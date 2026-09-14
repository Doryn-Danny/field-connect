import { createFileRoute } from "@tanstack/react-router";

import { AppShell, Panel, useMe } from "@/components/field/shell";
import { formatDate } from "@/lib/field-time";

export const Route = createFileRoute("/_authenticated/placement")({
  head: () => ({
    meta: [
      { title: "My placement — FieldDeck" },
      {
        name: "description",
        content: "Your field placement organization, department, supervisor and training dates.",
      },
      { property: "og:title", content: "My placement — FieldDeck" },
      {
        property: "og:description",
        content: "Placement organization, supervisor contacts and field training period.",
      },
    ],
  }),
  component: PlacementPage,
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 py-2.5">
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-card-foreground">{value}</span>
    </div>
  );
}

function PlacementPage() {
  const { data: me, isLoading } = useMe();
  const student = me?.student;
  const org = student?.organizations;
  const supervisor = student?.supervisors;

  return (
    <AppShell title="My placement" subtitle="Field practical training details">
      {isLoading ? (
        <Panel>Loading…</Panel>
      ) : !student ? (
        <Panel>
          <p className="text-sm text-muted-foreground">
            No placement is linked to this account yet. Your administrator will assign one.
          </p>
        </Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Student
            </h2>
            <div className="mt-3">
              <Row label="Name" value={student.full_name} />
              <Row label="Reg. no" value={student.student_no} />
              <Row label="Program" value={student.program ?? "—"} />
              <Row label="University" value={student.university ?? "—"} />
              <Row label="Email" value={student.email ?? "—"} />
              <Row label="Phone" value={student.phone ?? "—"} />
            </div>
          </Panel>

          <Panel>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Organization
            </h2>
            <div className="mt-3">
              <Row label="Name" value={org?.organization_name ?? "Not assigned"} />
              <Row label="Department" value={org?.department ?? "—"} />
              <Row label="Address" value={org?.address ?? "—"} />
              <Row label="Contact" value={org?.contact ?? "—"} />
              <Row
                label="Sign-in radius"
                value={org?.radius_meters ? `${org.radius_meters} m` : "—"}
              />
            </div>
          </Panel>

          <Panel>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Supervisor & period
            </h2>
            <div className="mt-3">
              <Row label="Supervisor" value={supervisor?.full_name ?? "Not assigned"} />
              <Row label="Email" value={supervisor?.email ?? "—"} />
              <Row label="Phone" value={supervisor?.phone ?? "—"} />
              <Row label="Start date" value={formatDate(student.start_date)} />
              <Row label="End date" value={formatDate(student.end_date)} />
            </div>
          </Panel>
        </div>
      )}
    </AppShell>
  );
}
