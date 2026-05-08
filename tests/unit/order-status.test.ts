import assert from "node:assert/strict";
import test from "node:test";
import { itemStatusForOrderStatus, orderStatusTransitionIssue } from "../../src/lib/supabase/order-status";

test("kitchen role can progress active tickets but cannot cancel accepted tickets", () => {
  assert.equal(orderStatusTransitionIssue("pending", "confirmed", "kitchen"), null);
  assert.equal(orderStatusTransitionIssue("confirmed", "preparing", "kitchen"), null);
  assert.equal(orderStatusTransitionIssue("preparing", "ready", "kitchen"), null);
  assert.equal(orderStatusTransitionIssue("confirmed", "cancelled", "kitchen"), "This role cannot cancel the order at its current stage");
});

test("waiter can serve ready orders and only cancel pending orders", () => {
  assert.equal(orderStatusTransitionIssue("ready", "served", "waiter"), null);
  assert.equal(orderStatusTransitionIssue("pending", "cancelled", "waiter"), null);
  assert.equal(orderStatusTransitionIssue("ready", "cancelled", "waiter"), "This role cannot cancel the order at its current stage");
});

test("terminal order statuses cannot be changed from the order board", () => {
  assert.match(orderStatusTransitionIssue("paid", "cancelled", "manager") ?? "", /cannot move/i);
  assert.match(orderStatusTransitionIssue("refunded", "cancelled", "owner") ?? "", /cannot move/i);
});

test("order item status is derived from trusted order status server-side", () => {
  assert.equal(itemStatusForOrderStatus("confirmed"), "accepted");
  assert.equal(itemStatusForOrderStatus("preparing"), "preparing");
  assert.equal(itemStatusForOrderStatus("ready"), "ready");
  assert.equal(itemStatusForOrderStatus("served"), "served");
  assert.equal(itemStatusForOrderStatus("cancelled"), "cancelled");
});
