import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { getErrorMessage, isRecord } from "@/lib/errors";
import type { Json } from "@/lib/supabase/types";

function signaturesMatch(expectedSignature: string, receivedSignature: string) {
  try {
    const expected = Buffer.from(expectedSignature, "hex");
    const received = Buffer.from(receivedSignature, "hex");
    return (
      expected.length === received.length &&
      crypto.timingSafeEqual(expected, received)
    );
  } catch {
    return false;
  }
}

function getNestedRecord(
  value: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> | null {
  let current: unknown = value;
  for (const key of keys) {
    if (!isRecord(current) || !isRecord(current[key])) return null;
    current = current[key] as Record<string, unknown>;
  }
  return current as Record<string, unknown>;
}

function getOrderIdFromPayment(payment: Record<string, unknown>) {
  const notes = payment.notes;
  if (!isRecord(notes) || typeof notes.order_id !== "string") return null;
  return notes.order_id;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (!signaturesMatch(expectedSignature, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event: unknown = JSON.parse(body);
    if (!isRecord(event) || typeof event.event !== "string") {
      return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    switch (event.event) {
      case "payment.captured": {
        const payment = getNestedRecord(event, ["payload", "payment", "entity"]);
        if (!payment) break;
        const orderId = getOrderIdFromPayment(payment);

        if (!orderId) break;

        // Update payment status
        await supabase
          .from("payments")
          .update({
            status: "completed",
            transaction_id: typeof payment.id === "string" ? payment.id : null,
            provider_data: payment as Json,
          })
          .eq("order_id", orderId)
          .eq("status", "pending");

        // Update order status to confirmed
        await supabase
          .from("orders")
          .update({ status: "confirmed" })
          .eq("id", orderId)
          .eq("status", "pending");

        break;
      }

      case "payment.failed": {
        const payment = getNestedRecord(event, ["payload", "payment", "entity"]);
        if (!payment) break;
        const orderId = getOrderIdFromPayment(payment);

        if (!orderId) break;

        await supabase
          .from("payments")
          .update({
            status: "failed",
            transaction_id: typeof payment.id === "string" ? payment.id : null,
            provider_data: payment as Json,
          })
          .eq("order_id", orderId)
          .eq("status", "pending");

        break;
      }

      case "refund.processed": {
        const refund = getNestedRecord(event, ["payload", "refund", "entity"]);
        const paymentId = refund?.payment_id;
        if (typeof paymentId !== "string") break;

        await supabase
          .from("payments")
          .update({ status: "refunded", provider_data: refund as Json })
          .eq("transaction_id", paymentId);

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", getErrorMessage(error));
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
