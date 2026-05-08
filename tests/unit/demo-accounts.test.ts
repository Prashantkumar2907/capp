import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const script = readFileSync("scripts/demo-accounts.mjs", "utf8");
const docs = readFileSync("docs/demo-data.md", "utf8");

test("demo auth account script only targets fake demo domain users", () => {
  assert.match(script, /demo\.capp\.local/);
  assert.match(script, /owner\.lotus@demo\.capp\.local/);
  assert.match(script, /cashier\.nightowl@demo\.capp\.local/);
  assert.doesNotMatch(script, /gmail\.com|yahoo\.com|outlook\.com/);
});

test("demo auth account script supports create and remove without printing passwords", () => {
  assert.match(script, /--create/);
  assert.match(script, /--remove/);
  assert.match(script, /DEMO_ACCOUNT_PASSWORD/);
  assert.match(script, /ALLOW_DEMO_ACCOUNT_MUTATION/);
  const logLines = script.split("\n").filter((line) => line.includes("console.log"));
  assert.equal(logLines.some((line) => line.includes("demoPassword")), false);
  assert.match(docs, /ALLOW_DEMO_ACCOUNT_MUTATION=1 npm run demo:accounts -- --remove/);
});
