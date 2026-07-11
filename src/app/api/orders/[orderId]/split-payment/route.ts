import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/api/auth";

/**
 * POST /api/orders/[orderId]/split-payment — record a partial or full
 * payment (part cash, part UPI is everyday reality at Indian counters).
 * The pending payment row shrinks to the remainder; the order is settled
 * when it reaches zero.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const body = (await request.json()) as { amount: number; method: "cash" | "upi" | "card" };

  if (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0) {
    return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
  }
  if (!["cash", "upi", "card"].includes(body.method)) {
    return NextResponse.json({ error: "Pick a payment method" }, { status: 400 });
  }

  const guard = await requireStaff(["owner", "admin", "manager", "cashier"]);
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

  const { data, error } = await admin.rpc("record_split_payment", {
    p_order_id: orderId,
    p_amount: body.amount,
    p_method: body.method,
  });

  if (error) {
    if (error.message.includes("INVALID_AMOUNT")) return NextResponse.json({ error: "Amount exceeds what is due" }, { status: 400 });
    if (error.message.includes("ORDER_CLOSED")) return NextResponse.json({ error: "This order is cancelled" }, { status: 409 });
    return NextResponse.json({ error: "Unable to record payment" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, result: data });
}
