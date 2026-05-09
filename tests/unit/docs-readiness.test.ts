import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("production operations docs cover release-critical setup topics", () => {
  [
    "README.md",
    "docs/env-vars.md",
    "docs/deployment.md",
    "docs/runbooks/operations.md",
    "docs/architecture/file-structure.md",
    "docs/supabase-setup.md",
    "docs/demo-data.md",
    "docs/razorpay-setup.md",
    "docs/google-oauth.md",
    "docs/testing-plan.md",
    "docs/performance.md",
    "docs/product-understanding.md",
    "docs/.llm-skills/auth-pattern.md",
    "docs/.llm-skills/db-access.md",
    "docs/.llm-skills/platform-admin.md",
    "docs/.llm-skills/ui-components.md",
  ].forEach((path) => assert.equal(existsSync(path), true, `${path} should exist`));

  const docs = [
    readFileSync("README.md", "utf8"),
    readFileSync("docs/env-vars.md", "utf8"),
    readFileSync("docs/deployment.md", "utf8"),
    readFileSync("docs/runbooks/operations.md", "utf8"),
  ].join("\n");

  [
    "SUPABASE_SERVICE_ROLE_KEY",
    "PLATFORM_ADMIN_EMAILS",
    "RAZORPAY_WEBHOOK_SECRET",
    "Migration Order",
    "Rollback",
    "Supabase Storage",
    "Payment Incident Triage",
    "Slow Query Triage",
  ].forEach((topic) => assert.equal(docs.includes(topic), true, `${topic} should be documented`));
});
