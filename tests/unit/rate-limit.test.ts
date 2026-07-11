import assert from "node:assert/strict";
import test from "node:test";
import { rateLimit } from "../../src/lib/rate-limit";

test("rate limit allows up to the limit then blocks", () => {
  const key = `test-${Math.random()}`;
  for (let i = 0; i < 8; i += 1) {
    assert.equal(rateLimit(key, 8, 60_000).ok, true, `hit ${i + 1} should pass`);
  }
  const blocked = rateLimit(key, 8, 60_000);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfterSeconds > 0);
});

test("separate keys have independent buckets", () => {
  const a = `a-${Math.random()}`;
  const b = `b-${Math.random()}`;
  for (let i = 0; i < 8; i += 1) rateLimit(a, 8, 60_000);
  assert.equal(rateLimit(a, 8, 60_000).ok, false);
  assert.equal(rateLimit(b, 8, 60_000).ok, true);
});

test("a tiny window frees up immediately", async () => {
  const key = `w-${Math.random()}`;
  assert.equal(rateLimit(key, 1, 20).ok, true);
  assert.equal(rateLimit(key, 1, 20).ok, false);
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(rateLimit(key, 1, 20).ok, true);
});
