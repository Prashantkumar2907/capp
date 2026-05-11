import assert from "node:assert/strict";
import test from "node:test";
import { createOrderSchema, publicReceiptQuerySchema } from "../../src/lib/validation/schemas";

test("createOrderSchema strips client-supplied dish names and prices", () => {
  const payload = createOrderSchema.parse({
    branchId: "b0000000-0000-0000-0000-000000000099",
    tableNumber: 1,
    orderSource: "qr_customer",
    orderType: "dine_in",
    items: [
      {
        dish_id: "d0000000-0000-0000-0000-000000000001",
        dish_name: "Free biryani",
        price_at_order: 1,
        quantity: 2,
      },
    ],
  });

  assert.equal("dish_name" in payload.items[0], false);
  assert.equal("price_at_order" in payload.items[0], false);
  assert.equal(payload.items[0].quantity, 2);
});

test("createOrderSchema requires QR customer orders to submit bounded quantities", () => {
  const parsed = createOrderSchema.safeParse({
    branchId: "b0000000-0000-0000-0000-000000000099",
    tableNumber: 1,
    items: [{ dish_id: "d0000000-0000-0000-0000-000000000001", quantity: 51 }],
  });

  assert.equal(parsed.success, false);
});

test("createOrderSchema accepts bounded idempotency keys and rejects unsafe characters", () => {
  const parsed = createOrderSchema.parse({
    branchId: "b0000000-0000-0000-0000-000000000099",
    tableNumber: 1,
    clientRequestId: "qr_20260508_table_1",
    items: [{ dish_id: "d0000000-0000-0000-0000-000000000001", quantity: 1 }],
  });

  assert.equal(parsed.clientRequestId, "qr_20260508_table_1");

  const unsafe = createOrderSchema.safeParse({
    branchId: "b0000000-0000-0000-0000-000000000099",
    tableNumber: 1,
    clientRequestId: "table 1 / retry",
    items: [{ dish_id: "d0000000-0000-0000-0000-000000000001", quantity: 1 }],
  });

  assert.equal(unsafe.success, false);
});

test("createOrderSchema strips client-supplied waiter identity", () => {
  const payload = createOrderSchema.parse({
    branchId: "b0000000-0000-0000-0000-000000000099",
    tableNumber: 1,
    clientRequestId: "waiter:b0000000-0000-0000-0000-000000000099:retry01",
    orderSource: "waiter",
    waiterId: "50000000-0000-0000-0000-000000000004",
    items: [{ dish_id: "d0000000-0000-0000-0000-000000000001", quantity: 1 }],
  });

  assert.equal("waiterId" in payload, false);
  assert.equal(payload.clientRequestId?.startsWith("waiter:"), true);
});

test("publicReceiptQuerySchema requires a bounded secure receipt token", () => {
  const parsed = publicReceiptQuerySchema.parse({
    orderId: "f0000000-0000-0000-0000-000000000099",
    token: "receipt_token_123456789012",
  });

  assert.equal(parsed.token, "receipt_token_123456789012");

  const missing = publicReceiptQuerySchema.safeParse({
    orderId: "f0000000-0000-0000-0000-000000000099",
  });
  const unsafe = publicReceiptQuerySchema.safeParse({
    orderId: "f0000000-0000-0000-0000-000000000099",
    token: "bad token with spaces",
  });

  assert.equal(missing.success, false);
  assert.equal(unsafe.success, false);
});
