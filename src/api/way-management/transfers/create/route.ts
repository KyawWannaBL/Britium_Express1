
import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "../../../../../lib/api-guard";
import { createAdminClient } from "../../../../../lib/admin-supabase";
import { generateTransferNumber } from "../../../../../lib/way-management";

export async function POST(request: NextRequest) {
  const access = await requireOpsAccess();

  const body = await request.json();
  const manifestId = String(body.manifestId ?? "");
  const toBranchId = body.toBranchId ? String(body.toBranchId) : null;
  const vehicleId = body.vehicleId ? String(body.vehicleId) : null;
  const bagCode = body.bagCode ? String(body.bagCode) : null;
  const sealCode = body.sealCode ? String(body.sealCode) : null;

  if (!manifestId || !access.branchCode) {
    return NextResponse.json({ error: "manifestId and operator branch are required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: branch } = await supabase.from("branches").select("id, code").eq("code", access.branchCode).maybeSingle();
  const { data: manifest } = await supabase.from("manifests").select("id, total_shipments, total_cod_mmks").eq("id", manifestId).maybeSingle();

  if (!branch || !manifest) {
    return NextResponse.json({ error: "Manifest or branch not found." }, { status: 404 });
  }

  const transferNumber = generateTransferNumber(branch.code);
  const { data, error } = await supabase
    .from("branch_transfers")
    .insert({
      transfer_number: transferNumber,
      from_branch_id: branch.id,
      to_branch_id: toBranchId,
      manifest_id: manifest.id,
      vehicle_id: vehicleId,
      transfer_status: "prepared",
      bag_code: bagCode,
      seal_code: sealCode,
      shipment_count: manifest.total_shipments ?? 0,
      cod_total_mmks: manifest.total_cod_mmks ?? 0,
      created_by_profile_id: access.id
    })
    .select("id, transfer_number, transfer_status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, transfer: data });
}
