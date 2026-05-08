import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const waiterPage = readFileSync("src/app/(dashboard)/dashboard/waiter/page.tsx", "utf8");

test("waiter POS sends trusted idempotency keys without client waiter identity", () => {
  assert.match(waiterPage, /clientRequestId: requestIdRef\.current/);
  assert.match(waiterPage, /waiter:\$\{branch!\.id\}:\$\{crypto\.randomUUID\(\)\}/);
  assert.doesNotMatch(waiterPage, /waiterId/);
});

test("waiter POS guards duplicate clicks while a create mutation is in flight", () => {
  assert.match(waiterPage, /submittingRef\.current/);
  assert.match(waiterPage, /createOrder\.isPending/);
  assert.match(waiterPage, /onSubmit=\{submitOrder\}/);
});
