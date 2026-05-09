import assert from "node:assert/strict";
import test from "node:test";
import type { NextRequest } from "next/server";

test("platform client onboarding rejects invalid payloads before auth or database work", async () => {
  const { POST } = await import("../../src/app/api/platform/clients/route");
  const request = new Request("http://localhost/api/platform/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ownerEmail: "not-an-email",
      organization: { name: "A", restaurant_type: "", default_tax_percent: 99, tax_inclusive: true },
      branch: { name: "", table_count: 0 },
      subscription: { plan: "moon", status: "active", durationDays: 0 },
    }),
  }) as NextRequest;

  const response = await POST(request);
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.match(body.error ?? "", /ownerEmail|organization|branch|subscription/i);
});

test("platform subscription grants reject invalid durations before auth or database work", async () => {
  const { POST } = await import("../../src/app/api/platform/subscriptions/grant/route");
  const request = new Request("http://localhost/api/platform/subscriptions/grant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orgId: "not-a-uuid",
      plan: "starter",
      status: "active",
      durationDays: 0,
    }),
  }) as NextRequest;

  const response = await POST(request);
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.match(body.error ?? "", /orgId|durationDays/i);
});

test("platform subscription grants reject invalid JSON with the shared contract", async () => {
  const { POST } = await import("../../src/app/api/platform/subscriptions/grant/route");
  const request = new Request("http://localhost/api/platform/subscriptions/grant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad json",
  }) as NextRequest;

  const response = await POST(request);
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.code, "INVALID_JSON");
});
