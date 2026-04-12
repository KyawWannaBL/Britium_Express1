import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "@/lib/api-guard";

export async function GET(request: NextRequest) {
  const access = await requireOpsAccess(); 
  
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();

  return NextResponse.json({ 
    items: [], 
    operator: access.id // Fixed: .id instead of .profileId
  });
}