import { Buffer } from "node:buffer";
import type { PaymentDependencies } from "./types.ts";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getPayfastConfig, pfNotificationSignature, pfNotificationString } from "./payfast.ts";

export async function handlePayfastNotification(
  request: Request,
  deps: PaymentDependencies,
): Promise<Response> {
  const cfg = getPayfastConfig(deps.env);
  if (!cfg.configured) return new Response("Payments unavailable", { status: 503 });
  const params = new URLSearchParams(await request.text());
  // Reject ambiguous payloads rather than verifying one value and reading another.
  if (new Set(params.keys()).size !== [...params.keys()].length)
    return new Response("Duplicate parameters", { status: 400 });
  const entries = [...params.entries()].filter(([key]) => key !== "signature");
  const signature = params.get("signature") || "";
  if (
    !/^[a-f0-9]{32}$/.test(signature) ||
    !timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(pfNotificationSignature(entries, cfg.passphrase)),
    )
  )
    return new Response("Invalid signature", { status: 400 });
  if (params.get("merchant_id") !== cfg.merchantId)
    return new Response("Merchant mismatch", { status: 400 });

  const bookingId = params.get("m_payment_id") || "";
  const providerId = params.get("pf_payment_id") || "";
  const status = params.get("payment_status") || "";
  const amount = params.get("amount_gross") || "";
  if (
    !z.string().uuid().safeParse(bookingId).success ||
    !providerId ||
    !["COMPLETE", "CANCELLED", "FAILED"].includes(status) ||
    !/^\d+(?:\.\d{1,2})?$/.test(amount)
  )
    return new Response("Invalid payment details", { status: 400 });
  const amountCents = Math.round(Number(amount) * 100);
  if (!Number.isSafeInteger(amountCents)) return new Response("Invalid amount", { status: 400 });

  // A valid signature alone is insufficient: verify the notification with PayFast.
  try {
    const response = await fetch(cfg.validateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: pfNotificationString(entries),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok || (await response.text()).trim() !== "VALID")
      return new Response("Invalid", { status: 400 });
  } catch (error) {
    console.error("PayFast ITN: validation request failed", error);
    return new Response("Validation unavailable", { status: 502 });
  }

  try {
    const supabaseAdmin = deps.supabase;
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select("id, amount_cents, status, booking_id, provider_payment_id")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!payment) return new Response("Unknown booking", { status: 404 });
    if (amountCents !== payment.amount_cents)
      return new Response("Amount mismatch", { status: 400 });
    if (payment.provider_payment_id && payment.provider_payment_id !== providerId)
      return new Response("Payment reference mismatch", { status: 400 });
    if (payment.status === "refunded") return new Response("OK");

    if (status === "COMPLETE") {
      if (payment.status !== "paid") {
        const { data: saved, error: paymentError } = await supabaseAdmin
          .from("payments")
          .update({
            status: "paid",
            provider_payment_id: providerId,
            paid_at: new Date().toISOString(),
            raw_reference: Object.fromEntries(params),
          })
          .eq("id", payment.id)
          .in("status", ["pending", "failed", "cancelled"])
          .select("id")
          .maybeSingle();
        if (paymentError) throw paymentError;
        if (!saved) return new Response("Payment changed; retry notification", { status: 500 });
      }

      // Retry confirmation even if an earlier attempt recorded payment but its
      // booking update failed. Already-confirmed bookings return no changed row.
      const { data: confirmed, error: bookingError } = await supabaseAdmin
        .from("bookings")
        .update({ status: "confirmed", hold_expires_at: null })
        .eq("id", bookingId)
        .in("status", ["pending_payment", "expired"])
        .select("id")
        .maybeSingle();
      if (bookingError?.code === "23P01") {
        // The client paid after expiry and someone else reserved the slot.
        // Keep the successful payment for admin follow-up instead of double-booking.
        const { error: noteError } = await supabaseAdmin
          .from("bookings")
          .update({
            notes: "PAID AFTER HOLD EXPIRED: slot conflict, please contact client / refund.",
          })
          .eq("id", bookingId);
        if (noteError) throw noteError;
        console.error(
          "PayFast ITN: paid booking requires follow-up due to a slot conflict",
          bookingId,
        );
      } else if (bookingError) {
        throw bookingError;
      } else if (confirmed) {
        console.info("PayFast: booking confirmed", bookingId);
      }
    } else if (payment.status !== "paid") {
      const { error: paymentError } = await supabaseAdmin
        .from("payments")
        .update({
          status: status === "CANCELLED" ? "cancelled" : "failed",
          raw_reference: Object.fromEntries(params),
        })
        .eq("id", payment.id)
        .in("status", ["pending", "failed", "cancelled"]);
      if (paymentError) throw paymentError;
    }
    return new Response("OK");
  } catch (error) {
    // PayFast retries non-200 responses. Never acknowledge a database failure.
    console.error("PayFast ITN: could not record notification", error);
    return new Response("Could not record payment", { status: 500 });
  }
}
