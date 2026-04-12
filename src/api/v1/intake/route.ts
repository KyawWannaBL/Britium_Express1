import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { tracking_no } = await request.json();

    if (!tracking_no) {
      return NextResponse.json({ error: 'Barcode missing or unreadable.' }, { status: 400 });
    }

    // 1. Find the shipment and verify it hasn't already been processed
    const { data: existing, error: searchError } = await supabase
      .from('shipments')
      .select('id, current_status')
      .eq('tracking_no', tracking_no)
      .single();

    if (searchError || !existing) {
      return NextResponse.json({ error: `Tracking ${tracking_no} not found in system.` }, { status: 404 });
    }

    if (existing.current_status !== 'draft') {
      return NextResponse.json({ error: `Tracking ${tracking_no} is already marked as ${existing.current_status}.` }, { status: 400 });
    }

    // 2. Update status to 'received' (Physical custody taken)
    const { data: updated, error: updateError } = await supabase
      .from('shipments')
      .update({ current_status: 'received' })
      .eq('tracking_no', tracking_no)
      .select('tracking_no, recipient_name')
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ data: updated, status: 'success', message: 'Parcel received into network.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
