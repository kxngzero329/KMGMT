import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminTitle, Panel, selectCls } from "@/components/admin/AdminUI";
import { ENQUIRY_STATUSES, ENQUIRY_STATUSES as ALL } from "@/types/domain";
import { formatDateTime } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/enquiries")({ component: Enquiries });

const LABEL: Record<string, string> = { new: "New", read: "Read", responded: "Responded", archived: "Archived" };

function Enquiries() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "enquiries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_enquiries").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [status, setStatus] = useState("");
  const setStatusOf = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("contact_enquiries").update({ status: status as (typeof ALL)[number] }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin", "enquiries"] }); },
  });
  const rows = (q.data ?? []).filter((e) => !status || e.status === status);

  return (
    <>
      <AdminTitle title="Enquiries">
        <select aria-label="Filter status" className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          {ENQUIRY_STATUSES.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
        </select>
      </AdminTitle>
      {q.isLoading && <Skeleton className="h-40" />}
      <ul className="space-y-3">
        {rows.map((e) => (
          <li key={e.id}>
            <Panel className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{e.subject} <span className="ml-2 text-xs font-normal text-muted-foreground">{formatDateTime(e.created_at)}</span></p>
                  <p className="text-sm text-muted-foreground">{e.name} · <span className="break-all">{e.email}</span>{e.phone ? ` · ${e.phone}` : ""}</p>
                  <p className="mt-2 text-sm">{e.message}</p>
                </div>
                <select aria-label={`Status for ${e.subject}`} className={selectCls} value={e.status} onChange={(ev) => setStatusOf.mutate({ id: e.id, status: ev.target.value })}>
                  {ALL.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
                </select>
              </div>
            </Panel>
          </li>
        ))}
      </ul>
      {q.data && rows.length === 0 && <p className="text-sm text-muted-foreground">No enquiries.</p>}
    </>
  );
}
