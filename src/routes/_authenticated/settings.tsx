import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell, Panel } from "@/components/field/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSettings, updateSettings } from "@/lib/field.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "System settings — FieldDeck" },
      {
        name: "description",
        content: "Set official working hours, lateness grace period and location requirements.",
      },
      { property: "og:title", content: "System settings — FieldDeck" },
      {
        property: "og:description",
        content: "Configure field attendance rules: working hours, grace period and GPS radius.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const load = useServerFn(getSettings);
  const save = useServerFn(updateSettings);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: () => load({}) });

  const [form, setForm] = useState({
    work_start: "08:00",
    work_end: "16:00",
    grace_minutes: 15,
    gps_required: true,
    default_radius_meters: 200,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        work_start: data.work_start.slice(0, 5),
        work_end: data.work_end.slice(0, 5),
        grace_minutes: data.grace_minutes,
        gps_required: data.gps_required,
        default_radius_meters: data.default_radius_meters,
      });
    }
  }, [data]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await save({ data: form });
      toast.success("Settings updated.");
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="System settings" subtitle="Attendance rules for all field students">
      <Panel className="max-w-xl">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start">Work start</Label>
                <Input
                  id="start"
                  type="time"
                  value={form.work_start}
                  onChange={(e) => setForm({ ...form, work_start: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end">Work end</Label>
                <Input
                  id="end"
                  type="time"
                  value={form.work_end}
                  onChange={(e) => setForm({ ...form, work_end: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grace">Lateness grace period (minutes)</Label>
              <Input
                id="grace"
                type="number"
                min={0}
                max={120}
                value={form.grace_minutes}
                onChange={(e) => setForm({ ...form, grace_minutes: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="radius">Default sign-in radius (metres)</Label>
              <Input
                id="radius"
                type="number"
                min={20}
                max={5000}
                value={form.default_radius_meters}
                onChange={(e) =>
                  setForm({ ...form, default_radius_meters: Number(e.target.value) })
                }
              />
            </div>
            <label className="flex items-center gap-3 text-sm text-card-foreground">
              <input
                type="checkbox"
                checked={form.gps_required}
                onChange={(e) => setForm({ ...form, gps_required: e.target.checked })}
              />
              Require location check when students sign in
            </label>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save settings"}
            </Button>
          </form>
        )}
      </Panel>
    </AppShell>
  );
}
