export const DELETE_DETAILS = {
  booking: {
    label: "booking",
    effect:
      "Permanently removes this booking, all its payments, invoice and email queue records, and EFT request records. The appointment slot becomes available again, subject to your availability rules. The client profile is kept. This does not issue a refund or recall emails already sent.",
  },
  client: {
    label: "client",
    effect:
      "Permanently removes this client profile, all their bookings, and the payments, invoice and email queue records, and EFT requests linked to those bookings. This does not issue refunds or recall emails already sent.",
  },
  service: {
    label: "service",
    effect:
      "Permanently removes this consultation service and ALL its bookings, payments, invoice and email queue records, and EFT requests. Client profiles are kept. This does not issue refunds. To stop new bookings while keeping history, turn Active off instead.",
  },
  player: {
    label: "player",
    effect:
      "Permanently removes this player profile from the website and admin dashboard. Uploaded photo files are kept in Storage because another profile may use them. You can archive the player instead to keep the profile.",
  },
  testimonial: {
    label: "testimonial",
    effect: "Permanently removes this testimonial from the website and admin dashboard.",
  },
  enquiry: {
    label: "enquiry",
    effect:
      "Permanently removes this enquiry and its email queue record. Emails already sent cannot be recalled.",
  },
  availability_rule: {
    label: "working-hours rule",
    effect:
      "Permanently removes this weekly working-hours block. Existing bookings are kept; future availability will be recalculated.",
  },
  availability_exception: {
    label: "date rule",
    effect:
      "Permanently removes this date rule. Normal weekly hours will apply again where no other date rule exists. Existing bookings are kept.",
  },
} as const;

export type DeletableEntity = keyof typeof DELETE_DETAILS;
