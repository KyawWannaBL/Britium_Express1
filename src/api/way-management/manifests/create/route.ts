
import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "../../../../../lib/api-guard";
import { createAdminClient } from "../../../../../lib/admin-supabase";
import { generateManifestNumber } from "../../../../../lib/way-management";

export async function POST(request: NextRequest) {
  const access = await requireOpsAccess();

  const body = await request.json();
  const shipmentIds = Array.isArray(body.shipmentIds) ? body.shipmentIds.map(String) : [];
  const destinationBranchId = body.destinationBranchId ? String(body.destinationBranchId) : null;
  const vehicleId = body.vehicleId ? String(body.vehicleId) : null;
  const bagCode = body.bagCode ? String(body.bagCode) : null;
  const sealCode = body.sealCode ? String(body.sealCode) : null;

  if (!access.branchCode || shipmentIds.length === 0) {
    return NextResponse.json({ error: "Branch context and shipmentIds are required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: branch } = await supabase.from("branches").select("id, code").eq("code", access.branchCode).maybeSingle();
  if (!branch) {
    return NextResponse.json({ error: "Operator branch not found." }, { status: 404 });
  }

  const { data: shipments, error: shipmentsError } = await supabase
    .from("shipments")
    .select("id, cod_amount_mmks")
    .in("id", shipmentIds)
    .eq("branch_id", branch.id);

  if (shipmentsError || !shipments || shipments.length === 0) {
    return NextResponse.json({ error: "No eligible branch shipments found." }, { status: 400 });
  }

  const manifestNumber = generateManifestNumber(branch.code);
  const totalCod = shipments.reduce((sum, item) => sum + Number(item.cod_amount_mmks ?? 0), 0);

  const { data: manifest, error } = await supabase
    .from("manifests")
    .insert({
      manifest_number: manifestNumber,
      branch_id: branch.id,
      destination_branch_id: destinationBranchId,
      vehicle_id: vehicleId,
      bag_code: bagCode,
      seal_code: sealCode,
      status: "sealed",
      total_shipments: shipments.length,
      total_cod_mmks: totalCod,
      created_by_profile_id: access.id
    })
    .select("id, manifest_number, status")
    .single();

  if (error || !manifest) {
    return NextResponse.json({ error: error?.message ?? "Unable to create manifest." }, { status: 500 });
  }

  const itemRows = shipments.map((shipment) => ({ manifest_id: manifest.id, shipment_id: shipment.id }));
  const itemsRes = await supabase.from("manifest_items").insert(itemRows);
  if (itemsRes.error) {
    return NextResponse.json({ error: itemsRes.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, manifest });
}
