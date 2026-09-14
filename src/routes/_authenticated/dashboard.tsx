import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, Panel, StatCard, StatusBadge, useMe } from "@/components/field/shell";
import { Button } from "@/components/ui/button";
import {
  formatDateShort,
  formatTime,
  getStudentDashboardKey,
} from "@/lib/field-client";
import {
  getMonitorOverview,
  getStudentDashboard,
  signInAttendance,
  signOutAttendance,
} from "@/lib/field.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — FieldDeck" },
      {
        name: "description",
        content: "Sign in and out of your field placement and track your attendance at a glance.",
      },
      { property: "og:title", content: "Dashboard — FieldDeck" },
      {
        property: "og:description",
        content: "Daily field attendance status, working hours and report progress.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: me, isLoading } = useMe();
  if (isLoading) {
    return (
      <AppShell title="Dashboard">
        <Panel>Loading…</Panel>
      </AppShell>
    );
  }
  if (me?.role === "student") return <StudentDashboard />;
  return <StaffDashboard role={me?.role ?? "supervisor"} />;
}

function StudentDashboard() {
  const load = useServerFn(getStudentDashboard);
  const signIn = useServerFn(signInAttendance);
  const signOut = useServerFn(signOutAttendance);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: getStudentDashboardKey,
    queryFn: () => load({}),
  });

  async function position(): Promise<{ latitude: number | null; longitude: number | null }> {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return { latitude: null, longitude: null };
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        () => resolve({ latitude: null, longitude: null }),
        { enableHighAccuracy: true, timeout: 10_000 },
      );
    });
  }

  async function act(kind: "in" | "out") {
    setBusy(true);
    try {
      const coords = await position();
      if (kind === "in") {
        const res = await signIn({ data: coords });
        toast.success(res.status === "late" ? "Signed in — marked late." : "Signed in on time.");
      } else {
        await signOut({ data: coords });
        toast.success("Signed out. Have a good evening.");
      }
      await queryClient.invalidateQueries({ queryKey: getStudentDashboardKey });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record attendance.");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
    return (
      <AppShell title="Today">
        <Panel>Loading your placement…</Panel>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell title="Today">
        <Panel>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Your placement is not ready yet."}
          </p>
        </Panel>
      </AppShell>
    );
  }

  const today = data.today;
  const org = data.student.organizations?.organization_name ?? "Placement pending";

  return (
    <AppShell
      title={`Hello, ${data.student.full_name.split(" ")[0]}`}
      subtitle={`${org} · ${data.student.student_no}`}
      actions={
        <div className="flex gap-2">
          <Button disabled={busy || !!today?.sign_in_time} onClick={() => act("in")}>
            {today?.sign_in_time ? "Signed in" : "Sign in"}
          </Button>
          <Button
            variant="secondary"
            disabled={busy || !today?.sign_in_time || !!today?.sign_out_time}
            onClick={() => act("out")}
          >
            {today?.sign_out_time ? "Signed out" : "Sign out"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today"
          value={<StatusBadge status={today?.status} />}
          hint={
            today?.sign_in_time
              ? `In ${formatTime(today.sign_in_time)}${today.sign_out_time ? ` · Out ${formatTime(today.sign_out_time)}` : ""}`
              : "Not signed in yet"
          }
        />
        <StatCard label="Days attended" value={data.stats.attended} hint={`${data.stats.late} late`} />
        <StatCard label="On-time rate" value={`${data.stats.onTimeRate}%`} />
        <StatCard
          label="Days remaining"
          value={data.stats.daysRemaining}
          hint={data.stats.totalDays ? `of ${data.stats.totalDays} days` : undefined}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Recent attendance
          </h2>
          <ul className="mt-4 divide-y divide-white/10">
            {data.recent.length === 0 ? (
              <li className="py-3 text-sm text-muted-foreground">No attendance recorded yet.</li>
            ) : (
              data.recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                  <span className="font-mono text-card-foreground">{formatDateShort(r.date)}</span>
                  <span className="text-muted-foreground">
                    {formatTime(r.sign_in_time)} – {formatTime(r.sign_out_time)}
                  </span>
                  <StatusBadge status={r.status} />
                </li>
              ))
            )}
          </ul>
        </Panel>

        <Panel>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Daily reports
          </h2>
          <p className="mt-4 font-mono text-3xl font-semibold text-card-foreground">
            {data.stats.activitiesFiled}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.stats.activitiesPending} awaiting supervisor review
          </p>
          <div className="mt-6 space-y-2">
            {data.weekly.map((w) => (
              <div key={w.date} className="flex items-center gap-3">
                <span className="w-16 font-mono text-xs text-muted-foreground">
                  {formatDateShort(w.date)}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, (w.minutes / 480) * 100)}%` }}
                  />
                </div>
                <span className="w-14 text-right font-mono text-xs text-muted-foreground">
                  {(w.minutes / 60).toFixed(1)}h
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function StaffDashboard({ role }: { role: string }) {
  const load = useServerFn(getMonitorOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["monitor"],
    queryFn: () => load({}),
  });

  if (isLoading || !data) {
    return (
      <AppShell title="Overview">
        <Panel>Loading roster…</Panel>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={role === "admin" ? "Administrator overview" : "Supervisor overview"}
      subtitle={`Today · ${formatDateShort(data.date)}`}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={data.stats.total} />
        <StatCard label="Signed in today" value={data.stats.signedIn} hint={`${data.stats.late} late`} />
        <StatCard label="Not reported" value={data.stats.notReported} />
        <StatCard label="Reports pending" value={data.stats.pendingActivities} />
      </div>

      <Panel className="mt-4 overflow-x-auto">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Today's roster
        </h2>
        <table className="mt-4 w-full text-sm">
          <thead className="text-left font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="py-2">Student</th>
              <th className="py-2">Organization</th>
              <th className="py-2">In</th>
              <th className="py-2">Out</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {data.roster.map((s) => (
              <tr key={s.id}>
                <td className="py-2 text-card-foreground">
                  {s.full_name}
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {s.student_no}
                  </span>
                </td>
                <td className="py-2 text-muted-foreground">
                  {s.organizations?.organization_name ?? "—"}
                </td>
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
    </AppShell>
  );
}
