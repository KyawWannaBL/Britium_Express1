import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "../../../../../lib/api-guard";
import { createAdminClient } from "../../../../../lib/admin-supabase";

const ASSIGNMENT_TYPES = new Set(["pickup", "delivery"]);

function normalizeOptionalId(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function normalizeAssignmentType(value: unknown) {
  const text = typeof value === "string" ? value.trim().toLowerCase() : "delivery";
  return ASSIGNMENT_TYPES.has(text) ? text : null;
}

export async function POST(request: NextRequest) {
  const access = await requireOpsAccess();

  const body = await request.json();
  const shipmentId = normalizeOptionalId(body.shipmentId ?? body.shipment_id);
  const vehicleId = normalizeOptionalId(body.vehicleId ?? body.vehicle_id);
  const assignmentType = normalizeAssignmentType(body.assignmentType ?? body.assignment_type);
  const notes = String(body.notes ?? "");

  if (!shipmentId) {
    return NextResponse.json({ error: "shipmentId is required." }, { status: 400 });
  }

  if (!assignmentType) {
    return NextResponse.json({ error: "assignmentType must be pickup or delivery." }, { status: 400 });
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

  let assignedVehicleId: string | null = null;
  if (vehicleId) {
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("id")
      .eq("id", vehicleId)
      .maybeSingle();

    if (vehicleError) {
      return NextResponse.json({ error: vehicleError.message }, { status: 500 });
    }

    if (!vehicle) {
      return NextResponse.json(
        { error: "Selected vehicle is not in vehicle master data. Refresh the vehicle list and choose a valid vehicle." },
        { status: 400 },
      );
    }

    assignedVehicleId = vehicle.id;
  }

  const payload = {
    shipment_id: shipmentId,
    branch_id: shipment.branch_id,
    assigned_operator_profile_id: access.id,
    assigned_vehicle_id: assignedVehicleId,
    assignment_type: assignmentType,
    assignment_status: "assigned",
    route_code: access.branchCode ? `${access.branchCode}-${assignmentType}` : assignmentType,
    notes: { manual: true, notes, by: access.fullName },
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("dispatch_assignments").insert(payload).select("id, assignment_status").single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("shipments")
    .update({
      status: assignmentType === "pickup" ? "assigned_for_pickup" : "assigned_for_delivery",
      updated_at: new Date().toISOString(),
    })
    .eq("id", shipmentId);

  return NextResponse.json({ ok: true, assignment: data });
}
