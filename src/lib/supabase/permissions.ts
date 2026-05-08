import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Staff } from "@/types/database";

export type StaffContextResult =
  | { ok: true; staff: Staff }
  | { ok: false; status: number; code: string; message: string };

export async function getActiveStaffContext(admin: ReturnType<typeof createAdminSupabase>): Promise<StaffContextResult> {
  const server = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await server.auth.getUser();

  if (error || !user) {
    return permissionFailure(401, "AUTH_REQUIRED", "Staff sign-in is required");
  }

  const { data: staff } = await admin
    .from("staff")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!staff) {
    return permissionFailure(403, "STAFF_FORBIDDEN", "Active staff access is required");
  }

  return { ok: true, staff };
}

export function requireOwnerOrAdmin(staff: Staff): StaffContextResult {
  return requireStaffRole(staff, ["owner", "admin"], "Owner or admin access is required");
}

export function requireStaffRole(staff: Staff, roles: readonly Staff["role"][], message = "This role cannot perform this action"): StaffContextResult {
  if (!roles.includes(staff.role)) {
    return permissionFailure(403, "ROLE_FORBIDDEN", message);
  }

  return { ok: true, staff };
}

export function permissionFailure(status: number, code: string, message: string): StaffContextResult & { ok: false } {
  return { ok: false, status, code, message };
}
