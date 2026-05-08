import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CRITICAL_VIEWPORTS,
  PERFORMANCE_BUDGETS,
  getPerformanceBudget,
  performanceBudgetsForPersona,
  requiredPerformanceIndexNames,
  type PerformancePersona,
} from "../../src/lib/performance/budgets";

test("critical performance budgets cover customer and staff workflows", () => {
  assert.deepEqual(
    PERFORMANCE_BUDGETS.map((budget) => budget.id),
    [
      "public-qr-menu",
      "public-qr-payment",
      "dashboard-overview",
      "dashboard-analytics",
      "kitchen-display",
      "waiter-pos",
      "cashier-payments",
      "staff-management",
      "menu-management",
    ]
  );

  const personas: PerformancePersona[] = ["public_customer", "owner", "admin", "manager", "waiter", "kitchen", "cashier"];
  personas.forEach((persona) => {
    assert.ok(performanceBudgetsForPersona(persona).length > 0, `${persona} should have a performance budget`);
  });
});

test("every critical route budget requires production UX states and responsive QA", () => {
  PERFORMANCE_BUDGETS.forEach((budget) => {
    assert.equal(budget.requiresSkeleton, true, `${budget.id} needs a skeleton`);
    assert.equal(budget.requiresEmptyState, true, `${budget.id} needs an empty state`);
    assert.equal(budget.requiresErrorState, true, `${budget.id} needs an error state`);
    assert.ok(budget.maxInitialJsKb <= 260, `${budget.id} initial JS budget is too high`);
    assert.ok(budget.maxApiP95Ms <= 900, `${budget.id} API budget is too high`);
    assert.equal(budget.maxDuplicateFetches, 0, `${budget.id} should not allow duplicate fetches`);
    assert.deepEqual(budget.viewports, CRITICAL_VIEWPORTS);
    assert.match(budget.cacheKey, /[{][a-zA-Z]+[}]/, `${budget.id} should declare a scoped cache key`);
  });
});

test("payment and ordering budgets preserve trusted server boundaries", () => {
  const publicPayment = getPerformanceBudget("public-qr-payment");
  const waiterPos = getPerformanceBudget("waiter-pos");
  const cashierPayments = getPerformanceBudget("cashier-payments");

  assert.ok(publicPayment);
  assert.ok(waiterPos);
  assert.ok(cashierPayments);
  assert.equal(publicPayment.maxMutationRequestsPerIntent, 1);
  assert.ok(hasBoundary(publicPayment.trustBoundaries, "server_order_totals"));
  assert.ok(hasBoundary(publicPayment.trustBoundaries, "server_payment_status"));
  assert.ok(hasBoundary(waiterPos.trustBoundaries, "server_menu_prices"));
  assert.ok(hasBoundary(cashierPayments.trustBoundaries, "webhook_signature"));
});

test("performance budget hot paths have matching database indexes", () => {
  const schema = readFileSync("supabase/01_schema.sql", "utf8");

  requiredPerformanceIndexNames().forEach((indexName) => {
    assert.equal(schema.includes(indexName), true, `${indexName} should exist in schema`);
  });
});

function hasBoundary(boundaries: readonly string[], boundary: string) {
  return boundaries.includes(boundary);
}

test("performance docs reference the machine-readable route budgets", () => {
  const docs = readFileSync("docs/performance.md", "utf8");

  PERFORMANCE_BUDGETS.forEach((budget) => {
    assert.equal(docs.includes(budget.id), true, `${budget.id} should be documented`);
  });
});
