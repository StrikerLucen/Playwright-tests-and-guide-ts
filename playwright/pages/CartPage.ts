import { Page, Locator } from "@playwright/test";

/**
 * PAGE OBJECT MODEL — CartPage (/cart.html)
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the shopping cart view. Exposes actions for reading cart
 * contents, removing items, and navigating to checkout.
 *
 * Notice that this page object does NOT contain any assertions (expect calls).
 * Assertions belong in test files. Page objects only describe interactions.
 * This separation makes the page object reusable across many different tests
 * that each assert different things about the same actions.
 */
export class CartPage {
  readonly page: Page;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.checkoutButton         = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
  }

  async goto() {
    await this.page.goto("/cart.html");
  }

  /** Returns the name of every item currently in the cart. */
  async getCartItems(): Promise<string[]> {
    return this.page
      .locator('[data-test="inventory-item-name"]')
      .allTextContents();
  }

  /**
   * Removes a specific product by scoping the button to its parent row.
   *
   * Selector breakdown: button[data-test^='remove']
   *   • button         — element must be a <button>
   *   • [data-test^=…] — data-test attribute *starts with* "remove"
   *
   * This matches "remove-sauce-labs-backpack", "remove-sauce-labs-bike-light",
   * etc. without hardcoding each product's slug. The ^ (starts-with)
   * operator is one of CSS attribute selector operators:
   *   ^= starts with  |  $= ends with  |  *= contains
   */
  async removeItem(productName: string) {
    const item = this.page
      .locator('[data-test="inventory-item"]')
      .filter({ hasText: productName });
    await item.locator("button[data-test^='remove']").click();
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }
}
