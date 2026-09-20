import { test } from "node:test";
import assert from "node:assert/strict";
import { validateAnswers, validateId } from "../src/lib/fit.ts";
const answers = { usual_size: "M", size_consistency: "consistent" };
test("fit answers accept questionnaire fields and reject anything else", () => {
  assert.deepEqual(validateAnswers({ ...answers, preferred_fit: "", note: "x" }), answers);
  assert.deepEqual(
    validateAnswers({ ...answers, height_cm: "176", measurements: { chest: "98", waist: "" } }),
    { ...answers, height_cm: 176, measurements: { chest: 98 } },
  );
  for (const input of [
    null,
    [],
    { usual_size: "M" },
    { ...answers, size_consistency: "nonsense" },
    { ...answers, preferred_fit: "snug" },
    { ...answers, height_cm: 15 },
    { ...answers, measurements: { chest: 900 } },
    { ...answers, measurements: { "chest; drop": 90 } },
  ])
    assert.throws(() => validateAnswers(input));
});
test("fit identifiers stay opaque API ids", () => {
  assert.equal(validateId("prd_ca4bf6e03b"), "prd_ca4bf6e03b");
  for (const input of ["../../etc", "a".repeat(65), "", 7, null])
    assert.throws(() => validateId(input));
});
