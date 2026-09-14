import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, Panel, StatusBadge } from "@/components/field/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, localDateString } from "@/lib/field-time";
import { listMyActivities, submitActivity } from "@/lib/field.functions";

export const Route = createFileRoute("/_authenticated/activities")({
  head: () => ({
    meta: [
      { title: "Daily activities — FieldDeck" },
      {
        name: "description",
        content: "File your daily field report: activities, skills learned, challenges and solutions.",
      },
      { property: "og:title", content: "Daily activities — FieldDeck" },
      {
        property: "og:description",
        content: "Submit daily field reports and follow your supervisor's review.",
      },
    ],
  }),
  component: ActivitiesPage,
});

function ActivitiesPage() {
  const load = useServerFn(listMyActivities);
  const submit = useServerFn(submitActivity);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-activities"],
    queryFn: () => load({}),
  });

  const [form, setForm] = useState({
    date: localDateString(),
    activity: "",
    description: "",
    skills_learned: "",
    challenges: "",
    solutions: "",
  });
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await submit({ data: form });
      toast.success("Report submitted for review.");
      setForm({
        date: localDateString(),
        activity: "",
        description: "",
        skills_learned: "",
        challenges: "",
        solutions: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["my-activities"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit the report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Daily activities" subtitle="What you did today at your placement">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
        <Panel>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            New report
          </h2>
          <form className="mt-4 space-y-3" onSubmit={save}>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="activity">Activity</Label>
              <Input
                id="activity"
                required
                minLength={5}
                value={form.activity}
                onChange={(e) => setForm({ ...form, activity: e.target.value })}
                placeholder="Assisted with network cabling"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="skills">Skills learned</Label>
              <Textarea
                id="skills"
                rows={2}
                value={form.skills_learned}
                onChange={(e) => setForm({ ...form, skills_learned: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="challenges">Challenges</Label>
              <Textarea
                id="challenges"
                rows={2}
                value={form.challenges}
                onChange={(e) => setForm({ ...form, challenges: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="solutions">Solutions</Label>
              <Textarea
                id="solutions"
                rows={2}
                value={form.solutions}
                onChange={(e) => setForm({ ...form, solutions: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Submitting…" : "Submit report"}
            </Button>
          </form>
        </Panel>

        <Panel>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Submitted reports
          </h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : error ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Could not load reports."}
            </p>
          ) : (data?.length ?? 0) === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No reports yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data!.map((a) => (
                <li key={a.id} className="rounded-lg border border-white/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      {formatDate(a.date)}
                    </span>
                    <StatusBadge status={a.approval_status} />
                  </div>
                  <p className="mt-2 text-sm font-medium text-card-foreground">{a.activity}</p>
                  {a.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                  ) : null}
                  {a.supervisor_comment ? (
                    <p className="mt-2 text-sm text-late">Supervisor: {a.supervisor_comment}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
