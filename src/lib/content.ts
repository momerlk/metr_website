export const productPages = {
  discover: {
    label: "Product search · Metr Discover",
    title: "AI product search for your fashion store.",
    description:
      "Customers type requests like ‘a black shirt under Rs 5,000’. Metr searches your product catalog and shows matching clothes, prices and links to buy them on your website.",
    steps: [
      [
        "Describe the need",
        "The customer types what they want: an occasion, colour, style or budget. They do not need to know your product names.",
      ],
      [
        "Search your catalog",
        "Metr uses your product descriptions, prices and stock data to find suitable items available in your store.",
      ],
      [
        "Show the matches",
        "The customer sees products that match their request, along with prices and a short explanation of why each was selected.",
      ],
      [
        "Continue shopping",
        "The customer opens a product in your store to choose a size and buy through your existing checkout.",
      ],
    ],
  },
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
