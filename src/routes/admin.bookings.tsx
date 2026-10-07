import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AdminTitle, BookingBadge, PaymentBadge, Panel, inputCls, selectCls } from "@/components/admin/AdminUI";
import { BookingDetailDialog } from "@/components/admin/BookingDetailDialog";
import { latestPayment, listBookings, type AdminBooking } from "@/features/admin/queries";
import { BOOKING_STATUSES, BOOKING_STATUS_LABEL, PAYMENT_STATUSES, PAYMENT_STATUS_LABEL } from "@/types/domain";
import { formatDateTime, formatZAR, toZonedDateKey } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/bookings")({ component: Bookings });

function Bookings() {
  const q = useQuery({ queryKey: ["admin", "bookings"], queryFn: () => listBookings() });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [pay, setPay] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [open, setOpen] = useState<AdminBooking | null>(null);

  const services = useMemo(() => [...new Map((q.data ?? []).map((b) => [b.services?.id, b.services?.name])).entries()], [q.data]);
  const rows = useMemo(() => {
    const s = search.toLowerCase();
    return (q.data ?? [])
      .filter((b) => !status || b.status === status)
      .filter((b) => !pay || latestPayment(b)?.status === pay)
      .filter((b) => !service || b.services?.id === service)
      .filter((b) => !date || toZonedDateKey(new Date(b.start_time)) === date)
      .filter((b) => !s || [b.booking_reference, b.clients?.full_name, b.clients?.email, b.clients?.whatsapp].some((v) => v?.toLowerCase().includes(s)))
      .sort((a, b) => (sort === "asc" ? 1 : -1) * a.start_time.localeCompare(b.start_time));
  }, [q.data, search, status, pay, service, date, sort]);

  return (
    <>
      <AdminTitle title="Bookings" />
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <input aria-label="Search" placeholder="Search name, email, ref…" className={`${inputCls} lg:col-span-2`} value={search} onChange={(e) => setSearch(e.target.value)} />
        <input aria-label="Date" type="date" className={selectCls} value={date} onChange={(e) => setDate(e.target.value)} />
        <select aria-label="Consultation" className={selectCls} value={service} onChange={(e) => setService(e.target.value)}>
          <option value="">All consultations</option>
          {services.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select aria-label="Status" className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{BOOKING_STATUS_LABEL[s]}</option>)}
        </select>
        <select aria-label="Payment" className={selectCls} value={pay} onChange={(e) => setPay(e.target.value)}>
          <option value="">All payments</option>
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{PAYMENT_STATUS_LABEL[s]}</option>)}
        </select>
      </div>
      <Panel className="overflow-x-auto">
        {q.isLoading && <Skeleton className="m-4 h-40" />}
        <table className="w-full min-w-180 text-sm">
          <thead className="border-b text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-3"><button onClick={() => setSort(sort === "asc" ? "desc" : "asc")}>Date {sort === "asc" ? "↑" : "↓"}</button></th>
              <th className="p-3">Client</th><th className="p-3">Consultation</th><th className="p-3">Price</th><th className="p-3">Status</th><th className="p-3">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((b) => (
              <tr key={b.id} onClick={() => setOpen(b)} className="cursor-pointer hover:bg-secondary">
                <td className="p-3 whitespace-nowrap">{formatDateTime(b.start_time)}</td>
                <td className="p-3"><span className="font-semibold">{b.clients?.full_name}</span><span className="block text-xs text-muted-foreground">{b.booking_reference}</span></td>
                <td className="p-3">{b.services?.name}</td>
                <td className="p-3">{formatZAR(b.services?.price_cents)}</td>
                <td className="p-3"><BookingBadge status={b.status} /></td>
                <td className="p-3"><PaymentBadge status={latestPayment(b)?.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {q.data && rows.length === 0 && <p className="p-6 text-sm text-muted-foreground">No bookings match.</p>}
      </Panel>
      <BookingDetailDialog booking={open} onClose={() => setOpen(null)} />
    </>
  );
}
