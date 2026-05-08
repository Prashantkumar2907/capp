import { createHmac, createHash, timingSafeEqual } from "crypto";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { releaseTableWhenIdle } from "@/lib/supabase/order-status";
import { getActiveStaffContext } from "@/lib/supabase/permissions";
import type { PaymentSettlementInput } from "@/lib/validation/schemas";
import type { Json, Payment, Staff } from "@/types/database";

type PaymentMutationResult =
  | { ok: true; payment?: Payment; duplicate?: boolean; ignored?: boolean }
  | { ok: false; status: number; code: string; message: string };

type PaymentWithOrder = Payment & { orders: { status: string; branch_id: string; table_number: number | null } | null };

export type RazorpayEvent = {
  event: string;
  created_at?: number;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        amount?: number;
        status?: string;
        order_id?: string;
        notes?: Record<string, string | undefined>;
      };
    };
  };
};

export async function settlePayment(paymentId: string, input: PaymentSettlementInput): Promise<PaymentMutationResult> {
  const admin = createAdminSupabase();
  const context = await getActiveStaffContext(admin);
  if (!context.ok) return context;

  if (!canSettlePayments(context.staff)) {
    return failure(403, "ROLE_FORBIDDEN", "Cashier, manager, admin, or owner access is required");
  }

  const { data: existing } = await admin
    .from("payments")
    .select("*, orders(status, branch_id, table_number)")
    .eq("id", paymentId)
    .maybeSingle();

  const payment = existing as PaymentWithOrder | null;
  if (!payment) return failure(404, "PAYMENT_NOT_FOUND", "Payment not found");
  if (!canUseBranch(context.staff, payment.branch_id)) return failure(403, "BRANCH_FORBIDDEN", "Payment is not available for this branch");
  if (payment.status === "completed" && input.status === "failed") return failure(409, "PAYMENT_ALREADY_COMPLETED", "Completed payments cannot be marked failed");
  if (payment.status === "refunded") return failure(409, "PAYMENT_REFUNDED", "Refunded payments cannot be settled again");

  const transactionId = payment.transaction_id || `manual-${payment.id.slice(0, 8)}-${Date.now()}`;
  const { data: updated, error } = await admin
    .from("payments")
    .update({ status: input.status, transaction_id: transactionId })
    .eq("id", payment.id)
    .eq("branch_id", payment.branch_id)
    .select("*")
    .single();

  if (error || !updated) return failure(400, "PAYMENT_UPDATE_FAILED", "Unable to update payment");

  const { data: updatedOrder } = await admin
    .from("orders")
    .update({ status: input.status === "completed" ? "paid" : "failed" })
    .eq("id", payment.order_id)
    .eq("branch_id", payment.branch_id)
    .select("id, branch_id, table_number")
    .single();

  if (input.status === "completed" && updatedOrder) {
    await releaseTableWhenIdle(admin, updatedOrder);
  }

  return { ok: true, payment: updated };
}

export async function processRazorpayWebhook(event: RazorpayEvent, rawBody: string, eventId: string): Promise<PaymentMutationResult> {
  const admin = createAdminSupabase();
  const payloadHash = createHash("sha256").update(rawBody).digest("hex");

  const { data: webhookEvent, error: insertError } = await admin
    .from("webhook_events")
    .insert({
      provider: "razorpay",
      event_id: eventId,
      event_type: event.event,
      payload_hash: payloadHash,
      payload: event as unknown as Json,
      status: "processing",
    })
    .select("*")
    .single();

  if (insertError) {
    if (insertError.code === "23505") return { ok: true, duplicate: true };
    return failure(400, "WEBHOOK_EVENT_CREATE_FAILED", "Unable to record webhook event");
  }

  const payment = event.payload?.payment?.entity;
  if (!payment?.id) {
    await markWebhookEvent(webhookEvent.id, "ignored");
    return { ok: true, ignored: true };
  }

  const status = event.event === "payment.captured" || payment.status === "captured" ? "completed" : event.event === "payment.failed" || payment.status === "failed" ? "failed" : "pending";
  const paymentId = payment.notes?.capp_payment_id;
  const orderId = payment.notes?.capp_order_id;

  const query = admin.from("payments").update({ status, transaction_id: payment.id, provider_data: event as unknown as Json }).select("*");
  const { data: updatedPayments, error } = paymentId
    ? await query.eq("id", paymentId)
    : orderId
      ? await query.eq("order_id", orderId)
      : payment.order_id
        ? await query.eq("transaction_id", payment.order_id)
        : { data: null, error: null };

  if (error) {
    await markWebhookEvent(webhookEvent.id, "failed", error.message);
    return failure(400, "WEBHOOK_PAYMENT_UPDATE_FAILED", "Unable to update payment from webhook");
  }

  const updated = (updatedPayments ?? [])[0] as Payment | undefined;
  if (updated) {
    const { data: updatedOrder } = await admin
      .from("orders")
      .update({ status: status === "completed" ? "paid" : status === "failed" ? "failed" : "pending" })
      .eq("id", updated.order_id)
      .eq("branch_id", updated.branch_id)
      .select("id, branch_id, table_number")
      .single();

    if (status === "completed" && updatedOrder) {
      await releaseTableWhenIdle(admin, updatedOrder);
    }
  }

  await markWebhookEvent(webhookEvent.id, updated ? "processed" : "ignored");
  return { ok: true, payment: updated };
}

export function razorpayEventId(event: RazorpayEvent, fallback: string | null) {
  const payment = event.payload?.payment?.entity;
  return fallback || [event.event, payment?.id, payment?.status].filter(Boolean).join(":") || createHash("sha256").update(JSON.stringify(event)).digest("hex");
}

export function validRazorpaySignature(body: string, signature: string, secret: string) {
  const digest = createHmac("sha256", secret).update(body).digest("hex");
  const actual = Buffer.from(signature);
  const expected = Buffer.from(digest);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function razorpayReplayIssue(event: Pick<RazorpayEvent, "created_at">, nowMs = Date.now()) {
  if (!event.created_at) return "Webhook timestamp is missing";

  const eventMs = event.created_at * 1000;
  const maxAgeMs = 24 * 60 * 60 * 1000;
  const futureSkewMs = 5 * 60 * 1000;

  if (eventMs < nowMs - maxAgeMs) return "Webhook timestamp is outside the retry window";
  if (eventMs > nowMs + futureSkewMs) return "Webhook timestamp is in the future";
  return null;
}

function canSettlePayments(staff: Staff) {
  return ["owner", "admin", "manager", "cashier"].includes(staff.role);
}

function canUseBranch(staff: Staff, branchId: string) {
  return staff.role === "owner" || staff.role === "admin" || staff.branch_id === branchId;
}

async function markWebhookEvent(id: string, status: "processed" | "ignored" | "failed", error?: string) {
  const admin = createAdminSupabase();
  await admin.from("webhook_events").update({ status, error: error ?? null, processed_at: new Date().toISOString() }).eq("id", id);
}

function failure(status: number, code: string, message: string): PaymentMutationResult & { ok: false } {
  return { ok: false, status, code, message };
}
