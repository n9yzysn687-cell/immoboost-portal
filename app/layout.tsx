import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://agentdaily.example"),
  title: { default: "Agent Daily", template: "%s · Agent Daily" },
  description: "Cockpit IA premium pour professionnels de l’immobilier : Mission Brain, experts métiers, crédits signés et kits mission complets.",
  applicationName: "Agent Daily",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Agent Daily",
    description: "Transformez chaque situation immobilière en mission prête à exécuter.",
    url: "/",
    siteName: "Agent Daily",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Daily",
    description: "Mission Brain, experts métiers et portefeuille de crédits signé côté serveur.",
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
    name: "Agent Daily",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    description: "Cockpit IA immobilier avec experts métiers, kits mission, crédits signés et transparence des données.",
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
