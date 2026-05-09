import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { orderStatuses, roles } from "../../src/lib/constants";

const seedSql = readFileSync("supabase/05_seed_demo.sql", "utf8");

test("demo seed covers required restaurant personas", () => {
  for (const name of ["Lotus Tea Room", "Masala Works", "Harbour Spice Group", "Night Owl Bowls"]) {
    assert.match(seedSql, new RegExp(name));
  }

  for (const type of ["tea_shop", "casual_dining", "multi_branch", "cloud_kitchen"]) {
    assert.match(seedSql, new RegExp(type));
  }
});

test("demo seed covers every staff role with fake local emails", () => {
  for (const role of roles) {
    assert.match(seedSql, new RegExp(`'${role}'`));
  }

  assert.match(seedSql, /demo\.capp\.local/);
});

test("demo seed bootstraps a platform admin and subscription grant history", () => {
  assert.match(seedSql, /insert into platform_admins/);
  assert.match(seedSql, /admin@example\.com/);
  assert.match(seedSql, /insert into subscription_grants/);
});

test("demo seed keeps UUIDs database-valid and order statuses centralized", () => {
  const uuidLikeValues = seedSql.match(/'[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}'/gi) ?? [];
  const invalidUuidValues = uuidLikeValues.filter((value) => !/^'[0-9a-f-]+'$/i.test(value));
  assert.deepEqual(invalidUuidValues, []);

  for (const status of ["paid", "failed", "refunded"]) {
    assert.equal((orderStatuses as readonly string[]).includes(status), true);
  }
});

test("demo seed provides stable dish media placeholders", () => {
  const mediaCount = (seedSql.match(/https:\/\/placehold\.co\/640x480\/png\?text=/g) ?? []).length;
  assert.ok(mediaCount >= 12);
});
