import { createClient } from "@/lib/supabase/server";
import { generateSmartWayId } from "@/lib/generators"; 
import { requireOpsAccess } from "@/lib/api-guard"; // The security guard
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 1. Security Check (FIX: No 'req' argument passed here)
  try {
    await requireOpsAccess(); 
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const supabase = await createClient();
  const body = await req.json();

  // 2. Get current count for serial number
  // Using head: true for a fast count of all existing shipments
  const { count, error: countError } = await supabase
    .from('shipments')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    return NextResponse.json({ error: "Failed to fetch sequence." }, { status: 500 });
  }

  // 3. Generate the Smart WayID (e.g., YGN20260330MDY0001)
  const wayId = generateSmartWayId(
    body.senderCity || "YGN", 
    body.recipientCity || "YGN", 
    (count || 0) + 1
  );

  // 4. Save to Database
  const { data, error } = await supabase
    .from('shipments')
    .insert([{
      ...body,
      way_id: wayId,
      status: 'pending_pickup',
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return "ok: true" so your frontend modal triggers correctly
  return NextResponse.json({ ...data, ok: true });
}