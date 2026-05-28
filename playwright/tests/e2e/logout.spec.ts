/**
 * LOGOUT TESTS — e2e/logout.spec.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Patterns demonstrated in this file:
 *
 *   1. Security / auth boundary testing: after logout we try to navigate
 *      directly to a protected page and verify the app redirects back to
 *      login — this confirms the server (not just the UI) enforces auth.
 *
 *   2. Combining fixtures: `authenticatedPage` (from our custom fixture) and
 *      `page` (from Playwright's built-in fixture) can be requested in the
 *      same test. They reference the same underlying browser page instance.
 *
 *   3. State verification from two angles:
 *      - Redirect to login URL → proves navigation is blocked.
 *      - Login button visible → proves the login page fully rendered.
 *      Together they make the assertion more robust than either alone.
 */
import { test, expect } from "../../fixtures/base.fixture";
import { InventoryPage } from "../../pages/InventoryPage";

test.describe("Logout", () => {
  test("logging out redirects to login page", async ({ authenticatedPage, page }) => {
    const inventoryPage = new InventoryPage(authenticatedPage);
    await authenticatedPage.goto("/inventory.html");
    await inventoryPage.logout();

    // Verify both the URL and the presence of the login form.
    await expect(page).toHaveURL("/");
    await expect(page.locator('[data-test="login-button"]')).toBeVisible();
  });

  test("cannot access inventory after logout", async ({ authenticatedPage, page }) => {
    const inventoryPage = new InventoryPage(authenticatedPage);
    await authenticatedPage.goto("/inventory.html");
    await inventoryPage.logout();

    // Attempt to navigate directly to a protected route post-logout.
    await page.goto("/inventory.html");

    // SauceDemo redirects unauthenticated requests back to the login page.
    await expect(page).toHaveURL("/");
  });
});
