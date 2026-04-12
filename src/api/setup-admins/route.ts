import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// WARNING: This route requires the SUPABASE_SERVICE_ROLE_KEY in your .env.local
// The service key bypasses Row Level Security and allows direct Auth manipulation.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local" }, { status: 500 });
  }

  const superAdmins = [
    { email: "md@britiumexpress.com", password: "Bv@00899600", name: "Managing Director" },
    { email: "sai@britiumexpress.com", password: "Sh@nstar28", name: "Sai" }
  ];

  const results = [];

  for (const admin of superAdmins) {
    try {
      // 1. Create or Update the user in the secure Auth system
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true, // Auto-confirm the email
        user_metadata: { full_name: admin.name }
      });

      let userId = authData?.user?.id;

      // If user already exists, update their password instead
      if (authError && authError.message.includes("already registered")) {
        // Fetch the user ID
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users.find(u => u.email === admin.email);
        
        if (existingUser) {
          userId = existingUser.id;
          await supabaseAdmin.auth.admin.updateUserById(userId, { password: admin.password });
        }
      } else if (authError) {
        throw authError;
      }

      // 2. Force the 'SYS' role in the public profiles table
      if (userId) {
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update({ role: "SYS", full_name: admin.name })
          .eq("id", userId);

        // If profile doesn't exist yet, insert it
        if (profileError) {
          await supabaseAdmin.from("profiles").insert({
            id: userId,
            role: "SYS",
            full_name: admin.name
          });
        }
      }

      results.push({ email: admin.email, status: "Success", role: "SYS" });
    } catch (error: any) {
      results.push({ email: admin.email, status: "Failed", error: error.message });
    }
  }

  return NextResponse.json({ message: "Super Admin Provisioning Complete", results });
}
