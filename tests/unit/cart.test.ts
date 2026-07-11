import assert from "node:assert/strict";
import test from "node:test";
import { cartLineId, lineUnitTotal, useCartStore } from "../../src/stores/cart-store";

test("cartLineId separates variant and addon combinations of the same dish", () => {
  const plain = cartLineId("dish-1");
  const half = cartLineId("dish-1", "variant-half");
  const full = cartLineId("dish-1", "variant-full");
  const fullWithAddons = cartLineId("dish-1", "variant-full", ["addon-a", "addon-b"]);

  assert.notEqual(plain, half);
  assert.notEqual(half, full);
  assert.notEqual(full, fullWithAddons);
  // addon order must not matter — same selection, same line
  assert.equal(cartLineId("dish-1", "variant-full", ["addon-b", "addon-a"]), fullWithAddons);
});

test("lineUnitTotal adds per-unit addon total to the unit price", () => {
  assert.equal(lineUnitTotal({ unit_price: 150, addon_total: 30 }), 180);
  assert.equal(lineUnitTotal({ unit_price: 220, addon_total: undefined }), 220);
});

test("cart keeps Half and Full plates of the same dish as separate lines", () => {
  const store = useCartStore.getState();
  store.clear();

  store.addItem({ dish_id: "paneer", dish_name: "Paneer", unit_price: 150, variant_id: "half", variant_name: "Half" });
  store.addItem({ dish_id: "paneer", dish_name: "Paneer", unit_price: 280, variant_id: "full", variant_name: "Full" });
  store.addItem({ dish_id: "paneer", dish_name: "Paneer", unit_price: 150, variant_id: "half", variant_name: "Half" });

  const { items } = useCartStore.getState();
  assert.equal(items.length, 2);
  assert.equal(items.find((item) => item.variant_id === "half")?.quantity, 2);
  assert.equal(items.find((item) => item.variant_id === "full")?.quantity, 1);
  assert.equal(useCartStore.getState().dishQuantity("paneer"), 3);
  // subtotal: 2*150 + 1*280 = 580
  assert.equal(useCartStore.getState().subtotal(), 580);
  useCartStore.getState().clear();
});

test("cart subtotal includes addon totals per unit", () => {
  const store = useCartStore.getState();
  store.clear();
  store.addItem({
    dish_id: "paneer",
    dish_name: "Paneer",
    unit_price: 150,
    variant_id: "half",
    addon_ids: ["butter"],
    addon_names: ["Extra Butter"],
    addon_total: 30,
    quantity: 2,
  });
  // 2 * (150 + 30) = 360 — must match create_order() server math
  assert.equal(useCartStore.getState().subtotal(), 360);
  useCartStore.getState().clear();
});
