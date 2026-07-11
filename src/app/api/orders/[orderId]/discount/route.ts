import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/api/auth";
import type { Order } from "@/types/database";

/**
 * POST /api/orders/[orderId]/discount — apply a flat discount to an open
 * order. Manager and above only; the rupee amount and reason land in
 * activity_logs for the owner's audit trail.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const body = (await request.json()) as { amount: number; reason?: string };

  if (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount < 0) {
    return NextResponse.json({ error: "Enter a valid discount amount" }, { status: 400 });
  }

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

  const { data, error } = await admin.rpc("apply_discount", {
    p_order_id: orderId,
    p_amount: body.amount,
    p_reason: body.reason || null,
    p_staff_id: guard.staff.staffId,
  });

  if (error) {
    if (error.message.includes("ORDER_CLOSED")) return NextResponse.json({ error: "This order is already closed" }, { status: 409 });
    if (error.message.includes("ORDER_NOT_FOUND")) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ error: "Unable to apply discount" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, order: data as Order });
}
