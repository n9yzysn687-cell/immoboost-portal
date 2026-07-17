import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://agentdaily.example";
  return [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/invite/daily-vendeur`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];
}
