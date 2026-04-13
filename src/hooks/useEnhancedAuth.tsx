import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import {
  AuthorityLevel,
  DataScope,
  ScreenCode,
  ApiScope,
  getRoleDefinition,
  hasApiPermission,
  hasScreenAccess,
  isSuperAdminEmail,
  resolveRoleCode,
} from "@/lib/rbac";

export type EnhancedAuthState = {
  session: Session | null;
  user: User | null;
  role: string;
  roleCode: string;
  authorityLevel: AuthorityLevel;
  dataScopes: DataScope[];
  screens: ScreenCode[];
  apiScopes: ApiScope[];
  loading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  hasScreenPermission: (screen: ScreenCode) => boolean;
  hasApiPermission: (scope: ApiScope) => boolean;
  refresh: () => Promise<void>;
};

async function loadRoleFromProfile(userId: string) {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("role, role_code, app_role, user_role")
      .eq("id", userId)
      .maybeSingle();

    const row: any = data || {};
    return row.role || row.role_code || row.app_role || row.user_role || "INT";
  } catch {
    return "INT";
  }
}

export function useEnhancedAuth(): EnhancedAuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState("INT");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (!currentSession?.user) {
        setRole("INT");
        return;
      }

      const email = currentSession.user.email ?? "";
      if (isSuperAdminEmail(email)) {
        setRole("SYS");
        return;
      }

      const metaRole =
        (currentSession.user.app_metadata as any)?.role ||
        (currentSession.user.app_metadata as any)?.role_code ||
        (currentSession.user.user_metadata as any)?.role;

      if (metaRole) {
        setRole(metaRole);
        return;
      }

      const dbRole = await loadRoleFromProfile(currentSession.user.id);
      setRole(dbRole);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setRole("INT");
        setLoading(false);
        return;
      }

      const email = nextSession.user.email ?? "";
      if (isSuperAdminEmail(email)) {
        setRole("SYS");
        setLoading(false);
        return;
      }

      const dbRole = await loadRoleFromProfile(nextSession.user.id);
      setRole(dbRole);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refresh]);

  const roleCode = useMemo(() => resolveRoleCode(role), [role]);
  const definition = useMemo(() => getRoleDefinition(role), [role]);

  return {
    session,
    user,
    role,
    roleCode,
    authorityLevel: definition.level,
    dataScopes: definition.scopes,
    screens: definition.screens,
    apiScopes: definition.api,
    loading,
    isAuthenticated: Boolean(user),
    isSuperAdmin: roleCode === "SYS",
    hasScreenPermission: (screen) => hasScreenAccess(role, screen),
    hasApiPermission: (scope) => hasApiPermission(role, scope),
    refresh,
  };
}

export default useEnhancedAuth;
