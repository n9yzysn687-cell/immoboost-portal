import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ImmoBoost™",
  description: "Le workspace intelligent des professionnels de l'immobilier.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
