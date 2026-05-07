import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { calculateTotals, orderNumber } from "@/lib/utils";
import type { Branch, Dish } from "@/types/database";

interface OrderBody {
  branchId: string;
  tableNumber?: number | null;
  customerName?: string;
  customerPhone?: string;
  waiterId?: string | null;
  orderType?: "dine_in" | "takeaway" | "delivery";
  orderSource?: "waiter" | "qr_customer" | "cashier";
  notes?: string;
  items: Array<{
    dish_id: string;
    dish_name?: string;
    quantity: number;
    price_at_order?: number;
    notes?: string;
  }>;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as OrderBody;

  if (!body.branchId || !body.items?.length) {
    return NextResponse.json({ error: "Branch and order items are required" }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data: branch, error: branchError } = await admin
    .from("branches")
    .select("*, organizations(name, default_tax_percent, tax_inclusive)")
    .eq("id", body.branchId)
    .eq("is_active", true)
    .single();

  if (branchError || !branch) {
    return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  }

  if (body.tableNumber) {
    const { data: table } = await admin.from("tables").select("id").eq("branch_id", body.branchId).eq("table_number", body.tableNumber).eq("is_active", true).maybeSingle();
    if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  const dishIds = [...new Set(body.items.map((item) => item.dish_id))];
  const { data: pricedDishes, error: dishError } = await admin
    .from("branch_dishes")
    .select("dish_id, custom_price, is_available, dishes(*)")
    .eq("branch_id", body.branchId)
    .in("dish_id", dishIds);

  if (dishError) {
    return NextResponse.json({ error: dishError.message }, { status: 400 });
  }

  const priceMap = new Map<string, { name: string; price: number }>();
  ((pricedDishes ?? []) as Array<{ dish_id: string; custom_price: number | null; is_available: boolean; dishes: Dish | null }>).forEach((row) => {
    if (row.is_available && row.dishes?.is_active) {
      priceMap.set(row.dish_id, { name: row.dishes.name, price: Number(row.custom_price ?? row.dishes.price) });
    }
  });

  if (priceMap.size !== dishIds.length) {
    return NextResponse.json({ error: "One or more dishes are unavailable" }, { status: 400 });
  }

  const normalizedItems = body.items.map((item) => {
    const dish = priceMap.get(item.dish_id)!;
    return {
      dish_id: item.dish_id,
      dish_name: dish.name,
      quantity: Math.max(1, Math.min(50, Number(item.quantity) || 1)),
      price_at_order: dish.price,
      notes: item.notes || null,
    };
  });

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.quantity * item.price_at_order, 0);
  const branchWithOrg = branch as Branch & { organizations: { name: string; default_tax_percent: number; tax_inclusive: boolean } | null };
  const org = branchWithOrg.organizations;
  const totals = calculateTotals(subtotal, Number(org?.default_tax_percent ?? 5), Boolean(org?.tax_inclusive ?? true));
  const number = orderNumber();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: number,
      branch_id: body.branchId,
      table_number: body.tableNumber ?? null,
      customer_name: body.customerName || null,
      customer_phone: body.customerPhone || null,
      waiter_id: body.waiterId ?? null,
      order_type: body.orderType ?? "dine_in",
      order_source: body.orderSource ?? "qr_customer",
      status: "pending",
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount: totals.discount,
      total: totals.total,
      notes: body.notes || null,
    })
    .select("*")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? "Unable to create order" }, { status: 400 });
  }

  const { error: itemsError } = await admin.from("order_items").insert(
    normalizedItems.map((item) => ({
      order_id: order.id,
      branch_id: body.branchId,
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
    return NextResponse.json({ error: itemsError.message }, { status: 400 });
  }

  await admin.from("payments").insert({
    order_id: order.id,
    branch_id: body.branchId,
    amount: totals.total,
    method: "upi",
    status: "pending",
  });

  if (body.tableNumber) {
    await admin.from("tables").update({ status: "occupied" }).eq("branch_id", body.branchId).eq("table_number", body.tableNumber);
  }

  return NextResponse.json({ ok: true, order });
}
