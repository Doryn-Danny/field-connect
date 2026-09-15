import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  MapPin,
  Shield,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FieldDeck — Field Student Attendance & Monitoring" },
      {
        name: "description",
        content:
          "Sign in and out of your field placement with location checks, file daily reports, and let supervisors monitor attendance in real time.",
      },
      { property: "og:title", content: "FieldDeck — Field Student Attendance & Monitoring" },
      {
        property: "og:description",
        content:
          "Attendance, daily field reports and supervisor monitoring for university field practical training.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: MapPin,
    title: "Verified sign in / out",
    body: "Students clock in at the workplace with a location check against the organization's registered site and radius.",
  },
  {
    icon: ClipboardCheck,
    title: "Daily field reports",
    body: "Record activities, skills learned, challenges and solutions; supervisors approve or return them with comments.",
  },
  {
    icon: Activity,
    title: "Live monitoring",
    body: "Supervisors see today's roster and lateness; administrators manage organizations, supervisors, students and working hours.",
  },
  {
    icon: Clock,
    title: "Attendance history",
    body: "Review past sign-in and sign-out times, hours worked and status trends across the placement period.",
  },
  {
    icon: Shield,
    title: "Role-based access",
    body: "Students, supervisors and administrators each see only the data and actions their role allows.",
  },
  {
    icon: Users,
    title: "Multi-organization",
    body: "University administrators can add organizations, assign supervisors and place students from one console.",
  },
];

const ROLES = [
  {
    label: "Students",
    items: [
      "One-tap workplace sign in",
      "GPS and time verification",
      "Daily activity reports",
      "Attendance and placement summary",
    ],
  },
  {
    label: "Supervisors",
    items: [
      "Real-time roster view",
      "Approve or return reports",
      "Track lateness and absence",
      "Comment on student activity",
    ],
  },
  {
    label: "Administrators",
    items: [
      "Manage organizations",
      "Assign supervisors and students",
      "Configure working hours",
      "Organization-wide oversight",
    ],
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">
            FD
          </span>
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
            FieldDeck
          </span>
        </div>
        <Link
          to="/auth"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="console-panel diag mx-4 rounded-2xl px-6 py-16 sm:mx-6 sm:px-12 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/60">
            Field practical training
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Attendance and monitoring for students on field placement.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/70 sm:text-lg">
            One console for students, field supervisors and university administrators: workplace
            sign in and out, attendance history, daily activity reports and placement details.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
            <Link
              to="/auth"
              search={{ mode: "register" }}
              className="rounded-md border border-white/25 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
            >
              Create an account
            </Link>
          </div>

          {/* Decorative data panels */}
          <div className="mt-12 grid gap-3 sm:grid-cols-3">
            <div className="glass rounded-xl p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Students
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold text-card-foreground">6</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Organizations
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold text-card-foreground">4</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Supervisors
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold text-card-foreground">4</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Everything you need for field training
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-foreground/80">
            Built to replace paper attendance sheets and scattered communication with one reliable,
            role-aware console.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass rounded-xl p-6 transition-colors hover:bg-white/[0.07]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-card-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Built for every role
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Each user sees the tools that matter to them — nothing more, nothing less.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="text-lg font-semibold text-card-foreground">{r.label}</h3>
              <ul className="mt-4 space-y-3">
                {r.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="border-t border-white/10 bg-brand/60">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Ready to streamline field training?</h2>
              <p className="mt-1 text-sm text-foreground/70">
                Sign in or register now and start tracking attendance in minutes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Sign in
              </Link>
              <Link
                to="/auth"
                search={{ mode: "register" }}
                className="rounded-md border border-white/25 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
              >
                Register
              </Link>
            </div>
          </div>
          <p className="mt-10 text-xs text-foreground/50">
            © {new Date().getFullYear()} FieldDeck. Built for university field practical training.
          </p>
        </div>
      </footer>
    </div>
  );
}
