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
