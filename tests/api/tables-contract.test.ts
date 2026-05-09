import assert from "node:assert/strict";
import test from "node:test";
import type { NextRequest } from "next/server";

test("table creation rejects invalid input before auth or database work", async () => {
  const { POST } = await import("../../src/app/api/tables/route");
  const request = new Request("http://localhost/api/tables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      branch_id: "not-a-uuid",
      label: "x".repeat(90),
      capacity: 0,
    }),
  }) as NextRequest;

  const response = await POST(request);
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.match(body.error ?? "", /branch_id|label|capacity/i);
});

test("table status updates reject malformed ids before auth or database work", async () => {
  const { PATCH } = await import("../../src/app/api/tables/[tableId]/route");
  const request = new Request("http://localhost/api/tables/not-a-uuid", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "inactive" }),
  }) as NextRequest;

  const response = await PATCH(request, { params: Promise.resolve({ tableId: "not-a-uuid" }) });
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.match(body.error ?? "", /uuid/i);
});

test("table status updates reject invalid statuses before auth or database work", async () => {
  const { PATCH } = await import("../../src/app/api/tables/[tableId]/route");
  const request = new Request("http://localhost/api/tables/10000000-0000-0000-0000-000000000001", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "cleaning" }),
  }) as NextRequest;

  const response = await PATCH(request, { params: Promise.resolve({ tableId: "10000000-0000-0000-0000-000000000001" }) });
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.match(body.error ?? "", /status/i);
});
