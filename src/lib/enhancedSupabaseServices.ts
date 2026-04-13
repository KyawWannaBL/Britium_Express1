import { supabase } from "@/lib/supabase/client";
import { ApiScope, ScreenCode, hasApiPermission, hasScreenAccess, resolveRoleCode } from "@/lib/rbac";

export type AuditPayload = {
  action: string;
  entityType: string;
  entityId?: string | null;
  status?: "success" | "failed" | "denied";
  beforeData?: unknown;
  afterData?: unknown;
  notes?: string | null;
};

export async function auditEvent(payload: AuditPayload) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const actorId = session?.user?.id ?? null;
  const actorEmail = session?.user?.email ?? null;

  return supabase.from("audit_logs").insert({
    actor_id: actorId,
    actor_email: actorEmail,
    action: payload.action,
    entity_type: payload.entityType,
    entity_id: payload.entityId ?? null,
    status: payload.status ?? "success",
    before_data: payload.beforeData ?? null,
    after_data: payload.afterData ?? null,
    notes: payload.notes ?? null,
  });
}

export function assertScreenPermission(role: string | null | undefined, screen: ScreenCode) {
  if (!hasScreenAccess(role, screen)) {
    throw new Error("You do not have permission to access this screen.");
  }
}

export function assertApiPermission(role: string | null | undefined, scope: ApiScope) {
  if (!hasApiPermission(role, scope)) {
    throw new Error("You do not have permission to perform this API action.");
  }
}

export async function createApprovalRequest(input: {
  requestType: string;
  entityType: string;
  entityId?: string | null;
  requestedBy: string;
  requestedRole?: string | null;
  payload?: unknown;
}) {
  const roleCode = resolveRoleCode(input.requestedRole);
  await auditEvent({
    action: "approval.request.create",
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    status: "success",
    afterData: input.payload ?? null,
    notes: "Approval workflow initiated",
  });

  return supabase.from("approval_requests").insert({
    request_type: input.requestType,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    requested_by: input.requestedBy,
    requested_role: roleCode,
    status: "pending",
    payload: input.payload ?? null,
  });
}

export async function secureSelect<T = unknown>(params: {
  table: string;
  columns?: string;
  role?: string | null;
  screen: ScreenCode;
  apiScope: ApiScope;
}) {
  assertScreenPermission(params.role, params.screen);
  assertApiPermission(params.role, params.apiScope);

  const result = await supabase.from(params.table).select(params.columns ?? "*");
  await auditEvent({
    action: "data.select",
    entityType: params.table,
    status: result.error ? "failed" : "success",
    notes: params.columns ?? "*",
  });
  return result as typeof result & { data: T[] | null };
}

export async function secureInsert<T = unknown>(params: {
  table: string;
  values: Record<string, unknown> | Array<Record<string, unknown>>;
  role?: string | null;
  screen: ScreenCode;
  apiScope: ApiScope;
}) {
  assertScreenPermission(params.role, params.screen);
  assertApiPermission(params.role, params.apiScope);

  const result = await supabase.from(params.table).insert(params.values).select();
  await auditEvent({
    action: "data.insert",
    entityType: params.table,
    status: result.error ? "failed" : "success",
    afterData: params.values,
  });
  return result as typeof result & { data: T[] | null };
}

export async function secureUpdate<T = unknown>(params: {
  table: string;
  match: Record<string, unknown>;
  values: Record<string, unknown>;
  role?: string | null;
  screen: ScreenCode;
  apiScope: ApiScope;
}) {
  assertScreenPermission(params.role, params.screen);
  assertApiPermission(params.role, params.apiScope);

  let query = supabase.from(params.table).update(params.values);
  for (const [key, value] of Object.entries(params.match)) {
    query = query.eq(key, value);
  }

  const result = await query.select();
  await auditEvent({
    action: "data.update",
    entityType: params.table,
    status: result.error ? "failed" : "success",
    afterData: params.values,
  });
  return result as typeof result & { data: T[] | null };
}

export async function secureDelete(params: {
  table: string;
  match: Record<string, unknown>;
  role?: string | null;
  screen: ScreenCode;
  apiScope: ApiScope;
}) {
  assertScreenPermission(params.role, params.screen);
  assertApiPermission(params.role, params.apiScope);

  let query = supabase.from(params.table).delete();
  for (const [key, value] of Object.entries(params.match)) {
    query = query.eq(key, value);
  }

  const result = await query;
  await auditEvent({
    action: "data.delete",
    entityType: params.table,
    status: result.error ? "failed" : "success",
    afterData: params.match,
  });
  return result;
}
