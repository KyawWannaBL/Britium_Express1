import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: staff, error } = await supabase
      .from('staff_directory')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const stats = {
      total: staff?.length || 0,
      active: staff?.filter(s => s.status === 'active').length || 0,
      pending: staff?.filter(s => s.status === 'pending_approval').length || 0,
      blocked: staff?.filter(s => s.status === 'blocked').length || 0,
    };

    return NextResponse.json({ data: staff || [], stats, status: 'success' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, action, newRole } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    let updatePayload: any = {};

    if (action === 'approve') updatePayload = { status: 'active' };
    if (action === 'block') updatePayload = { status: 'blocked' };
    if (action === 'unblock') updatePayload = { status: 'active' };
    if (action === 'change_role' && newRole) updatePayload = { role: newRole, status: 'active' };

    const { data: updated, error } = await supabase
      .from('staff_directory')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: updated, status: 'success', message: `Staff member updated successfully.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
