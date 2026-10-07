import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminTitle, Panel, inputCls } from "@/components/admin/AdminUI";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BOOKING_SELECT } from "@/features/admin/queries";
import { formatDateTime, formatZAR } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/clients")({ component: Clients });

function Clients() {
  const q = useQuery({
    queryKey: ["admin", "clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select(`*, bookings(${BOOKING_SELECT})`)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const rows = useMemo(() => {
    const s = search.toLowerCase();
    return (q.data ?? []).filter((c) =>
      !s || [c.full_name, c.email, c.whatsapp, c.current_club].some((v) => v?.toLowerCase().includes(s)),
    );
  }, [q.data, search]);
  const selected = rows.find((c) => c.id === open);

  return (
    <>
      <AdminTitle title="Clients" />
      <input aria-label="Search clients" placeholder="Search name, email, WhatsApp or club…" className={`${inputCls} mb-4 max-w-md`} value={search} onChange={(e) => setSearch(e.target.value)} />
      <Panel className="overflow-x-auto">
        {q.isLoading && <Skeleton className="m-4 h-40" />}
        <table className="w-full min-w-160 text-sm">
          <thead className="border-b text-left text-xs text-muted-foreground">
            <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">WhatsApp</th><th className="p-3">Club</th><th className="p-3">Consultations</th></tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((c) => (
              <tr key={c.id} onClick={() => setOpen(c.id)} className="cursor-pointer hover:bg-secondary">
                <td className="p-3 font-semibold">{c.full_name}<span className="block text-xs text-muted-foreground">Age {c.age}{c.age < 18 ? " · minor" : ""}</span></td>
                <td className="p-3 break-all">{c.email}</td>
                <td className="p-3 whitespace-nowrap">{c.whatsapp}</td>
                <td className="p-3">{c.current_club ?? ""}</td>
                <td className="p-3">{c.bookings?.length ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {q.data && rows.length === 0 && <p className="p-6 text-sm text-muted-foreground">No clients found.</p>}
      </Panel>
      <Dialog open={!!selected} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{selected.full_name}</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">Consultation history</p>
              <ul className="mt-3 divide-y rounded-md border">
                {selected.bookings?.map((b) => (
                  <li key={b.id} className="p-4 text-sm">
                    <span className="font-semibold">{b.services?.name}</span> · {formatDateTime(b.start_time)} · {formatZAR(b.services?.price_cents)}
                    <span className="block text-xs text-muted-foreground">Ref {b.booking_reference}</span>
                  </li>
                ))}
                {selected.bookings?.length === 0 && <li className="p-4 text-muted-foreground">No bookings yet.</li>}
              </ul>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
