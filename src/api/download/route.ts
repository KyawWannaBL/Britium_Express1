import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apkUrl = "https://dltavabvjwocknkyvwgz.supabase.co/storage/v1/object/public/builds/britium-enterprise.apk";
  return NextResponse.redirect(apkUrl);
}