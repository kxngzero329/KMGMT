import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
export type Service = Tables["services"]["Row"];
export type Client = Tables["clients"]["Row"];
export type Booking = Tables["bookings"]["Row"];
export type Payment = Tables["payments"]["Row"];
export type AvailabilityRule = Tables["availability_rules"]["Row"];
export type AvailabilityException = Tables["availability_exceptions"]["Row"];
export type BookingSettings = Tables["booking_settings"]["Row"];
export type RepresentedPlayer = Tables["represented_players"]["Row"];
export type Testimonial = Tables["testimonials"]["Row"];
export type ContactEnquiry = Tables["contact_enquiries"]["Row"];

export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type EnquiryStatus = Database["public"]["Enums"]["enquiry_status"];

export const BOOKING_STATUSES: BookingStatus[] = [
  "pending_payment",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
  "expired",
];
export const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid", "failed", "cancelled", "refunded"];
export const ENQUIRY_STATUSES: EnquiryStatus[] = ["new", "read", "responded", "archived"];

/** Statuses the admin may set manually. Payment is never marked paid by changing booking status. */
export const ADMIN_SETTABLE_STATUSES: BookingStatus[] = ["confirmed", "completed", "cancelled", "no_show"];

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending_payment: "Awaiting payment",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
  expired: "Expired",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export interface PublicBookingSummary {
  id: string;
  booking_reference: string;
  status: BookingStatus;
  start_time: string;
  end_time: string;
  timezone: string;
  hold_expires_at: string | null;
  service_name: string;
  duration_minutes: number;
  client_name: string;
  amount_cents: number | null;
  payment_status: PaymentStatus | null;
}

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
