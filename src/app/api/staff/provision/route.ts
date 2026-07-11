import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/api/auth";
import { roles as allRoles, type Role } from "@/lib/constants";
import { effectiveState, canGrow } from "@/lib/plans";

/**
 * Owner-generated staff logins ("shared kitchen tablet" model).
 *
 * Small Indian restaurants often run on shared devices and staff without
 * personal email. The owner creates a login handle + password here; we mint
 * a synthetic email (handle@org-slug.staff.capp.app) behind the scenes so
 * Supabase Auth is satisfied, and the owner hands the credentials over.
 *
 * Server-only: uses the service-role client, gated to owner/admin of the org.
 */

interface ProvisionBody {
  fullName: string;
  username: string;
  password: string;
  roles: Role[];
  branchId?: string | null;
  phone?: string;
}

const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,19}$/;

function loginEmail(username: string, orgSlug: string) {
  return `${username}@${orgSlug}.staff.capp.app`;
}

export async function POST(request: NextRequest) {
  const guard = await requireStaff(["owner", "admin"]);
  if (!guard.ok) return guard.response;

  const body = (await request.json()) as ProvisionBody;
  const username = (body.username ?? "").trim().toLowerCase();
  const fullName = (body.fullName ?? "").trim();
  const requestedRoles = [...new Set(body.roles ?? [])].filter((role): role is Role => (allRoles as readonly string[]).includes(role));

  if (!fullName) return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  if (!USERNAME_RE.test(username)) {
    return NextResponse.json({ error: "Login handle must be 3-20 chars: lowercase letters, numbers, . _ -" }, { status: 400 });
  }
  if ((body.password ?? "").length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if (!requestedRoles.length) return NextResponse.json({ error: "Pick at least one role" }, { status: 400 });
  if (requestedRoles.includes("owner")) {
    return NextResponse.json({ error: "Owner logins cannot be created here" }, { status: 400 });
  }

  const admin = createAdminSupabase();

  // growth-action gate: expired subscriptions can't add staff (live service unaffected)
  const { data: subRow } = await admin
    .from("subscriptions")
    .select("plan, status, trial_ends_at, current_period_end")
    .eq("org_id", guard.staff.orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const billing = effectiveState(subRow);
  if (!canGrow(billing.effective)) {
    return NextResponse.json({ error: "Subscription expired — renew to add staff logins" }, { status: 402 });
  }

  const { data: org } = await admin.from("organizations").select("slug").eq("id", guard.staff.orgId).single();
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  // branch must belong to the caller's org (or default to caller's branch)
  let branchId = body.branchId ?? guard.staff.branchId;
  if (branchId) {
    const { data: branchRow } = await admin.from("branches").select("id, org_id").eq("id", branchId).maybeSingle();
    if (!branchRow || branchRow.org_id !== guard.staff.orgId) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }
  } else {
    branchId = null;
  }

  const email = loginEmail(username, org.slug);

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    password: body.password,
    email_confirm: true,
    user_metadata: { full_name: fullName, provisioned_by: guard.staff.staffId },
  });

  if (authError || !created.user) {
    const duplicate = authError?.message?.toLowerCase().includes("already");
    return NextResponse.json(
      { error: duplicate ? "That login handle is taken in your restaurant" : "Unable to create login" },
      { status: duplicate ? 409 : 400 }
    );
  }

  const primaryRole = requestedRoles[0];
  const { data: staffRow, error: staffError } = await admin
    .from("staff")
    .insert({
      user_id: created.user.id,
      org_id: guard.staff.orgId,
      branch_id: branchId,
      full_name: fullName,
      email,
      phone: body.phone || null,
      role: primaryRole,
      is_active: true,
    })
    .select("id")
    .single();

  if (staffError || !staffRow) {
    // roll the auth user back so we never leave an orphan login
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "Unable to create staff record" }, { status: 400 });
  }

  // primary role lands via trigger; add the extras
  const extraRoles = requestedRoles.slice(1);
  if (extraRoles.length) {
    await admin.from("staff_roles").insert(extraRoles.map((role) => ({ staff_id: staffRow.id, role })));
  }

  return NextResponse.json({ ok: true, staffId: staffRow.id, login: email, roles: requestedRoles });
}

/** PATCH — reset a staff member's password (owner/admin, same org). */
export async function PATCH(request: NextRequest) {
  const guard = await requireStaff(["owner", "admin"]);
  if (!guard.ok) return guard.response;

  const body = (await request.json()) as { staffId: string; password: string };
  if ((body.password ?? "").length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data: member } = await admin
    .from("staff")
    .select("id, user_id, org_id")
    .eq("id", body.staffId)
    .maybeSingle();

  if (!member || member.org_id !== guard.staff.orgId) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }
  if (!member.user_id) {
    return NextResponse.json({ error: "This staff member has no login yet" }, { status: 400 });
  }

  const { error } = await admin.auth.admin.updateUserById(member.user_id, { password: body.password });
  if (error) return NextResponse.json({ error: "Unable to reset password" }, { status: 400 });

  return NextResponse.json({ ok: true });
}
