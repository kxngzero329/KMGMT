/**
 * Transactional email architecture (Resend-ready).
 * Set RESEND_API_KEY, EMAIL_FROM (e.g. "KMGMT <bookings@yourdomain>") and ADMIN_NOTIFICATION_EMAIL
 * to enable sending. Until then events are logged only.
 */
export type EmailEvent =
  | { type: "booking_pending"; bookingId: string }
  | { type: "booking_confirmed"; bookingId: string }
  | { type: "booking_cancelled"; bookingId: string }
  | { type: "booking_rescheduled"; bookingId: string }
  | { type: "consultation_reminder"; bookingId: string }
  | { type: "admin_new_paid_booking"; bookingId: string }
  | { type: "admin_new_enquiry"; enquiryId: string };

export async function sendTransactionalEmail(event: EmailEvent): Promise<void> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    console.info("[email] not configured, skipped:", event.type);
    return;
  }
  // TODO(phase 7): build templates per event and POST to https://api.resend.com/emails
  console.info("[email] would send:", event.type);
}
