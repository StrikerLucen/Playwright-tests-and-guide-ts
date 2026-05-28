/**
 * TEST DATA — Products
 * ─────────────────────────────────────────────────────────────────────────────
 * Known product names on SauceDemo. Using named constants (Products.backpack)
 * instead of raw strings in tests means:
 *
 *   • A product name change on the site is a one-line fix here.
 *   • Tests read like plain English: addToCart(Products.backpack).
 *   • Typos become compile-time errors (Products.backpac → red underline).
 *
 * `as const` freezes the object so TypeScript infers narrow literal types
 * ("Sauce Labs Backpack") rather than the wide `string` type.
 */
export const Products = {
  backpack:     "Sauce Labs Backpack",
  bikeLight:    "Sauce Labs Bike Light",
  boltTShirt:   "Sauce Labs Bolt T-Shirt",
  fleeceJacket: "Sauce Labs Fleece Jacket",
} as const;

/**
 * Union type of all product keys: "backpack" | "bikeLight" | "boltTShirt" | "fleeceJacket"
 * Lets you write functions that only accept valid product identifiers.
 */
export type ProductKey = keyof typeof Products;
