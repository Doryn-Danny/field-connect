import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["login", "register"]).optional() }),
  head: () => ({
    meta: [
      { title: "Sign in — FieldDeck" },
      {
        name: "description",
        content: "Sign in or register to record your field placement attendance and daily reports.",
      },
      { property: "og:title", content: "Sign in — FieldDeck" },
      {
        property: "og:description",
        content: "Access your field attendance dashboard, reports and placement details.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">(search.mode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSentConfirmation(true);
          return;
        }
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="console-panel diag hidden flex-col justify-between p-12 lg:flex">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">
            FD
          </span>
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
            FieldDeck
          </span>
        </Link>
        <div>
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-foreground">
            Field student attendance and monitoring, from arrival to daily report.
          </h2>
          <p className="mt-4 max-w-md text-sm text-foreground/60">
            Students sign in at the workplace, supervisors review activities, administrators keep
            placements and working hours in order.
          </p>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/40">
          Practical training console
        </p>
      </div>

      <div className="flex items-center justify-center bg-background p-6">
        <div className="glass w-full max-w-md rounded-2xl p-7">
          {sentConfirmation ? (
            <div className="text-center">
              <h1 className="text-xl font-semibold text-card-foreground">Check your email</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                We sent a confirmation link to {email}. Open it to activate your account, then come
                back and sign in.
              </p>
              <Button
                className="mt-6 w-full"
                onClick={() => {
                  setSentConfirmation(false);
                  setMode("login");
                }}
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-card-foreground">
                {mode === "login" ? "Sign in" : "Create your account"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "login"
                  ? "Use the email registered for your field placement."
                  : "Register with the email your university used for your placement."}
              </p>

              <form className="mt-6 space-y-4" onSubmit={submit}>
                {mode === "register" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-card-foreground">
                      Full name
                    </Label>
                    <Input
                      id="fullName"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Amina Hassan"
                    />
                  </div>
                ) : null}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-card-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.ac.tz"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-card-foreground">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <button
                type="button"
                className="mt-5 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login"
                  ? "No account yet? Register"
                  : "Already registered? Sign in"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
