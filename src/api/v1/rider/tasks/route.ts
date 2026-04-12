import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch Rider Stats and Active Tasks
export async function GET() {
  try {
    // For this demo, we'll fetch all non-draft shipments to give the rider a populated queue
    const { data: tasks, error } = await supabase
      .from('shipments')
      .select('id, tracking_no, recipient_name, current_status, cod_amount, address')
      .neq('current_status', 'draft')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const stats = {
      assigned: tasks.filter(t => !['delivered', 'failed_attempt', 'returned'].includes(t.current_status)).length,
      completed: tasks.filter(t => t.current_status === 'delivered').length,
      failed: tasks.filter(t => t.current_status === 'failed_attempt').length,
      earnings: tasks.filter(t => t.current_status === 'delivered').reduce((sum, t) => sum + (Number(t.cod_amount) || 0), 0)
    };

    return NextResponse.json({ data: tasks, stats, status: 'success' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Update Delivery Status (Success or Fail)
export async function POST(request: Request) {
  try {
    const { tracking_no, action } = await request.json();

    if (!tracking_no || !action) {
      return NextResponse.json({ error: 'Tracking number and action required.' }, { status: 400 });
    }

    const newStatus = action === 'complete' ? 'delivered' : 'failed_attempt';

    const { data: updated, error: updateError } = await supabase
      .from('shipments')
      .update({ current_status: newStatus })
      .eq('tracking_no', tracking_no)
      .select('tracking_no, current_status')
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ data: updated, status: 'success', message: `Parcel marked as ${newStatus}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
