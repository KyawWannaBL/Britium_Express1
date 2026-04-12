import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "../../../../../lib/api-guard";
import { createAdminClient } from "../../../../../lib/admin-supabase";

export async function POST(request: NextRequest) {
  const access = await requireOpsAccess();

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });

  const vehicleId = String(body.vehicleId ?? "").trim();
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const heading = body.heading == null || body.heading === "" ? null : Number(body.heading);
  const speedKph = body.speedKph == null || body.speedKph === "" ? null : Number(body.speedKph);
  const branchCode = String(body.branchCode ?? access.branchCode ?? "").trim().toUpperCase();

  if (!vehicleId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: "vehicleId, latitude, and longitude are required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const branchRes = await supabase.from("branches").select("id, code").eq("code", branchCode).maybeSingle();

  await supabase.from("vehicle_locations").insert({
    vehicle_id: vehicleId,
    branch_id: branchRes.data?.id ?? null,
    latitude,
    longitude,
    heading,
    speed_kph: speedKph,
    source: "admin_console"
  });

  const updateRes = await supabase.from("vehicles").update({
    latitude,
    longitude,
    last_seen_at: new Date().toISOString()
  }).eq("id", vehicleId);

  if (updateRes.error) {
    return NextResponse.json({ error: updateRes.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, lastSeenAt: new Date().toISOString() });
}
