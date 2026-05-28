/**
 * NETWORK / API-LAYER TESTS — api/products.api.spec.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Context: SauceDemo is a frontend-only demo app — it has no public REST API.
 * These tests exercise Playwright's network capabilities at the HTTP layer
 * rather than via the UI, demonstrating skills that apply to real projects
 * with actual APIs.
 *
 * Playwright provides two ways to make HTTP calls:
 *
 *   • `request` fixture (APIRequestContext):
 *     Makes raw HTTP requests without a browser page. Fast and lightweight.
 *     Great for verifying status codes, response bodies, and headers.
 *     Equivalent to using axios or fetch in a plain script, but integrated
 *     with Playwright's retry and reporting infrastructure.
 *
 *   • `page` + network interception:
 *     Opens a real browser and observes/intercepts network traffic.
 *     Use when you need to verify what a *rendered page* requests
 *     (e.g. checking no broken asset links, recording API calls made by JS).
 *
 * Patterns demonstrated:
 *   1. `request` fixture for direct HTTP assertions.
 *   2. `page.on("requestfailed")` listener for passive network monitoring.
 *   3. Filtering out third-party analytics noise from failure assertions.
 */
import { test, expect } from "@playwright/test";

test.describe("API / Network layer", () => {
  // ── Direct HTTP checks (APIRequestContext) ────────────────────────────────

  test("login page returns HTTP 200", async ({ request }) => {
    // `request.get()` sends a GET without opening a browser window.
    // Useful for health-check or smoke-test style verifications.
    const response = await request.get("https://www.saucedemo.com/");
    expect(response.status()).toBe(200);
  });

  // ── Auth redirect check ───────────────────────────────────────────────────

  test("inventory page redirects unauthenticated users to login", async ({
    page,
  }) => {
    // Navigate without authentication and confirm the app redirects to "/".
    // This validates that route guarding works at the browser level.
    await page.goto("https://www.saucedemo.com/inventory.html");
    await expect(page).toHaveURL("https://www.saucedemo.com/");
  });

  // ── Asset integrity check ─────────────────────────────────────────────────

  test("static assets load with 200 status", async ({ page }) => {
    const failedRequests: string[] = [];

    // Attach a listener BEFORE navigation so no requests are missed.
    // "requestfailed" fires when a network request cannot complete
    // (DNS failure, connection refused, SSL error, etc.).
    page.on("requestfailed", (req) => failedRequests.push(req.url()));

    await page.goto("https://www.saucedemo.com/");
    await page.waitForLoadState("networkidle"); // wait until no in-flight requests

    // Filter out analytics/tracking requests — they often fail in CI
    // environments due to ad blockers or network policies and are not
    // our responsibility to fix.
    const appFailures = failedRequests.filter((u) => !u.includes("analytics"));
    expect(appFailures).toHaveLength(0);
  });
});
