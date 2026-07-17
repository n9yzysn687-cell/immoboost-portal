import type { MetadataRoute } from "next";
import { seoSituations } from "../lib/seo-situations";
import { editorialDate, getSiteUrl } from "../lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return [
    { url: `${base}/`, lastModified: editorialDate, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/situations`, lastModified: editorialDate, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/methode`, lastModified: editorialDate, changeFrequency: "monthly", priority: 0.6 },
    ...seoSituations.map((situation) => ({
      url: `${base}/situations/${situation.slug}`,
      lastModified: editorialDate,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
