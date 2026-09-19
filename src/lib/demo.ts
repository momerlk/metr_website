export const examples = [
  {
    short: "The dinner plan",
    query: "Something black for a dinner. Under Rs 5,000, nothing too formal.",
    intent: [
      ["Occasion", "Dinner"],
      ["Colour", "Black"],
      ["Budget", "< Rs 5,000"],
      ["Register", "Smart casual"],
    ],
    products: [
      {
        name: "Relaxed camp collar",
        type: "shirt",
        color: "#282824",
        price: "4,200",
        matched: "colour · budget · register",
      },
      {
        name: "Everyday straight trouser",
        type: "trousers",
        color: "#252523",
        price: "4,800",
        matched: "colour · budget",
      },
      {
        name: "Essential heavyweight tee",
        type: "tee",
        color: "#30302b",
        price: "2,900",
        matched: "colour · budget · register",
      },
    ],
    explanation:
      "Black pieces with relaxed lines that read put-together, not formal. All three sit under the budget and are in stock.",
  },
  {
    short: "The everyday edit",
    query: "Oversized neutral tees for everyday wear.",
    intent: [
      ["Category", "T-shirts"],
      ["Fit", "Oversized"],
      ["Colour", "Neutral"],
      ["Use", "Everyday"],
    ],
    products: [
      {
        name: "Heavyweight cotton tee",
        type: "tee",
        color: "#c2b8a2",
        price: "2,900",
        matched: "fit · colour",
      },
      {
        name: "Everyday oversized tee",
        type: "tee",
        color: "#7d7b6c",
        price: "2,600",
        matched: "fit · colour · use",
      },
      {
        name: "Essential boxy tee",
        type: "tee",
        color: "#d8d3c7",
        price: "3,200",
        matched: "fit · colour",
      },
    ],
    explanation:
      "Three tees cut oversized or boxy, in sand, stone and chalk. Filtered to the fit attribute, not the word in the title.",
  },
  {
    short: "Smart, not formal",
    query: "A black outfit that feels smart but not formal.",
    intent: [
      ["Request", "Full outfit"],
      ["Colour", "Black"],
      ["Register", "Smart casual"],
      ["Fit", "Relaxed"],
    ],
    products: [
      {
        name: "Textured overshirt",
        type: "shirt",
        color: "#30302c",
        price: "4,600",
        matched: "colour · register",
      },
      {
        name: "Tailored relaxed trouser",
        type: "trousers",
        color: "#282824",
        price: "4,900",
        matched: "colour · register · fit",
      },
      {
        name: "Minimal cotton shirt",
        type: "shirt",
        color: "#20201e",
        price: "3,800",
        matched: "colour · register",
      },
    ],
    explanation:
      "An outfit, not a list: a top, a trouser and a layer that work together. Textures carry the interest so nothing reads as officewear.",
  },
] as const;
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
