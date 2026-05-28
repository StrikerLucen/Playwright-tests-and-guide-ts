import { defineConfig, devices } from "@playwright/test";

/**
 * PLAYWRIGHT CONFIGURATION
 * ─────────────────────────────────────────────────────────────────────────────
 * This file is the single control panel for the entire test suite.
 * Changing a value here affects every test — no need to touch spec files.
 *
 * Full reference: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Where Playwright looks for *.spec.ts files (relative to this file).
  testDir: "./tests",

  // Maximum time one test can run. Raise if your app is slow on CI.
  timeout: 30_000,

  // Timeout for every individual expect() assertion.
  expect: { timeout: 5_000 },

  // Each test *file* gets its own worker and runs in parallel.
  // Tests *within* a file run sequentially (default behaviour).
  fullyParallel: true,

  // Prevents accidentally committing `test.only()`.
  // On CI the suite will fail immediately instead of silently running one test.
  forbidOnly: !!process.env.CI,

  // Retry failed tests on CI to absorb transient network flakiness.
  // Never retry locally — instant feedback is more important than green.
  retries: process.env.CI ? 2 : 0,

  // Limit parallelism on CI shared runners; unrestricted locally.
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    // "list" streams test results to the terminal line-by-line in real time.
    ["list"],

    // "allure-playwright" writes raw JSON files that the `allure` CLI (or CI
    // artifact viewer) turns into an interactive HTML report.
    // Install Allure CLI: npm i -g allure-commandline
    // Generate report: allure generate allure-results -o allure-report
    [
      "allure-playwright",
      {
        detail: true,              // include step-level details in the report
        outputFolder: "allure-results", // raw JSON output folder
        suiteTitle: false,         // use describe() block names, not file names
      },
    ],
  ],

  use: {
    // All page.goto("/path") calls resolve relative to this URL.
    // This is why test files can write goto("/inventory.html") without the domain.
    baseURL: "https://www.saucedemo.com",

    // Capture a full Playwright trace (.zip) on the *first* retry only.
    // Open with: npx playwright show-trace trace.zip
    // Invaluable for debugging flaky tests without re-running them.
    trace: "on-first-retry",

    // Keep artifacts lean: screenshot only when a test fails.
    screenshot: "only-on-failure",
  },

  projects: [
    {
      // Run on Desktop Chrome. Add more entries for cross-browser coverage:
      //   { name: "firefox",  use: { ...devices["Desktop Firefox"] } }
      //   { name: "webkit",   use: { ...devices["Desktop Safari"] } }
      //   { name: "mobile",   use: { ...devices["iPhone 14"] } }
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
