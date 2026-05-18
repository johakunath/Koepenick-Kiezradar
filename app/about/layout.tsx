import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Über den Kiezradar – Köpenick Kiezradar",
  description: "Wie der Köpenick Kiezradar funktioniert — automatische Aggregation öffentlicher Meldungen für Berlin-Köpenick.",
  openGraph: {
    title: "Über den Kiezradar – Köpenick Kiezradar",
    description: "Wie der Köpenick Kiezradar funktioniert — automatische Aggregation öffentlicher Meldungen für Berlin-Köpenick.",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
