import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

type AuthState = "loading" | "authenticated" | "unauthenticated";

type PrivateRouteProps = {
  children: ReactNode;
  allowedRoles?: string[];
};

const resolveRole = (session: Session | null): string | undefined => {
  if (!session?.user) return undefined;
  const appRole = session.user.app_metadata?.role;
  const userRole = session.user.user_metadata?.role;
  return typeof appRole === "string" ? appRole : typeof userRole === "string" ? userRole : undefined;
};

export function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const [state, setState] = useState<AuthState>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      setState(data.session ? "authenticated" : "unauthenticated");
    };

    void bootstrap();

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession ?? null);
      setState(nextSession ? "authenticated" : "unauthenticated");
    });

    return () => {
      mounted = false;
      authSub.subscription.unsubscribe();
    };
  }, []);

  const userRole = useMemo(() => resolveRole(session), [session]);
  const roleAllowed =
    !allowedRoles?.length ||
    (userRole ? allowedRoles.map((r) => r.toLowerCase()).includes(userRole.toLowerCase()) : false);

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    setSubmitting(false);
  };

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-xl border bg-card px-6 py-4 text-sm text-muted-foreground shadow-sm">
          Loading secure session...
        </div>
      </div>
    );
  }

  if (state === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <form onSubmit={signIn} className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg">
          <h1 className="text-xl font-bold text-foreground">Britium Security Login</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to access role-protected logistics dashboards.</p>
          <div className="mt-4 space-y-3">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              placeholder="Email"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              placeholder="Password"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
            />
          </div>
          {authError ? <p className="mt-3 text-sm text-destructive">{authError}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="mt-5 h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  if (!roleAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-2xl rounded-2xl border bg-card p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-foreground">Restricted Access</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your role ({userRole ?? "unknown"}) cannot access this screen.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
