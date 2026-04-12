import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch all shipments that are no longer just "drafts"
    const { data: shipments, error } = await supabase
      .from('shipments')
      .select('id, tracking_no, recipient_name, current_status, cod_amount, updated_at')
      .neq('current_status', 'draft')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Calculate aggregated metrics for the top cards
    const metrics = {
      active: shipments?.filter(s => ['in_transit', 'out_for_delivery'].includes(s.current_status)).length || 0,
      success: shipments?.filter(s => s.current_status === 'delivered').length || 0,
      failures: shipments?.filter(s => s.current_status === 'failed_attempt').length || 0,
      returns: shipments?.filter(s => s.current_status === 'returned').length || 0,
      all_ways: shipments?.length || 0
    };

    return NextResponse.json({ data: shipments || [], metrics, status: 'success' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
