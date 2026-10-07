import { supabase } from "@/integrations/supabase/client";

export const BOOKING_SELECT =
  "*, services(id, name, duration_minutes, price_cents), clients(*), payments(id, status, amount_cents, provider, provider_payment_id, paid_at)";

export async function listBookings(opts: { from?: string; to?: string; limit?: number } = {}) {
  let q = supabase.from("bookings").select(BOOKING_SELECT).order("start_time", { ascending: false });
  if (opts.from) q = q.gte("start_time", opts.from);
  if (opts.to) q = q.lt("start_time", opts.to);
  q = q.limit(opts.limit ?? 500);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}
export type AdminBooking = Awaited<ReturnType<typeof listBookings>>[number];

export function latestPayment(b: AdminBooking) {
  return [...(b.payments ?? [])].sort((a, c) => (a.paid_at ?? "") < (c.paid_at ?? "") ? 1 : -1)[0];
}

export function unwrap<T>(r: { data: T | null; error: unknown }): T {
  if (r.error) throw r.error;
  return r.data as T;
}
