import assert from "node:assert/strict";
import test from "node:test";
import { config } from "dotenv";
import type { NextRequest } from "next/server";

test("health route returns ok", async () => {
  config({ path: ".env.local" });
  const { GET: health } = await import("../../src/app/api/health/route");
  const request = { nextUrl: new URL("http://localhost/api/health") } as NextRequest;
  const response = await health(request);
  const body = (await response.json()) as { ok: boolean; error?: string };

  assert.equal(response.status, 200, body.error ?? "health route should return 200");
  assert.equal(body.ok, true);
});
