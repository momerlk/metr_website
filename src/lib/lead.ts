export type Lead = {
  name: string;
  email: string;
  brand: string;
  website: string;
  platform: string;
  orders: string;
  interest: string;
  message: string;
};
export function validateLead(input: unknown): Lead {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Please complete the required fields.");
  const data = input as Record<string, unknown>;
  const text = (key: string, max: number, optional = false) => {
    const value = data[key];
    if (
      typeof value !== "string" ||
      value.trim().length > max ||
      (!optional && !value.trim())
    )
      throw new Error(`Please enter a valid ${key}.`);
    return value.trim();
  };
  const name = text("name", 100),
    email = text("email", 254).toLowerCase(),
    brand = text("brand", 100),
    website = text("website", 500),
    platform = text("platform", 30),
    orders = text("orders", 30),
    interest = text("interest", 30),
    message = text("message", 2000, true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Please enter a valid work email.");
  let url: URL;
  try {
    url = new URL(website);
  } catch {
    throw new Error("Please enter a complete website URL.");
  }
  if (
    !["https:", "http:"].includes(url.protocol) ||
    !url.hostname.includes(".") ||
    url.username ||
    url.password
  )
    throw new Error("Please enter a valid public website URL.");
  if (
    !["Shopify", "WooCommerce", "Custom", "Other"].includes(platform) ||
    !["<100", "100–500", "500–2,000", "2,000+"].includes(orders) ||
    !["Discover", "Fit", "Both"].includes(interest)
  )
    throw new Error(
      "Please select the platform, order range, and product interest.",
    );
  return {
    name,
    email,
    brand,
    website: url.href,
    platform,
    orders,
    interest,
    message,
  };
}
