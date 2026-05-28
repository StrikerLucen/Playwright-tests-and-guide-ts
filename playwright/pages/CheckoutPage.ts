import { Page, Locator } from "@playwright/test";

/**
 * PAGE OBJECT MODEL — CheckoutPage
 * ─────────────────────────────────────────────────────────────────────────────
 * SauceDemo checkout is a three-step linear flow:
 *   Step 1 (/checkout-step-one.html)  — shipping info form
 *   Step 2 (/checkout-step-two.html)  — order overview
 *   Complete (/checkout-complete.html) — confirmation
 *
 * Design decision: all steps are in one class here because the flow is small
 * and linear. In a larger app you would split into separate page objects:
 *   CheckoutInfoPage → CheckoutOverviewPage → CheckoutCompletePage
 * That keeps each class focused on one screen and makes maintenance easier.
 *
 * The locators for each step are only accessible after navigating to that
 * step. Playwright's auto-waiting means calling .click() on a locator that
 * doesn't exist yet will wait (up to the configured timeout) for it to appear,
 * rather than failing immediately.
 */
export class CheckoutPage {
  readonly page: Page;

  // Step 1 — shipping form
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly errorMessage: Locator;

  // Step 2 — order overview
  readonly finishButton: Locator;

  // Complete — confirmation
  readonly confirmationHeader: Locator;

  constructor(page: Page) {
    this.page               = page;
    this.firstNameInput     = page.locator('[data-test="firstName"]');
    this.lastNameInput      = page.locator('[data-test="lastName"]');
    this.postalCodeInput    = page.locator('[data-test="postalCode"]');
    this.continueButton     = page.locator('[data-test="continue"]');
    this.finishButton       = page.locator('[data-test="finish"]');
    this.errorMessage       = page.locator('[data-test="error"]');
    this.confirmationHeader = page.locator('[data-test="complete-header"]');
  }

  /**
   * Fills all three required shipping fields in a single method call.
   * Grouping related fields into one method (fillShippingInfo) rather than
   * exposing three separate fill methods keeps tests readable and prevents
   * partial fills that would leave the form in an inconsistent state.
   */
  async fillShippingInfo(firstName: string, lastName: string, zip: string) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(zip);
  }

  /** Submits the shipping form. Playwright waits for navigation automatically. */
  async continue() {
    await this.continueButton.click();
  }

  /** Finalises the order on the overview page. */
  async finish() {
    await this.finishButton.click();
  }

  /** Returns the inline validation error text, or "" if no error is shown. */
  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? "";
  }

  /** Returns the "Thank you for your order!" confirmation heading text. */
  async getConfirmationText(): Promise<string> {
    return (await this.confirmationHeader.textContent()) ?? "";
  }
}
