import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch 'open' bags and count how many shipments are inside them
    const { data: bags, error } = await supabase
      .from('bags')
      .select('*, shipments(id)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data: bags || [], status: 'success' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ACTION 1: CREATE A NEW BAG
    if (body.action === 'create_bag') {
      const { data, error } = await supabase
        .from('bags')
        .insert([{ bag_code: body.bag_code, destination: body.destination }])
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ data, status: 'success', message: 'Bag created.' });
    }

    // ACTION 2: SCAN PARCEL INTO BAG
    if (body.action === 'scan_to_bag') {
      const { tracking_no, bag_id } = body;

      // Ensure the parcel is actually in the warehouse first!
      const { data: parcel, error: checkError } = await supabase
        .from('shipments')
        .select('current_status')
        .eq('tracking_no', tracking_no)
        .single();

      if (checkError || !parcel) return NextResponse.json({ error: 'Parcel not found.' }, { status: 404 });
      if (parcel.current_status !== 'in_warehouse' && parcel.current_status !== 'sorting') {
        return NextResponse.json({ error: `Cannot bag parcel. Current status is: ${parcel.current_status}` }, { status: 400 });
      }

      // Move parcel into the bag
      const { data: updated, error: updateError } = await supabase
        .from('shipments')
        .update({ current_status: 'bagged', bag_id: bag_id })
        .eq('tracking_no', tracking_no)
        .select('tracking_no')
        .single();

      if (updateError) throw updateError;
      return NextResponse.json({ data: updated, status: 'success', message: 'Bagged successfully.' });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
