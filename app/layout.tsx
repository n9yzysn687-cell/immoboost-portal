import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://agentdaily.example"),
  title: { default: "ImmoBoost", template: "%s · ImmoBoost" },
  description: "Le copilote opérationnel des agents immobiliers : priorités, meilleure prochaine action et suivi préparé.",
  applicationName: "ImmoBoost",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ImmoBoost",
    description: "Chaque situation devient une meilleure prochaine action, prête à exécuter.",
    url: "/",
    siteName: "ImmoBoost",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ImmoBoost",
    description: "Le cockpit quotidien des agents immobiliers en Belgique francophone.",
  },
};

export const viewport: Viewport = {
  themeColor: "#07111f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ImmoBoost",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    description: "Copilote opérationnel immobilier avec priorisation, missions exécutables et suivi préparé.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
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
