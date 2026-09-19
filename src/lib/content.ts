export const productPages = {
  discover: {
    label: "Metr Discover",
    title: "Your catalog, read through intent.",
    description:
      "Customers describe what they want in their own words. Metr works out what they mean, retrieves from your live catalog, and explains each match.",
    steps: [
      [
        "Understand",
        "A natural request becomes structured intent: occasion, budget, colour, fit, register and the things the customer did not say.",
      ],
      [
        "Retrieve",
        "Semantic similarity, structured attributes and stock state, run against the merchant’s real catalog. Nothing is invented.",
      ],
      [
        "Rank",
        "Candidates are ordered against the whole request, so a budget or an occasion changes the result, not just the wording.",
      ],
      [
        "Explain",
        "Each result comes with the reason it matched, and room for the customer to refine.",
      ],
    ],
  },
  fit: {
    label: "Metr Fit",
    title: "Size charts, turned into a decision.",
    description:
      "Metr Fit reads a garment’s own points of measure against the customer’s usual size and preferred fit, then recommends one size and says how it will sit.",
    steps: [
      [
        "Product-specific",
        "A medium is not a medium across your range. Fit evaluates sizing in the context of the actual garment’s chart.",
      ],
      [
        "Customer-specific",
        "Usual size, preferred fit and, where a product needs it, a few body-profile inputs. No more than the garment requires.",
      ],
      [
        "Explainable",
        "More than a letter. Shoulders, chest, length: how the recommended size is expected to sit, area by area.",
      ],
      [
        "Grounded",
        "Recommendations start from the merchant’s approved size chart and the variants actually in stock.",
      ],
    ],
  },
} as const;
