import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "@/lib/api-guard";
import { createAdminClient } from "@/lib/admin-supabase";

export async function GET(request: NextRequest) {
  // ✅ FIX: Removed 'request'
  const access = await requireOpsAccess(); 

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const limit = Math.min(20, Number(request.nextUrl.searchParams.get("limit") ?? 10));

  try {
    const supabase = createAdminClient();
    let query = supabase
      .from("customers")
      .select("*")
      .limit(limit);

    if (q) {
      query = query.or(`full_name.ilike.%${q}%,phone_e164.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // ✅ FIX: Use access.id instead of access.id
    return NextResponse.json({ items: data ?? [], limit, operator: access.id });
  } catch (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}