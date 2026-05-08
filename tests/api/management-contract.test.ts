import assert from "node:assert/strict";
import test from "node:test";
import type { NextRequest } from "next/server";

test("staff API rejects owner role creation before auth or database work", async () => {
  const { POST } = await import("../../src/app/api/staff/route");
  const request = new Request("http://localhost/api/staff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: "Unsafe Owner",
      email: "unsafe.owner@demo.capp.local",
      role: "owner",
    }),
  }) as NextRequest;

  const response = await POST(request);
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.match(body.error ?? "", /role/);
});

test("branch API rejects malformed branch ids before auth or database work", async () => {
  const { PATCH } = await import("../../src/app/api/branches/[branchId]/route");
  const request = new Request("http://localhost/api/branches/not-a-uuid", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: false }),
  }) as NextRequest;

  const response = await PATCH(request, { params: Promise.resolve({ branchId: "not-a-uuid" }) });
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.match(body.error ?? "", /uuid/i);
});
