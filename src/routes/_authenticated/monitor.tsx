import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, Panel, StatCard, StatusBadge } from "@/components/field/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatTime } from "@/lib/field-time";
import { getMonitorOverview, reviewActivity } from "@/lib/field.functions";

export const Route = createFileRoute("/_authenticated/monitor")({
  head: () => ({
    meta: [
      { title: "Monitoring — FieldDeck" },
      {
        name: "description",
        content: "Track today's field attendance and review student daily reports.",
      },
      { property: "og:title", content: "Monitoring — FieldDeck" },
      {
        property: "og:description",
        content: "Supervisor monitoring of attendance, lateness and daily field reports.",
      },
    ],
  }),
  component: MonitorPage,
});

function MonitorPage() {
  const load = useServerFn(getMonitorOverview);
  const review = useServerFn(reviewActivity);
  const queryClient = useQueryClient();
  const [comments, setComments] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({ queryKey: ["monitor"], queryFn: () => load({}) });

  async function decide(id: string, approval_status: "approved" | "rejected") {
    try {
      await review({ data: { id, approval_status, supervisor_comment: comments[id] ?? "" } });
      toast.success(approval_status === "approved" ? "Report approved." : "Report returned.");
      await queryClient.invalidateQueries({ queryKey: ["monitor"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the report.");
    }
  }

  if (isLoading || !data) {
    return (
      <AppShell title="Monitoring">
        <Panel>Loading…</Panel>
      </AppShell>
    );
  }

  return (
    <AppShell title="Monitoring" subtitle={`Attendance and reports · ${formatDate(data.date)}`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={data.stats.total} />
        <StatCard label="Signed in" value={data.stats.signedIn} />
        <StatCard label="Late today" value={data.stats.late} />
        <StatCard label="Reports pending" value={data.stats.pendingActivities} />
      </div>

      <Panel className="mt-4 overflow-x-auto">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Today's attendance
        </h2>
        <table className="mt-4 w-full text-sm">
          <thead className="text-left font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="py-2">Student</th>
              <th className="py-2">Organization</th>
              <th className="py-2">Supervisor</th>
              <th className="py-2">In</th>
              <th className="py-2">Out</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {data.roster.map((s) => (
              <tr key={s.id}>
                <td className="py-2 text-card-foreground">{s.full_name}</td>
                <td className="py-2 text-muted-foreground">
                  {s.organizations?.organization_name ?? "—"}
                </td>
                <td className="py-2 text-muted-foreground">{s.supervisors?.full_name ?? "—"}</td>
                <td className="py-2 font-mono text-muted-foreground">
                  {formatTime(s.today?.sign_in_time)}
                </td>
                <td className="py-2 font-mono text-muted-foreground">
                  {formatTime(s.today?.sign_out_time)}
                </td>
                <td className="py-2">
                  <StatusBadge status={s.today?.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel className="mt-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Daily reports
        </h2>
        <ul className="mt-4 space-y-3">
          {data.activities.length === 0 ? (
            <li className="text-sm text-muted-foreground">No reports submitted yet.</li>
          ) : (
            data.activities.map((a) => (
              <li key={a.id} className="rounded-lg border border-white/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-card-foreground">
                    {a.student?.full_name ?? "Unknown student"}
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {formatDate(a.date)}
                    </span>
                  </span>
                  <StatusBadge status={a.approval_status} />
                </div>
                <p className="mt-2 text-sm text-card-foreground">{a.activity}</p>
                {a.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                ) : null}
                {a.skills_learned ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Skills: {a.skills_learned}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Input
                    className="max-w-xs"
                    placeholder="Comment (optional)"
                    value={comments[a.id] ?? ""}
                    onChange={(e) => setComments({ ...comments, [a.id]: e.target.value })}
                  />
                  <Button size="sm" onClick={() => decide(a.id, "approved")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => decide(a.id, "rejected")}>
                    Return
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </Panel>
    </AppShell>
  );
}
