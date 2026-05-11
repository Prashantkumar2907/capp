import { expect, test } from "@playwright/test";

const branchId = "b0000000-0000-0000-0000-000000000099";
const reviewHeading = { name: /review and send order/i };

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

test("public QR payment sends one idempotent order request on duplicate clicks", async ({ page }) => {
  const orderId = "f0000000-0000-0000-0000-000000000099";
  const receiptToken = "receipt_token_123456789012";
  const submittedBodies: Array<Record<string, unknown>> = [];

  await page.addInitScript(
    ({ branchId: seededBranchId }) => {
      window.localStorage.setItem(
        "capp-cart-v2",
        JSON.stringify({
          state: {
            branchId: seededBranchId,
            tableNumber: 1,
            submissionKey: null,
            items: [
              {
                dish_id: "d0000000-0000-0000-0000-000000000001",
                dish_name: "Millet Masala Dosa",
                unit_price: 180,
                quantity: 1,
                image_url: null,
                is_veg: true,
              },
            ],
          },
          version: 0,
        })
      );
    },
    { branchId }
  );

  await page.route("**/api/public/menu**", async (route) => {
    await route.fulfill({ json: menuFixture });
  });

  await page.route("**/api/orders", async (route) => {
    submittedBodies.push(route.request().postDataJSON() as Record<string, unknown>);
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({ json: { ok: true, order: { id: orderId, receipt_token: receiptToken }, receiptToken, duplicate: false } });
  });

  await page.route("**/api/public/receipt**", async (route) => {
    await route.fulfill({
      json: {
        ok: true,
        order: {
          id: orderId,
          order_number: "MW-20260508-001",
          branch_id: branchId,
          table_number: 1,
          customer_name: null,
          customer_phone: null,
          client_request_id: submittedBodies[0]?.clientRequestId ?? null,
          waiter_id: null,
          order_type: "dine_in",
          order_source: "qr_customer",
          status: "pending",
          subtotal: 171.43,
          tax: 8.57,
          discount: 0,
          total: 180,
          notes: null,
          created_at: "2026-05-08T00:00:00.000Z",
          updated_at: "2026-05-08T00:00:00.000Z",
          order_items: [
            {
              id: "70000000-0000-0000-0000-000000000001",
              order_id: orderId,
              branch_id: branchId,
              dish_id: "d0000000-0000-0000-0000-000000000001",
              dish_name: "Millet Masala Dosa",
              quantity: 1,
              price_at_order: 180,
              notes: null,
              status: "pending",
              created_at: "2026-05-08T00:00:00.000Z",
              updated_at: "2026-05-08T00:00:00.000Z",
            },
          ],
          payments: [
            {
              id: "60000000-0000-0000-0000-000000000001",
              order_id: orderId,
              branch_id: branchId,
              amount: 180,
              method: "upi",
              status: "pending",
              transaction_id: null,
              provider_data: {},
              created_at: "2026-05-08T00:00:00.000Z",
              updated_at: "2026-05-08T00:00:00.000Z",
            },
          ],
          branches: {
            ...menuFixture.branch,
            org_id: "a0000000-0000-0000-0000-000000000099",
            phone: null,
            upi_vpa: "masala@upi",
            table_count: 12,
            is_active: true,
            settings: {},
            created_at: "2026-05-08T00:00:00.000Z",
            updated_at: "2026-05-08T00:00:00.000Z",
          },
        },
      },
    });
  });

  await page.goto(`/order/${branchId}/1/payment`);
  await expect(page.getByRole("heading", reviewHeading)).toBeVisible({ timeout: 15000 });
  await expect(page.getByLabel("Name optional")).toBeVisible();
  await expect(page.getByLabel("Phone optional")).toBeVisible();
  await expect(page.getByLabel("Order note")).toBeVisible();
  await expect(page.getByText("1 selected items")).toBeVisible();
  const placeOrder = page.getByRole("button", { name: /^place order$/i }).filter({ visible: true });
  await expect(placeOrder).toHaveCount(1);
  await expect(placeOrder).toBeEnabled();

  await placeOrder.dblclick();
  await expect(page).toHaveURL(new RegExp(`/receipt/${orderId}\\?token=${receiptToken}$`), { timeout: 15000 });

  expect(submittedBodies).toHaveLength(1);
  const submitted = submittedBodies[0];
  expect(submitted).toBeTruthy();
  expect(String(submitted?.clientRequestId)).toMatch(/^[a-z0-9:_-]{12,96}$/i);
  expect(submitted).not.toHaveProperty("customerName");
  expect(submitted).not.toHaveProperty("customerPhone");
  expect(submitted).not.toHaveProperty("notes");
  expect(JSON.stringify(submitted)).not.toContain("price_at_order");
  expect(JSON.stringify(submitted)).not.toContain("unit_price");
});

test("public QR payment reuses loaded menu metadata after menu navigation", async ({ page }) => {
  let menuCalls = 0;
  let metaCalls = 0;

  await page.route(/\/api\/public\/menu\/meta(?:\?|$)/, async (route) => {
    metaCalls += 1;
    await route.fulfill({ json: { branch: menuFixture.branch, table: menuFixture.table } });
  });
  await page.route(/\/api\/public\/menu(?:\?|$)/, async (route) => {
    menuCalls += 1;
    await route.fulfill({ json: menuFixture });
  });

  await page.goto(`/order/${branchId}/1`);
  await expect(page.getByText("Millet Masala Dosa")).toBeVisible();
  await page.getByRole("button", { name: /add millet masala dosa|add/i }).first().click();

  const desktopReview = page.getByRole("link", { name: /^review order$/i });
  const mobileReview = page.getByRole("link", { name: /review 1 items/i });
  if (await desktopReview.isVisible()) {
    await expect(desktopReview).toBeEnabled();
    await desktopReview.click();
  } else {
    await expect(mobileReview).toBeVisible();
    await mobileReview.click();
  }

  await expect(page).toHaveURL(new RegExp(`/order/${branchId}/1/payment$`), { timeout: 15000 });
  await expect(page.getByRole("heading", reviewHeading)).toBeVisible({ timeout: 15000 });

  expect(menuCalls).toBe(1);
  expect(metaCalls).toBe(0);
});

test("direct public QR payment uses lightweight metadata and one mobile submit action", async ({ page }) => {
  let menuCalls = 0;
  let metaCalls = 0;

  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(
    ({ branchId: seededBranchId }) => {
      window.localStorage.setItem(
        "capp-cart-v2",
        JSON.stringify({
          state: {
            branchId: seededBranchId,
            tableNumber: 1,
            submissionKey: null,
            items: [
              {
                dish_id: "d0000000-0000-0000-0000-000000000001",
                dish_name: "Millet Masala Dosa",
                unit_price: 180,
                quantity: 1,
                image_url: null,
                is_veg: true,
              },
            ],
          },
          version: 0,
        })
      );
    },
    { branchId }
  );

  await page.route(/\/api\/public\/menu\/meta(?:\?|$)/, async (route) => {
    metaCalls += 1;
    await route.fulfill({ json: { branch: menuFixture.branch, table: menuFixture.table } });
  });
  await page.route(/\/api\/public\/menu(?:\?|$)/, async (route) => {
    menuCalls += 1;
    await route.fulfill({ json: menuFixture });
  });

  await page.goto(`/order/${branchId}/1/payment`);
  await expect(page.getByRole("heading", reviewHeading)).toBeVisible({ timeout: 15000 });
  await expect.poll(() => metaCalls).toBe(1);
  await expect(page.getByLabel("Name optional")).toBeVisible();
  await expect(page.getByLabel("Phone optional")).toBeVisible();
  await expect(page.getByLabel("Order note")).toBeVisible();
  await page.getByLabel("Name optional").fill("A".repeat(120));
  await page.getByLabel("Phone optional").fill("9".repeat(80));
  const longOrderNote = "Kitchen note ".repeat(60);
  await page.getByLabel("Order note").fill(longOrderNote);
  await expect(page.getByLabel("Name optional")).toHaveValue("A".repeat(80));
  await expect(page.getByLabel("Phone optional")).toHaveValue("9".repeat(24));
  await expect(page.getByLabel("Order note")).toHaveValue(longOrderNote.slice(0, 500));
  await expect(page.getByRole("button", { name: /^place order$/i })).toHaveCount(1);

  expect(menuCalls).toBe(0);
  expect(metaCalls).toBe(1);
});
