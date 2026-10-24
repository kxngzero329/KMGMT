import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminTitle, PaymentBadge, Panel, selectCls } from "@/components/admin/AdminUI";
import { PAYMENT_STATUSES, PAYMENT_STATUS_LABEL } from "@/types/domain";
import { formatDateTime, formatZAR } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/skeleton";
import { paymentMethodLabel } from "@/lib/payment-methods";
import { VerifyEftPaymentButton } from "@/components/admin/VerifyEftPaymentButton";

export const Route = createFileRoute("/admin/payments")({ component: Payments });

function Payments() {
  const q = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, bookings(booking_reference, status, clients(full_name), services(name))")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });
  const [status, setStatus] = useState("");
  const rows = useMemo(
    () => (q.data ?? []).filter((p) => !status || p.status === status),
    [q.data, status],
  );

  return (
    <>
      <AdminTitle title="Payments">
        <select
          aria-label="Filter payment status"
          className={selectCls}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </AdminTitle>
      <Panel className="overflow-x-auto">
        {q.isLoading && <Skeleton className="m-4 h-40" />}
        <table className="w-full min-w-190 text-sm">
          <thead className="border-b text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-3">Client</th>
              <th className="p-3">Booking</th>
              <th className="p-3">Service</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Method / invoice</th>
              <th className="p-3">Status</th>
              <th className="p-3">Payment reference</th>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((p) => {
              const b = p.bookings as {
                booking_reference: string;
                status: string;
                clients: { full_name: string } | null;
                services: { name: string } | null;
              } | null;
              return (
                <tr key={p.id} className="hover:bg-secondary">
                  <td className="p-3 font-semibold">{b?.clients?.full_name ?? ""}</td>
                  <td className="p-3">{b?.booking_reference}</td>
                  <td className="p-3">{b?.services?.name}</td>
                  <td className="p-3">{formatZAR(p.amount_cents)}</td>
                  <td className="p-3">
                    {paymentMethodLabel(p.provider)}
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {p.invoice_number}
                    </span>
                  </td>
                  <td className="p-3">
                    <PaymentBadge status={p.status} />
                  </td>
                  <td className="p-3 break-all">{p.provider_payment_id ?? ""}</td>
                  <td className="p-3 whitespace-nowrap">
                    {p.paid_at ? formatDateTime(p.paid_at) : ""}
                  </td>
                  <td className="p-3">
                    {p.provider === "eft" &&
                      p.status === "pending" &&
                      (b?.status === "confirmed" || b?.status === "completed") && (
                        <VerifyEftPaymentButton paymentId={p.id} />
                      )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {q.data && rows.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">No payments found.</p>
        )}
      </Panel>
    </>
  );
}
