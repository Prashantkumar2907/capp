import assert from "node:assert/strict";
import test from "node:test";
import type { NextRequest } from "next/server";

test("payment settlement rejects malformed ids before auth or database work", async () => {
  const { PATCH } = await import("../../src/app/api/payments/[paymentId]/settle/route");
  const request = new Request("http://localhost/api/payments/not-a-uuid/settle", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "completed" }),
  }) as NextRequest;

  const response = await PATCH(request, { params: Promise.resolve({ paymentId: "not-a-uuid" }) });
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.match(body.error ?? "", /uuid/i);
});

test("razorpay webhook rejects invalid signatures before database work", async () => {
  process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret";
  const { POST } = await import("../../src/app/api/v1/webhooks/razorpay/route");
  const request = new Request("http://localhost/api/v1/webhooks/razorpay", {
    method: "POST",
    headers: { "x-razorpay-signature": "bad-signature" },
    body: JSON.stringify({ event: "payment.captured" }),
  }) as NextRequest;

  const response = await POST(request);
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 401);
  assert.equal(body.ok, false);
  assert.equal(body.code, "INVALID_SIGNATURE");
});
