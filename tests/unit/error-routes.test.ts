import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const dashboardRoutes = ["analytics", "branches", "kitchen", "menu", "orders", "payments", "settings", "staff", "tables", "waiter"];

test("dashboard routes provide route-level recovery error boundaries", () => {
  assertErrorBoundary("src/app/(dashboard)/dashboard/error.tsx", "DashboardRouteError");

  dashboardRoutes.forEach((route) => {
    assertErrorBoundary(`src/app/(dashboard)/dashboard/${route}/error.tsx`, "DashboardRouteError");
  });
});

test("public ordering routes provide safe customer error boundaries", () => {
  [
    "src/app/(public)/order/[branchId]/[tableNumber]/error.tsx",
    "src/app/(public)/order/[branchId]/[tableNumber]/payment/error.tsx",
    "src/app/(public)/receipt/[orderId]/error.tsx",
  ].forEach((path) => assertErrorBoundary(path, "PublicRouteError"));
});

test("route error primitive is accessible and does not render raw error details", () => {
  const component = readFileSync("src/components/ui/route-error.tsx", "utf8");
  const routeErrors = [
    "src/app/(dashboard)/dashboard/error.tsx",
    ...dashboardRoutes.map((route) => `src/app/(dashboard)/dashboard/${route}/error.tsx`),
    "src/app/(public)/order/[branchId]/[tableNumber]/error.tsx",
    "src/app/(public)/order/[branchId]/[tableNumber]/payment/error.tsx",
    "src/app/(public)/receipt/[orderId]/error.tsx",
  ]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");

  assert.match(component, /role="alert"/);
  assert.match(component, /aria-live="assertive"/);
  assert.match(component, /onClick=\{reset\}/);
  assert.doesNotMatch(routeErrors, /error\.(message|digest)/);
});

function assertErrorBoundary(path: string, componentName: string) {
  assert.equal(existsSync(path), true, `${path} should exist`);
  const source = readFileSync(path, "utf8");

  assert.match(source, /"use client"/);
  assert.match(source, new RegExp(componentName));
  assert.match(source, /reset/);
}
