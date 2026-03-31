import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

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

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const supabase = await createServiceClient();

    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        const orderId = payment.notes?.order_id;

        if (!orderId) break;

        // Update payment status
        await supabase
          .from("payments")
          .update({
            status: "completed",
            transaction_id: payment.id,
            provider_data: payment,
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
        const payment = event.payload.payment.entity;
        const orderId = payment.notes?.order_id;

        if (!orderId) break;

        await supabase
          .from("payments")
          .update({
            status: "failed",
            transaction_id: payment.id,
            provider_data: payment,
          })
          .eq("order_id", orderId)
          .eq("status", "pending");

        break;
      }

      case "refund.processed": {
        const refund = event.payload.refund.entity;
        const paymentId = refund.payment_id;

        await supabase
          .from("payments")
          .update({ status: "refunded", provider_data: refund })
          .eq("transaction_id", paymentId);

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
