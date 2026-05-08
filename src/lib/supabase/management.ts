import { createAdminSupabase } from "@/lib/supabase/admin";
import { getActiveStaffContext, requireOwnerOrAdmin } from "@/lib/supabase/permissions";
import type { BranchInput, BranchUpdateInput, StaffInput, StaffUpdateInput } from "@/lib/validation/schemas";
import type { Branch, Staff } from "@/types/database";

type MutationResult<T> = { ok: true; data: T } | { ok: false; status: number; code: string; message: string };
type AdminContextResult = { ok: true; staff: Staff } | { ok: false; status: number; code: string; message: string };

export async function createBranch(input: BranchInput): Promise<MutationResult<{ branch: Branch }>> {
  const admin = createAdminSupabase();
  const context = await requireAdminContext(admin);
  if (!context.ok) return context;

  const { data: branch, error } = await admin
    .from("branches")
    .insert({
      org_id: context.staff.org_id,
      name: input.name,
      address: input.address || null,
      city: input.city || null,
      phone: input.phone || null,
      upi_vpa: input.upi_vpa || null,
      table_count: input.table_count,
    })
    .select("*")
    .single();

  if (error || !branch) return failure(400, "BRANCH_CREATE_FAILED", "Unable to create branch");

  const { error: tablesError } = await admin.from("tables").insert(
    Array.from({ length: input.table_count }).map((_, index) => ({
      branch_id: branch.id,
      table_number: index + 1,
      label: `Table ${index + 1}`,
      capacity: 4,
    }))
  );

  if (tablesError) {
    await admin.from("branches").delete().eq("id", branch.id);
    return failure(400, "TABLES_CREATE_FAILED", "Unable to create starter tables");
  }

  return { ok: true, data: { branch } };
}

export async function updateBranch(branchId: string, input: BranchUpdateInput): Promise<MutationResult<{ branch: Branch }>> {
  const admin = createAdminSupabase();
  const context = await requireAdminContext(admin);
  if (!context.ok) return context;

  const { data: existing } = await admin.from("branches").select("*").eq("id", branchId).eq("org_id", context.staff.org_id).maybeSingle();
  if (!existing) return failure(404, "BRANCH_NOT_FOUND", "Branch not found");

  if (input.is_active === false && existing.is_active) {
    const { count } = await admin
      .from("branches")
      .select("id", { count: "exact", head: true })
      .eq("org_id", context.staff.org_id)
      .eq("is_active", true);

    if ((count ?? 0) <= 1) {
      return failure(400, "LAST_BRANCH_ACTIVE", "At least one active branch is required");
    }
  }

  const { data: branch, error } = await admin
    .from("branches")
    .update({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.address !== undefined ? { address: input.address || null } : {}),
      ...(input.city !== undefined ? { city: input.city || null } : {}),
      ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
      ...(input.upi_vpa !== undefined ? { upi_vpa: input.upi_vpa || null } : {}),
      ...(input.table_count !== undefined ? { table_count: input.table_count } : {}),
      ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
    })
    .eq("id", branchId)
    .eq("org_id", context.staff.org_id)
    .select("*")
    .single();

  if (error || !branch) return failure(400, "BRANCH_UPDATE_FAILED", "Unable to update branch");
  return { ok: true, data: { branch } };
}

export async function createStaff(input: StaffInput): Promise<MutationResult<{ staff: Staff }>> {
  const admin = createAdminSupabase();
  const context = await requireAdminContext(admin);
  if (!context.ok) return context;

  if (input.branch_id) {
    const branchCheck = await ensureBranchInOrg(admin, input.branch_id, context.staff.org_id);
    if (!branchCheck.ok) return branchCheck;
  }

  const { data: staff, error } = await admin
    .from("staff")
    .insert({
      org_id: context.staff.org_id,
      branch_id: input.branch_id ?? null,
      full_name: input.full_name,
      email: input.email,
      phone: input.phone || null,
      role: input.role,
    })
    .select("*")
    .single();

  if (error || !staff) return failure(400, "STAFF_CREATE_FAILED", "Unable to create staff");
  return { ok: true, data: { staff } };
}

export async function updateStaff(staffId: string, input: StaffUpdateInput): Promise<MutationResult<{ staff: Staff }>> {
  const admin = createAdminSupabase();
  const context = await requireAdminContext(admin);
  if (!context.ok) return context;

  const { data: target } = await admin.from("staff").select("*").eq("id", staffId).eq("org_id", context.staff.org_id).maybeSingle();
  if (!target) return failure(404, "STAFF_NOT_FOUND", "Staff member not found");

  if (target.role === "owner" && context.staff.role !== "owner") {
    return failure(403, "OWNER_PROTECTED", "Only the owner can edit owner records");
  }

  if (target.id === context.staff.id && input.role && input.role !== target.role) {
    return failure(400, "SELF_ROLE_CHANGE_BLOCKED", "You cannot change your own role");
  }

  if (input.branch_id) {
    const branchCheck = await ensureBranchInOrg(admin, input.branch_id, context.staff.org_id);
    if (!branchCheck.ok) return branchCheck;
  }

  const { data: staff, error } = await admin
    .from("staff")
    .update({
      ...(input.full_name !== undefined ? { full_name: input.full_name } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.branch_id !== undefined ? { branch_id: input.branch_id } : {}),
    })
    .eq("id", staffId)
    .eq("org_id", context.staff.org_id)
    .select("*")
    .single();

  if (error || !staff) return failure(400, "STAFF_UPDATE_FAILED", "Unable to update staff");
  return { ok: true, data: { staff } };
}

export async function disableStaff(staffId: string): Promise<MutationResult<{ staff: Staff }>> {
  const admin = createAdminSupabase();
  const context = await requireAdminContext(admin);
  if (!context.ok) return context;

  const { data: target } = await admin.from("staff").select("*").eq("id", staffId).eq("org_id", context.staff.org_id).maybeSingle();
  if (!target) return failure(404, "STAFF_NOT_FOUND", "Staff member not found");
  if (target.id === context.staff.id) return failure(400, "SELF_DISABLE_BLOCKED", "You cannot disable your own access");
  if (target.role === "owner") return failure(400, "OWNER_DISABLE_BLOCKED", "Owner access cannot be disabled here");

  const { data: staff, error } = await admin
    .from("staff")
    .update({ is_active: false })
    .eq("id", staffId)
    .eq("org_id", context.staff.org_id)
    .select("*")
    .single();

  if (error || !staff) return failure(400, "STAFF_DISABLE_FAILED", "Unable to disable staff access");
  return { ok: true, data: { staff } };
}

async function requireAdminContext(admin: ReturnType<typeof createAdminSupabase>): Promise<AdminContextResult> {
  const context = await getActiveStaffContext(admin);
  if (!context.ok) return context;
  const adminCheck = requireOwnerOrAdmin(context.staff);
  if (!adminCheck.ok) return adminCheck;
  return { ok: true, staff: context.staff };
}

async function ensureBranchInOrg(admin: ReturnType<typeof createAdminSupabase>, branchId: string, orgId: string): Promise<MutationResult<{ branch: Branch }>> {
  const { data: branch } = await admin.from("branches").select("*").eq("id", branchId).eq("org_id", orgId).maybeSingle();
  if (!branch) return failure(400, "BRANCH_FORBIDDEN", "Branch is not available for this restaurant");
  return { ok: true, data: { branch } };
}

function failure(status: number, code: string, message: string): MutationResult<never> & { ok: false } {
  return { ok: false, status, code, message };
}
