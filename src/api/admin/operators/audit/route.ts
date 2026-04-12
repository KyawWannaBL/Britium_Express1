import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "@/lib/api-guard";
import { canManageUsers } from "@/lib/roles";

export async function GET(request: NextRequest) {
  const identity = await requireOpsAccess();

  if (!canManageUsers(identity.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({ message: "Audit logs active", operator: identity.id });
}