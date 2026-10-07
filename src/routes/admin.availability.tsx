import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminTitle, Panel, inputCls, selectCls } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { WEEKDAYS } from "@/types/domain";
import { formatShortDate } from "@/lib/utils/format";

export const Route = createFileRoute("/admin/availability")({ component: Availability });

const ORDER = [1, 2, 3, 4, 5, 6, 0];
const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "");

function Availability() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "availability"] });
  const q = useQuery({
    queryKey: ["admin", "availability"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [rules, exc, settings] = await Promise.all([
        supabase.from("availability_rules").select("*").order("start_time"),
        supabase.from("availability_exceptions").select("*").gte("date", today).order("date"),
        supabase.from("booking_settings").select("*").single(),
      ]);
      if (rules.error || exc.error || settings.error)
        throw rules.error || exc.error || settings.error;
      return { rules: rules.data, exceptions: exc.data, settings: settings.data };
    },
  });

  const run = useMutation({
    mutationFn: async (fn: () => PromiseLike<{ error: unknown }>) => {
      const { error } = await fn();
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved");
      refresh();
    },
    onError: () => toast.error("Couldn't save, check the times are valid."),
  });

  const [newRule, setNewRule] = useState({ weekday: 1, start_time: "17:00", end_time: "20:00" });
  const [exc, setExc] = useState({
    date: "",
    type: "blocked" as "blocked" | "custom_hours",
    start_time: "",
    end_time: "",
    reason: "",
  });
  const [settings, setSettings] = useState({
    buffer_minutes: 15,
    max_advance_days: 42,
    min_notice_hours: 12,
    slot_interval_minutes: 15,
  });
  useEffect(() => {
    if (q.data) setSettings(q.data.settings);
  }, [q.data]);

  if (!q.data) return <AdminTitle title="Availability" />;
  const { rules, exceptions } = q.data;

  return (
    <>
      <AdminTitle title="Availability" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel className="p-5">
          <h2 className="font-bold">Weekly working hours</h2>
          <p className="text-sm text-muted-foreground">
            Times are South African time. Add more than one block per day if needed.
          </p>
          <ul className="mt-4 divide-y">
            {ORDER.map((d) => {
              const dayRules = rules.filter((r) => r.weekday === d);
              return (
                <li key={d} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="w-24 font-semibold">{WEEKDAYS[d]}</span>
                  {dayRules.length === 0 && (
                    <span className="text-sm text-muted-foreground">Not available</span>
                  )}
                  {dayRules.map((r) => (
                    <span
                      key={r.id}
                      className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm"
                    >
                      <Switch
                        checked={r.active}
                        aria-label="Active"
                        onCheckedChange={(v) =>
                          run.mutate(() =>
                            supabase
                              .from("availability_rules")
                              .update({ active: v })
                              .eq("id", r.id),
                          )
                        }
                      />
                      <span className={r.active ? "" : "text-muted-foreground line-through"}>
                        {hhmm(r.start_time)}–{hhmm(r.end_time)}
                      </span>
                      <button
                        aria-label="Remove"
                        onClick={() =>
                          run.mutate(() =>
                            supabase.from("availability_rules").delete().eq("id", r.id),
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </span>
                  ))}
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap items-end gap-2 border-t pt-4">
            <select
              aria-label="Day"
              className={selectCls}
              value={newRule.weekday}
              onChange={(e) => setNewRule({ ...newRule, weekday: +e.target.value })}
            >
              {ORDER.map((d) => (
                <option key={d} value={d}>
                  {WEEKDAYS[d]}
                </option>
              ))}
            </select>
            <input
              aria-label="From"
              type="time"
              className={selectCls}
              value={newRule.start_time}
              onChange={(e) => setNewRule({ ...newRule, start_time: e.target.value })}
            />
            <input
              aria-label="To"
              type="time"
              className={selectCls}
              value={newRule.end_time}
              onChange={(e) => setNewRule({ ...newRule, end_time: e.target.value })}
            />
            <Button
              size="sm"
              onClick={() => run.mutate(() => supabase.from("availability_rules").insert(newRule))}
            >
              Add hours
            </Button>
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="font-bold">Specific dates</h2>
          <p className="text-sm text-muted-foreground">
            Block a whole day, block certain hours, or set custom hours that replace the normal
            hours for that date.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <input
              aria-label="Date"
              type="date"
              className={selectCls}
              value={exc.date}
              onChange={(e) => setExc({ ...exc, date: e.target.value })}
            />
            <select
              aria-label="Type"
              className={selectCls}
              value={exc.type}
              onChange={(e) => setExc({ ...exc, type: e.target.value as "blocked" })}
            >
              <option value="blocked">Block (leave times empty for whole day)</option>
              <option value="custom_hours">Custom hours</option>
            </select>
            <input
              aria-label="From"
              type="time"
              className={selectCls}
              value={exc.start_time}
              onChange={(e) => setExc({ ...exc, start_time: e.target.value })}
            />
            <input
              aria-label="To"
              type="time"
              className={selectCls}
              value={exc.end_time}
              onChange={(e) => setExc({ ...exc, end_time: e.target.value })}
            />
            <input
              aria-label="Reason"
              placeholder="Reason (optional)"
              className={`${inputCls} sm:col-span-2`}
              value={exc.reason}
              onChange={(e) => setExc({ ...exc, reason: e.target.value })}
            />
          </div>
          <Button
            size="sm"
            className="mt-3"
            disabled={!exc.date}
            onClick={() =>
              run.mutate(() =>
                supabase.from("availability_exceptions").insert({
                  date: exc.date,
                  type: exc.type,
                  start_time: exc.start_time || null,
                  end_time: exc.end_time || null,
                  reason: exc.reason || null,
                }),
              )
            }
          >
            Add date rule
          </Button>
          <ul className="mt-4 divide-y border-t">
            {exceptions.length === 0 && (
              <li className="py-3 text-sm text-muted-foreground">No upcoming date rules.</li>
            )}
            {exceptions.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 py-3 text-sm">
                <span>
                  <span className="font-semibold">
                    {formatShortDate(`${e.date}T12:00:00+02:00`)}
                  </span>{" "}
                  ·{" "}
                  {e.type === "blocked"
                    ? e.start_time
                      ? `Blocked ${hhmm(e.start_time)}–${hhmm(e.end_time)}`
                      : "Whole day blocked"
                    : `Custom hours ${hhmm(e.start_time)}–${hhmm(e.end_time)}`}
                  {e.reason && <span className="text-muted-foreground"> · {e.reason}</span>}
                </span>
                <button
                  aria-label="Remove"
                  onClick={() =>
                    run.mutate(() =>
                      supabase.from("availability_exceptions").delete().eq("id", e.id),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="p-5 xl:col-span-2">
          <h2 className="font-bold">Booking rules</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["max_advance_days", "Book up to (days ahead)"],
                ["min_notice_hours", "Minimum notice (hours)"],
                ["buffer_minutes", "Break between consultations (min)"],
                ["slot_interval_minutes", "Start times every (min)"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="text-sm">
                <span className="mb-1 block font-semibold">{label}</span>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={settings[k]}
                  onChange={(e) => setSettings({ ...settings, [k]: +e.target.value })}
                />
              </label>
            ))}
          </div>
          <Button
            size="sm"
            className="mt-4"
            onClick={() =>
              run.mutate(() =>
                supabase
                  .from("booking_settings")
                  .update({
                    buffer_minutes: settings.buffer_minutes,
                    max_advance_days: settings.max_advance_days,
                    min_notice_hours: settings.min_notice_hours,
                    slot_interval_minutes: settings.slot_interval_minutes,
                  })
                  .eq("id", 1),
              )
            }
          >
            Save booking rules
          </Button>
        </Panel>
      </div>
    </>
  );
}
