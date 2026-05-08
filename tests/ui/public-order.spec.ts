import { expect, test } from "@playwright/test";

const branchId = "b0000000-0000-0000-0000-000000000099";

const menuFixture = {
  branch: {
    id: branchId,
    name: "Indiranagar",
    address: "12 Market Road",
    city: "Bengaluru",
    organizations: { name: "Masala Works", default_tax_percent: 5, tax_inclusive: true },
  },
  table: {
    id: "e0000000-0000-0000-0000-000000000001",
    branch_id: branchId,
    table_number: 1,
    label: "Window 1",
    capacity: 4,
    status: "available",
    qr_code_url: null,
    is_active: true,
    created_at: "2026-05-08T00:00:00.000Z",
  },
  categories: [
    { id: "c0000000-0000-0000-0000-000000000001", org_id: "a0000000-0000-0000-0000-000000000099", name: "Breakfast", sort_order: 1, is_active: true, created_at: "2026-05-08T00:00:00.000Z" },
    { id: "c0000000-0000-0000-0000-000000000002", org_id: "a0000000-0000-0000-0000-000000000099", name: "Beverages", sort_order: 2, is_active: true, created_at: "2026-05-08T00:00:00.000Z" },
  ],
  dishes: [
    {
      id: "d0000000-0000-0000-0000-000000000001",
      org_id: "a0000000-0000-0000-0000-000000000099",
      category_id: "c0000000-0000-0000-0000-000000000001",
      name: "Millet Masala Dosa",
      description: "Crisp millet dosa with potato masala and chutneys",
      price: 180,
      image_url: null,
      is_veg: true,
      is_active: true,
      tags: ["breakfast", "popular"],
      prep_time_mins: 12,
      created_at: "2026-05-08T00:00:00.000Z",
      updated_at: "2026-05-08T00:00:00.000Z",
      categories: { name: "Breakfast" },
      branch_dishes: [],
    },
    {
      id: "d0000000-0000-0000-0000-000000000002",
      org_id: "a0000000-0000-0000-0000-000000000099",
      category_id: "c0000000-0000-0000-0000-000000000002",
      name: "Filter Coffee Flask",
      description: "Strong house blend served for two",
      price: 140,
      image_url: null,
      is_veg: true,
      is_active: true,
      tags: ["beverage"],
      prep_time_mins: 5,
      created_at: "2026-05-08T00:00:00.000Z",
      updated_at: "2026-05-08T00:00:00.000Z",
      categories: { name: "Beverages" },
      branch_dishes: [],
    },
  ],
};

test("public QR ordering replaces skeletons with responsive menu content", async ({ page }) => {
  let releaseMenu: () => void = () => undefined;
  const menuReady = new Promise<void>((resolve) => {
    releaseMenu = resolve;
  });

  await page.route("**/api/public/menu**", async (route) => {
    await menuReady;
    await route.fulfill({ json: menuFixture });
  });

  await page.goto(`/order/${branchId}/1`);
  await expect(page.locator(".skeleton-shine").first()).toBeVisible();

  releaseMenu();

  await expect(page.getByRole("heading", { name: /order at your table/i })).toBeVisible();
  await expect(page.getByText("Millet Masala Dosa")).toBeVisible();
  await expect(page.getByRole("button", { name: /add millet masala dosa|add/i }).first()).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasHorizontalOverflow).toBe(false);
});
