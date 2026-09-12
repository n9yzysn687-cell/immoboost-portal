import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ImmoBoost AI™ — Votre assistant immobilier intelligent",
  description: "Décrivez une situation. ImmoBoost la comprend et prépare immédiatement votre kit d'action complet.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
