import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch live warehouse statistics
export async function GET() {
  try {
    const { data: shipments, error } = await supabase
      .from('shipments')
      .select('current_status');

    if (error) throw error;

    const stats = {
      inbound: shipments.filter(s => s.current_status === 'received').length,
      sorting: shipments.filter(s => s.current_status === 'in_warehouse').length,
      dispatch: shipments.filter(s => s.current_status === 'dispatched').length,
      exceptions: shipments.filter(s => s.current_status === 'exception').length,
    };

    return NextResponse.json({ data: stats, status: 'success' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Process an Inbound Warehouse Scan
export async function POST(request: Request) {
  try {
    const { tracking_no, scan_type = 'inbound' } = await request.json();

    if (!tracking_no) return NextResponse.json({ error: 'Missing barcode.' }, { status: 400 });

    // 1. Log the scan in the ledger
    const { error: logError } = await supabase
      .from('warehouse_scans')
      .insert([{ tracking_no, scan_type }]);
      
    if (logError) throw logError;

    // 2. Update the main shipment status
    const newStatus = scan_type === 'inbound' ? 'in_warehouse' : 'sorting';
    
    const { data: updated, error: updateError } = await supabase
      .from('shipments')
      .update({ current_status: newStatus })
      .eq('tracking_no', tracking_no)
      .select('tracking_no, current_status')
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ data: updated, status: 'success', message: `Parcel moved to ${newStatus}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
