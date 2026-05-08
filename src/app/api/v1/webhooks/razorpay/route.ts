import type { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/responses";
import { processRazorpayWebhook, razorpayEventId, razorpayReplayIssue, validRazorpaySignature, type RazorpayEvent } from "@/lib/supabase/payments";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const incomingEventId = request.headers.get("x-razorpay-event-id");
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return apiError("WEBHOOK_SECRET_MISSING", "Razorpay webhook secret is not configured", 500);
  }

  if (!signature || !validRazorpaySignature(rawBody, signature, webhookSecret)) {
    return apiError("INVALID_SIGNATURE", "Invalid signature", 401);
  }

  let event: RazorpayEvent;
  try {
    event = JSON.parse(rawBody) as RazorpayEvent;
  } catch {
    return apiError("INVALID_JSON", "Webhook payload is not valid JSON", 400);
  }

  const replayIssue = razorpayReplayIssue(event);
  if (replayIssue) {
    return apiError("WEBHOOK_REPLAY_REJECTED", replayIssue, 409);
  }

  const result = await processRazorpayWebhook(event, rawBody, razorpayEventId(event, incomingEventId));
  if (!result.ok) {
    return apiError(result.code, result.message, result.status);
  }

  return apiOk({ duplicate: Boolean(result.duplicate), ignored: Boolean(result.ignored) });
}
