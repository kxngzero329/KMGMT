/** Keep public wording aligned with the server-assigned deadline in payments.due_at. */
export const EFT_PAYMENT_POLICY =
  "EFT payment is due within 3 calendar days (72 hours) of booking, or before your consultation if sooner. If payment has not been received and verified by the deadline, your booking will automatically be cancelled and the slot released.";

export const EFT_PROOF_POLICY =
  "Pay and send proof via WhatsApp or email before the deadline. Kieraan verifies funds manually; sending proof alone does not mark the invoice paid. Contact KMGMT promptly if your payment is still awaiting verification.";

export function eftDeadlinePassed(dueAt: string | null | undefined) {
  return !!dueAt && Date.parse(dueAt) <= Date.now();
}
