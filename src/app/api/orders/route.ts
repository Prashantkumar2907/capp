import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { Order } from "@/types/database";

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
    quantity: number;
    variant_id?: string | null;
    addon_ids?: string[];
    notes?: string;
  }>;
}

/**
 * Public endpoint (QR customers) also used by the waiter dashboard.
 * All pricing, validation, and inserts happen atomically inside the
 * create_order() Postgres function — client-supplied prices are ignored.
 */
const ERROR_MAP: Record<string, { message: string; status: number }> = {
  EMPTY_ORDER: { message: "Order items are required", status: 400 },
  BRANCH_NOT_FOUND: { message: "Branch not found", status: 404 },
  TABLE_NOT_FOUND: { message: "Table not found", status: 404 },
  DISH_UNAVAILABLE: { message: "One or more dishes are unavailable", status: 400 },
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as OrderBody;

  if (!body.branchId || !body.items?.length) {
    return NextResponse.json({ error: "Branch and order items are required" }, { status: 400 });
  }

  const admin = createAdminSupabase();

  const { data, error } = await admin.rpc("create_order", {
    p_branch_id: body.branchId,
    p_items: body.items.map((item) => ({
      dish_id: item.dish_id,
      quantity: item.quantity,
      variant_id: item.variant_id ?? null,
      addon_ids: item.addon_ids ?? [],
      notes: item.notes || null,
    })),
    p_table_number: body.tableNumber ?? null,
    p_customer_name: body.customerName || null,
    p_customer_phone: body.customerPhone || null,
    p_waiter_id: body.waiterId ?? null,
    p_order_type: body.orderType ?? "dine_in",
    p_order_source: body.orderSource ?? "qr_customer",
    p_notes: body.notes || null,
  });

  if (error) {
    const known = Object.keys(ERROR_MAP).find((code) => error.message.includes(code));
    if (known) {
      const mapped = ERROR_MAP[known];
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }
    return NextResponse.json({ error: "Unable to create order" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, order: data as Order });
}
