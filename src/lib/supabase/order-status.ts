import { createAdminSupabase } from "@/lib/supabase/admin";
import { getActiveStaffContext } from "@/lib/supabase/permissions";
import type { OperationalOrderStatus, OrderItemStatus, OrderStatus, Role } from "@/lib/constants";
import type { Branch, Order, Staff } from "@/types/database";

export type OrderStatusUpdateResult =
  | { ok: true; order: Order; itemStatus: OrderItemStatus | null; unchanged: boolean }
  | { ok: false; status: number; code: string; message: string };

const transitionTargets: Record<OrderStatus, readonly OperationalOrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served", "cancelled"],
  served: ["cancelled"],
  paid: [],
  cancelled: [],
  refunded: [],
  failed: [],
};

const progressionRoles: Record<Exclude<OperationalOrderStatus, "pending" | "cancelled">, readonly Role[]> = {
  confirmed: ["owner", "admin", "manager", "kitchen"],
  preparing: ["owner", "admin", "manager", "kitchen"],
  ready: ["owner", "admin", "manager", "kitchen"],
  served: ["owner", "admin", "manager", "waiter", "kitchen"],
};

export async function transitionOrderStatus(orderId: string, targetStatus: OperationalOrderStatus): Promise<OrderStatusUpdateResult> {
  const admin = createAdminSupabase();
  const context = await getActiveStaffContext(admin);
  if (!context.ok) return context;

  const { data: order, error } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) return failure(400, "ORDER_LOOKUP_FAILED", "Unable to load order");
  if (!order) return failure(404, "ORDER_NOT_FOUND", "Order not found");

  const { data: branch } = await admin.from("branches").select("*").eq("id", order.branch_id).eq("is_active", true).maybeSingle();
  if (!branch) return failure(404, "BRANCH_NOT_FOUND", "Branch not found");

  const access = staffCanAccessBranch(context.staff, branch);
  if (!access) return failure(403, "BRANCH_FORBIDDEN", "Staff access is not available for this branch");

  if (order.status === targetStatus) {
    return { ok: true, order, itemStatus: itemStatusForOrderStatus(targetStatus), unchanged: true };
  }

  const transitionIssue = orderStatusTransitionIssue(order.status, targetStatus, context.staff.role);
  if (transitionIssue) return failure(409, "INVALID_STATUS_TRANSITION", transitionIssue);

  if (targetStatus === "cancelled") {
    const { data: settledPayments, error: paymentError } = await admin
      .from("payments")
      .select("id")
      .eq("order_id", order.id)
      .in("status", ["completed", "refunded"]);

    if (paymentError) return failure(400, "PAYMENT_LOOKUP_FAILED", "Unable to verify payment state");
    if (settledPayments?.length) return failure(409, "ORDER_SETTLED", "Paid or refunded orders cannot be cancelled from the order board");
  }

  const { data: updatedOrder, error: updateError } = await admin
    .from("orders")
    .update({ status: targetStatus })
    .eq("id", order.id)
    .eq("status", order.status)
    .select("*")
    .single();

  if (updateError || !updatedOrder) {
    return failure(409, "ORDER_STATUS_CONFLICT", "Order status changed. Refresh the board and try again");
  }

  const itemStatus = itemStatusForOrderStatus(targetStatus);
  if (itemStatus) {
    const { error: itemError } = await admin.from("order_items").update({ status: itemStatus }).eq("order_id", order.id).eq("branch_id", order.branch_id);
    if (itemError) return failure(400, "ORDER_ITEMS_UPDATE_FAILED", "Order updated, but item status could not be synced");
  }

  if (targetStatus === "confirmed" && updatedOrder.table_number) {
    await admin.from("tables").update({ status: "occupied" }).eq("branch_id", updatedOrder.branch_id).eq("table_number", updatedOrder.table_number);
  }

  if (targetStatus === "cancelled") {
    await releaseTableWhenIdle(admin, updatedOrder);
  }

  return { ok: true, order: updatedOrder, itemStatus, unchanged: false };
}

export function orderStatusTransitionIssue(currentStatus: OrderStatus, targetStatus: OperationalOrderStatus, role: Role): string | null {
  if (!transitionTargets[currentStatus].includes(targetStatus)) {
    return `Orders cannot move from ${currentStatus} to ${targetStatus}`;
  }

  if (targetStatus === "cancelled") {
    if (["owner", "admin", "manager", "cashier"].includes(role)) return null;
    if (role === "waiter" && currentStatus === "pending") return null;
    return "This role cannot cancel the order at its current stage";
  }

  if (targetStatus === "pending") {
    return "Orders cannot be moved back to pending";
  }

  return progressionRoles[targetStatus].includes(role) ? null : "This role cannot move the order to the requested status";
}

export function itemStatusForOrderStatus(status: OperationalOrderStatus): OrderItemStatus | null {
  if (status === "pending") return "pending";
  if (status === "confirmed") return "accepted";
  if (status === "preparing") return "preparing";
  if (status === "ready") return "ready";
  if (status === "served") return "served";
  if (status === "cancelled") return "cancelled";
  return null;
}

export async function releaseTableWhenIdle(admin: ReturnType<typeof createAdminSupabase>, order: Pick<Order, "branch_id" | "table_number" | "id">) {
  if (!order.table_number) return;

  const { data: activeOrders } = await admin
    .from("orders")
    .select("id")
    .eq("branch_id", order.branch_id)
    .eq("table_number", order.table_number)
    .neq("id", order.id)
    .in("status", ["pending", "confirmed", "preparing", "ready", "served"]);

  if (!activeOrders?.length) {
    await admin.from("tables").update({ status: "available" }).eq("branch_id", order.branch_id).eq("table_number", order.table_number);
  }
}

function staffCanAccessBranch(staff: Staff, branch: Branch) {
  if (staff.org_id !== branch.org_id) return false;
  if (staff.role === "owner" || staff.role === "admin") return true;
  return staff.branch_id === branch.id;
}

function failure(status: number, code: string, message: string): OrderStatusUpdateResult & { ok: false } {
  return { ok: false, status, code, message };
}
