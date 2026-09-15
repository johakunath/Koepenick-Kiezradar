import Header from "@/components/Header";
import Explorer from "./explorer";
import { getDisplayEntries, getDistricts, getIngestHealth } from "@/lib/data";
import { parseFilters } from "@/lib/shared/discovery";

export default async function DiscoveryPage({ searchParams, map = false }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>; map?: boolean;
}) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) if (typeof value === "string") params.set(key, value);
  return <div className="min-h-screen bg-bg"><Header />
    <Explorer entries={getDisplayEntries()} districts={getDistricts()} health={getIngestHealth()}
      initialFilters={parseFilters(params)} initialMap={map} initialSelected={params.get("selected") ?? ""}
      initialNow={new Date().toISOString()} />
  </div>;
}
