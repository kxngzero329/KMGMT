import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BOOKING_SELECT } from "./queries";
import { toZonedDateKey } from "@/lib/utils/format";

function dayBounds() {
  const key = toZonedDateKey(new Date());
  const start = `${key}T00:00:00+02:00`;
  return {
    start,
    end: new Date(Date.parse(start) + 86_400_000).toISOString(),
    monthStart: `${key.slice(0, 7)}-01T00:00:00+02:00`,
  };
}

// Page through paid rows so the monthly figure is not silently cut off by the
// API's row limit. This is a normal authenticated read under existing RLS.
async function receivedThisMonth(start: string, signal: AbortSignal) {
  let total = 0;
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("payments")
      .select("amount_cents")
      .eq("status", "paid")
      .gte("paid_at", start)
      .lte("paid_at", new Date().toISOString())
      .order("id")
      .range(offset, offset + 499)
      .abortSignal(signal);
    if (error) throw error;
    total += data.reduce((sum, payment) => sum + payment.amount_cents, 0);
    if (data.length < 500) return total;
  }
}

export const dashboardOverviewQuery = queryOptions({
  queryKey: ["admin", "dashboard", "overview"],
  refetchInterval: 30_000,
  queryFn: async ({ signal }) => {
    const now = new Date().toISOString();
    const bounds = dayBounds();
    const [today, upcomingCount, pendingEft, upcoming, received] = await Promise.all([
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .in("status", ["confirmed", "completed"])
        .gte("start_time", bounds.start)
        .lt("start_time", bounds.end)
        .abortSignal(signal),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "confirmed")
        .gte("start_time", now)
        .abortSignal(signal),
      supabase
        .from("payments")
        .select("id, bookings!inner(status)", { count: "exact", head: true })
        .eq("provider", "eft")
        .eq("status", "pending")
        .in("bookings.status", ["confirmed", "completed"])
        .abortSignal(signal),
      supabase
        .from("bookings")
        .select(BOOKING_SELECT)
        .eq("status", "confirmed")
        .gte("end_time", now)
        .order("start_time")
        .limit(8)
        .abortSignal(signal),
      receivedThisMonth(bounds.monthStart, signal),
    ]);
    for (const result of [today, upcomingCount, pendingEft, upcoming])
      if (result.error) throw result.error;
    return {
      today: today.count ?? 0,
      upcomingCount: upcomingCount.count ?? 0,
      pendingEft: pendingEft.count ?? 0,
      upcoming: upcoming.data ?? [],
      received,
    };
  },
});

const ATTENTION_EFT_SELECT = `id, due_at, bookings!inner(${BOOKING_SELECT})` as const;

export const dashboardAttentionQuery = queryOptions({
  queryKey: ["admin", "dashboard", "attention"],
  refetchInterval: 30_000,
  queryFn: async ({ signal }) => {
    const now = new Date();
    const bounds = dayBounds();
    const [eft, today, enquiries] = await Promise.all([
      supabase
        .from("payments")
        .select(ATTENTION_EFT_SELECT, { count: "exact" })
        .eq("provider", "eft")
        .eq("status", "pending")
        .eq("bookings.status", "confirmed")
        .lte("due_at", new Date(now.getTime() + 86_400_000).toISOString())
        .order("due_at")
        .limit(4)
        .abortSignal(signal),
      supabase
        .from("bookings")
        .select(BOOKING_SELECT, { count: "exact" })
        .eq("status", "confirmed")
        .gte("start_time", bounds.start)
        .lt("start_time", bounds.end)
        .gt("end_time", now.toISOString())
        .order("start_time")
        .limit(4)
        .abortSignal(signal),
      supabase
        .from("contact_enquiries")
        .select("id, name, email, subject, message, created_at", { count: "exact" })
        .eq("status", "new")
        .order("created_at")
        .limit(4)
        .abortSignal(signal),
    ]);
    for (const result of [eft, today, enquiries]) if (result.error) throw result.error;
    return {
      eft: eft.data ?? [],
      eftCount: eft.count ?? 0,
      today: today.data ?? [],
      todayCount: today.count ?? 0,
      enquiries: enquiries.data ?? [],
      enquiryCount: enquiries.count ?? 0,
    };
  },
});
