import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/api/auth";
import type { Order } from "@/types/database";

interface AddItemsBody {
  items: Array<{ dish_id: string; quantity: number; variant_id?: string | null; addon_ids?: string[]; notes?: string }>;
}

const ERROR_MAP: Record<string, { message: string; status: number }> = {
  ORDER_NOT_FOUND: { message: "Order not found", status: 404 },
  ORDER_CLOSED: { message: "This order is already closed", status: 409 },
  DISH_UNAVAILABLE: { message: "One or more dishes are unavailable", status: 400 },
  ITEM_NOT_FOUND: { message: "Item not found on this order", status: 404 },
};

function mapError(message: string) {
  const known = Object.keys(ERROR_MAP).find((code) => message.includes(code));
  return known ? ERROR_MAP[known] : { message: "Unable to update order", status: 400 };
}

/** Verifies the order belongs to the caller's org. Returns 404-style null when it doesn't. */
async function orderInCallerOrg(admin: ReturnType<typeof createAdminSupabase>, orderId: string, orgId: string) {
  const { data } = await admin
    .from("orders")
    .select("id, branches!inner(org_id)")
    .eq("id", orderId)
    .maybeSingle();
  const branches = data?.branches as { org_id: string } | { org_id: string }[] | null | undefined;
  const resolved = Array.isArray(branches) ? branches[0]?.org_id : branches?.org_id;
  return !!data && resolved === orgId;
}

/** POST /api/orders/[orderId]/items — add lines to an open order (waiter adds a round). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const body = (await request.json()) as AddItemsBody;

  if (!body.items?.length) {
    return NextResponse.json({ error: "Items are required" }, { status: 400 });
  }

  const guard = await requireStaff();
  if (!guard.ok) return guard.response;

  const admin = createAdminSupabase();
  if (!(await orderInCallerOrg(admin, orderId, guard.staff.orgId))) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { data, error } = await admin.rpc("add_order_items", {
    p_order_id: orderId,
    p_items: body.items.map((item) => ({
      dish_id: item.dish_id,
      quantity: item.quantity,
      variant_id: item.variant_id ?? null,
      addon_ids: item.addon_ids ?? [],
      notes: item.notes || null,
    })),
  });

  if (error) {
    const mapped = mapError(error.message);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }

  return NextResponse.json({ ok: true, order: data as Order });
}

/** DELETE /api/orders/[orderId]/items?itemId=... — cancel one line on an open order. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const itemId = request.nextUrl.searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json({ error: "itemId is required" }, { status: 400 });
  }

  const guard = await requireStaff();
  if (!guard.ok) return guard.response;

  const admin = createAdminSupabase();
  if (!(await orderInCallerOrg(admin, orderId, guard.staff.orgId))) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { data, error } = await admin.rpc("remove_order_item", {
    p_order_id: orderId,
    p_item_id: itemId,
  });

  if (error) {
    const mapped = mapError(error.message);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }

  return NextResponse.json({ ok: true, order: data as Order });
}
