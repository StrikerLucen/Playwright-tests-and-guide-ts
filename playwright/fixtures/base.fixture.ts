import { test as base, Page } from "@playwright/test";
import { LoginPage }    from "../pages/LoginPage";
import { InventoryPage } from "../pages/InventoryPage";
import { CartPage }     from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { Users }        from "./users";

/**
 * PLAYWRIGHT FIXTURES — dependency injection for tests
 * ─────────────────────────────────────────────────────────────────────────────
 * A fixture is a reusable setup/teardown block. Instead of writing beforeEach
 * in every test file, you declare a fixture once and Playwright injects it
 * as a named parameter in the test function signature.
 *
 * The anatomy of a fixture:
 *
 *   fixtureKey: async ({ page }, use) => {
 *     // ① SETUP — runs before the test body
 *     const thing = new Thing(page);
 *     await thing.prepare();
 *
 *     await use(thing);   // ② hands control to the test; test runs here
 *
 *     // ③ TEARDOWN — runs after the test (add cleanup here if needed)
 *   }
 *
 * Key properties:
 *   • Lazy — Playwright only instantiates what the test actually requests.
 *     A test that only uses `loginPage` never creates `cartPage`.
 *   • Isolated — each test gets its own fixture instances (no shared state).
 *   • Composable — fixtures can depend on other fixtures (e.g. `authenticatedPage`
 *     implicitly depends on the built-in `page` fixture from Playwright).
 *
 * Interview tip: "Fixtures are the POM's best friend — POM handles WHERE to
 * click, fixtures handle WHEN to navigate and authenticate."
 */

/** Describes the custom fixtures this project adds on top of Playwright's built-ins. */
type AppFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  /** A `Page` that is already authenticated as the standard user. */
  authenticatedPage: Page;
};

/**
 * Our custom `test` object extends Playwright's base `test` with extra fixtures.
 * Every spec file imports THIS `test` (and `expect`) instead of from
 * "@playwright/test" directly. That is the only import change needed to get
 * access to all custom fixtures.
 */
export const test = base.extend<AppFixtures>({
  // Navigates to "/" so tests can call loginPage.login() without a prior goto().
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },

  // Page objects that need no pre-navigation are wrapped and handed over directly.
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  /**
   * Performs a full login before handing a plain `Page` to the test.
   *
   * Why return `Page` instead of a page object?
   * Tests that need an authenticated session often interact with *multiple*
   * pages (inventory → cart → checkout). Returning the raw `page` lets each
   * test instantiate whichever page objects it needs, keeping the fixture
   * simple and general.
   *
   * Why not use Playwright's storageState for session reuse?
   * SauceDemo stores auth in a cookie that expires quickly. A fresh login per
   * test is fast enough (~300 ms) and guarantees a truly clean state.
   */
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(Users.standard.username, Users.standard.password);
    await use(page);
  },
});

// Re-export expect so spec files only need one import statement.
export { expect } from "@playwright/test";
