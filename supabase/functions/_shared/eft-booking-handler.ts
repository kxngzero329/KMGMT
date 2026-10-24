import { z } from "zod";
import { clientDetailsSchema } from "../../../src/lib/validation/schemas.ts";
import { allowedOrigin, corsHeaders, hasPublicApiKey } from "./http.ts";
import { getEftConfig } from "./eft-email.ts";
import type { Env, PaymentDependencies } from "./types.ts";

const inputSchema = z
  .object({
    serviceId: z.string().uuid(),
    startTime: z.string().datetime({ offset: true }),
    client: clientDetailsSchema,
    requestId: z.string().uuid(),
  })
  .strict();

export async function handleEftBooking(
  request: Request,
  env: Env,
  database: () => PaymentDependencies["supabase"],
) {
  const origin = allowedOrigin(request.headers.get("origin"), env);
  if (!origin)
    return Response.json(
      { ok: false, error: "This website is not enabled for bookings." },
      { status: 403 },
    );
  const headers = corsHeaders(origin);
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);
  if (!hasPublicApiKey(request, env))
    return json({ ok: false, error: "Invalid project API key." }, 401);
  try {
    const body = await request.text();
    if (body.length > 24000) return json({ ok: false, error: "Invalid booking request." }, 400);
    let input: unknown;
    try {
      input = JSON.parse(body);
    } catch {
      return json({ ok: false, error: "Invalid booking request." }, 400);
    }
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success)
      return json({ ok: false, error: "Please check your booking details." }, 400);
    // Confirm the private invoice settings exist before reserving the appointment.
    getEftConfig(env);
    const { data, error } = await database().rpc("create_eft_booking", {
      p_service_id: parsed.data.serviceId,
      p_start: parsed.data.startTime,
      p_client: parsed.data.client,
      p_request_id: parsed.data.requestId,
    });
    if (error) {
      const messages: Record<string, string> = {
        SLOT_UNAVAILABLE: "Sorry, that time was just taken. Please choose another time.",
        SERVICE_UNAVAILABLE: "This consultation is no longer available.",
        GUARDIAN_CONSENT_REQUIRED: "Parent/guardian consent is required for players under 18.",
        EFT_BOOKING_LIMIT:
          "Please contact KMGMT about your outstanding EFT bookings before reserving another session.",
        EFT_BOOKING_CLOSED: "This EFT booking has been closed. Please start a new booking.",
        REQUEST_MISMATCH: "Your booking details changed. Please start a new booking.",
      };
      const code = Object.keys(messages).find((key) => error.message.includes(key));
      console.error("EFT reservation could not be completed", code || "database_unavailable");
      return json(
        {
          ok: false,
          error: code ? messages[code] : "We couldn't reserve your consultation. Please try again.",
        },
        400,
      );
    }
    const row = data?.[0];
    if (!row) throw new Error("No reservation returned");
    // No account details, PDF bytes or private email payloads go to the browser.
    return json({
      ok: true,
      bookingId: row.booking_id,
      reference: row.booking_reference,
      invoiceNumber: row.invoice_number,
    });
  } catch {
    console.error("EFT booking temporarily unavailable");
    return json(
      {
        ok: false,
        error: "EFT booking is temporarily unavailable. Please try again or contact KMGMT.",
      },
      503,
    );
  }
}
