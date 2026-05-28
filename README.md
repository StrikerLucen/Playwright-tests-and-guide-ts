# qa-automation-showcase

![CI](https://github.com/StrikerLucen/Playwright-tests-and-guide-ts/actions/workflows/ci.yml/badge.svg)

> A production-quality end-to-end automation suite built with **Playwright + TypeScript**, targeting [SauceDemo](https://www.saucedemo.com). Designed as both a learning reference and an interview showcase.

---

## What this project demonstrates

| Skill | Where to look |
|---|---|
| Page Object Model (strict, no raw selectors in tests) | [`playwright/pages/`](playwright/pages/) |
| Playwright custom fixtures (dependency injection) | [`playwright/fixtures/base.fixture.ts`](playwright/fixtures/base.fixture.ts) |
| Test isolation (fresh context per test, no shared state) | Every spec file |
| Typed test data with `as const` | [`playwright/fixtures/users.ts`](playwright/fixtures/users.ts) |
| Scoped locators with `.filter()` | [`playwright/pages/InventoryPage.ts`](playwright/pages/InventoryPage.ts) |
| Network / HTTP-layer testing | [`playwright/tests/api/products.api.spec.ts`](playwright/tests/api/products.api.spec.ts) |
| Allure reporting integrated in config | [`playwright/playwright.config.ts`](playwright/playwright.config.ts) |
| GitHub Actions CI with artifact upload | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) |

---

## Tech stack

| Tool | Version | Purpose |
|---|---|---|
| [Playwright](https://playwright.dev) | 1.44+ | Browser automation framework |
| [TypeScript](https://www.typescriptlang.org) | 5.x | Type-safe test code |
| [Allure Playwright](https://allurereport.org) | 3.x | HTML test reporting |
| [Node.js](https://nodejs.org) | 20 LTS | Runtime |
| [GitHub Actions](https://docs.github.com/en/actions) | — | CI/CD pipeline |

---

## Project structure

```
qa-automation-showcase/
│
├── .github/
│   └── workflows/
│       └── ci.yml              ← CI pipeline (push/PR → test → upload report)
│
├── playwright/
│   ├── pages/                  ← Page Object Model classes (one per page)
│   │   ├── LoginPage.ts
│   │   ├── InventoryPage.ts
│   │   ├── CartPage.ts
│   │   └── CheckoutPage.ts
│   │
│   ├── fixtures/               ← Test data and Playwright fixture definitions
│   │   ├── users.ts            ← SauceDemo test accounts (typed with `as const`)
│   │   ├── products.ts         ← Product name constants
│   │   └── base.fixture.ts     ← Custom fixtures: loginPage, authenticatedPage, …
│   │
│   ├── tests/
│   │   ├── e2e/                ← Full user-flow tests
│   │   │   ├── login.spec.ts
│   │   │   ├── products.spec.ts
│   │   │   ├── cart.spec.ts
│   │   │   ├── checkout.spec.ts
│   │   │   └── logout.spec.ts
│   │   └── api/                ← HTTP / network-layer tests
│   │       └── products.api.spec.ts
│   │
│   └── playwright.config.ts    ← Central config: timeouts, reporter, baseURL, projects
│
├── CONCEPTS.md                 ← Deep-dive into every pattern used (start here!)
├── INTERVIEW_GUIDE.md          ← Common QA interview Q&A with code references
└── README.md                   ← This file
```

---

## Quick start

```bash
# 1. Install dependencies
cd playwright
npm install

# 2. Install the Chromium browser binary
npx playwright install chromium

# 3. Run all tests (headless)
npm test

# 4. Run in headed mode (watch the browser)
npm run test:headed

# 5. Run a single spec file
npx playwright test tests/e2e/login.spec.ts

# 6. Run with the Playwright Inspector (step-by-step debugger)
PWDEBUG=1 npx playwright test tests/e2e/login.spec.ts
```

---

## Allure report

Allure produces an interactive HTML report with history, screenshots, and traces.

```bash
# Install the Allure CLI (one-time)
npm install -g allure-commandline

# Run tests (creates allure-results/)
npm test

# Generate the HTML report
allure generate allure-results --clean -o allure-report

# Open in browser
allure open allure-report
```

On GitHub Actions, `allure-results/` is uploaded as a build artifact.
Download the zip from the workflow run → unzip → run `allure generate` locally.

---

## Test coverage

| Area | Tests | Scenarios covered |
|---|---|---|
| **Login** | 4 | Valid login, locked-out user, invalid credentials, empty fields |
| **Product listing** | 4 | Sort A-Z, Z-A, price low→high, price high→low |
| **Cart** | 4 | Add item (badge +1), add two items (badge = 2), remove item, badge disappears |
| **Checkout** | 4 | Happy path (full purchase), empty first name, empty last name, empty postal code |
| **Logout** | 2 | Redirect to login, blocked access to inventory after logout |
| **API / network** | 3 | HTTP 200 on login, unauthenticated redirect, zero failed asset requests |
| **Total** | **21** | |

---

## Key design decisions

### Page Object Model — no raw selectors in tests

Every test file imports a page object class and calls its methods. The class
owns all selectors. When a selector changes, only the page object needs updating.

```typescript
// ✗ Raw selector in a test (brittle)
await page.fill('[data-test="username"]', 'standard_user');

// ✓ Page object method (resilient)
await loginPage.login(Users.standard.username, Users.standard.password);
```

### Fixtures — dependency injection for tests

`base.fixture.ts` extends Playwright's built-in `test` object with custom fixtures
(`loginPage`, `authenticatedPage`, etc.). Tests declare what they need in their
parameter list; Playwright provides it:

```typescript
test("valid user can log in", async ({ loginPage, page }) => {
  // loginPage is pre-navigated to "/"; no beforeEach needed
  await loginPage.login(Users.standard.username, Users.standard.password);
  await expect(page).toHaveURL(/inventory/);
});
```

### Test isolation — zero shared state

Each test runs in a fresh browser context (cookies and localStorage wiped).
Tests never depend on the result or state of another test. They can run in any
order, in parallel, and individually.

### Typed test data — `as const`

```typescript
export const Users = {
  standard: { username: "standard_user", password: "secret_sauce" },
} as const;
// username is the literal type "standard_user", not the broad type `string`
// → typos caught at compile time, not test runtime
```

### Scoped locators — no ambiguous matches

When multiple elements match a selector, `.filter()` narrows the parent first:

```typescript
const item = page
  .locator('[data-test="inventory-item"]')
  .filter({ hasText: "Sauce Labs Backpack" });
await item.locator("button").click(); // exactly one button inside
```

---

## Extending this project

### Add a new page
1. Create `playwright/pages/NewPage.ts` with a class extending nothing (plain POM).
2. Add a fixture for it in `base.fixture.ts`.
3. Create `playwright/tests/e2e/newpage.spec.ts`.

### Add a new browser
In `playwright.config.ts`, add an entry to `projects`:
```typescript
{ name: "firefox", use: { ...devices["Desktop Firefox"] } },
{ name: "webkit",  use: { ...devices["Desktop Safari"]  } },
```

### Add API mocking
```typescript
await page.route('**/api/products', (route) => {
  route.fulfill({ json: { items: [] } });
});
```

### Add visual regression testing
```typescript
await expect(page).toHaveScreenshot('inventory.png');
```

---

## Further reading

| Resource | What |
|---|---|
| [CONCEPTS.md](CONCEPTS.md) | Deep explanation of every pattern — POM, fixtures, locators, TypeScript features |
| [INTERVIEW_GUIDE.md](INTERVIEW_GUIDE.md) | Common QA interview Q&A with answers grounded in this codebase |
| [Playwright docs](https://playwright.dev/docs/intro) | Official Playwright documentation |
| [Allure docs](https://allurereport.org/docs/) | Allure report configuration reference |

---

## CI badge setup

The badge at the top of this file is already wired to this repository:

```
![CI](https://github.com/StrikerLucen/Playwright-tests-and-guide-ts/actions/workflows/ci.yml/badge.svg)
```
