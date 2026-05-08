import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dishImage = readFileSync("src/components/features/menu/dish-image.tsx", "utf8");
const dishTile = readFileSync("src/components/features/menu/dish-tile.tsx", "utf8");
const menuPage = readFileSync("src/app/(dashboard)/dashboard/menu/page.tsx", "utf8");

test("dish media uses accessible lazy images with fallback behavior", () => {
  assert.match(dishImage, /alt=\{alt\}/);
  assert.match(dishImage, /loading="lazy"/);
  assert.match(dishImage, /decoding="async"/);
  assert.match(dishImage, /onError=\{\(\) => setFailed\(true\)\}/);
  assert.match(dishImage, /image unavailable/);
});

test("menu surfaces share the resilient dish image primitive", () => {
  assert.match(dishTile, /<DishImage/);
  assert.match(dishTile, /aria-label=\{`Add \$\{dish\.name\}`\}/);
  assert.match(menuPage, /<DishImage/);
});
