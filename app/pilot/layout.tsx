import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pilotes privés · ImmoBoost",
  robots: { index: false, follow: false, nocache: true },
};

export default function PilotLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
