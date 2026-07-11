import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

type RazorpayEvent = {
  event: string;
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
    subscription?: {
      entity?: {
        id?: string;
        status?: string;
        current_start?: number;
        current_end?: number;
        notes?: Record<string, string | undefined>;
      };
    };
  };
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (webhookSecret && (!signature || !validSignature(rawBody, signature, webhookSecret))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as RazorpayEvent;

  // ---- Subscription lifecycle (plan billing) ----
  const subscriptionEntity = event.payload?.subscription?.entity;
  if (event.event.startsWith("subscription.") && subscriptionEntity?.id) {
    const admin = createAdminSupabase();
    const nextStatus =
      event.event === "subscription.activated" || event.event === "subscription.charged" || event.event === "subscription.resumed"
        ? "active"
        : event.event === "subscription.halted" || event.event === "subscription.pending"
          ? "past_due"
          : event.event === "subscription.cancelled" || event.event === "subscription.completed"
            ? "cancelled"
            : null;

    if (nextStatus) {
      const update: Record<string, unknown> = { status: nextStatus, updated_at: new Date().toISOString() };
      if (subscriptionEntity.current_start) update.current_period_start = new Date(subscriptionEntity.current_start * 1000).toISOString();
      if (subscriptionEntity.current_end) update.current_period_end = new Date(subscriptionEntity.current_end * 1000).toISOString();
      const notedPlan = subscriptionEntity.notes?.capp_plan;
      if (notedPlan && ["starter", "growth", "pro"].includes(notedPlan)) update.plan = notedPlan;

      // match by the id we stored at checkout; fall back to notes org id
      const { data: matched } = await admin
        .from("subscriptions")
        .update(update)
        .eq("razorpay_subscription_id", subscriptionEntity.id)
        .select("id");
      if (!matched?.length && subscriptionEntity.notes?.capp_org_id) {
        await admin.from("subscriptions").update({ ...update, razorpay_subscription_id: subscriptionEntity.id }).eq("org_id", subscriptionEntity.notes.capp_org_id);
      }
    }
    return NextResponse.json({ ok: true });
  }

  // ---- Order payments (existing flow) ----
  const payment = event.payload?.payment?.entity;

  if (!payment?.id) {
    return NextResponse.json({ ok: true });
  }

  const status = event.event === "payment.captured" || payment.status === "captured" ? "completed" : event.event === "payment.failed" || payment.status === "failed" ? "failed" : "pending";
  const orderId = payment.notes?.capp_order_id;
  const paymentId = payment.notes?.capp_payment_id;
  const admin = createAdminSupabase();

  if (paymentId) {
    await admin.from("payments").update({ status, transaction_id: payment.id, provider_data: event }).eq("id", paymentId);
  } else if (orderId) {
    await admin.from("payments").update({ status, transaction_id: payment.id, provider_data: event }).eq("order_id", orderId);
  } else if (payment.order_id) {
    await admin.from("payments").update({ status, transaction_id: payment.id, provider_data: event }).eq("transaction_id", payment.order_id);
  }

  return NextResponse.json({ ok: true });
}

function validSignature(body: string, signature: string, secret: string) {
  const digest = createHmac("sha256", secret).update(body).digest("hex");
  const actual = Buffer.from(signature);
  const expected = Buffer.from(digest);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
