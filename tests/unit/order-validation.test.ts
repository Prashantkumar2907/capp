import assert from "node:assert/strict";
import test from "node:test";
import { createOrderSchema } from "../../src/lib/validation/schemas";

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
