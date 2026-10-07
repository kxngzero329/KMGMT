import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminTitle, Panel, inputCls } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Testimonial } from "@/types/domain";

export const Route = createFileRoute("/admin/testimonials")({ component: Testimonials });

const empty: Testimonial = {
  id: "", client_name: "", role_or_context: "", content: "", approved: false, display_order: 0,
  created_at: "", updated_at: "",
};

function Testimonials() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });
  const [edit, setEdit] = useState<Testimonial | null>(null);
  const save = useMutation({
    mutationFn: async (t: Testimonial) => {
      const row = {
        client_name: t.client_name, role_or_context: t.role_or_context || null, content: t.content,
        approved: t.approved, display_order: t.display_order,
      };
      const { error } = t.id
        ? await supabase.from("testimonials").update(row).eq("id", t.id)
        : await supabase.from("testimonials").insert(row);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Testimonial saved"); setEdit(null); qc.invalidateQueries({ queryKey: ["admin", "testimonials"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (t: Testimonial) => {
      const { error } = await supabase.from("testimonials").delete().eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "testimonials"] }); },
  });

  return (
    <>
      <AdminTitle title="Testimonials">
        <Button size="sm" onClick={() => setEdit({ ...empty })}><Plus className="mr-1 h-4 w-4" /> Add testimonial</Button>
      </AdminTitle>
      {q.isLoading && <Skeleton className="h-40" />}
      <ul className="space-y-3">
        {(q.data ?? []).map((t) => (
          <li key={t.id}>
            <Panel className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{t.client_name} <span className="text-xs font-normal text-muted-foreground">{t.role_or_context}</span></p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.content}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    Approved <Switch checked={t.approved} onCheckedChange={(c) => save.mutate({ ...t, approved: c })} />
                  </label>
                  <input aria-label="Display order" type="number" className="h-9 w-16 rounded-md border border-input px-2 text-sm" value={t.display_order}
                    onChange={(e) => save.mutate({ ...t, display_order: +e.target.value })} />
                  <Button size="icon" variant="ghost" aria-label={`Edit testimonial by ${t.client_name}`} onClick={() => setEdit(t)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label={`Delete testimonial by ${t.client_name}`} onClick={() => confirm("Delete this testimonial?") && remove.mutate(t)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                </div>
              </div>
            </Panel>
          </li>
        ))}
      </ul>
      {q.data && q.data.length === 0 && <p className="text-sm text-muted-foreground">No testimonials yet.</p>}
      {edit && (
        <Dialog open onOpenChange={(o) => !o && setEdit(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{edit.id ? "Edit" : "Add"} testimonial</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <label className="block text-sm font-semibold">Name
                <input aria-label="Client name" className={`${inputCls} mt-1`} value={edit.client_name} onChange={(e) => setEdit({ ...edit, client_name: e.target.value })} />
              </label>
              <label className="block text-sm font-semibold">Role / context
                <input aria-label="Role or context" className={`${inputCls} mt-1`} value={edit.role_or_context ?? ""} onChange={(e) => setEdit({ ...edit, role_or_context: e.target.value })} />
              </label>
              <label className="block text-sm font-semibold">Content
                <textarea aria-label="Testimonial content" rows={4} className={`${inputCls} mt-1 h-auto`} value={edit.content} onChange={(e) => setEdit({ ...edit, content: e.target.value })} />
              </label>
              <Button disabled={save.isPending || !edit.client_name || !edit.content} onClick={() => save.mutate(edit)}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
