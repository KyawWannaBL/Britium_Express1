import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "@/lib/api-guard";
import { canManageUsers } from "@/lib/roles";
import { createAdminClient } from "@/lib/admin-supabase";
import { listOperatorMemberships, replaceOperatorMemberships } from "@/lib/operator-management";

type Params = { params: Promise<{ operatorId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  // 1. Fix: 0 arguments
  const identity = await requireOpsAccess();

  // 2. Fix: changed appRole to role
  if (!canManageUsers(identity.role)) {
    return NextResponse.json({ error: "Not allowed to view branch memberships." }, { status: 403 });
  }

  try {
    const { operatorId } = await params;
    const memberships = await listOperatorMemberships(operatorId);
    return NextResponse.json({ memberships });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load memberships." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  // 1. Fix: 0 arguments
  const identity = await requireOpsAccess();

  // 2. Fix: changed appRole to role
  if (!canManageUsers(identity.role)) {
    return NextResponse.json({ error: "Not allowed to edit branch memberships." }, { status: 403 });
  }

  try {
    const { operatorId } = await params;
    const body = await request.json();
    const memberships = Array.isArray(body.memberships) ? body.memberships : [];
    const appRole = typeof body.appRole === "string" ? body.appRole : null;

    const saved = await replaceOperatorMemberships({ operatorId, memberships, appRole });

    const supabase = createAdminClient();
    await supabase.from("operator_admin_actions").insert({
      actor_profile_id: identity.id, // 3. Fix: changed profileId to id
      target_profile_id: operatorId,
      action: "update_branch_memberships",
      metadata: {
        membershipCount: saved.length,
        primaryBranchCode:
          saved.find((item: any) => item.isPrimary || item.is_primary)?.branch_code ?? null
      }
    });

    return NextResponse.json({ ok: true, memberships: saved });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update memberships." },
      { status: 500 }
    );
  }
}