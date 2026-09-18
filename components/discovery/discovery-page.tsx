import Header from "@/components/Header";
import Explorer from "./explorer";
import { getDisplayEntries, getDistricts, getIngestHealth } from "@/lib/data";
import { parseFilters } from "@/lib/shared/discovery";
import { discoveryListPath, type DiscoveryListPath } from "@/lib/shared/discovery-navigation";

export default async function DiscoveryPage({ searchParams, map = false, listPath = "/" }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>; map?: boolean; listPath?: DiscoveryListPath;
}) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) if (typeof value === "string") params.set(key, value);
  return <div className="min-h-screen bg-bg"><Header />
    <Explorer entries={getDisplayEntries()} districts={getDistricts()} health={getIngestHealth()}
      initialFilters={parseFilters(params)} initialMap={map} initialSelected={params.get("selected") ?? ""}
      initialListPath={discoveryListPath(map ? "/karte" : listPath, params)}
      initialNow={new Date().toISOString()} />
  </div>;
}
