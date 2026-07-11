import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/api/auth";
import { sendWhatsApp, orderReadyMessage } from "@/lib/notify-whatsapp";
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

  // Staff-only endpoint: kitchen/waiter/cashier/manager/admin/owner dashboards call this.
  const guard = await requireStaff();
  if (!guard.ok) return guard.response;

  const admin = createAdminSupabase();

  // Scope: the order must belong to the caller's organization (via its branch).
  const { data: existing } = await admin
    .from("orders")
    .select("id, branch_id, branches!inner(org_id)")
    .eq("id", orderId)
    .maybeSingle();

  const orderOrgId = (existing?.branches as { org_id: string } | { org_id: string }[] | null | undefined);
  const resolvedOrgId = Array.isArray(orderOrgId) ? orderOrgId[0]?.org_id : orderOrgId?.org_id;

  if (!existing || resolvedOrgId !== guard.staff.orgId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { data: order, error } = await admin.from("orders").update({ status: body.status }).eq("id", orderId).select("*").single();

  // Customer WhatsApp ping when food is ready — fire-and-forget, never blocks
  if (!error && order && body.status === "ready" && order.customer_phone) {
    const { data: branchRow } = await admin
      .from("branches")
      .select("name, organizations(name)")
      .eq("id", order.branch_id)
      .maybeSingle();
    const orgName = (branchRow?.organizations as { name?: string } | { name?: string }[] | null | undefined);
    const restaurantName = (Array.isArray(orgName) ? orgName[0]?.name : orgName?.name) ?? branchRow?.name ?? "Your restaurant";
    const receiptUrl = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/receipt/${order.id}` : undefined;
    void sendWhatsApp(order.customer_phone, orderReadyMessage(order.order_number, restaurantName, receiptUrl));
  }

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
