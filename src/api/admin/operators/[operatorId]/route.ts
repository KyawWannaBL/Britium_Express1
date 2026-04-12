import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "@/lib/api-guard";
import { canManageUsers, normalizeRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/admin-supabase";
import {
  ensureAssignable,
  listBranches,
  setPrimaryBranch,
  updateOperatorAccount
} from "@/lib/operator-management";

type Params = { params: Promise<{ operatorId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  // 1. Fix: 0 arguments
  const identity = await requireOpsAccess();

  // 2. Fix: changed appRole to role
  if (!canManageUsers(identity.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { operatorId } = await params;
    const body = await request.json();

    const appRole = body.app_role ?? body.appRole ?? body.role;
    const normalizedRole = appRole ? normalizeRole(appRole) : undefined;

    // Fix: changed identity.role to identity.role
    if (normalizedRole && !ensureAssignable(identity.role, normalizedRole)) {
      return NextResponse.json(
        { error: `Role ${normalizedRole} cannot be assigned by ${identity.role}.` },
        { status: 403 }
      );
    }

    let primaryBranchCode: string | null | undefined = undefined;
    if (body.primary_branch_id || body.primaryBranchId) {
      const targetBranchId = body.primary_branch_id ?? body.primaryBranchId;
      const branches = await listBranches();
      const branch = branches.find((b) => b.id === targetBranchId);
      primaryBranchCode = branch?.code ?? null;
    }

    const updated = await updateOperatorAccount({
      operatorId,
      updates: {
        full_name: body.full_name ?? body.fullName,
        preferred_language: body.preferred_language ?? body.preferredLanguage,
        app_role: normalizedRole || undefined,
        is_active: typeof body.is_active === "boolean" ? body.is_active : body.isActive,
        must_change_password:
          typeof body.must_change_password === "boolean"
            ? body.must_change_password
            : body.mustChangePassword,
        primary_branch_id:
          body.primary_branch_id ?? body.primaryBranchId ?? undefined,
        primary_branch_code:
          primaryBranchCode === undefined ? undefined : primaryBranchCode
      }
    });

    const finalBranchId = body.primary_branch_id ?? body.primaryBranchId;
    if (finalBranchId && primaryBranchCode) {
      await setPrimaryBranch({
        operatorId,
        branchId: finalBranchId,
        branchCode: primaryBranchCode,
        appRole: normalizedRole ?? updated.app_role ?? updated.role
      });
    }

    const supabase = createAdminClient();
    await supabase.from("operator_admin_actions").insert({
      actor_profile_id: identity.id, // 3. Fix: changed profileId to id
      target_profile_id: operatorId,
      action: "update_operator",
      metadata: {
        appRole: normalizedRole ?? null,
        primaryBranchId: finalBranchId ?? null,
        isActive: body.is_active ?? body.isActive ?? null,
        mustChangePassword: body.must_change_password ?? body.mustChangePassword ?? null
      }
    });

    return NextResponse.json({ ok: true, operator: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update operator." },
      { status: 500 }
    );
  }
}