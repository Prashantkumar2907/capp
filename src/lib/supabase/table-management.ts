import { createAdminSupabase } from "@/lib/supabase/admin";
import { getActiveStaffContext, requireStaffRole } from "@/lib/supabase/permissions";
import type { TableCreateInput, TableStatusUpdateInput } from "@/lib/validation/schemas";
import type { Branch, RestaurantTable, Staff } from "@/types/database";

type TableMutationResult<T> = { ok: true; data: T } | { ok: false; status: number; code: string; message: string };

const tableCreateRoles: Staff["role"][] = ["owner", "admin", "manager"];
const tableStatusRoles: Staff["role"][] = ["owner", "admin", "manager", "waiter"];
const activeOrderStatuses = ["pending", "confirmed", "preparing", "ready", "served"] as const;

export async function createTable(input: TableCreateInput): Promise<TableMutationResult<{ table: RestaurantTable }>> {
  const admin = createAdminSupabase();
  const context = await getActiveStaffContext(admin);
  if (!context.ok) return context;

  const roleCheck = requireStaffRole(context.staff, tableCreateRoles, "Owner, admin, or manager access is required to create tables");
  if (!roleCheck.ok) return roleCheck;

  const branchResult = await resolveWritableBranch(admin, input.branch_id ?? context.staff.branch_id, context.staff);
  if (!branchResult.ok) return branchResult;

  const { data: lastTable, error: lastTableError } = await admin
    .from("tables")
    .select("table_number")
    .eq("branch_id", branchResult.data.branch.id)
    .order("table_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastTableError) return failure(400, "TABLE_LOOKUP_FAILED", "Unable to calculate the next table number");

  const nextNumber = Number(lastTable?.table_number ?? 0) + 1;
  const label = input.label?.trim() || `Table ${nextNumber}`;
  const { data: table, error } = await admin
    .from("tables")
    .insert({
      branch_id: branchResult.data.branch.id,
      table_number: nextNumber,
      label,
      capacity: input.capacity,
      status: "available",
      is_active: true,
    })
    .select("*")
    .single();

  if (error || !table) return failure(400, "TABLE_CREATE_FAILED", "Unable to create table");
  return { ok: true, data: { table } };
}

export async function updateTableStatus(tableId: string, input: TableStatusUpdateInput): Promise<TableMutationResult<{ table: RestaurantTable }>> {
  const admin = createAdminSupabase();
  const context = await getActiveStaffContext(admin);
  if (!context.ok) return context;

  const roleCheck = requireStaffRole(context.staff, tableStatusRoles, "Table status changes require table access");
  if (!roleCheck.ok) return roleCheck;

  const { data: table, error: tableError } = await admin.from("tables").select("*").eq("id", tableId).maybeSingle();
  if (tableError) return failure(400, "TABLE_LOOKUP_FAILED", "Unable to load table");
  if (!table) return failure(404, "TABLE_NOT_FOUND", "Table not found");

  const branchResult = await resolveWritableBranch(admin, table.branch_id, context.staff);
  if (!branchResult.ok) return branchResult;

  if (input.status === "available" || input.status === "inactive") {
    const activeOrders = await hasActiveOrdersForTable(admin, table);
    if (activeOrders) {
      return failure(409, "TABLE_HAS_ACTIVE_ORDERS", "Serve or settle active orders before freeing or deactivating this table");
    }
  }

  const { data: updated, error } = await admin
    .from("tables")
    .update({
      status: input.status,
      is_active: input.status !== "inactive",
    })
    .eq("id", table.id)
    .eq("branch_id", table.branch_id)
    .select("*")
    .single();

  if (error || !updated) return failure(400, "TABLE_UPDATE_FAILED", "Unable to update table status");
  return { ok: true, data: { table: updated } };
}

async function resolveWritableBranch(
  admin: ReturnType<typeof createAdminSupabase>,
  branchId: string | null | undefined,
  staff: Staff
): Promise<TableMutationResult<{ branch: Branch }>> {
  if (!branchId) return failure(400, "BRANCH_REQUIRED", "A branch is required for table management");

  const { data: branch } = await admin
    .from("branches")
    .select("*")
    .eq("id", branchId)
    .eq("org_id", staff.org_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!branch) return failure(404, "BRANCH_NOT_FOUND", "Branch not found");
  if (staff.role !== "owner" && staff.role !== "admin" && staff.branch_id !== branch.id) {
    return failure(403, "BRANCH_FORBIDDEN", "Staff access is not available for this branch");
  }

  return { ok: true, data: { branch } };
}

async function hasActiveOrdersForTable(admin: ReturnType<typeof createAdminSupabase>, table: RestaurantTable) {
  const { count } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", table.branch_id)
    .eq("table_number", table.table_number)
    .in("status", activeOrderStatuses);

  return Boolean(count);
}

function failure(status: number, code: string, message: string): TableMutationResult<never> & { ok: false } {
  return { ok: false, status, code, message };
}
