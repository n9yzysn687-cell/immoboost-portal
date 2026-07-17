import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSiteUrl } from "../lib/site";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "ImmoBoost · Copilote pour agents immobiliers", template: "%s · ImmoBoost" },
  description: "Le copilote opérationnel des agents immobiliers : priorités, meilleure prochaine action et suivi préparé.",
  applicationName: "ImmoBoost",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ImmoBoost",
    description: "Chaque situation devient une meilleure prochaine action, prête à exécuter.",
    url: "/",
    siteName: "ImmoBoost",
    locale: "fr_BE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ImmoBoost",
    description: "Le cockpit quotidien des agents immobiliers en Belgique francophone.",
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#07111f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "ImmoBoost",
        url: siteUrl,
        description: "Copilote opérationnel pour agents immobiliers en Belgique francophone.",
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "ImmoBoost",
        url: siteUrl,
        inLanguage: "fr-BE",
        publisher: { "@id": `${siteUrl}/#organization` },
        audience: { "@type": "BusinessAudience", audienceType: "Agents immobiliers indépendants et petites agences" },
      },
    ],
  };

  return (
    <html lang="fr">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}
