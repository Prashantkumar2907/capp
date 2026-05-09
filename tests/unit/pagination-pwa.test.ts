import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("operational list pages use shared pagination", () => {
  [
    "src/app/(dashboard)/dashboard/orders/page.tsx",
    "src/app/(dashboard)/dashboard/payments/page.tsx",
    "src/app/(dashboard)/dashboard/staff/page.tsx",
    "src/app/(dashboard)/dashboard/menu/page.tsx",
  ].forEach((path) => {
    const source = readFileSync(path, "utf8");
    assert.match(source, /usePagination/);
    assert.match(source, /<Pagination/);
    assert.match(source, /pageItems\.map/);
  });
});

test("pagination primitive exposes accessible page controls and page size", () => {
  const source = readFileSync("src/components/ui/pagination.tsx", "utf8");

  assert.match(source, /aria-label="Pagination"/);
  assert.match(source, /aria-label="Rows per page"/);
  assert.match(source, /aria-label="Next page"/);
  assert.match(source, /aria-label="Previous page"/);
});

test("pwa manifest, service worker, and install prompt are wired into the shell", () => {
  [
    "src/app/manifest.ts",
    "public/sw.js",
    "public/offline.html",
    "public/icons/capp-icon.svg",
    "public/icons/capp-maskable.svg",
  ].forEach((path) => assert.equal(existsSync(path), true, `${path} should exist`));

  const layout = readFileSync("src/app/layout.tsx", "utf8");
  const shell = readFileSync("src/components/layouts/dashboard-shell.tsx", "utf8");
  const prompt = readFileSync("src/components/shared/pwa-install-prompt.tsx", "utf8");
  const manifest = readFileSync("src/app/manifest.ts", "utf8");
  const worker = readFileSync("public/sw.js", "utf8");
  const proxy = readFileSync("src/proxy.ts", "utf8");

  assert.match(layout, /manifest: "\/manifest\.webmanifest"/);
  assert.match(layout, /appleWebApp/);
  assert.match(shell, /<PwaInstallPrompt \/>/);
  assert.match(prompt, /beforeinstallprompt/);
  assert.match(prompt, /iphone\|ipad\|ipod/i);
  assert.match(prompt, /Add to Home Screen/);
  assert.match(prompt, /!navigator\.webdriver/);
  assert.match(prompt, /navigator\.serviceWorker\.register\("\/sw\.js"\)/);
  assert.match(manifest, /display: "standalone"/);
  assert.match(manifest, /purpose: "maskable"/);
  assert.match(worker, /\/api\//);
  assert.match(worker, /offline\.html/);
  assert.match(proxy, /manifest\.webmanifest/);
  assert.match(proxy, /sw\.js/);
  assert.match(proxy, /offline\.html/);
});
