import assert from "node:assert/strict";
import test from "node:test";
import type { NextRequest } from "next/server";

test("public menu rejects malformed branch ids before database work", async () => {
  const { GET } = await import("../../src/app/api/public/menu/route");
  const request = { nextUrl: new URL("http://localhost/api/public/menu?branchId=bad&tableNumber=1") } as NextRequest;

  const response = await GET(request);
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.match(body.error ?? "", /branchId/i);
});

test("public receipt rejects malformed order ids before database work", async () => {
  const { GET } = await import("../../src/app/api/public/receipt/route");
  const request = { nextUrl: new URL("http://localhost/api/public/receipt?orderId=bad") } as NextRequest;

  const response = await GET(request);
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.match(body.error ?? "", /orderId/i);
});

test("public menu metadata rejects malformed branch ids before database work", async () => {
  const { GET } = await import("../../src/app/api/public/menu/meta/route");
  const request = { nextUrl: new URL("http://localhost/api/public/menu/meta?branchId=bad&tableNumber=1") } as NextRequest;

  const response = await GET(request);
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.match(body.error ?? "", /branchId/i);
});

test("public feedback rejects invalid input before database work", async () => {
  const { POST } = await import("../../src/app/api/public/feedback/route");
  const request = new Request("http://localhost/api/public/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: "not-a-uuid",
      branchId: "also-not-a-uuid",
      rating: 6,
      comment: "x".repeat(700),
    }),
  }) as NextRequest;

  const response = await POST(request);
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.match(body.error ?? "", /orderId|branchId|rating|comment/);
});
