import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Fetch recent shipments for the Data Entry Turbo list
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .select('id, tracking_no, recipient_name, current_status, total_charge, cod_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(5); // Just pull the 5 most recent for the "Recent Entries" queue

    if (error) throw error;
    return NextResponse.json({ data: data || [], status: 'success' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Accept new shipments from the Data Entry Turbo form
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Enterprise Validation
    if (!body.tracking_no || !body.recipient_name) {
      return NextResponse.json({ error: 'Tracking Number and Recipient are required.' }, { status: 400 });
    }

    // 2. Database Insertion (Mapping UI fields to SPEC-2 columns)
    const { data, error } = await supabase
      .from('shipments')
      .insert([{
        tracking_no: body.tracking_no,
        recipient_name: body.recipient_name,
        cod_amount: Number(body.cod_amount) || 0,
        total_charge: Number(body.delivery_fee) || 0,
        weight_kg: Number(body.weight_kg) || 0,
        current_status: 'draft', // All new turbo entries start as drafts until scanned
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data, status: 'success', message: 'Shipment secured.' });
  } catch (error: any) {
    console.error("Booking Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
