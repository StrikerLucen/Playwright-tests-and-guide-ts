# Core Concepts — QA Automation with Playwright & TypeScript

A practical reference for every pattern used in this project. Read this
alongside the source code — each section links to the relevant files.

---

## Table of Contents

1. [Page Object Model (POM)](#1-page-object-model-pom)
2. [Playwright Fixtures](#2-playwright-fixtures)
3. [Locator Strategies](#3-locator-strategies)
4. [Test Isolation](#4-test-isolation)
5. [TypeScript Essentials for QA](#5-typescript-essentials-for-qa)
6. [Allure Reporting](#6-allure-reporting)
7. [GitHub Actions CI](#7-github-actions-ci)
8. [Playwright Auto-Waiting](#8-playwright-auto-waiting)
9. [Test Anatomy](#9-test-anatomy)
10. [Common Mistakes to Avoid](#10-common-mistakes-to-avoid)

---

## 1. Page Object Model (POM)

**What it is:**
A design pattern where each page (or component) of the application under test
is represented as a class. The class owns all selectors and interaction logic
for that page. Tests import and call the class — they never contain raw selectors.

**Why it matters:**
```
WITHOUT POM                            WITH POM
─────────────────────────────────────  ──────────────────────────────────────
test("login", async ({ page }) => {    test("login", async ({ loginPage }) => {
  await page.fill('#user-name', 'x')     await loginPage.login('x', 'y')
  await page.fill('#password',  'y')     // selector is #user-name? #username?
  await page.click('#login-button')      // doesn't matter — LoginPage handles it
})                                     })

When the selector changes:             When the selector changes:
→ grep every spec file                 → edit LoginPage.ts, done
```

**Files in this project:**
- [`playwright/pages/LoginPage.ts`](playwright/pages/LoginPage.ts)
- [`playwright/pages/InventoryPage.ts`](playwright/pages/InventoryPage.ts)
- [`playwright/pages/CartPage.ts`](playwright/pages/CartPage.ts)
- [`playwright/pages/CheckoutPage.ts`](playwright/pages/CheckoutPage.ts)

**Rules of thumb:**
- One class per page (or per major component).
- No `expect()` assertions inside page objects — those belong in tests.
- Methods should express *actions*, not clicks: `login()` not `clickLoginButton()`.
- Declare locators as `readonly` class properties initialised in the constructor.

---

## 2. Playwright Fixtures

**What they are:**
Reusable setup/teardown functions that Playwright injects into tests by name.
Think of them as the dependency injection system of your test suite.

**The anatomy of a fixture:**
```typescript
myFixture: async ({ page }, use) => {
  // SETUP — runs before the test body
  const thing = await createSomething(page);

  await use(thing);   // ← test runs here, receives `thing` as a parameter

  // TEARDOWN — runs after the test body (optional cleanup)
  await thing.dispose();
}
```

**Built-in Playwright fixtures** (always available):
| Fixture | What you get |
|---|---|
| `page` | A fresh browser page (tab) |
| `context` | A browser context (like an incognito window) |
| `browser` | The browser instance |
| `request` | An HTTP client for API calls without a browser |

**Custom fixtures in this project** (`playwright/fixtures/base.fixture.ts`):
| Fixture | What you get |
|---|---|
| `loginPage` | `LoginPage` instance, pre-navigated to "/" |
| `inventoryPage` | `InventoryPage` instance |
| `cartPage` | `CartPage` instance |
| `checkoutPage` | `CheckoutPage` instance |
| `authenticatedPage` | A `Page` already logged in as `standard_user` |

**Key properties:**
- **Lazy** — only created if the test requests them.
- **Isolated** — each test gets its own instances (no shared state).
- **Composable** — fixtures can depend on other fixtures.

---

## 3. Locator Strategies

Playwright offers many ways to find elements. Here is the priority order
used in this project, from most to least preferred:

| Priority | Strategy | Example | Why |
|---|---|---|---|
| 1 | `data-test` attribute | `[data-test="login-button"]` | Survives CSS redesigns; intent is explicit |
| 2 | ARIA role | `getByRole('button', { name: 'Login' })` | Accessible by definition; works across languages |
| 3 | Visible text | `getByText('Add to cart')` | Human-readable; fragile with i18n |
| 4 | CSS class | `.shopping_cart_badge` | Breaks when class names change |
| 5 | XPath | `//button[@id='x']` | Verbose and brittle; last resort |

**Scoped locators** (chaining):
```typescript
// Instead of: page.locator('button').nth(3)  ← fragile index
// Use: narrow the parent first, then find the child
const card = page.locator('[data-test="inventory-item"]').filter({ hasText: 'Backpack' });
await card.locator('button').click();
```

**CSS attribute selectors:**
```
[attr="value"]   exact match
[attr^="value"]  starts with   ← used in CartPage for "remove-sauce-labs-…"
[attr$="value"]  ends with
[attr*="value"]  contains
```

---

## 4. Test Isolation

**The rule:** Every test must start and finish in a clean state. No test
should depend on the result of another test.

**Why it matters:**
- Tests can run in any order (or in parallel) without breaking.
- A failing test doesn't cascade failures into unrelated tests.
- Debugging is easier: if test 7 fails, you know the issue is in test 7.

**How this project achieves isolation:**

| Mechanism | How |
|---|---|
| Fresh browser context | Playwright creates a new context per test by default. Cookies, localStorage, and session data are wiped. |
| No shared variables | Page objects are instantiated inside each test (or fixture), never at the module level. |
| `beforeEach` for navigation only | `beforeEach` is only used to navigate to a page — never to add state that tests depend on. |
| Independent test data | Each test adds its own cart items; it never assumes items added by another test are present. |

---

## 5. TypeScript Essentials for QA

You don't need to be a TypeScript expert to write great tests. Here are the
specific features used in this project and why:

### `as const`
```typescript
export const Users = { standard: { username: "standard_user" } } as const;
//                                                                ^^^^^^^^
// Without: username is type `string` — any string is valid
// With:    username is type "standard_user" — only that exact value is valid
// Benefit: typos caught at compile time, not at runtime
```

### Union types
```typescript
export type SortOption = "az" | "za" | "lohi" | "hilo";
// Only these four strings are legal. Passing "AZ" is a compile error.
```

### `Record<K, V>`
```typescript
const SORT_VALUES: Record<SortOption, string> = { az: "az", za: "za", ... };
// TypeScript checks that every SortOption key has a string value.
// Forgetting "hilo" would be a compile error.
```

### `keyof typeof`
```typescript
export type UserKey = keyof typeof Users;
// Automatically derives: "standard" | "locked" | "invalid"
// Adding a new user to Users automatically adds it to UserKey.
```

### `readonly` class properties
```typescript
class LoginPage {
  readonly usernameInput: Locator; // Cannot be reassigned after construction
}
// Prevents accidental overwrites and signals "this is set once and stays".
```

### Async/await
```typescript
// Every Playwright action returns a Promise. `await` pauses until it resolves.
await page.click('button');       // waits for click to complete
await expect(el).toBeVisible();   // waits for element, up to expect.timeout
```

---

## 6. Allure Reporting

**What it is:** An open-source HTML test report that shows test results,
screenshots, traces, and history in an interactive UI.

**How it works in this project:**
1. The `allure-playwright` reporter (configured in `playwright.config.ts`)
   writes raw JSON files to `allure-results/` as tests run.
2. The `allure` CLI reads those JSON files and generates a static HTML site.

**Generate and view the report locally:**
```bash
# 1. Install the Allure CLI (one-time)
npm install -g allure-commandline

# 2. Run the tests (creates allure-results/)
cd playwright && npm test

# 3. Generate the HTML report
allure generate allure-results --clean -o allure-report

# 4. Open it in a browser
allure open allure-report
```

**On CI (GitHub Actions):**
The workflow uploads `allure-results/` as an artifact. Download the zip from
the workflow run page, unzip it, and run steps 3–4 above locally.

---

## 7. GitHub Actions CI

**What it is:** A free CI/CD platform built into GitHub. Defined in
`.github/workflows/ci.yml`.

**Trigger events in this project:**
```yaml
on:
  push:         # runs when code is pushed to main/master
  pull_request: # runs when a PR targeting main/master is opened or updated
```

**The job steps:**
```
checkout → install Node → npm ci → playwright install → playwright test → upload artifact
```

**Key concepts:**
- `runs-on: ubuntu-latest` — fresh Linux VM for every run.
- `npm ci` vs `npm install` — `ci` is deterministic (uses lock file).
- `if: always()` on the upload step — upload the report even when tests fail.
- `retention-days: 30` — artifacts auto-delete after 30 days.

---

## 8. Playwright Auto-Waiting

One of Playwright's biggest strengths: **you almost never need `sleep()` or
`waitForTimeout()`**. Playwright automatically waits for:

| Action | What Playwright waits for |
|---|---|
| `locator.click()` | Element exists, is visible, is not disabled, is not covered |
| `locator.fill()` | Element is editable |
| `expect(el).toBeVisible()` | Element becomes visible (up to `expect.timeout`) |
| `page.goto()` | Navigation completes (load event fires) |
| `waitFor({ state: "visible" })` | Explicit wait for a specific element state |

**When you DO need explicit waits:**
```typescript
// CSS animation hasn't completed yet — element is visible but not interactable
await this.logoutLink.waitFor({ state: "visible" });

// Wait for all network requests to settle
await page.waitForLoadState("networkidle");
```

---

## 9. Test Anatomy

Every test in this project follows the **Arrange → Act → Assert** (AAA) pattern:

```typescript
test("adding an item increments cart badge", async ({ authenticatedPage }) => {
  // ARRANGE — set up preconditions
  const inventoryPage = new InventoryPage(authenticatedPage);
  await authenticatedPage.goto("/inventory.html");

  // ACT — perform the action under test
  await inventoryPage.addToCart(Products.backpack);

  // ASSERT — verify the expected outcome
  const count = await inventoryPage.getCartCount();
  expect(count).toBe(1);
});
```

**`test.describe()`** groups related tests and gives them a shared label in the report.

**`test.beforeEach()`** runs before every test inside its `describe` block.
Use it for shared navigation — never for state that tests depend on.

---

## 10. Common Mistakes to Avoid

| Mistake | Problem | Fix |
|---|---|---|
| Raw selectors in test files | Selector change breaks many tests | Use page object methods |
| `test.only()` committed | CI only runs one test | `forbidOnly: true` in config catches this |
| `await` forgotten | Action fires but test doesn't wait | Always `await` Playwright calls |
| `sleep(2000)` for timing | Slow and unreliable | Use `waitFor` or Playwright's auto-waiting |
| Shared state between tests | Test order dependency | Fixture provides fresh context per test |
| Hardcoded strings in tests | Copy-paste errors; hard to update | Use `Users` and `Products` constants |
| Assertions inside page objects | Page object becomes an oracle | Keep `expect()` in test files only |
| Index-based locators (`nth(2)`) | Breaks when DOM order changes | Scope with `.filter({ hasText })` |
