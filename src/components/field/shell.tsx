import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getMe } from "@/lib/field.functions";
import { Button } from "@/components/ui/button";
import { STATUS_LABEL } from "@/lib/field-time";

export function useMe() {
  const fn = useServerFn(getMe);
  return useQuery({ queryKey: ["me"], queryFn: () => fn({}), staleTime: 60_000 });
}

type NavItem = { to: string; label: string };

const STUDENT_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/attendance", label: "Attendance" },
  { to: "/activities", label: "Daily activities" },
  { to: "/placement", label: "Placement" },
];

const STAFF_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/monitor", label: "Monitoring" },
];

const ADMIN_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/monitor", label: "Monitoring" },
  { to: "/manage", label: "Manage" },
  { to: "/settings", label: "Settings" },
];

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  const role = me?.role ?? "student";
  const nav = role === "admin" ? ADMIN_NAV : role === "supervisor" ? STAFF_NAV : STUDENT_NAV;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="console-panel diag border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">
              FD
            </span>
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
              FieldDeck
            </span>
          </Link>
          <nav className="order-3 flex w-full flex-wrap gap-1 sm:order-2 sm:w-auto">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-white/10 hover:text-foreground"
                activeProps={{ className: "bg-white/15 text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="order-2 ml-auto flex items-center gap-3 sm:order-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-foreground">
                {me?.profile?.full_name || me?.email}
              </p>
              <p className="font-mono text-xs uppercase tracking-widest text-foreground/60">
                {role}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {subtitle ? <p className="mt-1 text-sm text-foreground/60">{subtitle}</p> : null}
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`glass rounded-xl p-5 ${className}`}>{children}</div>;
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <Panel>
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-3xl font-semibold text-card-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Panel>
  );
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) {
    return (
      <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground">
        Not reported
      </span>
    );
  }
  const tone =
    status === "present" || status === "approved"
      ? "bg-present/15 text-present"
      : status === "late" || status === "pending" || status === "half_day"
        ? "bg-late/15 text-late"
        : "bg-absent/15 text-absent";
  const label =
    STATUS_LABEL[status] ?? status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
  return (
    <span className={`rounded-full px-2.5 py-1 font-mono text-xs font-medium ${tone}`}>
      {label}
    </span>
  );
}
