/**
 * LOGIN TESTS — e2e/login.spec.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Patterns demonstrated in this file:
 *
 *   1. Custom fixture injection: `loginPage` is declared as a parameter and
 *      Playwright provides it automatically — no beforeEach needed.
 *
 *   2. Test isolation: the `loginPage` fixture creates a *fresh browser
 *      context* for every test. No cookie, localStorage, or session data
 *      leaks between tests.
 *
 *   3. Named test data: we import Users constants instead of hardcoding
 *      credential strings, so a credential change is a one-line fix.
 *
 *   4. POM in action: tests call loginPage.login() and loginPage.getErrorMessage()
 *      — zero raw selectors appear in this file.
 *
 * Test naming convention:
 *   "<subject> <verb> <expected outcome>"  →  easy to read in the Allure report.
 */
import { test, expect } from "../../fixtures/base.fixture";
import { Users } from "../../fixtures/users";

test.describe("Login", () => {
  // ── Happy path ────────────────────────────────────────────────────────────

  test("valid user can log in and sees inventory", async ({ loginPage, page }) => {
    await loginPage.login(Users.standard.username, Users.standard.password);

    // toHaveURL with a regex is more resilient than an exact string —
    // it passes regardless of query params or trailing slashes.
    await expect(page).toHaveURL(/inventory/);
    await expect(page.locator('[data-test="inventory-list"]')).toBeVisible();
  });

  // ── Negative / edge cases ─────────────────────────────────────────────────

  test("locked-out user sees error message", async ({ loginPage }) => {
    await loginPage.login(Users.locked.username, Users.locked.password);

    // getErrorMessage() is defined in LoginPage — no selector in the test.
    const error = await loginPage.getErrorMessage();
    expect(error).toContain("Sorry, this user has been locked out");
  });

  test("invalid credentials show error", async ({ loginPage }) => {
    await loginPage.login(Users.invalid.username, Users.invalid.password);

    const error = await loginPage.getErrorMessage();
    expect(error).toContain("Username and password do not match");
  });

  test("empty username shows validation error", async ({ loginPage }) => {
    // Passing empty strings simulates clicking Login without filling the form.
    await loginPage.login("", "");

    const error = await loginPage.getErrorMessage();
    expect(error).toContain("Username is required");
  });
});
