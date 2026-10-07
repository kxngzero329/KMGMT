import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminTitle, BookingBadge, Panel } from "@/components/admin/AdminUI";
import { BookingDetailDialog } from "@/components/admin/BookingDetailDialog";
import { BOOKING_SELECT, type AdminBooking } from "@/features/admin/queries";
import { formatDateTime, formatZAR, toZonedDateKey } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const [open, setOpen] = useState<AdminBooking | null>(null);
  const q = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const [upcoming, pending, confirmed, revenue, enquiries, players] = await Promise.all([
        supabase.from("bookings").select(BOOKING_SELECT).in("status", ["confirmed", "pending_payment"]).gte("start_time", now).order("start_time").limit(20),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending_payment").gt("hold_expires_at", now),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
        supabase.from("payments").select("amount_cents").eq("status", "paid"),
        supabase.from("contact_enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("represented_players").select("id", { count: "exact", head: true }).eq("active", true),
      ]);
      if (upcoming.error) throw upcoming.error;
      const list = (upcoming.data ?? []).filter((b) => b.status === "confirmed" || (b.hold_expires_at && b.hold_expires_at > now));
      const todayKey = toZonedDateKey(new Date());
      return {
        upcoming: list,
        today: list.filter((b) => toZonedDateKey(new Date(b.start_time)) === todayKey && b.status === "confirmed").length,
        pending: pending.count ?? 0,
        confirmed: confirmed.count ?? 0,
        revenue: (revenue.data ?? []).reduce((s, p) => s + p.amount_cents, 0),
        enquiries: enquiries.count ?? 0,
        players: players.count ?? 0,
      };
    },
  });
  const d = q.data;
  const cards: [string, string | number][] = d
    ? [
        ["Upcoming consultations", d.upcoming.filter((b) => b.status === "confirmed").length],
        ["Today's consultations", d.today],
        ["Pending payments", d.pending],
        ["Confirmed bookings", d.confirmed],
        ["Total revenue", formatZAR(d.revenue)],
        ["New enquiries", d.enquiries],
        ["Represented players", d.players],
      ]
    : [];

  return (
    <>
      <AdminTitle title="Dashboard" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {q.isLoading && Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        {cards.map(([k, v]) => (
          <Panel key={k} className="p-4">
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className="mt-2 text-2xl font-bold">{v}</p>
          </Panel>
        ))}
      </div>
      <h2 className="mb-3 mt-10 text-lg font-bold">Upcoming appointments</h2>
      <Panel>
        {d?.upcoming.length === 0 && <p className="p-6 text-sm text-muted-foreground">No upcoming appointments.</p>}
        <ul className="divide-y">
          {d?.upcoming.map((b) => (
            <li key={b.id}>
              <button onClick={() => setOpen(b)} className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left hover:bg-secondary">
                <span>
                  <span className="font-semibold">{b.clients?.full_name}</span>
                  <span className="block text-sm text-muted-foreground">{b.services?.name} · {formatDateTime(b.start_time)}</span>
                </span>
                <BookingBadge status={b.status} />
              </button>
            </li>
          ))}
        </ul>
      </Panel>
      <BookingDetailDialog booking={open} onClose={() => setOpen(null)} />
    </>
  );
}
