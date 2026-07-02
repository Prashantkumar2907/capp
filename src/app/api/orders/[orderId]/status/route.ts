import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { orderStatuses, type OrderStatus } from "@/lib/constants";

interface Params {
  params: Promise<{ orderId: string }>;
}

interface StatusBody {
  status: OrderStatus;
  itemStatus?: "pending" | "accepted" | "preparing" | "ready" | "served" | "cancelled";
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { orderId } = await params;
  const body = (await request.json()) as StatusBody;

  if (!orderStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data: order, error } = await admin.from("orders").update({ status: body.status }).eq("id", orderId).select("*").single();

  if (error || !order) {
    return NextResponse.json({ error: error?.message ?? "Order not found" }, { status: 400 });
  }

  if (body.itemStatus) {
    await admin.from("order_items").update({ status: body.itemStatus }).eq("order_id", orderId);
  }

  if (body.status === "served" || body.status === "cancelled") {
    await admin.from("tables").update({ status: "available" }).eq("branch_id", order.branch_id).eq("table_number", order.table_number ?? -1);
  }

  if (body.status === "confirmed" && order.table_number) {
    await admin.from("tables").update({ status: "occupied" }).eq("branch_id", order.branch_id).eq("table_number", order.table_number);
  }

  return NextResponse.json({ ok: true, order });
}
