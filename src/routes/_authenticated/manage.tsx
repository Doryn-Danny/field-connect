import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, Panel } from "@/components/field/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/field-time";
import {
  deleteOrganization,
  deleteStudent,
  deleteSupervisor,
  getAdminData,
  saveOrganization,
  saveStudent,
  saveSupervisor,
} from "@/lib/field.functions";

export const Route = createFileRoute("/_authenticated/manage")({
  head: () => ({
    meta: [
      { title: "Manage placements — FieldDeck" },
      {
        name: "description",
        content: "Administer organizations, field supervisors and student placements.",
      },
      { property: "og:title", content: "Manage placements — FieldDeck" },
      {
        property: "og:description",
        content: "Add organizations with sign-in locations, supervisors and student placements.",
      },
    ],
  }),
  component: ManagePage,
});

type Tab = "organizations" | "supervisors" | "students";

function ManagePage() {
  const load = useServerFn(getAdminData);
  const saveOrg = useServerFn(saveOrganization);
  const delOrg = useServerFn(deleteOrganization);
  const saveSup = useServerFn(saveSupervisor);
  const delSup = useServerFn(deleteSupervisor);
  const saveStu = useServerFn(saveStudent);
  const delStu = useServerFn(deleteStudent);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["admin-data"], queryFn: () => load({}) });
  const [tab, setTab] = useState<Tab>("organizations");

  const [org, setOrg] = useState({
    organization_name: "",
    address: "",
    department: "",
    contact: "",
    latitude: "",
    longitude: "",
    radius_meters: "200",
  });
  const [sup, setSup] = useState({
    full_name: "",
    email: "",
    phone: "",
    organization_id: "",
  });
  const [stu, setStu] = useState({
    student_no: "",
    full_name: "",
    email: "",
    phone: "",
    program: "",
    university: "University of Dodoma",
    organization_id: "",
    supervisor_id: "",
    start_date: "",
    end_date: "",
  });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
  }

  function fail(e: unknown) {
    toast.error(e instanceof Error ? e.message : "Could not save.");
  }

  async function submitOrg(event: React.FormEvent) {
    event.preventDefault();
    try {
      await saveOrg({
        data: {
          organization_name: org.organization_name,
          address: org.address,
          department: org.department,
          contact: org.contact,
          latitude: org.latitude ? Number(org.latitude) : null,
          longitude: org.longitude ? Number(org.longitude) : null,
          radius_meters: Number(org.radius_meters || 200),
        },
      });
      toast.success("Organization saved.");
      setOrg({
        organization_name: "",
        address: "",
        department: "",
        contact: "",
        latitude: "",
        longitude: "",
        radius_meters: "200",
      });
      await refresh();
    } catch (e) {
      fail(e);
    }
  }

  async function submitSup(event: React.FormEvent) {
    event.preventDefault();
    try {
      await saveSup({
        data: {
          full_name: sup.full_name,
          email: sup.email,
          phone: sup.phone,
          organization_id: sup.organization_id || null,
        },
      });
      toast.success("Supervisor saved.");
      setSup({ full_name: "", email: "", phone: "", organization_id: "" });
      await refresh();
    } catch (e) {
      fail(e);
    }
  }

  async function submitStu(event: React.FormEvent) {
    event.preventDefault();
    try {
      await saveStu({
        data: {
          student_no: stu.student_no,
          full_name: stu.full_name,
          email: stu.email,
          phone: stu.phone,
          program: stu.program,
          university: stu.university,
          organization_id: stu.organization_id || null,
          supervisor_id: stu.supervisor_id || null,
          start_date: stu.start_date || null,
          end_date: stu.end_date || null,
        },
      });
      toast.success("Student saved.");
      setStu({ ...stu, student_no: "", full_name: "", email: "", phone: "" });
      await refresh();
    } catch (e) {
      fail(e);
    }
  }

  async function remove(kind: Tab, id: string) {
    try {
      if (kind === "organizations") await delOrg({ data: { id } });
      else if (kind === "supervisors") await delSup({ data: { id } });
      else await delStu({ data: { id } });
      toast.success("Deleted.");
      await refresh();
    } catch (e) {
      fail(e);
    }
  }

  if (isLoading || !data) {
    return (
      <AppShell title="Manage">
        <Panel>Loading…</Panel>
      </AppShell>
    );
  }

  const tabs: Tab[] = ["organizations", "supervisors", "students"];

  return (
    <AppShell title="Manage" subtitle="Organizations, supervisors and student placements">
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-sm capitalize transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-white/10 text-foreground/70"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "organizations" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
          <Panel>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Add organization
            </h2>
            <form className="mt-4 space-y-3" onSubmit={submitOrg}>
              <Field label="Name" value={org.organization_name} onChange={(v) => setOrg({ ...org, organization_name: v })} required />
              <Field label="Department" value={org.department} onChange={(v) => setOrg({ ...org, department: v })} />
              <Field label="Address" value={org.address} onChange={(v) => setOrg({ ...org, address: v })} />
              <Field label="Contact" value={org.contact} onChange={(v) => setOrg({ ...org, contact: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude" value={org.latitude} onChange={(v) => setOrg({ ...org, latitude: v })} />
                <Field label="Longitude" value={org.longitude} onChange={(v) => setOrg({ ...org, longitude: v })} />
              </div>
              <Field label="Radius (m)" value={org.radius_meters} onChange={(v) => setOrg({ ...org, radius_meters: v })} />
              <Button type="submit" className="w-full">Save organization</Button>
            </form>
          </Panel>
          <Panel className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="py-2">Organization</th>
                  <th className="py-2">Department</th>
                  <th className="py-2">Radius</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.organizations.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2 text-card-foreground">{o.organization_name}</td>
                    <td className="py-2 text-muted-foreground">{o.department ?? "—"}</td>
                    <td className="py-2 font-mono text-muted-foreground">{o.radius_meters} m</td>
                    <td className="py-2 text-right">
                      <Button size="sm" variant="secondary" onClick={() => remove("organizations", o.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      ) : null}

      {tab === "supervisors" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
          <Panel>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Add supervisor
            </h2>
            <form className="mt-4 space-y-3" onSubmit={submitSup}>
              <Field label="Full name" value={sup.full_name} onChange={(v) => setSup({ ...sup, full_name: v })} required />
              <Field label="Email" type="email" value={sup.email} onChange={(v) => setSup({ ...sup, email: v })} required />
              <Field label="Phone" value={sup.phone} onChange={(v) => setSup({ ...sup, phone: v })} />
              <div className="space-y-1.5">
                <Label>Organization</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  value={sup.organization_id}
                  onChange={(e) => setSup({ ...sup, organization_id: e.target.value })}
                >
                  <option value="">Not assigned</option>
                  {data.organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.organization_name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full">Save supervisor</Button>
            </form>
          </Panel>
          <Panel className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="py-2">Supervisor</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Organization</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.supervisors.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2 text-card-foreground">{s.full_name}</td>
                    <td className="py-2 text-muted-foreground">{s.email}</td>
                    <td className="py-2 text-muted-foreground">
                      {s.organizations?.organization_name ?? "—"}
                    </td>
                    <td className="py-2 text-right">
                      <Button size="sm" variant="secondary" onClick={() => remove("supervisors", s.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      ) : null}

      {tab === "students" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
          <Panel>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Add student
            </h2>
            <form className="mt-4 space-y-3" onSubmit={submitStu}>
              <Field label="Registration no" value={stu.student_no} onChange={(v) => setStu({ ...stu, student_no: v })} required />
              <Field label="Full name" value={stu.full_name} onChange={(v) => setStu({ ...stu, full_name: v })} required />
              <Field label="Email" type="email" value={stu.email} onChange={(v) => setStu({ ...stu, email: v })} required />
              <Field label="Phone" value={stu.phone} onChange={(v) => setStu({ ...stu, phone: v })} />
              <Field label="Program" value={stu.program} onChange={(v) => setStu({ ...stu, program: v })} />
              <Field label="University" value={stu.university} onChange={(v) => setStu({ ...stu, university: v })} />
              <div className="space-y-1.5">
                <Label>Organization</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  value={stu.organization_id}
                  onChange={(e) => setStu({ ...stu, organization_id: e.target.value })}
                >
                  <option value="">Not assigned</option>
                  {data.organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.organization_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Supervisor</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  value={stu.supervisor_id}
                  onChange={(e) => setStu({ ...stu, supervisor_id: e.target.value })}
                >
                  <option value="">Not assigned</option>
                  {data.supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start date" type="date" value={stu.start_date} onChange={(v) => setStu({ ...stu, start_date: v })} />
                <Field label="End date" type="date" value={stu.end_date} onChange={(v) => setStu({ ...stu, end_date: v })} />
              </div>
              <Button type="submit" className="w-full">Save student</Button>
            </form>
          </Panel>
          <Panel className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="py-2">Student</th>
                  <th className="py-2">Organization</th>
                  <th className="py-2">Supervisor</th>
                  <th className="py-2">Period</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.students.map((s) => (
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
                    <td className="py-2 text-muted-foreground">{s.supervisors?.full_name ?? "—"}</td>
                    <td className="py-2 font-mono text-xs text-muted-foreground">
                      {formatDate(s.start_date)} – {formatDate(s.end_date)}
                    </td>
                    <td className="py-2 text-right">
                      <Button size="sm" variant="secondary" onClick={() => remove("students", s.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      ) : null}
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
