import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminTitle, Panel } from "@/components/admin/AdminUI";
import { BookingDetailDialog } from "@/components/admin/BookingDetailDialog";
import { listBookings, type AdminBooking } from "@/features/admin/queries";
import { formatTime, localDateKey, toZonedDateKey } from "@/lib/utils/format";

export const Route = createFileRoute("/admin/calendar")({ component: CalendarPage });

function CalendarPage() {
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; });
  const [open, setOpen] = useState<AdminBooking | null>(null);
  const from = new Date(month); from.setDate(from.getDate() - 7);
  const to = new Date(month); to.setMonth(to.getMonth() + 1); to.setDate(to.getDate() + 7);
  const q = useQuery({
    queryKey: ["admin", "calendar", month.toISOString()],
    queryFn: () => listBookings({ from: from.toISOString(), to: to.toISOString() }),
  });
  const byDay = useMemo(() => {
    const m = new Map<string, AdminBooking[]>();
    const now = new Date().toISOString();
    for (const b of q.data ?? []) {
      const visible = ["confirmed", "completed"].includes(b.status) || (b.status === "pending_payment" && (b.hold_expires_at ?? "") > now);
      if (!visible) continue;
      const k = toZonedDateKey(new Date(b.start_time));
      m.set(k, [...(m.get(k) ?? []), b].sort((a, c) => a.start_time.localeCompare(c.start_time)));
    }
    return m;
  }, [q.data]);

  const start = new Date(month); start.setDate(1 - ((month.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const shift = (n: number) => { const d = new Date(month); d.setMonth(d.getMonth() + n); setMonth(d); };

  return (
    <>
      <AdminTitle title="Calendar">
        <div className="flex items-center gap-2">
          <button aria-label="Previous month" onClick={() => shift(-1)} className="h-9 w-9 rounded-md border hover:border-gold"><ChevronLeft className="mx-auto h-4 w-4" /></button>
          <span className="min-w-36 text-center font-semibold">{month.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}</span>
          <button aria-label="Next month" onClick={() => shift(1)} className="h-9 w-9 rounded-md border hover:border-gold"><ChevronRight className="mx-auto h-4 w-4" /></button>
        </div>
      </AdminTitle>
      <div className="mb-3 flex gap-4 text-xs">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Confirmed</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> Awaiting payment</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> Completed</span>
      </div>
      <Panel className="overflow-x-auto">
        <div className="grid min-w-175 grid-cols-7 text-xs">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="border-b p-2 font-semibold text-muted-foreground">{d}</div>)}
          {days.map((d) => {
            const k = localDateKey(d);
            const inMonth = d.getMonth() === month.getMonth();
            return (
              <div key={k} className={`min-h-24 border-b border-r p-1.5 ${inMonth ? "" : "bg-secondary/60 text-muted-foreground"}`}>
                <p className="mb-1 font-semibold">{d.getDate()}</p>
                {byDay.get(k)?.map((b) => (
                  <button key={b.id} onClick={() => setOpen(b)}
                    className={`mb-1 block w-full truncate rounded border-l-2 bg-secondary px-1.5 py-1 text-left hover:bg-accent ${b.status === "confirmed" ? "border-success" : b.status === "pending_payment" ? "border-warning" : "border-muted-foreground"}`}>
                    {formatTime(b.start_time)} {b.clients?.full_name}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </Panel>
      <BookingDetailDialog booking={open} onClose={() => setOpen(null)} />
    </>
  );
}
