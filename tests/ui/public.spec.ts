import { expect, test } from "@playwright/test";

test("landing page presents the product and primary auth actions", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /restaurant operating system/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /start your restaurant/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible();
});

test("auth page keeps form controls accessible", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});
