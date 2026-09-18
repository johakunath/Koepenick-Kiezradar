import type { Metadata } from "next";
import DiscoveryPage from "@/components/discovery/discovery-page";
export const metadata: Metadata = { title: "Termine entdecken – Köpenick Kiezradar", description: "Heute, am Wochenende und demnächst: Termine in Köpenick und Umgebung." };
export default async function TerminePage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <DiscoveryPage {...props} listPath="/termine" />;
}
