import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/api/auth";
import type { Order } from "@/types/database";

/**
 * POST /api/orders/[orderId]/cancel { reason? }
 * Manager and above. Cancels the order + items, voids the pending payment,
 * frees the table, and logs who/why. Settled orders are refused (that's a
 * refund flow, not a cancel).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const body = (await request.json().catch(() => ({}))) as { reason?: string };

  const guard = await requireStaff(["owner", "admin", "manager"]);
  if (!guard.ok) return guard.response;

  const admin = createAdminSupabase();
  const { data: existing } = await admin
    .from("orders")
    .select("id, branches!inner(org_id)")
    .eq("id", orderId)
    .maybeSingle();
  const branches = existing?.branches as { org_id: string } | { org_id: string }[] | null | undefined;
  const orgId = Array.isArray(branches) ? branches[0]?.org_id : branches?.org_id;
  if (!existing || orgId !== guard.staff.orgId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { data, error } = await admin.rpc("cancel_order", {
    p_order_id: orderId,
    p_reason: body.reason || null,
    p_staff_id: guard.staff.staffId,
  });

  if (error) {
    if (error.message.includes("ORDER_PAID")) {
      return NextResponse.json({ error: "This order is already paid — issue a refund instead of cancelling" }, { status: 409 });
    }
    if (error.message.includes("ORDER_NOT_FOUND")) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Unable to cancel order" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, order: data as Order });
}
