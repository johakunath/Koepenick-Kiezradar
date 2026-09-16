import { Search, LocateFixed, SlidersHorizontal, X, Sprout, Palette, Trees, Store, HandHeart } from "lucide-react";
import type { DistrictRecord } from "@/lib/types";
import { ALL_TAGS, TAG_LABELS } from "@/lib/types";
import { PERIODS, INTERESTS, type DiscoveryFilters } from "@/lib/shared/discovery";

const interestIcons = { family: Sprout, culture: Palette, outdoors: Trees, markets: Store, community: HandHeart };

export default function DiscoveryFiltersBar({ filters, update, districts, locate, locating, nearby, clearNearby, radius, setRadius, reset }: {
  filters: DiscoveryFilters; update: (patch: Partial<DiscoveryFilters>) => void; districts: DistrictRecord[];
  locate: () => void; locating: boolean; nearby: boolean; clearNearby: () => void;
  radius: number; setRadius: (radius: number) => void; reset: () => void;
}) {
  const chip = "min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors";
  return <section aria-label="Entdeckung filtern" className="discovery-filters rounded-2xl border border-border bg-card p-3 md:p-4">
    <div className="flex flex-wrap items-center gap-2">
      <div className="order-0 flex flex-1 items-center gap-4 md:flex-none md:pr-3" aria-label="Inhalte">
        {([["discover", "Entdecken"], ["news", "Kiezmeldungen"]] as const).map(([mode, label]) => <button type="button" key={mode}
          aria-pressed={filters.mode === mode} onClick={() => update({ mode, interest: "", period: "upcoming" })}
          className={`min-h-11 border-b-2 px-1 text-sm font-semibold ${filters.mode === mode ? "border-water text-water" : "border-transparent text-ink-soft hover:border-border"}`}>{label}</button>)}
      </div>
      <div className="relative order-2 min-w-0 flex-1 basis-[calc(100%-4rem)] md:order-1 md:basis-44">
        <Search size={18} aria-hidden="true" className="absolute left-3.5 top-3.5 text-ink-soft" />
        <label className="sr-only" htmlFor="discovery-search">Suche nach Thema, Ort oder Veranstaltung</label>
        <input id="discovery-search" type="search" value={filters.query} onChange={event => update({ query: event.target.value })}
          placeholder="Veranstaltung, Thema oder Ort" className="min-h-12 w-full rounded-xl border border-border bg-bg py-2 pl-11 pr-3 text-base placeholder:text-ink-mute" />
      </div>
      <button type="button" onClick={nearby ? clearNearby : locate} disabled={locating} aria-pressed={nearby}
        aria-label={locating ? "Standort wird gesucht…" : nearby ? "Nähe aktiv · zurücksetzen" : "In meiner Nähe"}
        className={`order-3 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-full border px-3 text-sm font-medium md:order-2 ${nearby ? "bg-water text-bg border-water" : "bg-bg border-border text-water hover:border-water"}`}>
        <LocateFixed size={18} aria-hidden="true" /><span className="hidden lg:inline">{locating ? "Standort wird gesucht…" : nearby ? "Nähe aktiv · zurücksetzen" : "In meiner Nähe"}</span>
      </button>
      <details className="relative order-1 md:order-3">
        <summary aria-label="Ort & Kategorie" className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border bg-bg px-3 text-sm font-medium text-water"><SlidersHorizontal size={17} aria-hidden="true" /><span className="hidden xl:inline">Ort & Kategorie</span>{filters.tag || filters.district ? <span aria-label="Filter aktiv" className="size-2 rounded-full bg-brick" /> : null}</summary>
        <div className="absolute right-0 top-full z-30 mt-2 w-[min(20rem,calc(100vw-4.5rem))] space-y-3 rounded-xl border border-border bg-card p-4 shadow-lg">
          <label className="block text-sm">Ortsteil<select value={filters.district} onChange={event => update({ district: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-border bg-bg px-2">
            <option value="">Köpenick & Umgebung</option>{districts.map(d => <option value={d.slug} key={d.slug}>{d.label}</option>)}
          </select></label>
          <label className="block text-sm">Kategorie<select value={filters.tag} onChange={event => update({ tag: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-border bg-bg px-2">
            <option value="">Alle Kategorien</option>{ALL_TAGS.map(tag => <option key={tag} value={tag}>{TAG_LABELS[tag]}</option>)}
          </select></label>
        </div>
      </details>
      {nearby && <label className="order-4 text-sm">Umkreis <select className="min-h-11 rounded-lg border border-border bg-card px-2" value={radius} onChange={e => setRadius(Number(e.target.value))}>
        <option value={2}>2 km</option><option value={5}>5 km</option><option value={10}>10 km</option>
      </select></label>}
    </div>
    {filters.mode === "discover" && <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Zeitraum">
      {Object.entries(PERIODS).map(([key, label]) => <button type="button" key={key} aria-pressed={filters.period === key}
        onClick={() => update({ period: key as DiscoveryFilters["period"] })}
        className={`${chip} ${filters.period === key ? "border-water bg-water text-bg" : "border-border text-ink-soft hover:border-water"}`}>{label}</button>)}
    </div>}
    {filters.mode === "discover" && <div className="-mx-1 mt-2 flex gap-1 overflow-x-auto border-t border-border px-1 pt-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Interessen">
      {Object.entries(INTERESTS).map(([key, label]) => {
        const Icon = interestIcons[key as keyof typeof interestIcons];
        return <button type="button" key={key} aria-pressed={filters.interest === key}
          onClick={() => update({ interest: filters.interest === key ? "" : key as DiscoveryFilters["interest"] })}
          className={`${chip} inline-flex items-center gap-2 ${filters.interest === key ? "border-reed bg-reed text-bg" : "border-transparent text-ink-soft hover:bg-bg"}`}><Icon size={16} aria-hidden="true" />{label}</button>;
      })}
    </div>}
    {(filters.query || filters.tag || filters.district || filters.interest || filters.period !== "upcoming" || nearby) &&
      <button className="mt-1 inline-flex min-h-11 items-center gap-1 px-2 text-xs text-ink-soft underline underline-offset-4" type="button" onClick={reset}><X size={14} aria-hidden="true" />Filter zurücksetzen</button>}
  </section>;
}
