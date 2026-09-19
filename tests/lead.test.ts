import { test } from "node:test";
import assert from "node:assert/strict";
import { validateLead } from "../src/lib/lead.ts";
import { demoSize, examples } from "../src/lib/demo.ts";
const lead = {
  name: "Test Merchant",
  email: "TEST@example.com",
  brand: "Example",
  website: "https://example.com",
  platform: "Shopify",
  orders: "100–500",
  interest: "Both",
  message: "",
};
test("lead validation normalizes valid data and rejects invalid trust-boundary inputs", () => {
  assert.equal(validateLead(lead).email, "test@example.com");
  for (const input of [
    null,
    [],
    { ...lead, email: "invalid" },
    { ...lead, website: "javascript:alert(1)" },
    { ...lead, website: "https://user:password@example.com" },
    { ...lead, platform: "Unsupported" },
    { ...lead, name: " " },
    { ...lead, message: "a".repeat(2001) },
  ])
    assert.throws(() => validateLead(input));
});
test("illustrative fit sizes stay in range and discovery examples respect stated budget", () => {
  assert.equal(demoSize("XS", "Close"), "XS");
  assert.equal(demoSize("XL", "Oversized"), "XL");
  assert.equal(demoSize("M", "Relaxed"), "M");
  assert.equal(demoSize("M", "Oversized"), "L");
  for (const product of examples[0].products)
    assert.ok(Number(product.price.replace(",", "")) < 5000);
});
