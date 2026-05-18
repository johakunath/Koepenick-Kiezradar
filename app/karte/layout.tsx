import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Karte – Köpenick Kiezradar",
  description: "Alle Meldungen auf der Karte — Treptow-Köpenick auf einen Blick.",
  openGraph: {
    title: "Karte – Köpenick Kiezradar",
    description: "Alle Meldungen auf der Karte — Treptow-Köpenick auf einen Blick.",
  },
};

export default function KarteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
