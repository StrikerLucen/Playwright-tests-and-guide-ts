/**
 * PRODUCT LISTING TESTS — e2e/products.spec.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Patterns demonstrated in this file:
 *
 *   1. `authenticatedPage` fixture: logs in once before each test,
 *      so these tests never touch the login form — they start on inventory.
 *
 *   2. beforeEach for shared navigation: all tests in this suite need to be
 *      on the inventory page, so navigation lives in beforeEach rather than
 *      duplicated inside each test body.
 *
 *   3. Data-driven assertions: sort tests compare the actual DOM order
 *      against a freshly computed sorted array — they don't hardcode
 *      expected product names, so they stay valid if SauceDemo adds products.
 *
 *   4. Spread + sort: [...names].sort() creates a *copy* before sorting to
 *      avoid mutating the original array, then we compare the two.
 */
import { test, expect } from "../../fixtures/base.fixture";
import { InventoryPage } from "../../pages/InventoryPage";

test.describe("Product Listing", () => {
  // beforeEach runs after the `authenticatedPage` fixture sets up auth,
  // so by the time each test body runs the browser is on /inventory.html.
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/inventory.html");
  });

  // ── Sorting ───────────────────────────────────────────────────────────────

  test("products sort A-Z", async ({ authenticatedPage }) => {
    const inventoryPage = new InventoryPage(authenticatedPage);
    await inventoryPage.sortBy("az");

    const names  = await inventoryPage.getProductNames();
    const sorted = [...names].sort(); // JS default sort is lexicographic (A-Z)
    expect(names).toEqual(sorted);
  });

  test("products sort Z-A", async ({ authenticatedPage }) => {
    const inventoryPage = new InventoryPage(authenticatedPage);
    await inventoryPage.sortBy("za");

    const names  = await inventoryPage.getProductNames();
    const sorted = [...names].sort().reverse();
    expect(names).toEqual(sorted);
  });

  test("products sort price low to high", async ({ authenticatedPage }) => {
    const inventoryPage = new InventoryPage(authenticatedPage);
    await inventoryPage.sortBy("lohi");

    const prices = await inventoryPage.getProductPrices();
    // Numeric comparator (a, b) => a - b is required for numbers —
    // JS default sort would treat 9 > 10 lexicographically.
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });

  test("products sort price high to low", async ({ authenticatedPage }) => {
    const inventoryPage = new InventoryPage(authenticatedPage);
    await inventoryPage.sortBy("hilo");

    const prices = await inventoryPage.getProductPrices();
    const sorted = [...prices].sort((a, b) => b - a); // reversed comparator
    expect(prices).toEqual(sorted);
  });
});
