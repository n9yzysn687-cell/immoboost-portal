const fallbackUrl = "https://immoboost-portal.vercel.app";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionHost) return `https://${productionHost}`.replace(/\/$/, "");

  return fallbackUrl;
}

export const siteName = "ImmoBoost";
export const editorialDate = "2026-07-17";
