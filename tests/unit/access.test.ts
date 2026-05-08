import assert from "node:assert/strict";
import test from "node:test";
import { roleAccess, roles, type Role } from "../../src/lib/constants";
import { requireStaffRole } from "../../src/lib/supabase/permissions";
import type { Staff } from "../../src/types/database";

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

test("shared staff role guard supports feature-specific server boundaries", () => {
  const staff = { role: "manager" } as Staff;
  assert.equal(requireStaffRole(staff, ["owner", "admin", "manager"]).ok, true);
  const denied = requireStaffRole(staff, ["owner", "admin"], "Owner or admin access is required");
  assert.equal(denied.ok, false);
  if (!denied.ok) {
    assert.equal(denied.status, 403);
    assert.equal(denied.code, "ROLE_FORBIDDEN");
  }
});
