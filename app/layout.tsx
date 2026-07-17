import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://agentdaily.example"),
  title: { default: "Agent Daily", template: "%s · Agent Daily" },
  description: "L’assistant opérationnel des agents immobiliers : une situation, les bons experts et un kit prêt à utiliser.",
  applicationName: "Agent Daily",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Agent Daily",
    description: "Une situation. Les bons experts. Une mission prête à exécuter.",
    url: "/",
    siteName: "Agent Daily",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Daily",
    description: "Le cockpit quotidien des agents immobiliers francophones.",
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
    description: "Assistant opérationnel immobilier avec experts métiers et kits mission prêts à utiliser.",
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
