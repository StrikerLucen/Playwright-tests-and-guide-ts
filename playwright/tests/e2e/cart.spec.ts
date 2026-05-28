/**
 * CART TESTS — e2e/cart.spec.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Patterns demonstrated in this file:
 *
 *   1. Cross-page interactions: a single test can move from the inventory
 *      page to the cart page by clicking a link — page objects for each
 *      page are instantiated as needed within the test body.
 *
 *   2. State reset via fixture: `authenticatedPage` creates a new browser
 *      context per test. Tests that add items never see items from a previous
 *      test — the cart is always empty at the start.
 *
 *   3. Negative assertions: `.not.toContain()` verifies an item is gone
 *      from the list after removal.
 *
 *   4. Multi-step flow in one test: "cart badge disappears" adds an item,
 *      navigates away, removes it, then navigates back to confirm the badge
 *      is gone — all within a single test to verify the complete behaviour.
 */
import { test, expect } from "../../fixtures/base.fixture";
import { InventoryPage } from "../../pages/InventoryPage";
import { CartPage }      from "../../pages/CartPage";
import { Products }      from "../../fixtures/products";

test.describe("Cart", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/inventory.html");
  });

  // ── Badge count ───────────────────────────────────────────────────────────

  test("adding an item increments cart badge", async ({ authenticatedPage }) => {
    const inventoryPage = new InventoryPage(authenticatedPage);
    await inventoryPage.addToCart(Products.backpack);

    const count = await inventoryPage.getCartCount();
    expect(count).toBe(1);
  });

  test("adding two items shows badge count of 2", async ({ authenticatedPage }) => {
    const inventoryPage = new InventoryPage(authenticatedPage);
    await inventoryPage.addToCart(Products.backpack);
    await inventoryPage.addToCart(Products.bikeLight);

    const count = await inventoryPage.getCartCount();
    expect(count).toBe(2);
  });

  // ── Remove items ──────────────────────────────────────────────────────────

  test("removing an item from cart removes it from cart page", async ({
    authenticatedPage,
  }) => {
    const inventoryPage = new InventoryPage(authenticatedPage);
    const cartPage      = new CartPage(authenticatedPage);

    await inventoryPage.addToCart(Products.backpack);
    await inventoryPage.cartLink.click(); // navigate to cart
    await cartPage.removeItem(Products.backpack);

    const items = await cartPage.getCartItems();
    expect(items).not.toContain(Products.backpack);
  });

  test("cart badge disappears when all items removed", async ({
    authenticatedPage,
  }) => {
    const inventoryPage = new InventoryPage(authenticatedPage);
    const cartPage      = new CartPage(authenticatedPage);

    // Add → navigate to cart → remove → go back → verify badge is gone
    await inventoryPage.addToCart(Products.backpack);
    await inventoryPage.cartLink.click();
    await cartPage.removeItem(Products.backpack);
    await authenticatedPage.goto("/inventory.html");

    // getCartCount() returns 0 when the badge element is absent from the DOM.
    const count = await inventoryPage.getCartCount();
    expect(count).toBe(0);
  });
});
