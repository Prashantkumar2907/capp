import assert from "node:assert/strict";
import test from "node:test";
import type { NextRequest } from "next/server";

test("order creation rejects invalid payloads before database work", async () => {
  const { POST } = await import("../../src/app/api/orders/route");
  const request = new Request("http://localhost/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      branchId: "not-a-uuid",
      items: [],
    }),
  }) as NextRequest;

  const response = await POST(request);
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.match(body.error ?? "", /branchId|items/);
});
