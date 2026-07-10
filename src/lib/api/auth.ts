import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { Role } from "@/lib/constants";

export interface StaffContext {
  userId: string;
  staffId: string;
  orgId: string;
  branchId: string | null;
  role: Role;
}

type GuardResult = { ok: true; staff: StaffContext } | { ok: false; response: NextResponse };

/**
 * API route guard: requires an authenticated user who is an active staff
 * member. Returns their staff context (org, branch, role) for scoping checks.
 *
 * The proxy layer intentionally excludes /api/* — every route handler that is
 * not meant to be public MUST call this (proxy is a UX layer, not a security
 * boundary).
 */
export async function requireStaff(allowedRoles?: readonly Role[]): Promise<GuardResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  // Admin client: staff lookup must not depend on RLS visibility of the row itself.
  const admin = createAdminSupabase();
  const { data: staff } = await admin
    .from("staff")
    .select("id, org_id, branch_id, role, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!staff || !staff.is_active) {
    return { ok: false, response: NextResponse.json({ error: "Not an active staff member" }, { status: 403 }) };
  }

  if (allowedRoles && !allowedRoles.includes(staff.role as Role)) {
    return { ok: false, response: NextResponse.json({ error: "Insufficient role" }, { status: 403 }) };
  }

  return {
    ok: true,
    staff: {
      userId: user.id,
      staffId: staff.id,
      orgId: staff.org_id,
      branchId: staff.branch_id,
      role: staff.role as Role,
    },
  };
}
