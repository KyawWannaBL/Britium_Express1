
import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "../../../../../lib/api-guard";
import { createAdminClient } from "../../../../../lib/admin-supabase";

export async function POST(request: NextRequest) {
  const access = await requireOpsAccess();

  const body = await request.json();
  const shipmentId = String(body.shipmentId ?? "");
  const vehicleId = body.vehicleId ? String(body.vehicleId) : null;
  const assignmentType = String(body.assignmentType ?? "delivery");
  const notes = String(body.notes ?? "");

  if (!shipmentId) {
    return NextResponse.json({ error: "shipmentId is required." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: shipment, error: shipmentError } = await supabase
    .from("shipments")
    .select("id, branch_id")
    .eq("id", shipmentId)
    .maybeSingle();

  if (shipmentError || !shipment) {
    return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
  }

  const payload = {
    shipment_id: shipmentId,
    branch_id: shipment.branch_id,
    assigned_operator_profile_id: access.id,
    assigned_vehicle_id: vehicleId,
    assignment_type: assignmentType,
    assignment_status: "assigned",
    route_code: access.branchCode ? `${access.branchCode}-${assignmentType}` : assignmentType,
    notes: { manual: true, notes, by: access.fullName },
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from("dispatch_assignments").insert(payload).select("id, assignment_status").single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("shipments").update({ status: assignmentType === "pickup" ? "assigned_for_pickup" : "assigned_for_delivery", updated_at: new Date().toISOString() }).eq("id", shipmentId);

  return NextResponse.json({ ok: true, assignment: data });
}
