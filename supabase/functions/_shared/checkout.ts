import type { PaymentDependencies } from "./types.ts";
import { getPayfastConfig, pfSignature, centsToAmount } from "./payfast.ts";

/** Private booking details and the price are read only on the server. */
export async function preparePayfastPayment(
  bookingId: string,
  origin: string,
  deps: PaymentDependencies,
) {
  const cfg = getPayfastConfig(deps.env);
  if (!cfg.configured)
    return {
      ok: false as const,
      error: "Online payments are not configured yet. Please contact us.",
    };

  try {
    const supabaseAdmin = deps.supabase;
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select(
        "id, booking_reference, status, hold_expires_at, services(name, price_cents), clients(full_name, email)",
      )
      .eq("id", bookingId)
      .maybeSingle();
    if (error) throw error;
    if (!booking) return { ok: false as const, error: "Booking not found." };
    if (booking.status !== "pending_payment")
      return { ok: false as const, error: "This booking is no longer awaiting payment." };
    const expires = Date.parse(booking.hold_expires_at || "");
    if (!Number.isFinite(expires) || expires <= Date.now())
      return {
        ok: false as const,
        error: "Your reservation has expired. Please choose a time again.",
      };

    const service = booking.services;
    const client = booking.clients;
    if (
      !service ||
      !client ||
      !Number.isSafeInteger(service.price_cents) ||
      service.price_cents <= 0
    )
      throw new Error("Booking is missing its service or client details");

    // A cancelled/failed checkout can be retried while the hold is valid.
    // Never reset an already-paid or refunded payment.
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .update({ amount_cents: service.price_cents, status: "pending" })
      .eq("booking_id", booking.id)
      .in("status", ["pending", "cancelled", "failed"])
      .select("id")
      .maybeSingle();
    if (paymentError) throw paymentError;
    if (!payment)
      return {
        ok: false as const,
        error: "This payment cannot be restarted. Please check your booking status or contact us.",
      };

    const [first, ...rest] = client.full_name.trim().split(/\s+/);
    const fields: [string, string][] = [
      ["merchant_id", cfg.merchantId],
      ["merchant_key", cfg.merchantKey],
      ["return_url", `${origin}/booking/success?booking=${booking.id}`],
      ["cancel_url", `${origin}/booking/cancelled?booking=${booking.id}`],
      ["notify_url", `${cfg.supabaseUrl}/functions/v1/payfast-notify`],
      ["name_first", (first ?? "").slice(0, 100)],
      ["name_last", rest.join(" ").slice(0, 100)],
      ["email_address", client.email],
      ["m_payment_id", booking.id],
      ["amount", centsToAmount(service.price_cents)],
      ["item_name", `${service.name} (${booking.booking_reference})`.slice(0, 100)],
    ];
    const filtered = fields.filter(([, value]) => value !== "");
    return {
      ok: true as const,
      action: cfg.processUrl,
      fields: Object.fromEntries([
        ...filtered,
        ["signature", pfSignature(filtered, cfg.passphrase)],
      ]),
    };
  } catch (error) {
    // Configuration/database details stay in the server log, not the browser.
    console.error("PayFast checkout could not be prepared:", error);
    return {
      ok: false as const,
      error: "We couldn't start your payment. Please try again or contact us if this continues.",
    };
  }
}
