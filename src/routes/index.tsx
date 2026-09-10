import { createFileRoute, Link } from "@tanstack/react-router";

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
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    title: "Verified sign in / out",
    body: "Students clock in at the workplace with a location check against the organization's registered site and radius.",
  },
  {
    title: "Daily field reports",
    body: "Record activities, skills learned, challenges and solutions; supervisors approve or return them with comments.",
  },
  {
    title: "Live monitoring",
    body: "Supervisors see today's roster and lateness; administrators manage organizations, supervisors, students and working hours.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
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

      <section className="console-panel diag mx-4 rounded-2xl px-6 py-16 sm:mx-6 sm:px-12">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/60">
            Field practical training
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            Attendance and monitoring for students on field placement.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-foreground/70">
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
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-14 sm:grid-cols-3 sm:px-6">
        {FEATURES.map((f) => (
          <div key={f.title} className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-card-foreground">{f.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
