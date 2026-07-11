import assert from "node:assert/strict";
import test from "node:test";
import { effectiveState, canGrow, plans } from "../../src/stores/../lib/plans";

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

test("trial with days left is trial with full pro access", () => {
  const state = effectiveState({ plan: "starter", status: "trial", trial_ends_at: daysFromNow(10) });
  assert.equal(state.effective, "trial");
  assert.equal(state.plan, "pro");
  assert.equal(canGrow(state.effective), true);
});

test("trial just past end falls into grace, then expired", () => {
  const grace = effectiveState({ plan: "starter", status: "trial", trial_ends_at: daysFromNow(-2) });
  assert.equal(grace.effective, "grace");
  const expired = effectiveState({ plan: "starter", status: "trial", trial_ends_at: daysFromNow(-30) });
  assert.equal(expired.effective, "expired");
  assert.equal(canGrow(expired.effective), false);
});

test("active subscription within period is active on its own plan", () => {
  const state = effectiveState({ plan: "growth", status: "active", current_period_end: daysFromNow(20) });
  assert.equal(state.effective, "active");
  assert.equal(state.plan, "growth");
});

test("past_due inside grace still grows; cancelled never does", () => {
  const grace = effectiveState({ plan: "growth", status: "past_due", current_period_end: daysFromNow(-1) });
  assert.equal(grace.effective, "grace");
  assert.equal(canGrow(grace.effective), true);
  const cancelled = effectiveState({ plan: "growth", status: "cancelled" });
  assert.equal(cancelled.effective, "expired");
});

test("missing subscription row is treated as expired starter", () => {
  const state = effectiveState(null);
  assert.equal(state.effective, "expired");
  assert.equal(state.plan, "starter");
});

test("plan limits are consistent with DB plan_branch_limit()", () => {
  assert.equal(plans.starter.maxBranches, 1);
  assert.equal(plans.growth.maxBranches, 3);
  assert.equal(plans.pro.maxBranches, Number.POSITIVE_INFINITY);
});
