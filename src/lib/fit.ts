// Metr Fit API types and trust-boundary validation for the live demo.
// Secret keys stay on the server; the browser only talks to /api/fit.
export type Question = {
  id: string;
  section?: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  help?: string;
  unit?: "cm" | "in" | "kg";
  min?: number | null;
  max?: number | null;
};
export type Questionnaire = {
  product_id: string;
  chart_id: string;
  chart_revision: number;
  version: string;
  category: string;
  questions: Question[];
  available_sizes: string[];
};
export type Recommendation = {
  recommended_size: string;
  confidence: number;
  confidence_meaning: string;
  fit: Record<string, string>;
  explanation: string;
  warnings: string[];
  algorithm_version: string;
  chart_revision: number;
};
export type FitProduct = { id: string; title: string; product_type: string };
export type Answers = {
  body_type?: string;
  silhouette_shoulders?: string;
  silhouette_waist?: string;
  silhouette_hips?: string;
  silhouette_thigh?: string;
  usual_size: string;
  size_consistency: string;
  preferred_fit?: string;
  shoulder_profile?: string;
  chest_profile?: string;
  waist_profile?: string;
  hip_profile?: string;
  height_cm?: number;
  weight_kg?: number;
  upper_body_profile?: string;
  lower_body_profile?: string;
  measurements?: Record<string, number>;
};
export type FitConfig = { url: string; key: string; store: string };
export function fitConfig(): FitConfig | null {
  const url = process.env.METR_API_URL?.trim();
  const key = process.env.METR_API_KEY?.trim();
  const store = process.env.METR_STORE_ID?.trim();
  if (!url || !key || !store) return null;
  return { url: url.replace(/\/+$/, ""), key, store };
}
export const silhouetteSteps = { silhouette_shoulders: "tops_shoulders", silhouette_waist: "tops_waist_stomach", silhouette_hips: "bottoms_hips_seat", silhouette_thigh: "bottoms_thigh_legs" };
const profiles = ["narrow", "average", "broad"];
const selects: Record<string, string[] | null> = {
  body_type: ["1", "2", "3", "4", "5", "6"],
  usual_size: null,
  size_consistency: ["sometimes_smaller", "consistent", "sometimes_larger"],
  preferred_fit: ["close", "regular", "loose"],
  shoulder_profile: profiles,
  chest_profile: profiles,
  waist_profile: profiles,
  hip_profile: profiles,
  upper_body_profile: ["balanced", "fuller_chest", "fuller_waist"],
  lower_body_profile: ["balanced", "fuller_hips", "fuller_waist"],
};
export function validateId(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(value))
    throw new Error("Invalid identifier.");
  return value;
}
/** Accepts only the answer fields the Fit questionnaire defines. */
export function validateAnswers(input: unknown): Answers {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Please answer the questions.");
  const data = input as Record<string, unknown>;
  const answers: Record<string, unknown> = {};
  for (const [id, options] of Object.entries(selects)) {
    const value = data[id];
    if (value === undefined || value === "") continue;
    if (typeof value !== "string" || value.length > 40)
      throw new Error(`Invalid answer for ${id}.`);
    if (options && !options.includes(value))
      throw new Error(`Invalid answer for ${id}.`);
    answers[id] = value;
  }
  if (typeof answers.usual_size !== "string" || typeof answers.size_consistency !== "string")
    throw new Error("Please answer the required questions.");
  for (const [id, min, max, unit] of [["height_cm", 120, 230, "cm"], ["weight_kg", 30, 300, "kg"]] as const) {
    const raw = data[id];
    if (raw === undefined || raw === "") continue;
    if ((typeof raw !== "string" && typeof raw !== "number") || (typeof raw === "string" && !raw.trim()))
      throw new Error(`Enter a valid ${id === "height_cm" ? "height" : "weight"}.`);
    const value = Number(raw);
    if (!Number.isFinite(value) || value < min || value > max)
      throw new Error(id === "height_cm" ? "Height must be between 3 ft 11.25 in and 7 ft 6.5 in." : `Weight must be between ${min} and ${max} ${unit}.`);
    answers[id] = value;
  }
  for (const [field, asset] of Object.entries(silhouetteSteps)) {
    const value = data[field];
    if (value === undefined || value === "") continue;
    if (typeof value !== "string" || !new RegExp(`^(female|male)_${asset}:[1-6]$`).test(value)) throw new Error("Invalid illustration selection.");
    answers[field] = value;
  }
  const source = data.measurements;
  if (source && typeof source === "object" && !Array.isArray(source)) {
    const measurements: Record<string, number> = {};
    for (const [name, raw] of Object.entries(source as Record<string, unknown>)) {
      if (raw === undefined || raw === "") continue;
      if (!/^[a-z_]{1,40}$/.test(name)) throw new Error("Invalid measurement.");
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 1 || value > 300)
        throw new Error("Body measurements must be between 0.4 and 118.1 inches.");
      measurements[name] = value;
    }
    if (Object.keys(measurements).length > 8) throw new Error("Too many measurements.");
    if (Object.keys(measurements).length) answers.measurements = measurements;
  }
  return answers as Answers;
}

/** Every API question appears once; older API questionnaires work without section metadata. */
export function quizSteps(questions: Question[]) {
  const groups = [
    { id: "usual_size", title: "Your usual size" },
    { id: "shoulders", title: "Your shoulders" },
    { id: "body_profile", title: "Your body shape" },
    { id: "height_weight", title: "Height and weight" },
    { id: "fit_preference", title: "How you like it to fit" },
    { id: "measurements", title: "Add measurements" },
  ];
  function group(q: Question) {
    if (q.id === "shoulder_profile" || q.id === "silhouette_shoulders") return "shoulders";
    if (q.id.startsWith("measurements.")) return "measurements";
    if (q.id === "usual_size" || q.id === "size_consistency") return "usual_size";
    if (q.id === "height_cm" || q.id === "weight_kg") return "height_weight";
    if (q.id === "preferred_fit") return "fit_preference";
    return "body_profile";
  }
  return groups.map(step => ({ ...step, questions: questions.filter(q => group(q) === step.id).sort((a, b) => Number(b.id === "body_type") - Number(a.id === "body_type")) }))
    .filter(step => step.questions.length > 0)
    .map(step => ({ ...step, title: step.id === "height_weight" && step.questions.length === 1
      ? (step.questions[0].id === "height_cm" ? "Your height" : "Your weight") : step.title }));
}

// Customer-facing imperial draft; the API continues to receive canonical cm.
export function quizAnswerPayload(draft: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const measurements: Record<string, number> = {};
  for (const [id, raw] of Object.entries(draft)) {
    if (!raw || raw === ":") continue;
    if (id === "height_cm") {
      const parts = raw.split(":");
      const [feet, inches] = parts.map(Number);
      const cm = (feet * 12 + inches) * 2.54;
      if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim() || !Number.isInteger(feet) || !Number.isFinite(inches) || inches < 0 || inches >= 12 || cm < 120 || cm > 230)
        throw new Error("Enter both feet and inches, between 3 ft 11.25 in and 7 ft 6.5 in.");
      result[id] = Math.round(cm * 10000) / 10000;
    } else if (id.startsWith("measurements.")) {
      const inches = Number(raw);
      if (!raw.trim() || !Number.isFinite(inches) || inches * 2.54 < 1 || inches * 2.54 > 300)
        throw new Error("Enter body measurements between 0.4 and 118.1 inches.");
      measurements[id.slice(13)] = Math.round(inches * 2.54 * 10000) / 10000;
    } else result[id] = raw;
  }
  if (Object.keys(measurements).length) result.measurements = measurements;
  return result;
}

