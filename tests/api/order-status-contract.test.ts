import assert from "node:assert/strict";
import test from "node:test";
import type { NextRequest } from "next/server";

const validOrderId = "f0000000-0000-0000-0000-000000000099";

test("order status endpoint rejects malformed order ids before auth or database work", async () => {
  const { PATCH } = await import("../../src/app/api/orders/[orderId]/status/route");
  const request = new Request("http://localhost/api/orders/not-a-uuid/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "confirmed" }),
  }) as NextRequest;

  const response = await PATCH(request, { params: Promise.resolve({ orderId: "not-a-uuid" }) });
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.match(body.error ?? "", /uuid/i);
});

test("order status endpoint ignores client-supplied item status and requires a valid order status", async () => {
  const { PATCH } = await import("../../src/app/api/orders/[orderId]/status/route");
  const request = new Request(`http://localhost/api/orders/${validOrderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemStatus: "served" }),
  }) as NextRequest;

  const response = await PATCH(request, { params: Promise.resolve({ orderId: validOrderId }) });
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.match(body.error ?? "", /status/i);
});
