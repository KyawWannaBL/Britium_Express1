import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch the 50 most recent shipments for the print queue
    const { data: waybills, error } = await supabase
      .from('shipments')
      .select('id, tracking_no, recipient_name, current_status, created_at, address, phone_1, cod_amount')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ data: waybills || [], status: 'success' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
