import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch all active shipments to calculate performance
    const { data: shipments, error } = await supabase
      .from('shipments')
      .select('current_status')
      .neq('current_status', 'draft');

    if (error) throw error;

    const delivered = shipments.filter(s => s.current_status === 'delivered').length;
    const exceptions = shipments.filter(s => ['exception', 'failed_attempt', 'returned'].includes(s.current_status)).length;
    const totalActive = shipments.length;
    
    // Calculate real-time daily target completion percentage
    const dailyTargetPercent = totalActive > 0 ? Math.round((delivered / totalActive) * 100) : 0;

    const dashboardData = {
      team_performance: 12,     // Placeholder for Active Staff count
      pending_approvals: 0,     // Placeholder for Leave/Expense approvals
      shift_attendance: 98,     // Placeholder for Attendance %
      escalation_queue: exceptions, // Real DB Data: Failed or Exception parcels
      route_balancing: 3,       // Placeholder for active routes
      daily_target: dailyTargetPercent // Real DB Data: Success Rate
    };

    return NextResponse.json({ data: dashboardData, status: 'success' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
