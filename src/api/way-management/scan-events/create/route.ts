import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "../../../../../lib/api-guard";
import { createAdminClient } from "../../../../../lib/admin-supabase";

const ALLOWED_SCAN_TYPES = new Set([
  "pickup",
  "hub_in",
  "hub_out",
  "transfer_out",
  "transfer_in",
  "delivered"
]);

export async function POST(request: NextRequest) {
  const access = await requireOpsAccess();

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });

  const shipmentId = String(body.shipmentId ?? "").trim();
  const waybillId = String(body.waybillId ?? "").trim();
  const scanType = String(body.scanType ?? "").trim().toLowerCase();
  const scannerType = String(body.scannerType ?? "mobile_camera").trim().toLowerCase();
  const branchCode = String(body.branchCode ?? access.branchCode ?? "").trim().toUpperCase();
  const latitude = body.latitude == null || body.latitude === "" ? null : Number(body.latitude);
  const longitude = body.longitude == null || body.longitude === "" ? null : Number(body.longitude);
  const codAmountMmks = body.codAmountMmks == null || body.codAmountMmks === "" ? 0 : Number(body.codAmountMmks);
  const notes = typeof body.notes === "string" ? body.notes : "";
  const recipientName = typeof body.recipientName === "string" ? body.recipientName : "";
  const trackingNumber = typeof body.trackingNumber === "string" ? body.trackingNumber : "";
  const metadata = {
    notes,
    recipientName,
    trackingNumber,
    createdByRole: access.role
  };

  if (!shipmentId || !waybillId || !branchCode || !ALLOWED_SCAN_TYPES.has(scanType)) {
    return NextResponse.json({ error: "shipmentId, waybillId, valid scanType, and branchCode are required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const branchRes = await supabase.from("branches").select("id, code").eq("code", branchCode).maybeSingle();
  if (branchRes.error || !branchRes.data) {
    return NextResponse.json({ error: "Unknown branch code." }, { status: 400 });
  }

  const shipmentRes = await supabase
    .from("shipments")
    .select("id, tracking_number, branch_id")
    .eq("id", shipmentId)
    .maybeSingle();

  if (shipmentRes.error || !shipmentRes.data) {
    return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
  }

  const insertRes = await supabase.from("scan_events").insert({
    shipment_id: shipmentId,
    waybill_id: waybillId,
    scan_type: scanType,
    scanner_type: scannerType,
    branch_code: branchCode,
    branch_id: branchRes.data.id,
    actor_user_id: access.id,
    latitude,
    longitude,
    cod_amount_mmks: codAmountMmks,
    metadata
  }).select("id, scanned_at, scan_type, branch_code").single();

  if (insertRes.error) {
    return NextResponse.json({ error: insertRes.error.message }, { status: 500 });
  }

  const statusMap: Record<string, string> = {
    pickup: "picked_up",
    hub_in: "at_origin_branch",
    hub_out: "in_linehaul",
    transfer_out: "in_linehaul",
    transfer_in: "at_destination_branch",
    delivered: "delivered"
  };

  await supabase.from("shipments").update({
    status: statusMap[scanType] ?? undefined
  }).eq("id", shipmentId);

  return NextResponse.json({
    ok: true,
    event: insertRes.data,
    operator: { fullName: access.fullName, branchCode: access.branchCode }
  });
}
