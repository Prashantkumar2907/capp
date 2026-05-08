import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { calculateTotals, orderNumber } from "@/lib/utils";
import type { CreateOrderInput } from "@/lib/validation/schemas";
import type { Branch, Dish, Order, Staff } from "@/types/database";

export type CreateOrderResult =
  | { ok: true; order: Order }
  | { ok: false; status: number; code: string; message: string };

type BranchWithOrganization = Branch & {
  organizations: { name: string; default_tax_percent: number; tax_inclusive: boolean } | null;
};

type BranchDishPriceRow = {
  dish_id: string;
  custom_price: number | null;
  is_available: boolean;
  dishes: Dish | null;
};

type OrderActor = {
  staffId: string | null;
  role: Staff["role"] | null;
};

export async function createRestaurantOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const admin = createAdminSupabase();
  const { data: branch, error: branchError } = await admin
    .from("branches")
    .select("*, organizations(name, default_tax_percent, tax_inclusive)")
    .eq("id", input.branchId)
    .eq("is_active", true)
    .single();

  if (branchError || !branch) {
    return failure(404, "BRANCH_NOT_FOUND", "Branch not found");
  }

  const branchWithOrg = branch as BranchWithOrganization;
  const actor = await resolveOrderActor(admin, input, branchWithOrg);
  if (!actor.ok) return actor;

  if (input.orderSource === "qr_customer" && (!input.tableNumber || input.orderType !== "dine_in")) {
    return failure(400, "QR_TABLE_REQUIRED", "QR orders must be dine-in orders linked to an active table");
  }

  if (input.tableNumber) {
    const { data: table } = await admin
      .from("tables")
      .select("id")
      .eq("branch_id", input.branchId)
      .eq("table_number", input.tableNumber)
      .eq("is_active", true)
      .maybeSingle();
    if (!table) return failure(404, "TABLE_NOT_FOUND", "Table not found");
  }

  const dishIds = [...new Set(input.items.map((item) => item.dish_id))];
  const { data: pricedDishes, error: dishError } = await admin
    .from("branch_dishes")
    .select("dish_id, custom_price, is_available, dishes(*)")
    .eq("branch_id", input.branchId)
    .in("dish_id", dishIds);

  if (dishError) {
    return failure(400, "MENU_LOOKUP_FAILED", "Unable to verify menu availability");
  }

  const priceMap = new Map<string, { name: string; price: number }>();
  ((pricedDishes ?? []) as BranchDishPriceRow[]).forEach((row) => {
    if (row.is_available && row.dishes?.is_active) {
      priceMap.set(row.dish_id, { name: row.dishes.name, price: Number(row.custom_price ?? row.dishes.price) });
    }
  });

  if (priceMap.size !== dishIds.length) {
    return failure(400, "DISH_UNAVAILABLE", "One or more dishes are unavailable");
  }

  const normalizedItems = input.items.map((item) => {
    const dish = priceMap.get(item.dish_id)!;
    return {
      dish_id: item.dish_id,
      dish_name: dish.name,
      quantity: item.quantity,
      price_at_order: dish.price,
      notes: item.notes || null,
    };
  });

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.quantity * item.price_at_order, 0);
  const org = branchWithOrg.organizations;
  const totals = calculateTotals(subtotal, Number(org?.default_tax_percent ?? 5), Boolean(org?.tax_inclusive ?? true));
  const number = orderNumber();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: number,
      branch_id: input.branchId,
      table_number: input.tableNumber ?? null,
      customer_name: input.customerName || null,
      customer_phone: input.customerPhone || null,
      waiter_id: actor.staffId,
      order_type: input.orderType,
      order_source: input.orderSource,
      status: "pending",
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount: totals.discount,
      total: totals.total,
      notes: input.notes || null,
    })
    .select("*")
    .single();

  if (orderError || !order) {
    return failure(400, "ORDER_CREATE_FAILED", "Unable to create order");
  }

  const { error: itemsError } = await admin.from("order_items").insert(
    normalizedItems.map((item) => ({
      order_id: order.id,
      branch_id: input.branchId,
      dish_id: item.dish_id,
      dish_name: item.dish_name,
      quantity: item.quantity,
      price_at_order: item.price_at_order,
      notes: item.notes,
      status: "pending" as const,
    }))
  );

  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    return failure(400, "ORDER_ITEMS_CREATE_FAILED", "Unable to add order items");
  }

  const { error: paymentError } = await admin.from("payments").insert({
    order_id: order.id,
    branch_id: input.branchId,
    amount: totals.total,
    method: "upi",
    status: "pending",
  });

  if (paymentError) {
    await admin.from("orders").delete().eq("id", order.id);
    return failure(400, "PAYMENT_CREATE_FAILED", "Unable to prepare payment");
  }

  if (input.tableNumber) {
    await admin.from("tables").update({ status: "occupied" }).eq("branch_id", input.branchId).eq("table_number", input.tableNumber);
  }

  return { ok: true, order };
}

async function resolveOrderActor(
  admin: ReturnType<typeof createAdminSupabase>,
  input: CreateOrderInput,
  branch: Branch
): Promise<{ ok: true } & OrderActor | { ok: false; status: number; code: string; message: string }> {
  if (input.orderSource === "qr_customer") {
    return { ok: true, staffId: null, role: null };
  }

  const server = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await server.auth.getUser();

  if (error || !user) {
    return failure(401, "AUTH_REQUIRED", "Staff sign-in is required to create this order");
  }

  const { data: staff } = await admin
    .from("staff")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!staff || staff.org_id !== branch.org_id) {
    return failure(403, "STAFF_FORBIDDEN", "Staff access is not available for this branch");
  }

  const allowedRoles: Staff["role"][] =
    input.orderSource === "waiter" ? ["owner", "admin", "manager", "waiter"] : ["owner", "admin", "manager", "cashier"];

  if (!allowedRoles.includes(staff.role)) {
    return failure(403, "ROLE_FORBIDDEN", "Your role cannot create this type of order");
  }

  const canUseBranch = staff.role === "owner" || staff.role === "admin" || staff.branch_id === input.branchId;
  if (!canUseBranch) {
    return failure(403, "BRANCH_FORBIDDEN", "Staff access is not available for this branch");
  }

  return { ok: true, staffId: staff.id, role: staff.role };
}

function failure(status: number, code: string, message: string): CreateOrderResult & { ok: false } {
  return { ok: false, status, code, message };
}
