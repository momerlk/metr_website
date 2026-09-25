import { test } from "node:test";
import assert from "node:assert/strict";
import { validateAnswers, validateId, quizSteps } from "../src/lib/fit.ts";
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

test("weight and paired profiles are validated without coercing objects", () => {
  assert.deepEqual(validateAnswers({ ...answers, weight_kg: "72.5", upper_body_profile: "fuller_chest", lower_body_profile: "balanced" }),
    { ...answers, upper_body_profile: "fuller_chest", lower_body_profile: "balanced", weight_kg: 72.5 });
  for (const value of [null, true, [], [70], {}, " ", "NaN", 29, 301]) {
    assert.throws(() => validateAnswers({ ...answers, weight_kg: value }));
  }
  assert.throws(() => validateAnswers({ ...answers, upper_body_profile: "fuller_hips" }));
});

test("quiz steps expose every question once and omit irrelevant empty steps", () => {
  const ids = ["usual_size", "size_consistency", "shoulder_profile", "chest_profile", "upper_body_profile", "height_cm", "weight_kg", "preferred_fit", "measurements.chest"];
  const questions = ids.map(id => ({ id, label: id, type: "single_select", required: false }));
  const steps = quizSteps(questions);
  assert.deepEqual(steps.map(step => step.id), ["usual_size", "shoulders", "body_profile", "height_weight", "fit_preference", "measurements"]);
  assert.deepEqual(steps.flatMap(step => step.questions.map(q => q.id)).sort(), [...ids].sort());
  const shoes = quizSteps(questions.filter(q => ["usual_size", "size_consistency"].includes(q.id)));
  assert.deepEqual(shoes.map(step => step.id), ["usual_size"]);
});

test("imperial quiz converts once and preserves kilograms and visual selection", async () => {
  const { quizAnswerPayload } = await import("../src/lib/fit.ts");
  const draft = { ...answers, height_cm: "5:8", weight_kg: "72.5", body_type: "4", "measurements.chest": "40" };
  assert.deepEqual(validateAnswers(quizAnswerPayload(draft)), { ...answers, body_type: "4", height_cm: 172.72, weight_kg: 72.5, measurements: { chest: 101.6 } });
  assert.equal(draft.height_cm, "5:8");
  assert.deepEqual(quizAnswerPayload({ height_cm: ":", "measurements.chest": "" }), {});
  for (const height_cm of ["5:", ":8", "5:12", "5:-1", "2:0", "8:0", "NaN:0", "5:8:1"]) assert.throws(() => quizAnswerPayload({ height_cm }));
  for (const value of ["7", "0", 4, "hourglass"]) assert.throws(() => validateAnswers({ ...answers, body_type: value }));
  assert.equal(validateAnswers({ ...answers, silhouette_waist: "male_tops_waist_stomach:4" }).silhouette_waist, "male_tops_waist_stomach:4");
  for (const value of ["4", "male_tops_waist_stomach:7", "female_bottoms_hips_seat:1", true]) assert.throws(() => validateAnswers({ ...answers, silhouette_waist: value }));
});

test("supplied illustration options retain their asset identity and files", async () => {
  const { fitAssets } = await import("../src/lib/fit-assets.ts");
  const { silhouetteSteps } = await import("../src/lib/fit.ts");
  const { readFileSync } = await import("node:fs");
  assert.equal(Object.keys(fitAssets).length, 8);
  for (const [field, suffix] of Object.entries(silhouetteSteps)) {
    for (const track of ["female", "male"]) {
      const asset = `${track}_${suffix}`;
      assert.equal(fitAssets[asset].length, 6);
      const image = readFileSync(new URL(`../public/fit/${asset}.png`, import.meta.url));
      assert.equal(image.readUInt32BE(16), 1122);
      assert.equal(image.readUInt32BE(20), 1402);
      for (let n = 1; n <= 6; n++) assert.equal((validateAnswers({ ...answers, [field]: `${asset}:${n}` }) as Record<string, unknown>)[field], `${asset}:${n}`);
    }
  }
});
