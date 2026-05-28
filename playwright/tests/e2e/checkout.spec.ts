/**
 * CHECKOUT TESTS — e2e/checkout.spec.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Patterns demonstrated in this file:
 *
 *   1. Helper function within the test file: `addItemAndGoToCheckout` is a
 *      private async function that sets up the precondition (item in cart,
 *      checkout started) shared by every test in this suite. It is NOT a
 *      fixture because it is specific to this one file. If it were needed
 *      in other files, it would graduate to a fixture or a page object method.
 *
 *   2. Happy path + boundary / validation tests in the same describe block:
 *      keeping them together makes it clear that we cover both the success
 *      case and every required-field error.
 *
 *   3. Partial fills for validation: to trigger "Last Name is required" we
 *      fill firstName but leave lastName and zip empty, simulating a real
 *      user who forgets to complete the form.
 *
 * What is the "happy path"?
 *   The sequence of steps a user follows when everything works correctly.
 *   Always test it first — if the happy path breaks, negative tests are moot.
 */
import { test, expect }  from "../../fixtures/base.fixture";
import { InventoryPage } from "../../pages/InventoryPage";
import { CartPage }      from "../../pages/CartPage";
import { CheckoutPage }  from "../../pages/CheckoutPage";
import { Products }      from "../../fixtures/products";

test.describe("Checkout", () => {
  /**
   * Shared precondition: add a product to the cart and navigate to checkout step 1.
   * Returns a CheckoutPage instance ready for the test to interact with.
   *
   * Using `page: any` here keeps the helper simple — in a stricter codebase
   * you would type it as `page: Page` from "@playwright/test".
   */
  async function addItemAndGoToCheckout(page: any): Promise<CheckoutPage> {
    const inventoryPage = new InventoryPage(page);
    const cartPage      = new CartPage(page);

    await page.goto("/inventory.html");
    await inventoryPage.addToCart(Products.backpack);
    await inventoryPage.cartLink.click();
    await cartPage.proceedToCheckout();

    return new CheckoutPage(page);
  }

  // ── Happy path ────────────────────────────────────────────────────────────

  test("happy path: complete checkout shows confirmation", async ({
    authenticatedPage,
  }) => {
    const checkoutPage = await addItemAndGoToCheckout(authenticatedPage);
    await checkoutPage.fillShippingInfo("Jane", "Doe", "12345");
    await checkoutPage.continue();
    await checkoutPage.finish();

    const confirmation = await checkoutPage.getConfirmationText();
    expect(confirmation).toContain("Thank you for your order");
  });

  // ── Validation errors — required fields ───────────────────────────────────

  test("empty first name shows validation error", async ({
    authenticatedPage,
  }) => {
    const checkoutPage = await addItemAndGoToCheckout(authenticatedPage);
    // Click Continue without filling anything → should show the first error.
    await checkoutPage.continue();

    const error = await checkoutPage.getErrorMessage();
    expect(error).toContain("First Name is required");
  });

  test("empty last name shows validation error", async ({
    authenticatedPage,
  }) => {
    const checkoutPage = await addItemAndGoToCheckout(authenticatedPage);
    await checkoutPage.fillShippingInfo("Jane", "", ""); // firstName filled, rest empty
    await checkoutPage.continue();

    const error = await checkoutPage.getErrorMessage();
    expect(error).toContain("Last Name is required");
  });

  test("empty postal code shows validation error", async ({
    authenticatedPage,
  }) => {
    const checkoutPage = await addItemAndGoToCheckout(authenticatedPage);
    await checkoutPage.fillShippingInfo("Jane", "Doe", ""); // zip left empty
    await checkoutPage.continue();

    const error = await checkoutPage.getErrorMessage();
    expect(error).toContain("Postal Code is required");
  });
});
