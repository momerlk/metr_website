import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return process.env.SITE_URL
    ? ["", "/discover", "/fit", "/developers", "/about", "/access"].map(
        (path) => ({ url: `${process.env.SITE_URL}${path}` }),
      )
    : [];
}
