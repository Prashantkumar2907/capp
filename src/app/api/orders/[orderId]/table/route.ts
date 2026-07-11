import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/api/auth";
import type { Order } from "@/types/database";

/**
 * POST /api/orders/[orderId]/table
 *   { action: "move",  tableNumber: 7 }        — group shifted tables
 *   { action: "merge", targetOrderId: "..." }  — two groups joined; this
 *     order's items move onto the target and this order closes
 */
type Body =
  | { action: "move"; tableNumber: number }
  | { action: "merge"; targetOrderId: string };

const ERROR_MAP: Record<string, { message: string; status: number }> = {
  ORDER_NOT_FOUND: { message: "Order not found", status: 404 },
  ORDER_CLOSED: { message: "One of the orders is already closed", status: 409 },
  TABLE_NOT_FOUND: { message: "That table does not exist", status: 404 },
  TABLE_OCCUPIED: { message: "That table already has a running order — merge instead", status: 409 },
  SAME_ORDER: { message: "Pick a different order to merge into", status: 400 },
  BRANCH_MISMATCH: { message: "Orders belong to different branches", status: 400 },
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const body = (await request.json()) as Body;

  const guard = await requireStaff(["owner", "admin", "manager", "waiter"]);
  if (!guard.ok) return guard.response;

  const admin = createAdminSupabase();

  const inOrg = async (id: string) => {
    const { data } = await admin.from("orders").select("id, branches!inner(org_id)").eq("id", id).maybeSingle();
    const branches = data?.branches as { org_id: string } | { org_id: string }[] | null | undefined;
    const orgId = Array.isArray(branches) ? branches[0]?.org_id : branches?.org_id;
    return !!data && orgId === guard.staff.orgId;
  };

  if (!(await inOrg(orderId))) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let rpc;
  if (body.action === "move") {
    if (!Number.isInteger(body.tableNumber) || body.tableNumber <= 0) {
      return NextResponse.json({ error: "Pick a table" }, { status: 400 });
    }
    rpc = admin.rpc("move_order_table", { p_order_id: orderId, p_table_number: body.tableNumber });
  } else if (body.action === "merge") {
    if (!body.targetOrderId || !(await inOrg(body.targetOrderId))) {
      return NextResponse.json({ error: "Target order not found" }, { status: 404 });
    }
    rpc = admin.rpc("merge_orders", { p_source_order_id: orderId, p_target_order_id: body.targetOrderId });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const { data, error } = await rpc;
  if (error) {
    const known = Object.keys(ERROR_MAP).find((code) => error.message.includes(code));
    const mapped = known ? ERROR_MAP[known] : { message: "Unable to update tables", status: 400 };
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }

  return NextResponse.json({ ok: true, order: data as Order });
}
