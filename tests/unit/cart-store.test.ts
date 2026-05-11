import assert from "node:assert/strict";
import test from "node:test";
import { parseStoredCartSnapshot } from "../../src/stores/cart-store";

test("stored cart parser recovers bounded persisted QR cart intent", () => {
  const snapshot = parseStoredCartSnapshot(
    JSON.stringify({
      state: {
        branchId: "b0000000-0000-0000-0000-000000000099",
        tableNumber: "1",
        submissionKey: "qr_order_123456",
        items: [
          {
            dish_id: "d0000000-0000-0000-0000-000000000001",
            dish_name: "Millet Masala Dosa",
            unit_price: "180",
            quantity: 2,
            notes: "Less spicy",
            image_url: null,
            is_veg: true,
          },
        ],
      },
      version: 0,
    })
  );

  assert.equal(snapshot?.branchId, "b0000000-0000-0000-0000-000000000099");
  assert.equal(snapshot?.tableNumber, 1);
  assert.equal(snapshot?.items.length, 1);
  assert.equal(snapshot?.items[0]?.unit_price, 180);
  assert.equal(snapshot?.items[0]?.quantity, 2);
});

test("stored cart parser drops malformed item intent", () => {
  const snapshot = parseStoredCartSnapshot(
    JSON.stringify({
      state: {
        branchId: "b0000000-0000-0000-0000-000000000099",
        tableNumber: 1,
        items: [
          { dish_id: "missing-name", unit_price: 100, quantity: 1 },
          { dish_id: "bad-qty", dish_name: "Bad quantity", unit_price: 100, quantity: 0 },
        ],
      },
      version: 0,
    })
  );

  assert.equal(snapshot?.items.length, 0);
});
