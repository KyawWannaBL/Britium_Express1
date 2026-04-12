
import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "../../../../lib/api-guard";
import { getWayManagementBoard } from "../../../../lib/way-management";

export async function GET(request: NextRequest) {
  const access = await requireOpsAccess();

  const requestedBranch = request.nextUrl.searchParams.get("branch");
  const branchCode = requestedBranch || access.branchCode || null;
  const board = await getWayManagementBoard(branchCode);

  return NextResponse.json({
    ...board,
    operator: {
      fullName: access.fullName,
      role: access.role,
      branchCode: access.branchCode
    }
  });
}
