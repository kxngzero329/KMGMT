import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { clientDetailsSchema } from "@/lib/validation/schemas";

const holdInput = z.object({
  serviceId: z.string().uuid(),
  startTime: z.string().datetime({ offset: true }),
  client: clientDetailsSchema,
});

const ERROR_MESSAGES: Record<string, string> = {
  SLOT_UNAVAILABLE: "Sorry, that time was just taken. Please choose another time.",
  SERVICE_UNAVAILABLE: "This consultation is no longer available.",
  GUARDIAN_CONSENT_REQUIRED: "Parent/guardian consent is required for players under 18.",
};

/**
 * Creates a 15-minute reservation (pending_payment). Validated server-side here,
 * then again atomically in the database (create_booking_hold + exclusion constraint).
 */
export const createBookingHold = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => holdInput.parse(d))
  .handler(async ({ data }) => {
    const { createPublicClient } = await import("@/lib/supabase/public.server");
    const sb = createPublicClient();
    const { data: rows, error } = await sb.rpc("create_booking_hold", {
      p_service_id: data.serviceId,
      p_start: data.startTime,
      p_client: data.client,
    });
    if (error) {
      const code = Object.keys(ERROR_MESSAGES).find((k) => error.message.includes(k));
      console.error("create_booking_hold failed", error.message);
      return { ok: false as const, error: code ? ERROR_MESSAGES[code] : "We couldn't reserve this time. Please try again." };
    }
    const row = rows?.[0];
    if (!row) return { ok: false as const, error: "We couldn't reserve this time. Please try again." };
    return { ok: true as const, bookingId: row.booking_id, reference: row.booking_reference, holdExpiresAt: row.hold_expires_at };
  });
