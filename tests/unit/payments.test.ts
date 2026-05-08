import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { razorpayEventId, validRazorpaySignature, type RazorpayEvent } from "../../src/lib/supabase/payments";

test("validRazorpaySignature verifies HMAC without exposing secrets", () => {
  const body = JSON.stringify({ event: "payment.captured" });
  const secret = "test_webhook_secret";
  const signature = createHmac("sha256", secret).update(body).digest("hex");

  assert.equal(validRazorpaySignature(body, signature, secret), true);
  assert.equal(validRazorpaySignature(body, "bad-signature", secret), false);
});

test("razorpayEventId prefers provider event header and falls back deterministically", () => {
  const event: RazorpayEvent = {
    event: "payment.captured",
    payload: { payment: { entity: { id: "pay_demo_123", status: "captured" } } },
  };

  assert.equal(razorpayEventId(event, "evt_demo_123"), "evt_demo_123");
  assert.equal(razorpayEventId(event, null), "payment.captured:pay_demo_123:captured");
});
