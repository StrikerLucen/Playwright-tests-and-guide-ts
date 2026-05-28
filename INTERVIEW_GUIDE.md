# Interview Guide — QA Automation with Playwright

This guide maps common QA automation interview questions to concrete answers
you can give using this codebase as evidence. Every answer includes the
specific file or pattern that demonstrates it.

---

## Table of Contents

1. [Design & Architecture](#1-design--architecture)
2. [Playwright Specifics](#2-playwright-specifics)
3. [Test Design](#3-test-design)
4. [CI/CD & Reporting](#4-cicd--reporting)
5. [TypeScript for QA](#5-typescript-for-qa)
6. [Debugging & Maintenance](#6-debugging--maintenance)
7. [Questions to Ask the Interviewer](#7-questions-to-ask-the-interviewer)

---

## 1. Design & Architecture

---

### "What is the Page Object Model and why do you use it?"

**Short answer:**
> POM is a design pattern where each page of the application is represented
> as a class. The class owns all selectors and actions for that page.
> Tests import the class and call its methods — they never contain raw selectors.

**What it solves:**
- **Maintainability:** When a selector changes, you edit one class, not every
  test that touches that page.
- **Readability:** `loginPage.login(user, password)` reads like a user story;
  `page.fill('#user-name', ...)` reads like an implementation detail.
- **Reusability:** Multiple test files can share the same page object.

**Show in code:** [`playwright/pages/LoginPage.ts`](playwright/pages/LoginPage.ts)

---

### "How do you organise your test project?"

```
playwright/
├── pages/       ← one class per page (POM)
├── fixtures/    ← test data (users, products) and fixture setup
├── tests/
│   ├── e2e/     ← full user flows: login → add to cart → checkout
│   └── api/     ← network/HTTP layer tests
└── playwright.config.ts   ← single control panel for the whole suite
```

**Key decisions:**
- Test data lives in `fixtures/` — changing a credential is a one-line edit.
- Fixtures handle authentication — spec files focus on behaviour, not setup.
- Config is centralised — no scattered `page.setDefaultTimeout()` calls.

---

### "How do you keep tests independent?"

**Three mechanisms in this project:**

1. **Fresh browser context per test:** Playwright creates a new context by
   default. Cookies, localStorage, and session data are wiped between tests.

2. **Fixtures, not shared variables:** Page objects are constructed inside
   fixtures or test bodies — never at the module/describe level.

3. **No ordering assumptions:** `beforeEach` only handles navigation, never
   adds state. Cart tests add their own items; they don't assume items from
   another test are present.

**Show in code:** [`playwright/fixtures/base.fixture.ts`](playwright/fixtures/base.fixture.ts)

---

## 2. Playwright Specifics

---

### "Why Playwright over Selenium or Cypress?"

| Feature | Playwright | Selenium | Cypress |
|---|---|---|---|
| Auto-waiting | Built-in (smart) | Manual waits | Built-in |
| Multi-browser | Chromium, Firefox, WebKit | All | Chromium-based only |
| Network interception | Native | Third-party | Limited |
| Parallel execution | Worker-level | Grid required | Dashboard required |
| TypeScript | First-class | Library-dependent | First-class |
| Iframe / multi-tab | Native | Complex | Limited |

**Best answer:** "Playwright's auto-waiting and native network interception
remove the two biggest sources of flakiness I've seen in Selenium suites."

---

### "Explain Playwright's auto-waiting."

When you call `locator.click()`, Playwright does NOT immediately send a click.
It first checks:
1. Element exists in the DOM
2. Element is visible
3. Element is stable (not animating)
4. Element is enabled
5. Element is not covered by another element

Only then does it click. This eliminates most `sleep()` and `waitForTimeout()`
calls that plague other frameworks.

**When explicit waits are still needed:**
```typescript
// Element is visible but sidebar animation hasn't finished → not interactable yet
await this.logoutLink.waitFor({ state: "visible" });

// Wait for all XHR/fetch to settle before reading the DOM
await page.waitForLoadState("networkidle");
```

**Show in code:** [`playwright/pages/InventoryPage.ts`](playwright/pages/InventoryPage.ts) — `logout()` method

---

### "What are Playwright fixtures and how do you use custom ones?"

**Built-in fixtures** are objects Playwright provides to every test:
`page`, `context`, `browser`, `request`.

**Custom fixtures** extend the built-in ones using `test.extend<T>()`.
Each fixture is a function that receives injected dependencies, runs setup,
calls `await use(value)` to hand the value to the test, then runs teardown.

```typescript
export const test = base.extend<AppFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // SETUP: log in before the test
    await loginPage.login(user, pass);
    await use(page);          // test runs here
    // TEARDOWN: (nothing needed — context is discarded anyway)
  },
});
```

Tests request fixtures by name in their parameter list:
```typescript
test("checkout", async ({ authenticatedPage, cartPage }) => { ... });
```

**Show in code:** [`playwright/fixtures/base.fixture.ts`](playwright/fixtures/base.fixture.ts)

---

### "How do you handle elements that aren't always in the DOM?"

**Problem:** The cart badge element is absent when the cart is empty.
Calling `.textContent()` on a missing element throws.

**Solution:** Check visibility first.
```typescript
async getCartCount(): Promise<number> {
  const visible = await this.cartBadge.isVisible();
  if (!visible) return 0;
  const text = await this.cartBadge.textContent();
  return parseInt(text ?? "0", 10);
}
```

**Show in code:** [`playwright/pages/InventoryPage.ts`](playwright/pages/InventoryPage.ts) — `getCartCount()`

---

### "How do you avoid clicking the wrong button when there are multiple matches?"

**Problem:** The inventory page has 6 "Add to cart" buttons. `locator('button')` finds all six.

**Solution:** Chain `.filter()` to scope the search to the relevant card first.
```typescript
const item = page
  .locator('[data-test="inventory-item"]')
  .filter({ hasText: productName });   // narrow to the right card
await item.locator("button").click();  // only one button inside now
```

**Show in code:** [`playwright/pages/InventoryPage.ts`](playwright/pages/InventoryPage.ts) — `addToCart()`

---

## 3. Test Design

---

### "What test types do you cover and why?"

| Type | What | Why |
|---|---|---|
| **Happy path** | Complete flow with valid data | If this breaks, nothing works |
| **Negative / error** | Invalid input, locked user | Most bugs live in edge cases |
| **Boundary** | Empty fields, missing required data | Form validation is often broken |
| **Security / auth** | Access protected pages after logout | Auth bugs have the highest impact |
| **Network / API** | HTTP status, redirect behaviour | Catches issues invisible to the UI |

**In this project:** Login covers 4 scenarios (valid + 3 negative);
Checkout covers 1 happy path + 3 validation errors.

---

### "How do you name your tests?"

Convention: `"<subject> <verb> <expected outcome>"`

```typescript
"valid user can log in and sees inventory"
"locked-out user sees error message"
"adding an item increments cart badge"
"happy path: complete checkout shows confirmation"
```

**Why it matters:** In the Allure report, the test name IS the documentation.
A failing test named `"test3"` tells you nothing; `"empty postal code shows
validation error"` tells you exactly what broke and what to check.

---

### "What is the AAA pattern?"

**Arrange → Act → Assert** — the three phases of every test:

```typescript
test("adding an item increments cart badge", async ({ authenticatedPage }) => {
  // ARRANGE: navigate to the page with products
  const inventoryPage = new InventoryPage(authenticatedPage);
  await authenticatedPage.goto("/inventory.html");

  // ACT: perform the action under test
  await inventoryPage.addToCart(Products.backpack);

  // ASSERT: verify the expected outcome
  expect(await inventoryPage.getCartCount()).toBe(1);
});
```

---

## 4. CI/CD & Reporting

---

### "How does your CI pipeline work?"

```
Push / PR → GitHub Actions triggers → ubuntu-latest runner
  → actions/checkout (get the code)
  → actions/setup-node (Node 20 + npm cache)
  → npm ci (deterministic install from lock file)
  → playwright install --with-deps chromium (browsers + OS libraries)
  → playwright test (run suite, retries: 2 on failure)
  → upload-artifact (allure-results/, always, 30-day retention)
```

**Key decisions to explain:**
- `npm ci` instead of `npm install` — reproducible, fails on lock file drift.
- `--with-deps` — installs OS libraries so Chromium works on headless Ubuntu.
- `if: always()` — upload the Allure report even when tests fail so you can
  investigate the failure.
- `retries: 2` on CI — absorbs transient network blips without requiring re-runs.

**Show in code:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

---

### "Why Allure and not the built-in HTML reporter?"

| Feature | Allure | Built-in HTML |
|---|---|---|
| History / trend charts | Yes | No |
| Step-level detail | Yes | No |
| Screenshot / trace embedding | Yes | Limited |
| Retries visualisation | Yes | No |
| Filterable by status/label | Yes | No |

Allure turns a flat pass/fail list into an interactive report with trends,
categories, and drilldown — much more useful for stakeholders and post-mortem analysis.

---

## 5. TypeScript for QA

---

### "Why TypeScript instead of JavaScript for test automation?"

1. **Compile-time errors:** Typos in selector strings, wrong argument types,
   and missing properties are caught before the test runs.
   ```typescript
   await inventoryPage.sortBy("AZ"); // TS error: "AZ" is not SortOption
   await inventoryPage.sortBy("az"); // OK
   ```

2. **Autocomplete:** IDE suggests valid method names and parameters — faster
   to write, harder to get wrong.

3. **Self-documenting:** The function signature `login(username: string, password: string)`
   tells you exactly what to pass without reading the implementation.

4. **Refactoring safety:** Rename a method and TypeScript shows every callsite
   that needs updating — no grep required.

---

### "What TypeScript features do you use most in tests?"

- `as const` — freeze test data objects so values are literal types.
- Union types — constrain parameters to valid values only.
- `readonly` — mark page object locators as immutable after construction.
- `keyof typeof` — derive union types from object keys automatically.
- Async/await — required for all Playwright calls; TypeScript enforces it.

**Show in code:** [`playwright/fixtures/users.ts`](playwright/fixtures/users.ts),
[`playwright/pages/InventoryPage.ts`](playwright/pages/InventoryPage.ts)

---

## 6. Debugging & Maintenance

---

### "How do you debug a failing test?"

**Step 1 — Read the error:** Playwright prints the failing assertion, the
received value, and a screenshot path if configured.

**Step 2 — Run headed with slow-mo:**
```bash
npx playwright test --headed --project=chromium tests/e2e/login.spec.ts
```

**Step 3 — Open the Playwright Trace Viewer:**
`trace: "on-first-retry"` in config captures a full trace on CI.
```bash
npx playwright show-trace playwright-report/trace.zip
```
The trace shows every action, screenshot before/after, and network requests.

**Step 4 — Use Playwright Inspector:**
```bash
PWDEBUG=1 npx playwright test tests/e2e/login.spec.ts
```
Opens a step-by-step debugger in a browser window.

---

### "How do you handle flaky tests?"

1. **Identify** — run the test 10× in a loop; if it fails < 100% of the time it's flaky.
2. **Root cause** — usually a timing issue, shared state, or environment dependency.
3. **Fix** — prefer `waitFor()` or `waitForLoadState()` over `sleep()`; ensure
   the fixture provides truly clean state.
4. **Protect** — `retries: 2` on CI catches transient network issues without
   hiding real bugs.

**Never** suppress a flaky test with `test.skip()` without a tracking ticket.

---

### "How do you keep selectors resilient?"

Priority order:
1. `[data-test="..."]` attributes — added explicitly for testing, not affected by style changes.
2. ARIA roles — `getByRole('button', { name: 'Login' })` — accessible and stable.
3. Visible text — works until copy is changed or the app is internationalised.
4. CSS classes — last resort; change with every redesign.

**Ask developers to add `data-test` attributes** when you encounter elements
with no stable identifier. This is a normal part of a QA–Dev collaboration.

---

## 7. Questions to Ask the Interviewer

Asking good questions signals seniority. Pick 2–3 from this list:

**On the tech stack:**
- "What browser coverage do you currently run in CI, and are there plans to expand?"
- "Do you use Playwright's component testing or just end-to-end?"
- "How do you handle test data — do tests create their own data via API, or use seed data?"

**On process:**
- "What is the current test suite run time, and what's the target?"
- "How do flaky tests get escalated — is there an on-call rotation?"
- "What does the QA–Dev handoff look like? Do you write tests before, during, or after development?"

**On the team:**
- "What does a typical sprint look like for the QA team?"
- "What's the biggest current pain point in your automation suite?"
- "How are `data-test` attributes handled — is there a convention developers follow?"
