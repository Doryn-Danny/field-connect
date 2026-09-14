import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AppShell, Panel, StatusBadge } from "@/components/field/shell";
import { formatDate, formatTime, hoursBetween } from "@/lib/field-time";
import { listMyAttendance } from "@/lib/field.functions";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance history — FieldDeck" },
      {
        name: "description",
        content: "Every field placement day you signed in and out, with hours worked and status.",
      },
      { property: "og:title", content: "Attendance history — FieldDeck" },
      {
        property: "og:description",
        content: "Full record of your field attendance days, hours and lateness.",
      },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const load = useServerFn(listMyAttendance);
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-attendance"],
    queryFn: () => load({}),
  });

  return (
    <AppShell title="Attendance history" subtitle="Your complete field attendance record">
      <Panel className="overflow-x-auto">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Could not load attendance."}
          </p>
        ) : (data?.rows.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No attendance recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Sign in</th>
                <th className="py-2">Sign out</th>
                <th className="py-2">Hours</th>
                <th className="py-2">Distance</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {data!.rows.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 text-card-foreground">{formatDate(r.date)}</td>
                  <td className="py-2 font-mono text-muted-foreground">
                    {formatTime(r.sign_in_time)}
                  </td>
                  <td className="py-2 font-mono text-muted-foreground">
                    {formatTime(r.sign_out_time)}
                  </td>
                  <td className="py-2 font-mono text-muted-foreground">
                    {hoursBetween(r.sign_in_time, r.sign_out_time)}
                  </td>
                  <td className="py-2 font-mono text-muted-foreground">
                    {r.distance_meters == null ? "—" : `${Math.round(r.distance_meters)} m`}
                  </td>
                  <td className="py-2">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </AppShell>
  );
}
