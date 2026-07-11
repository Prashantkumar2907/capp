import assert from "node:assert/strict";
import test from "node:test";
import { calculateTotals, formatCurrency, initials, slugify, upiLink } from "../../src/lib/utils";

test("calculateTotals handles tax-inclusive restaurant pricing", () => {
  const total = calculateTotals(105, 5, true);
  assert.equal(total.subtotal, 100);
  assert.equal(total.tax, 5);
  assert.equal(total.total, 105);
});

test("calculateTotals handles tax-exclusive restaurant pricing", () => {
  const total = calculateTotals(100, 5, false);
  assert.equal(total.subtotal, 100);
  assert.equal(total.tax, 5);
  assert.equal(total.total, 105);
});

test("utility formatting keeps restaurant UI predictable", () => {
  assert.equal(slugify("Spice Garden Cafe!"), "spice-garden-cafe");
  assert.equal(initials("Prashant Kumar"), "PK");
  assert.equal(formatCurrency(499), "\u20b9499");
  assert.match(upiLink({ vpa: "merchant@upi", amount: 250, reference: "ORD-1", merchant: "CAPP" }), /^upi:\/\/pay\?/);
});

test("calculateTotals applies service charge before GST (exclusive)", () => {
  // 200 + 10% SC = 220, GST 5% on 220 = 11, total 231
  const totals = calculateTotals(200, 5, false, 0, { serviceChargePercent: 10 });
  assert.equal(totals.subtotal, 200);
  assert.equal(totals.serviceCharge, 20);
  assert.equal(totals.tax, 11);
  assert.equal(totals.total, 231);
});

test("calculateTotals inclusive pricing: printed parts always sum to total", () => {
  const totals = calculateTotals(200, 5, true, 0, { serviceChargePercent: 10 });
  assert.equal(totals.subtotal + totals.serviceCharge + totals.tax, totals.total);
});

test("calculateTotals composition scheme charges no GST but keeps service charge", () => {
  const totals = calculateTotals(200, 5, false, 0, { serviceChargePercent: 10, composition: true });
  assert.equal(totals.tax, 0);
  assert.equal(totals.serviceCharge, 20);
  assert.equal(totals.total, 220);
});

test("dailySummaryMessage builds a readable owner recap", async () => {
  const { dailySummaryMessage } = await import("../../src/lib/notify-whatsapp");
  const message = dailySummaryMessage({ restaurantName: "Spice Garden", date: "11 Jul", revenue: 18400, orders: 47, topDish: "Paneer Butter Masala", avgRating: 4.6 });
  assert.match(message, /Spice Garden/);
  assert.match(message, /₹18,400/);
  assert.match(message, /Orders: 47/);
  assert.match(message, /Paneer Butter Masala/);
  assert.match(message, /4\.6/);
});

test("dailySummaryMessage omits missing optional lines", async () => {
  const { dailySummaryMessage } = await import("../../src/lib/notify-whatsapp");
  const message = dailySummaryMessage({ restaurantName: "Dhaba", date: "11 Jul", revenue: 500, orders: 3 });
  assert.doesNotMatch(message, /Top dish/);
  assert.doesNotMatch(message, /Rating/);
});
