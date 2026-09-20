import type { MetadataRoute } from "next";
import { fitDocs, docsHref } from "@/lib/fit-docs";
export default function sitemap(): MetadataRoute.Sitemap {
  return process.env.SITE_URL
    ? ["", "/fit", "/developers", "/about", "/access", ...fitDocs.map(page => docsHref(page.slug))].map(
        (path) => ({ url: `${process.env.SITE_URL}${path}` }),
      )
    : [];
}
