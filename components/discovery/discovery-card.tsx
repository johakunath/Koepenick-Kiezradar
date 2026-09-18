import Link from "next/link";
import { MapPin, ArrowUpRight, ArrowRight } from "lucide-react";
import type { Entry } from "@/lib/types";
import { TAG_LABELS } from "@/lib/types";
import { formatEntryDate, isEvent, distanceKm, type Point } from "@/lib/shared/discovery";
import { hasMappableCoordinates } from "@/lib/shared/map-coordinates";

export default function DiscoveryCard({ entry, selected, onSelect, occurrences = 1, point, returnTo }: {
  entry: Entry; selected?: boolean; onSelect: () => void; occurrences?: number; point?: Point; returnTo: string;
}) {
  const event = isEvent(entry);
  const mapped = hasMappableCoordinates(entry);
  const date = event ? entry.event_start_at : entry.published_at;
  const parsed = date && Number.isFinite(Date.parse(date)) ? new Date(date) : null;
  const detailUrl = `/eintrag/${entry.slug}?from=${encodeURIComponent(returnTo)}`;
  return <article id={`result-${entry.id}`} tabIndex={-1}
    className={`discovery-card relative flex h-full flex-col rounded-2xl border bg-card p-5 md:p-6 ${selected ? "border-water ring-2 ring-water" : "border-border"}`}>
    <div className="flex items-start gap-4">
      <div aria-hidden="true" className={`flex h-[66px] w-14 shrink-0 flex-col items-center justify-center rounded-xl border ${event ? "border-reed/20 bg-reed/5 text-reed" : "border-border bg-bg text-ink-soft"}`}>
        <span className="font-display text-[28px] leading-none">{parsed ? parsed.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin", day: "2-digit" }) : "?"}</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide">{parsed ? parsed.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin", month: "short" }).replace(".", "") : "Termin"}</span>
      </div>
      <div className="min-w-0">
        <p className="mb-2 text-xs font-semibold leading-relaxed text-reed">{formatEntryDate(entry)}</p>
        <h2 className="font-display text-[21px] leading-[1.3] text-ink">
          <Link className="decoration-water decoration-1 underline-offset-4 hover:underline focus-visible:underline" href={detailUrl}>{entry.title}</Link>
        </h2>
      </div>
    </div>
    <p className="mt-4 flex flex-wrap items-start gap-1.5 text-sm leading-relaxed text-ink-soft"><MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span className="flex-1">{entry.venue || entry.location || "Ort noch offen"}</span>
      {point && mapped && <span className="font-medium text-water">ca. {distanceKm(point, entry).toFixed(1)} km</span>}
    </p>
    {entry.summary_origin !== "fallback" && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{entry.ai_summary}</p>}
    <div className="my-4 flex flex-wrap gap-1.5">{entry.tags.map(tag => <span key={tag} className="rounded-full bg-bg-deep/70 px-2.5 py-1 text-[11px] font-medium text-ink-soft">{TAG_LABELS[tag]}</span>)}</div>
    {occurrences > 1 && <Link href={detailUrl} className="mb-3 inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-reed hover:underline">+ {occurrences - 1} {occurrences === 2 ? "weiterer Termin" : "weitere Termine"} in dieser Auswahl <ArrowRight size={13} aria-hidden="true" /></Link>}
    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-ink-soft">
      <a className="inline-flex min-h-11 items-center gap-1 underline-offset-4 hover:underline" href={entry.source_url} target="_blank" rel="noopener noreferrer">
        {entry.source}<ArrowUpRight size={13} aria-hidden="true" />
      </a>
      {mapped ? <button type="button" onClick={onSelect} aria-pressed={selected} className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 font-semibold transition-colors ${selected ? "border-water bg-water text-bg" : "border-border text-water hover:bg-bg"}`}>
        <MapPin size={14} aria-hidden="true" />{selected ? "Auf Karte gewählt" : "Auf Karte"}
      </button> : <span className="text-[11px]">Ohne genauen Kartenpunkt</span>}
    </div>
  </article>;
}
