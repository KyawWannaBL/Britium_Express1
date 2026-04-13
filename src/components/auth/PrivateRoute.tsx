import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";

type AuthState = "loading" | "authenticated" | "unauthenticated";

type PrivateRouteProps = {
  children: ReactNode;
  allowedRoles?: string[];
};

const GLOBAL_ACCESS_ROLES = new Set([
  "super_admin",
  "admin",
  "sys",
  "app_owner",
]);

const MD_SUPERADMIN_EMAIL = "md@britiumexpress.com";

function normalizeRole(value?: string | null) {
  return (value ?? "")
    .trim()
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

async function resolveRole(session: Session | null): Promise<string> {
  if (!session?.user) return "guest";

  const email = session.user.email?.toLowerCase() ?? "";
  if (email === MD_SUPERADMIN_EMAIL) return "super_admin";

  const metaRole = normalizeRole(
    (session.user.app_metadata as any)?.role ||
      (session.user.app_metadata as any)?.role_code ||
      (session.user.user_metadata as any)?.role
  );

  if (metaRole) return metaRole;

  try {
    const { data } = await supabase
      .from("profiles")
      .select("role, role_code, app_role, user_role")
      .eq("id", session.user.id)
      .maybeSingle();

    const row: any = data || {};
    return normalizeRole(
      row.role || row.role_code || row.app_role || row.user_role || "guest"
    );
  } catch {
    return "guest";
  }
}

export function PrivateRoute({
  children,
  allowedRoles = [],
}: PrivateRouteProps) {
  const location = useLocation();

  const [authState, setAuthState] = useState<AuthState>("loading");
  const [resolvedRole, setResolvedRole] = useState("guest");

  const normalizedAllowedRoles = useMemo(
    () => allowedRoles.map((role) => normalizeRole(role)),
    [allowedRoles]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (!cancelled) setAuthState("unauthenticated");
          return;
        }

        const role = await resolveRole(session);

        if (!cancelled) {
          setResolvedRole(role);
          setAuthState("authenticated");
        }
      } catch {
        if (!cancelled) setAuthState("unauthenticated");
      }
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setResolvedRole("guest");
        setAuthState("unauthenticated");
        return;
      }

      const role = await resolveRole(session);
      setResolvedRole(role);
      setAuthState("authenticated");
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (authState === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#07111f_0%,#0a1830_100%)] px-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-6 text-sm font-semibold text-white/80 backdrop-blur">
          Checking access...
        </div>
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (
    normalizedAllowedRoles.length > 0 &&
    !normalizedAllowedRoles.includes(resolvedRole) &&
    !GLOBAL_ACCESS_ROLES.has(resolvedRole)
  ) {
    return (
      <div className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_54%,#f8fafc_100%)] px-4">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
          <h1 className="text-3xl font-black text-[#0d2c54]">Restricted Access</h1>
          <p className="mt-3 text-base text-slate-500">
            Your role ({resolvedRole || "unknown"}) cannot access this screen.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default PrivateRoute;
