import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminTitle, Panel, inputCls } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { RepresentedPlayer } from "@/types/domain";

export const Route = createFileRoute("/admin/players")({ component: Players });

const empty: RepresentedPlayer = {
  id: "", name: "", image_url: null, position: "", age: null, current_club: "", previous_clubs: "",
  nationality: "", active: true, visible: true, display_order: 0, created_at: "", updated_at: "",
};

function Players() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "players"],
    queryFn: async () => {
      const { data, error } = await supabase.from("represented_players").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });
  const [edit, setEdit] = useState<RepresentedPlayer | null>(null);
  const save = useMutation({
    mutationFn: async (p: RepresentedPlayer) => {
      const row = {
        name: p.name, position: p.position || null, age: p.age || null, current_club: p.current_club || null,
        previous_clubs: p.previous_clubs || null, nationality: p.nationality || null, image_url: p.image_url,
        active: p.active, visible: p.visible, display_order: p.display_order,
      };
      const { error } = p.id
        ? await supabase.from("represented_players").update(row).eq("id", p.id)
        : await supabase.from("represented_players").insert(row);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Player saved"); setEdit(null); qc.invalidateQueries({ queryKey: ["admin", "players"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (p: RepresentedPlayer) => {
      const { error } = await supabase.from("represented_players").update({ active: false, visible: false }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Player archived"); qc.invalidateQueries({ queryKey: ["admin", "players"] }); },
  });

  return (
    <>
      <AdminTitle title="Represented players">
        <Button size="sm" onClick={() => setEdit({ ...empty })}><Plus className="mr-1 h-4 w-4" /> Add player</Button>
      </AdminTitle>
      {q.isLoading && <Skeleton className="h-40" />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(q.data ?? []).map((p) => (
          <Panel key={p.id} className="overflow-hidden">
            <div className="aspect-video bg-muted">
              {p.image_url && <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />}
            </div>
            <div className="p-4">
              <p className="font-bold">{p.name} <span className="text-xs font-normal text-muted-foreground">#{p.display_order}</span></p>
              <p className="text-sm text-muted-foreground">{p.position} · {p.current_club ?? ""}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  Visible <Switch checked={p.visible} onCheckedChange={(c) => save.mutate({ ...p, visible: c })} />
                </label>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" aria-label={`Edit ${p.name}`} onClick={() => setEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label={`Archive ${p.name}`} onClick={() => confirm(`Archive ${p.name}?`) && remove.mutate(p)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </div>
      {q.data && q.data.length === 0 && <p className="text-sm text-muted-foreground">No players yet.</p>}
      {edit && <PlayerDialog player={edit} saving={save.isPending} onClose={() => setEdit(null)} onSave={save.mutate} />}
    </>
  );
}

function PlayerDialog({ player, onClose, onSave, saving }: {
  player: RepresentedPlayer;
  onClose: () => void;
  onSave: (p: RepresentedPlayer) => void;
  saving: boolean;
}) {
  const [v, setV] = useState(player);
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof RepresentedPlayer>(k: K, value: RepresentedPlayer[K]) => setV((p) => ({ ...p, [k]: value }));

  async function upload(file: File) {
    setUploading(true);
    try {
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
      const { error } = await supabase.storage.from("player-photos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = await supabase.storage.from("player-photos").createSignedUrl(path, 60 * 60 * 24 * 7);
      set("image_url", data?.signedUrl ?? path);
    } catch (e) {
      toast.error((e as Error).message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const f = (k: keyof RepresentedPlayer, label: string, props: Record<string, unknown> = {}) => (
    <label className="block text-sm font-semibold">
      {label}
      <input aria-label={label} className={`${inputCls} mt-1`} value={(v[k] as string | number | null) ?? ""} onChange={(e) => set(k, e.target.value || null)} {...props} />
    </label>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{player.id ? "Edit player" : "Add player"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          {f("name", "Full name")}
          {f("position", "Position", { placeholder: "e.g. Striker" })}
          {f("age", "Age", { type: "number", min: 6, max: 60 })}
          {f("current_club", "Current club")}
          {f("previous_clubs", "Previous clubs")}
          {f("nationality", "Nationality")}
          <label className="block text-sm font-semibold">Photo
            <div className="mt-1 flex items-center gap-3">
              {v.image_url && <img src={v.image_url} alt="" className="h-16 w-16 rounded object-cover" />}
              <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm hover:border-gold">
                <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload photo"}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
            </div>
          </label>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm font-semibold">Active <Switch checked={v.active} onCheckedChange={(c) => set("active", c)} /></label>
            <label className="flex items-center gap-2 text-sm font-semibold">Visible <Switch checked={v.visible} onCheckedChange={(c) => set("visible", c)} /></label>
            <label className="text-sm font-semibold">Order
              <input aria-label="Display order" type="number" className={`${inputCls} w-20`} value={v.display_order} onChange={(e) => set("display_order", +e.target.value)} />
            </label>
          </div>
          <Button className="mt-2" disabled={saving || !v.name} onClick={() => onSave(v)}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
