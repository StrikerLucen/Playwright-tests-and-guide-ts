/**
 * TEST DATA — Users
 * ─────────────────────────────────────────────────────────────────────────────
 * Why centralize credentials here instead of writing them in each test?
 *
 *   1. Single source of truth — a password change is a one-line edit here,
 *      not a grep-and-replace across every spec file.
 *   2. Named references (Users.locked) make test intent obvious without
 *      a comment explaining what "locked_out_user" means.
 *   3. TypeScript's `as const` makes every value a *literal type*, e.g.
 *      username is "standard_user" (not the broad type `string`). This
 *      enables autocomplete and prevents accidental reassignment.
 *
 * SauceDemo ships with these built-in test accounts — no setup required.
 */
export const Users = {
  /** Normal user: can log in and complete a full purchase. */
  standard: {
    username: "standard_user",
    password: "secret_sauce",
  },
  /** Blocked by the application — login returns an error banner. */
  locked: {
    username: "locked_out_user",
    password: "secret_sauce",
  },
  /** Does not exist — tests that credentials are validated server-side. */
  invalid: {
    username: "invalid_user",
    password: "wrong_password",
  },
} as const;

/**
 * Utility type: "standard" | "locked" | "invalid"
 *
 * `keyof typeof Users` reads the keys of the Users object at the type level.
 * Useful when a function should accept any valid user key as a parameter.
 */
export type UserKey = keyof typeof Users;
