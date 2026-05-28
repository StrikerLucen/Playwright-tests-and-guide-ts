import { Page, Locator } from "@playwright/test";

/**
 * SortOption is a TypeScript *union type* — only these four string literals
 * are legal values. Passing anything else is a compile-time error, not a
 * silent runtime bug.
 *
 * Interview tip: "I use union types for constrained inputs so the compiler
 * rejects invalid arguments before the test ever runs."
 */
export type SortOption = "az" | "za" | "lohi" | "hilo";

/**
 * Maps our readable aliases → the actual <option value="…"> DOM attributes.
 * The mapping lives here so InventoryPage is the *only* file that ever knows
 * what the raw DOM strings are. Tests use "az", not "az" duplicated everywhere.
 *
 * Record<K, V> is a TypeScript utility type meaning "an object whose keys are
 * all values of K and whose values are all V". Equivalent to { [key in K]: V }.
 */
const SORT_VALUES: Record<SortOption, string> = {
  az:   "az",
  za:   "za",
  lohi: "lohi",
  hilo: "hilo",
};

/**
 * PAGE OBJECT MODEL — InventoryPage (/inventory.html)
 * ─────────────────────────────────────────────────────────────────────────────
 * Covers: product listing, sorting, add/remove from cart, logout.
 *
 * The cart badge and navigation links live in the persistent header that is
 * present on every authenticated page, but we define them here because
 * InventoryPage is where most interactions with them begin.
 */
export class InventoryPage {
  readonly page: Page;
  readonly sortDropdown: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly menuButton: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    this.page        = page;
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.cartBadge   = page.locator(".shopping_cart_badge");
    this.cartLink    = page.locator(".shopping_cart_link");
    this.menuButton  = page.locator("#react-burger-menu-btn");
    this.logoutLink  = page.locator("#logout_sidebar_link");
  }

  async goto() {
    await this.page.goto("/inventory.html");
  }

  /** Selects a sort option from the dropdown by mapped DOM value. */
  async sortBy(option: SortOption) {
    await this.sortDropdown.selectOption(SORT_VALUES[option]);
  }

  /**
   * Returns all product names in current DOM order.
   * allTextContents() collects text from *every* matching element at once,
   * which is more efficient than looping and calling textContent() per element.
   */
  async getProductNames(): Promise<string[]> {
    return this.page
      .locator('[data-test="inventory-item-name"]')
      .allTextContents();
  }

  /**
   * Strips the "$" prefix and converts to floats so tests can do numeric
   * comparisons (prices[0] < prices[1]) instead of string comparisons.
   */
  async getProductPrices(): Promise<number[]> {
    const raw = await this.page
      .locator('[data-test="inventory-item-price"]')
      .allTextContents();
    return raw.map((p) => parseFloat(p.replace("$", "")));
  }

  /**
   * Scopes the button click to the specific product card using .filter().
   *
   * Why .filter({ hasText }) instead of just matching the button directly?
   * The page has multiple "Add to cart" buttons with identical text. Without
   * scoping to the parent card, locator.click() would throw because it found
   * more than one match. .filter() narrows the parent element first, then
   * we search for the button within that narrowed scope.
   */
  async addToCart(productName: string) {
    const item = this.page
      .locator('[data-test="inventory-item"]')
      .filter({ hasText: productName });
    await item.locator("button").click();
  }

  /** Same scoping strategy as addToCart — the button label changes to "Remove" after adding. */
  async removeFromCart(productName: string) {
    const item = this.page
      .locator('[data-test="inventory-item"]')
      .filter({ hasText: productName });
    await item.locator("button").click();
  }

  /**
   * The badge element is *absent from the DOM* when the cart is empty,
   * not just hidden. Calling .textContent() on a missing element would throw,
   * so we guard with isVisible() first and return 0 when it's not there.
   */
  async getCartCount(): Promise<number> {
    const visible = await this.cartBadge.isVisible();
    if (!visible) return 0;
    const text = await this.cartBadge.textContent();
    return parseInt(text ?? "0", 10);
  }

  /**
   * Opens the slide-in sidebar and clicks Logout.
   * waitFor({ state: "visible" }) waits for the CSS animation to finish
   * before clicking — without it, the click might land before the link
   * is interactable and cause a flaky test.
   */
  async logout() {
    await this.menuButton.click();
    await this.logoutLink.waitFor({ state: "visible" });
    await this.logoutLink.click();
  }
}
