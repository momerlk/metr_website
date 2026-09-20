export const sizes = ["XS", "S", "M", "L", "XL"] as const;
// ponytail: one sample garment's point-of-measure table, cm. Real charts come from the merchant.
export const sizeChart = {
  chest: [52, 55, 58, 61, 64],
  length: [66, 68, 70, 72, 74],
  shoulder: [46, 48, 50, 52, 54],
} as const;
export function demoSize(size: string, preference: string) {
  const index = sizes.indexOf(size as (typeof sizes)[number]);
  return sizes[
    Math.min(
      sizes.length - 1,
      Math.max(
        0,
        index +
          (preference === "Oversized" ? 1 : preference === "Close" ? -1 : 0),
      ),
    )
  ];
}
export function fitSummary(preference: string) {
  return {
    shoulders: preference === "Close" ? "Close to the body" : "Sits easy",
    chest:
      preference === "Oversized"
        ? "Roomy"
        : preference === "Close"
          ? "Close"
          : "Relaxed",
    length: preference === "Oversized" ? "Longer" : "Regular",
  };
}
