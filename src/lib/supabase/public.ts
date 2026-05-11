import { createAdminSupabase } from "@/lib/supabase/admin";
import type { PublicFeedbackInput, PublicMenuQueryInput } from "@/lib/validation/schemas";
import type { Branch, Category, Dish, Order, OrderItem, Payment, RestaurantTable } from "@/types/database";

export type PublicResult<T> = { ok: true; data: T } | { ok: false; status: number; code: string; message: string };

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

export type PublicBranchMenuPayload = Omit<PublicMenuPayload, "table">;
export type PublicMenuMetaPayload = Pick<PublicMenuPayload, "branch" | "table">;

export type PublicReceiptOrder = Pick<Order, "id" | "order_number" | "branch_id" | "table_number" | "status" | "subtotal" | "tax" | "discount" | "total" | "created_at"> & {
  order_items: Array<Pick<OrderItem, "id" | "dish_name" | "quantity" | "price_at_order" | "notes">>;
  payments: Array<Pick<Payment, "id" | "amount" | "method" | "status">>;
  branches: (Pick<Branch, "id" | "name" | "upi_vpa"> & { organizations: { name: string; default_tax_percent: number; tax_inclusive: boolean } | null }) | null;
};

export async function getPublicMenu(input: PublicMenuQueryInput): Promise<PublicResult<PublicMenuPayload>> {
  const admin = createAdminSupabase();
  const [menuResult, tableResult] = await Promise.all([getPublicBranchMenuWithClient(admin, input.branchId), getPublicTableWithClient(admin, input)]);

  if (!menuResult.ok) return menuResult;
  if (!tableResult.ok) return tableResult;

  return {
    ok: true,
    data: {
      ...menuResult.data,
      table: tableResult.data.table,
    },
  };
}

export async function getPublicBranchMenu(branchId: string): Promise<PublicResult<PublicBranchMenuPayload>> {
  return getPublicBranchMenuWithClient(createAdminSupabase(), branchId);
}

export async function getPublicTable(input: PublicMenuQueryInput): Promise<PublicResult<{ table: PublicMenuTable | null }>> {
  return getPublicTableWithClient(createAdminSupabase(), input);
}

export async function getPublicMenuMeta(input: PublicMenuQueryInput): Promise<PublicResult<PublicMenuMetaPayload>> {
  const admin = createAdminSupabase();
  const [branchResult, tableResult] = await Promise.all([getPublicBranchMetaWithClient(admin, input.branchId), getPublicTableWithClient(admin, input)]);

  if (!branchResult.ok) return branchResult;
  if (!tableResult.ok) return tableResult;

  return {
    ok: true,
    data: {
      branch: branchResult.data.branch,
      table: tableResult.data.table,
    },
  };
}

type AdminSupabaseClient = ReturnType<typeof createAdminSupabase>;

async function getPublicBranchMetaWithClient(admin: AdminSupabaseClient, branchId: string): Promise<PublicResult<{ branch: PublicMenuBranch }>> {
  const { data: branch, error } = await admin
    .from("branches")
    .select("id, org_id, name, address, city, organizations(name, default_tax_percent, tax_inclusive)")
    .eq("id", branchId)
    .eq("is_active", true)
    .single();

  if (error || !branch) {
    return failure(404, "BRANCH_NOT_FOUND", "Branch not found");
  }

  return { ok: true, data: { branch: branch as PublicMenuBranch } };
}

async function getPublicBranchMenuWithClient(admin: AdminSupabaseClient, branchId: string): Promise<PublicResult<PublicBranchMenuPayload>> {
  const branchResult = await getPublicBranchMetaWithClient(admin, branchId);
  if (!branchResult.ok) return branchResult;

  const [{ data: categories, error: categoriesError }, { data: branchDishes, error: menuError }] = await Promise.all([
    admin
      .from("categories")
      .select("id, org_id, name, sort_order, is_active")
      .eq("org_id", branchResult.data.branch.org_id)
      .eq("is_active", true)
      .order("sort_order"),
    admin
      .from("branch_dishes")
      .select("custom_price, is_available, dishes(id, category_id, name, description, price, image_url, is_veg, is_active, prep_time_mins, categories(name))")
      .eq("branch_id", branchId)
      .eq("is_available", true)
      .order("created_at", { ascending: true }),
  ]);

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
    .filter((dish): dish is PublicMenuDish & { categories: Pick<Category, "name"> | null } => Boolean(dish));

  return {
    ok: true,
    data: {
      branch: branchResult.data.branch,
      categories: categories ?? [],
      dishes,
    },
  };
}

async function getPublicTableWithClient(admin: AdminSupabaseClient, input: PublicMenuQueryInput): Promise<PublicResult<{ table: PublicMenuTable | null }>> {
  if (!input.tableNumber) return { ok: true, data: { table: null } };

  const { data: table, error } = await admin
    .from("tables")
    .select("id, branch_id, table_number, label, capacity, status")
    .eq("branch_id", input.branchId)
    .eq("table_number", input.tableNumber)
    .eq("is_active", true)
    .maybeSingle();

  if (error) return failure(400, "TABLE_LOOKUP_FAILED", "Unable to load table");
  if (!table) return failure(404, "TABLE_NOT_FOUND", "Table not found");

  return { ok: true, data: { table: table as PublicMenuTable } };
}

export async function getPublicReceipt(orderId: string, receiptToken: string): Promise<PublicResult<{ order: PublicReceiptOrder }>> {
  const admin = createAdminSupabase();
  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id, order_number, branch_id, table_number, status, subtotal, tax, discount, total, created_at, order_items(id, dish_name, quantity, price_at_order, notes), payments(id, amount, method, status), branches(id, name, upi_vpa, organizations(name, default_tax_percent, tax_inclusive))"
    )
    .eq("id", orderId)
    .eq("receipt_token", receiptToken)
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
    .eq("receipt_token", input.token)
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
