import { NextRequest, NextResponse } from "next/server";
import { getOpsIdentity } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // ✅ FIX: Removed 'request' argument
    const identity = await getOpsIdentity();

    if (!identity) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: identity.id, // ✅ FIX: Use .id instead of .profileId
        role: identity.role,
        branchCode: identity.branchCode
      }
    });
  } catch (error) {
    return NextResponse.json(
      { authenticated: false, error: "Session expired or unauthorized" },
      { status: 401 }
    );
  }
}