import assert from "node:assert/strict";
import test from "node:test";
import type { NextRequest } from "next/server";

test("onboarding rejects invalid workspace input before auth or database work", async () => {
  const { POST } = await import("../../src/app/api/onboarding/route");
  const request = new Request("http://localhost/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organization: {
        name: "A",
        restaurant_type: "",
        default_tax_percent: 99,
        tax_inclusive: true,
      },
      branch: {
        name: "",
        table_count: 0,
      },
      seedMenu: "yes",
    }),
  }) as NextRequest;

  const response = await POST(request);
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.match(body.error ?? "", /organization|branch|seedMenu/i);
});

test("onboarding rejects invalid JSON with the shared API error contract", async () => {
  const { POST } = await import("../../src/app/api/onboarding/route");
  const request = new Request("http://localhost/api/onboarding", {
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
