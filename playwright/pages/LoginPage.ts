import { Page, Locator } from "@playwright/test";

/**
 * PAGE OBJECT MODEL (POM) — LoginPage
 * ─────────────────────────────────────────────────────────────────────────────
 * What is a Page Object?
 *   A class that wraps one page (or component) of the app. It exposes
 *   high-level actions ("login", "getErrorMessage") instead of raw DOM
 *   operations. Test files describe WHAT to verify; page objects describe
 *   HOW to interact with the UI.
 *
 * Why bother?
 *   ┌──────────────────────────────────────────────────┐
 *   │ Without POM (fragile)                            │
 *   │   await page.fill('#user-name', 'standard_user') │
 *   │   await page.fill('#password',  'secret_sauce')  │
 *   │   await page.click('#login-button')              │
 *   │   — repeated in every test that needs login —    │
 *   └──────────────────────────────────────────────────┘
 *   ┌──────────────────────────────────────────────────┐
 *   │ With POM (resilient)                             │
 *   │   await loginPage.login(user, password)          │
 *   │   — selector changes only need one edit here —   │
 *   └──────────────────────────────────────────────────┘
 *
 * Locator strategy — why [data-test="..."] attributes?
 *   • They survive visual redesigns (CSS class names change; test IDs don't).
 *   • Intent is explicit: the developer signals "this element is tested".
 *   • Preferred order: data-test → aria role → text → CSS class → XPath.
 */
export class LoginPage {
  // Locators are declared as readonly so they cannot be reassigned after
  // construction. Playwright Locators are *lazy* — no DOM lookup happens
  // until you call an action (.click(), .fill(), .textContent(), …).
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton  = page.locator('[data-test="login-button"]');
    this.errorMessage = page.locator('[data-test="error"]');
  }

  /** Navigate to the login page. Used by the loginPage fixture. */
  async goto() {
    await this.page.goto("/");
  }

  /**
   * High-level action: fill both fields and submit the form.
   * Tests call loginPage.login(…) — they never touch individual fields.
   * This is the POM principle in action: one method, zero raw selectors in tests.
   */
  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /** Returns the visible error banner text, or an empty string if absent. */
  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? "";
  }
}
