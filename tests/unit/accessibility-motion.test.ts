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

test("light theme status and action colors keep accessible contrast", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  const rootTheme = css.match(/:root\s*{([\s\S]*?)\n}/)?.[1] ?? "";
  const colors = Object.fromEntries(
    [...rootTheme.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/gi)].map((match) => [match[1], match[2]])
  );

  assert.ok(contrast(colors.primary, colors["primary-foreground"]) >= 4.5);
  assert.ok(contrast(colors.primary, "#dfece6") >= 4.5);
  assert.ok(contrast(colors.success, colors.secondary) >= 4.5);
  assert.ok(contrast(colors["muted-foreground"], colors.secondary) >= 4.5);
});

function contrast(foreground: string, background: string) {
  const fg = relativeLuminance(foreground);
  const bg = relativeLuminance(background);
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
}

function relativeLuminance(color: string) {
  const [red, green, blue] = color
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => {
      const value = Number.parseInt(channel, 16) / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
