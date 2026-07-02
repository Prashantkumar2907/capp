import assert from "node:assert/strict";
import test from "node:test";
import { roleAccess, roles, type Role } from "../../src/lib/constants";

test("every role can reach the dashboard and settings", () => {
  assert.deepEqual(roleAccess.dashboard, roles);
  assert.deepEqual(roleAccess.settings, roles);
});

test("kitchen and waiter roles stay focused", () => {
  assert.equal((roleAccess.kitchen as readonly Role[]).includes("kitchen"), true);
  assert.equal((roleAccess.kitchen as readonly Role[]).includes("waiter"), false);
  assert.equal((roleAccess.waiter as readonly Role[]).includes("waiter"), true);
  assert.equal((roleAccess.payments as readonly Role[]).includes("kitchen"), false);
});
