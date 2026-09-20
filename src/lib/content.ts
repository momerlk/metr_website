export const productPages = {
  fit: {
    label: "Size recommendations · Metr Fit",
    title: "A size recommendation on your product page.",
    description:
      "Customers enter their usual size and how they like clothes to fit. Metr compares their answers with the item’s size chart, recommends a size and explains the expected fit.",
    steps: [
      [
        "Start with your chart",
        "Your brand supplies the product’s measurements for each size. Recommendations depend on that product’s approved size chart.",
      ],
      [
        "Ask about fit",
        "The customer shares their usual size and preferred fit. Some products may need additional body measurements.",
      ],
      [
        "Recommend a size",
        "Metr compares the customer’s inputs with the garment’s measurements to suggest a size for that product.",
      ],
      [
        "Explain the fit",
        "The customer sees how the size is expected to fit, such as relaxed at the chest or longer in length, before deciding to buy.",
      ],
    ],
  },
} as const;
