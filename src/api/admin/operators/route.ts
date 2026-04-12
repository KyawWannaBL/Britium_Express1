import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "@/lib/api-guard";
import { canManageUsers } from "@/lib/roles";
import { createAdminClient } from "@/lib/admin-supabase";

export async function GET(request: NextRequest) {
  const identity = await requireOpsAccess(); // Fixed: 0 arguments

  if (!canManageUsers(identity.role)) { // Fixed: .role instead of .appRole
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("operators").select("*");
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const identity = await requireOpsAccess();

  if (!canManageUsers(identity.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const supabase = createAdminClient();
  
  const { data, error } = await supabase.from("operators").insert([body]).select().single();
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}