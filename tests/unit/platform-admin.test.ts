import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("platform admin console has route-level loading and recovery states", () => {
  assert.equal(existsSync("src/app/admin/page.tsx"), true);
  assert.equal(existsSync("src/app/admin/loading.tsx"), true);
  assert.equal(existsSync("src/app/admin/error.tsx"), true);

  const page = readFileSync("src/app/admin/page.tsx", "utf8");
  assert.match(page, /Platform admin/);
  assert.match(page, /EmptyState/);
  assert.match(page, /AdminSkeleton/);
  assert.match(page, /Grant subscription/);
  assert.match(page, /Onboard client/);
});

test("platform admin services use a separate authorization and audit path", () => {
  const service = readFileSync("src/lib/supabase/platform-admin.ts", "utf8");
  assert.match(service, /requirePlatformAdmin/);
  assert.match(service, /platform_admins/);
  assert.match(service, /subscription_grants/);
  assert.match(service, /auth\.admin\.listUsers/);
  assert.doesNotMatch(service, /requireOwnerOrAdmin/);
});

test("platform API routes keep mutation validation at the boundary", () => {
  [
    "src/app/api/platform/clients/route.ts",
    "src/app/api/platform/subscriptions/grant/route.ts",
  ].forEach((path) => {
    const source = readFileSync(path, "utf8");
    assert.match(source, /safeParse/);
    assert.match(source, /apiValidationError/);
    assert.match(source, /apiOk/);
  });
});
