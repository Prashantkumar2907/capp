import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("root layout and CSS declare reduced-motion behavior", () => {
  const layout = readFileSync("src/app/layout.tsx", "utf8");
  const css = readFileSync("src/app/globals.css", "utf8");

  assert.match(layout, /data-scroll-behavior="smooth"/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /scroll-behavior: auto/);
  assert.match(css, /overscroll-behavior: none/);
  assert.match(css, /\.scrollable-inner[\s\S]*overscroll-behavior: contain/);
  assert.match(css, /\.skeleton-shine[\s\S]*animation: none/);
});

test("dialog primitive exposes modal focus and labeling hooks", () => {
  const dialog = readFileSync("src/components/ui/dialog.tsx", "utf8");

  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /aria-labelledby/);
  assert.match(dialog, /event\.key === "Escape"/);
  assert.match(dialog, /getFocusable/);
});
