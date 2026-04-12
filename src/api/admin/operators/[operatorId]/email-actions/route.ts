import { NextRequest, NextResponse } from "next/server";
import { requireOpsAccess } from "@/lib/api-guard";
import { createAdminClient } from "@/lib/admin-supabase";
import { generateRecoveryLink, sendInviteEmail } from "@/lib/operator-management";

// Next.js 15+ requires params to be a Promise
type Params = { operatorId: string };

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<Params> }
) {
  // 1. Production Hardening: Verify administrative access (FIX: 0 arguments)
  const identity = await requireOpsAccess();
  
  // 2. Enforce Role Permissions (FIX: changed 'appRole' to 'role')
  const allowedRoles = ["admin", "SUPER_ADMIN", "APP_OWNER", "OPERATIONS_ADMIN", "HR_ADMIN"];
  if (!allowedRoles.includes(identity.role)) {
    return NextResponse.json(
      { error: "Not allowed to trigger operator email actions." }, 
      { status: 403 }
    );
  }

  try {
    const resolvedParams = await params;
    const operatorId = resolvedParams.operatorId;
    
    const body = await request.json();
    const action = String(body.action ?? "");
    const redirectTo = body.redirectTo ? String(body.redirectTo) : undefined;

    const supabase = createAdminClient();

    // 2. Database Wiring: Fetch operator and associated profile
    const { data: operator, error: opError } = await supabase
      .from("operator_profiles")
      .select("id, auth_user_id, profile_id, full_name")
      .eq("id", operatorId)
      .single();

    if (opError || !operator) {
      return NextResponse.json({ error: "Operator not found." }, { status: 404 });
    }

    // Use profile_id as primary, fallback to auth_user_id
    const profileId = operator.profile_id || operator.auth_user_id;
    
    if (!profileId) {
      return NextResponse.json({ error: "No profile linked to operator." }, { status: 400 });
    }

    const { data: profile, error: profError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", profileId)
      .single();

    const email = profile?.email;
    if (profError || !email) {
      return NextResponse.json({ error: "Operator email is not available." }, { status: 400 });
    }

    // 3. Action Logic: Invite or Reset
    if (action === "invite") {
      const data = await sendInviteEmail({ email, redirectTo });
      
      // Audit Log: Track administrative actions (FIX: changed 'profileId' to 'id')
      await supabase.from("operator_admin_actions").insert({
        actor_profile_id: identity.id, 
        target_profile_id: operatorId,
        action: "send_invite_email",
        channel: "email",
        subject: "Operator invitation",
        metadata: { email, redirectTo: redirectTo ?? null }
      });
      
      return NextResponse.json({ ok: true, action, delivery: "invite-email", result: data });
    }

    if (action === "reset") {
      const data = await generateRecoveryLink({ email, redirectTo });
      
      // Audit Log: Track administrative actions (FIX: changed 'profileId' to 'id')
      await supabase.from("operator_admin_actions").insert({
        actor_profile_id: identity.id, 
        target_profile_id: operatorId,
        action: "send_reset_email",
        channel: "email",
        subject: "Operator password reset",
        metadata: { email, redirectTo: redirectTo ?? null }
      });
      
      return NextResponse.json({ ok: true, action, delivery: "recovery-link", result: data });
    }

    return NextResponse.json({ error: "Unsupported email action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to trigger email action." },
      { status: 500 }
    );
  }
}