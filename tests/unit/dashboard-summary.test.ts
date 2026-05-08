import assert from "node:assert/strict";
import test from "node:test";
import { buildDashboardSummary } from "../../src/lib/analytics/dashboard-summary";

test("buildDashboardSummary creates chart-ready branch metrics without returning full rows", () => {
  const summary = buildDashboardSummary({
    now: new Date("2026-05-08T12:00:00.000Z"),
    orders: [
      {
        id: "o1",
        order_number: "MW-001",
        table_number: 4,
        order_source: "qr_customer",
        status: "pending",
        total: 420,
        created_at: "2026-05-08T08:00:00.000Z",
      },
      {
        id: "o2",
        order_number: "MW-002",
        table_number: null,
        order_source: "cashier",
        status: "paid",
        total: 300,
        created_at: "2026-05-07T18:00:00.000Z",
      },
    ],
    items: [
      { dish_name: "Millet Masala Dosa", quantity: 2, price_at_order: 180, created_at: "2026-05-08T08:00:00.000Z" },
      { dish_name: "Filter Coffee Flask", quantity: 1, price_at_order: 140, created_at: "2026-05-08T08:00:00.000Z" },
    ],
    feedback: [{ rating: 4 }, { rating: 5 }],
    payments: [{ status: "completed", amount: 300 }],
  });

  assert.equal(summary.revenue, 420);
  assert.equal(summary.rangeRevenue, 720);
  assert.equal(summary.ordersToday, 1);
  assert.equal(summary.ordersInRange, 2);
  assert.equal(summary.activeOrders, 1);
  assert.equal(summary.averageRating, 4.5);
  assert.equal(summary.topDishes[0].name, "Millet Masala Dosa");
  assert.deepEqual(summary.statusCounts, [
    { name: "pending", value: 1 },
    { name: "paid", value: 1 },
  ]);
  assert.deepEqual(summary.sourceCounts, [
    { source: "qr customer", orders: 1 },
    { source: "cashier", orders: 1 },
  ]);
  assert.equal(summary.dailyRevenue.length, 2);
});
