import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const dashboardRoutes = ["analytics", "branches", "kitchen", "menu", "orders", "payments", "settings", "staff", "tables", "waiter"];

test("dashboard child routes provide route-level skeleton loading files", () => {
  for (const route of dashboardRoutes) {
    const path = `src/app/(dashboard)/dashboard/${route}/loading.tsx`;
    assert.equal(existsSync(path), true, `${route} should have loading.tsx`);
    assert.match(readFileSync(path, "utf8"), /DashboardRouteSkeleton/);
  }
});

test("dashboard route skeletons expose status semantics", () => {
  const source = readFileSync("src/components/ui/loading-patterns.tsx", "utf8");
  assert.match(source, /role="status"/);
  assert.match(source, /aria-label="Loading dashboard page"/);
  assert.match(source, /kind\?: "analytics" \| "board" \| "cards" \| "form" \| "menu" \| "orders" \| "table"/);
});
