import assert from "node:assert/strict";
import test from "node:test";
import { config } from "dotenv";

test("health route returns ok", async () => {
  config({ path: ".env.local" });
  const { GET: health } = await import("../../src/app/api/health/route");
  const response = await health();
  const body = (await response.json()) as { ok: boolean; error?: string };

  assert.equal(response.status, 200, body.error ?? "health route should return 200");
  assert.equal(body.ok, true);
});
