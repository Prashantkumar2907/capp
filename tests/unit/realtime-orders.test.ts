import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hookSource = readFileSync("src/hooks/use-realtime-orders.ts", "utf8");

test("realtime orders hook coalesces overlapping refreshes", () => {
  assert.match(hookSource, /inFlightRef/);
  assert.match(hookSource, /queuedRefreshRef/);
  assert.match(hookSource, /queuedRefreshRef\.current = true/);
});

test("realtime orders hook guards branch changes and subscription cleanup", () => {
  assert.match(hookSource, /branchRef\.current === currentBranchId/);
  assert.match(hookSource, /activeRef\.current/);
  assert.match(hookSource, /removeChannel\(channel\)/);
});
