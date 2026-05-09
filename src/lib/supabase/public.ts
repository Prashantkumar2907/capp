import { createAdminSupabase } from "@/lib/supabase/admin";
import type { PublicFeedbackInput, PublicMenuQueryInput } from "@/lib/validation/schemas";
import type { Branch, Category, Dish, Order, OrderItem, Payment, RestaurantTable } from "@/types/database";

type PublicResult<T> = { ok: true; data: T } | { ok: false; status: number; code: string; message: string };

type BranchWithOrganization = Branch & {
  organizations: { name: string; default_tax_percent: number; tax_inclusive: boolean } | null;
};

type BranchDishRow = {
  custom_price: number | null;
  is_available: boolean;
  dishes: (PublicMenuDish & { categories: Pick<Category, "name"> | null }) | null;
};

export type PublicMenuBranch = Pick<Branch, "id" | "org_id" | "name" | "address" | "city"> & {
  organizations: { name: string; default_tax_percent: number; tax_inclusive: boolean } | null;
};

export type PublicMenuTable = Pick<RestaurantTable, "id" | "branch_id" | "table_number" | "label" | "capacity" | "status">;

export type PublicMenuCategory = Pick<Category, "id" | "org_id" | "name" | "sort_order" | "is_active">;

export type PublicMenuDish = Pick<
  Dish,
  "id" | "category_id" | "name" | "description" | "price" | "image_url" | "is_veg" | "is_active" | "prep_time_mins"
>;

export type PublicMenuPayload = {
  branch: PublicMenuBranch;
  table: PublicMenuTable | null;
  categories: PublicMenuCategory[];
  dishes: Array<PublicMenuDish & { categories: Pick<Category, "name"> | null }>;
};

export type PublicReceiptOrder = Order & {
  order_items: OrderItem[];
  payments: Payment[];
  branches: BranchWithOrganization | null;
};

export async function getPublicMenu(input: PublicMenuQueryInput): Promise<PublicResult<PublicMenuPayload>> {
  const admin = createAdminSupabase();
  const { data: branch, error: branchError } = await admin
    .from("branches")
    .select("id, org_id, name, address, city, organizations(name, default_tax_percent, tax_inclusive)")
    .eq("id", input.branchId)
    .eq("is_active", true)
    .single();

  if (branchError || !branch) {
    return failure(404, "BRANCH_NOT_FOUND", "Branch not found");
  }

  const [{ data: table }, { data: categories, error: categoriesError }, { data: branchDishes, error: menuError }] = await Promise.all([
    input.tableNumber
      ? admin
          .from("tables")
          .select("id, branch_id, table_number, label, capacity, status")
          .eq("branch_id", input.branchId)
          .eq("table_number", input.tableNumber)
          .eq("is_active", true)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    admin
      .from("categories")
      .select("id, org_id, name, sort_order, is_active")
      .eq("org_id", (branch as Pick<Branch, "org_id">).org_id)
      .eq("is_active", true)
      .order("sort_order"),
    admin
      .from("branch_dishes")
      .select("custom_price, is_available, dishes(id, category_id, name, description, price, image_url, is_veg, is_active, prep_time_mins, categories(name))")
      .eq("branch_id", input.branchId)
      .eq("is_available", true)
      .order("created_at", { ascending: true }),
  ]);

  if (input.tableNumber && !table) {
    return failure(404, "TABLE_NOT_FOUND", "Table not found");
  }

  if (categoriesError || menuError) {
    return failure(400, "MENU_LOOKUP_FAILED", "Unable to load menu");
  }

  const dishes = ((branchDishes ?? []) as BranchDishRow[])
    .map((row) => {
      if (!row.dishes || !row.dishes.is_active) return null;
      return {
        ...row.dishes,
        price: Number(row.custom_price ?? row.dishes.price),
        categories: row.dishes.categories,
      };
    })
    .filter((dish): dish is Dish & { categories: Pick<Category, "name"> | null } => Boolean(dish));

  return {
    ok: true,
    data: {
      branch: branch as PublicMenuBranch,
      table: table as PublicMenuTable | null,
      categories: categories ?? [],
      dishes,
    },
  };
}

export async function getPublicReceipt(orderId: string): Promise<PublicResult<{ order: PublicReceiptOrder }>> {
  const admin = createAdminSupabase();
  const { data: order, error } = await admin
    .from("orders")
    .select("*, order_items(*), payments(*), branches(*, organizations(name, default_tax_percent, tax_inclusive))")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return failure(404, "RECEIPT_NOT_FOUND", "Receipt not found");
  }

  return { ok: true, data: { order: order as PublicReceiptOrder } };
}

export async function createPublicFeedback(input: PublicFeedbackInput): Promise<PublicResult<{ feedbackId: string }>> {
  const admin = createAdminSupabase();
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, branch_id")
    .eq("id", input.orderId)
    .eq("branch_id", input.branchId)
    .maybeSingle();

  if (orderError) return failure(400, "ORDER_LOOKUP_FAILED", "Unable to verify receipt");
  if (!order) return failure(404, "ORDER_NOT_FOUND", "Receipt not found");

  const { data: feedback, error } = await admin
    .from("feedback")
    .insert({
      order_id: input.orderId,
      branch_id: input.branchId,
      rating: input.rating,
      comment: input.comment || null,
    })
    .select("id")
    .single();

  if (error || !feedback) return failure(400, "FEEDBACK_CREATE_FAILED", "Unable to save feedback");
  return { ok: true, data: { feedbackId: feedback.id } };
}

function failure(status: number, code: string, message: string): PublicResult<never> & { ok: false } {
  return { ok: false, status, code, message };
}
