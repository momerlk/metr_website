// Metr Fit API types and trust-boundary validation for the live demo.
// Secret keys stay on the server; the browser only talks to /api/fit.
export type Question = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  help?: string;
  unit?: "cm" | "in";
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
  usual_size: string;
  size_consistency: string;
  preferred_fit?: string;
  shoulder_profile?: string;
  chest_profile?: string;
  waist_profile?: string;
  hip_profile?: string;
  height_cm?: number;
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
const profiles = ["narrow", "average", "broad"];
const selects: Record<string, string[] | null> = {
  usual_size: null,
  size_consistency: ["sometimes_smaller", "consistent", "sometimes_larger"],
  preferred_fit: ["close", "regular", "loose"],
  shoulder_profile: profiles,
  chest_profile: profiles,
  waist_profile: profiles,
  hip_profile: profiles,
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
  if (data.height_cm !== undefined && data.height_cm !== "") {
    const height = Number(data.height_cm);
    if (!Number.isFinite(height) || height < 120 || height > 230)
      throw new Error("Height must be between 120 and 230 cm.");
    answers.height_cm = height;
  }
  const source = data.measurements;
  if (source && typeof source === "object" && !Array.isArray(source)) {
    const measurements: Record<string, number> = {};
    for (const [name, raw] of Object.entries(source as Record<string, unknown>)) {
      if (raw === undefined || raw === "") continue;
      if (!/^[a-z_]{1,40}$/.test(name)) throw new Error("Invalid measurement.");
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 1 || value > 300)
        throw new Error("Body measurements must be between 1 and 300 cm.");
      measurements[name] = value;
    }
    if (Object.keys(measurements).length > 8) throw new Error("Too many measurements.");
    if (Object.keys(measurements).length) answers.measurements = measurements;
  }
  return answers as Answers;
}
