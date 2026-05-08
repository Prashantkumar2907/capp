import { createAdminSupabase } from "@/lib/supabase/admin";
import { getActiveStaffContext, requireStaffRole } from "@/lib/supabase/permissions";
import type { DishInput, DishUpdateInput } from "@/lib/validation/schemas";
import type { Branch, Category, Dish, Staff } from "@/types/database";

type MutationResult<T> = { ok: true; data: T } | { ok: false; status: number; code: string; message: string };
type MenuContextResult = { ok: true; staff: Staff } | { ok: false; status: number; code: string; message: string };

const menuRoles: Staff["role"][] = ["owner", "admin", "manager"];

export async function createDish(input: DishInput): Promise<MutationResult<{ dish: Dish }>> {
  const admin = createAdminSupabase();
  const context = await requireMenuContext(admin);
  if (!context.ok) return context;

  const categoryCheck = await ensureCategoryInOrg(admin, input.category_id ?? null, context.staff.org_id);
  if (!categoryCheck.ok) return categoryCheck;

  const branchCheck = await resolveWritableBranch(admin, input.branch_id ?? context.staff.branch_id, context.staff);
  if (!branchCheck.ok) return branchCheck;

  const { data: dish, error } = await admin
    .from("dishes")
    .insert({
      org_id: context.staff.org_id,
      category_id: input.category_id ?? null,
      name: input.name,
      description: input.description || null,
      price: input.price,
      image_url: input.image_url ?? null,
      is_veg: input.is_veg,
      is_active: input.is_active,
      prep_time_mins: input.prep_time_mins,
    })
    .select("*")
    .single();

  if (error || !dish) return failure(400, "DISH_CREATE_FAILED", "Unable to create dish");

  const { error: branchDishError } = await admin.from("branch_dishes").insert({
    branch_id: branchCheck.data.branch.id,
    dish_id: dish.id,
    is_available: input.is_active,
  });

  if (branchDishError) {
    await admin.from("dishes").delete().eq("id", dish.id).eq("org_id", context.staff.org_id);
    return failure(400, "DISH_BRANCH_CREATE_FAILED", "Unable to add dish to the selected branch");
  }

  return { ok: true, data: { dish } };
}

export async function updateDish(dishId: string, input: DishUpdateInput): Promise<MutationResult<{ dish: Dish }>> {
  const admin = createAdminSupabase();
  const context = await requireMenuContext(admin);
  if (!context.ok) return context;

  const { data: existing } = await admin.from("dishes").select("*").eq("id", dishId).eq("org_id", context.staff.org_id).maybeSingle();
  if (!existing) return failure(404, "DISH_NOT_FOUND", "Dish not found");

  const categoryCheck = await ensureCategoryInOrg(admin, input.category_id ?? existing.category_id, context.staff.org_id);
  if (!categoryCheck.ok) return categoryCheck;

  if (input.branch_id) {
    const branchCheck = await resolveWritableBranch(admin, input.branch_id, context.staff);
    if (!branchCheck.ok) return branchCheck;
  }

  const { data: dish, error } = await admin
    .from("dishes")
    .update({
      ...(input.category_id !== undefined ? { category_id: input.category_id } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.image_url !== undefined ? { image_url: input.image_url } : {}),
      ...(input.is_veg !== undefined ? { is_veg: input.is_veg } : {}),
      ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
      ...(input.prep_time_mins !== undefined ? { prep_time_mins: input.prep_time_mins } : {}),
    })
    .eq("id", dishId)
    .eq("org_id", context.staff.org_id)
    .select("*")
    .single();

  if (error || !dish) return failure(400, "DISH_UPDATE_FAILED", "Unable to update dish");

  if (input.branch_id && input.is_active !== undefined) {
    await admin
      .from("branch_dishes")
      .update({ is_available: input.is_active })
      .eq("branch_id", input.branch_id)
      .eq("dish_id", dishId);
  }

  return { ok: true, data: { dish } };
}

export async function deleteDish(dishId: string): Promise<MutationResult<{ dish: Dish }>> {
  const admin = createAdminSupabase();
  const context = await requireMenuContext(admin);
  if (!context.ok) return context;

  const { data: existing } = await admin.from("dishes").select("*").eq("id", dishId).eq("org_id", context.staff.org_id).maybeSingle();
  if (!existing) return failure(404, "DISH_NOT_FOUND", "Dish not found");

  const { data: dish, error } = await admin
    .from("dishes")
    .delete()
    .eq("id", dishId)
    .eq("org_id", context.staff.org_id)
    .select("*")
    .single();

  if (error || !dish) return failure(400, "DISH_DELETE_FAILED", "Unable to delete dish");
  return { ok: true, data: { dish } };
}

async function requireMenuContext(admin: ReturnType<typeof createAdminSupabase>): Promise<MenuContextResult> {
  const context = await getActiveStaffContext(admin);
  if (!context.ok) return context;
  const roleCheck = requireStaffRole(context.staff, menuRoles, "Owner, admin, or manager access is required for menu changes");
  if (!roleCheck.ok) return roleCheck;
  return { ok: true, staff: context.staff };
}

async function ensureCategoryInOrg(
  admin: ReturnType<typeof createAdminSupabase>,
  categoryId: string | null,
  orgId: string
): Promise<MutationResult<{ category: Category | null }>> {
  if (!categoryId) return { ok: true, data: { category: null } };
  const { data: category } = await admin.from("categories").select("*").eq("id", categoryId).eq("org_id", orgId).maybeSingle();
  if (!category) return failure(400, "CATEGORY_FORBIDDEN", "Category is not available for this restaurant");
  return { ok: true, data: { category } };
}

async function resolveWritableBranch(
  admin: ReturnType<typeof createAdminSupabase>,
  branchId: string | null,
  staff: Staff
): Promise<MutationResult<{ branch: Branch }>> {
  if (!branchId) return failure(400, "BRANCH_REQUIRED", "A branch is required for menu availability");

  const { data: branch } = await admin
    .from("branches")
    .select("*")
    .eq("id", branchId)
    .eq("org_id", staff.org_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!branch) return failure(400, "BRANCH_FORBIDDEN", "Branch is not available for this restaurant");
  if (staff.role !== "owner" && staff.role !== "admin" && staff.branch_id !== branch.id) {
    return failure(403, "BRANCH_FORBIDDEN", "Managers can only update their assigned branch");
  }

  return { ok: true, data: { branch } };
}

function failure(status: number, code: string, message: string): MutationResult<never> & { ok: false } {
  return { ok: false, status, code, message };
}
