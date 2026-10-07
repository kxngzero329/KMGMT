import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminTitle, Panel, inputCls } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatZAR } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/skeleton";
import type { Service } from "@/types/domain";

export const Route = createFileRoute("/admin/services")({ component: Services });

function Services() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });
  const save = useMutation({
    mutationFn: async (s: Service) => {
      const { error } = await supabase.from("services").update({
        name: s.name, short_description: s.short_description, full_description: s.full_description,
        duration_minutes: s.duration_minutes, price_cents: s.price_cents, active: s.active, display_order: s.display_order,
      }).eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Service saved"); qc.invalidateQueries({ queryKey: ["admin", "services"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <><AdminTitle title="Services" /><Skeleton className="h-40" /></>;

  return (
    <>
      <AdminTitle title="Services" />
      <div className="grid gap-5 lg:grid-cols-2">
        {(q.data ?? []).map((s) => (
          <ServiceForm key={s.id} service={s} onSave={(v) => save.mutate(v)} saving={save.isPending} />
        ))}
      </div>
    </>
  );
}

function ServiceForm({ service, onSave, saving }: { service: Service; onSave: (s: Service) => void; saving: boolean }) {
  const [v, setV] = useState(service);
  useEffect(() => setV(service), [service]);
  const set = <K extends keyof Service>(k: K, value: Service[K]) => setV((p) => ({ ...p, [k]: value }));
  const dirty = JSON.stringify(v) !== JSON.stringify(service);

  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-3">
        <input aria-label="Service name" className="border-0 bg-transparent font-bold focus:outline-none" value={v.name} onChange={(e) => set("name", e.target.value)} />
        <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
          Active <Switch checked={v.active} onCheckedChange={(c) => set("active", c)} />
        </label>
      </div>
      <label className="mt-4 block text-sm font-semibold">Short description
        <textarea rows={2} className={`${inputCls} mt-1 h-auto`} value={v.short_description} onChange={(e) => set("short_description", e.target.value)} />
      </label>
      <label className="mt-3 block text-sm font-semibold">Full description
        <textarea rows={4} className={`${inputCls} mt-1 h-auto`} value={v.full_description} onChange={(e) => set("full_description", e.target.value)} />
      </label>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <label className="text-sm font-semibold">Price (R)
          <input type="number" min={1} aria-label="Price in rands" className={`${inputCls} mt-1`} value={v.price_cents / 100} onChange={(e) => set("price_cents", Math.round(+e.target.value * 100))} />
        </label>
        <label className="text-sm font-semibold">Duration (min)
          <input type="number" min={1} aria-label="Duration in minutes" className={`${inputCls} mt-1`} value={v.duration_minutes} onChange={(e) => set("duration_minutes", +e.target.value)} />
        </label>
        <label className="text-sm font-semibold">Display order
          <input type="number" aria-label="Display order" className={`${inputCls} mt-1`} value={v.display_order} onChange={(e) => set("display_order", +e.target.value)} />
        </label>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{formatZAR(v.price_cents)} · {v.duration_minutes} min</span>
        <Button size="sm" disabled={!dirty || saving} onClick={() => onSave(v)}>Save changes</Button>
      </div>
    </Panel>
  );
}
