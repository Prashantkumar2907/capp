import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rls = readFileSync("supabase/03_rls.sql", "utf8");
const functions = readFileSync("supabase/02_functions.sql", "utf8");
const storage = readFileSync("supabase/04_storage_realtime.sql", "utf8");

test("anonymous clients cannot directly read or write order/payment tables", () => {
  [
    "orders_select_public",
    "orders_insert_public",
    "order_items_select_public",
    "order_items_insert_public",
    "payments_select_public",
    "payments_insert_public",
    "feedback_insert_public",
  ].forEach((policyName) => assert.equal(rls.includes(policyName), false, `${policyName} should not be present`));

  assert.doesNotMatch(rls, /on (orders|order_items|payments|feedback)[\s\S]{0,120}using \(true\)/);
  assert.doesNotMatch(rls, /on (orders|order_items|payments|feedback)[\s\S]{0,120}with check \(true\)/);
});

test("security-definer RLS helpers pin their search path", () => {
  ["app_user_org_id", "app_user_branch_id", "app_user_role", "app_branch_org_id", "app_user_can_manage_branch", "create_order_with_items"].forEach((name) => {
    const start = functions.indexOf(`create or replace function ${name}`);
    assert.notEqual(start, -1, `${name} should exist`);
    const nextFunction = functions.indexOf("create or replace function", start + 1);
    const source = functions.slice(start, nextFunction === -1 ? undefined : nextFunction);
    assert.match(source, /security definer/);
    assert.match(source, /set search_path = public, auth/);
  });
});

test("trusted order creation RPC is not executable by browser roles", () => {
  assert.match(functions, /revoke all on function create_order_with_items[\s\S]*from public/);
  assert.match(functions, /grant execute on function create_order_with_items[\s\S]*to service_role/);
});

test("dish image writes are limited to menu-management roles", () => {
  assert.match(storage, /dish_images_insert[\s\S]*app_user_role\(\) in \('owner','admin','manager'\)/);
  assert.match(storage, /dish_images_update[\s\S]*app_user_role\(\) in \('owner','admin','manager'\)/);
  assert.match(storage, /dish_images_delete[\s\S]*app_user_role\(\) in \('owner','admin','manager'\)/);
});

test("platform admin tables do not expose broad client-side policies", () => {
  assert.match(rls, /alter table platform_admins enable row level security/);
  assert.match(rls, /alter table subscription_grants enable row level security/);
  assert.match(rls, /platform_admins_select_self/);
  assert.doesNotMatch(rls, /on subscription_grants[\s\S]{0,120}using \(true\)/);
  assert.doesNotMatch(rls, /on subscription_grants[\s\S]{0,120}with check \(true\)/);
});
