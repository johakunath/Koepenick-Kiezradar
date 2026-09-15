import Link from "next/link";
import { MapPin, ArrowUpRight, CalendarDays } from "lucide-react";
import type { Entry } from "@/lib/types";
import { TAG_LABELS } from "@/lib/types";
import { formatEntryDate, isEvent, distanceKm, type Point } from "@/lib/shared/discovery";
import { hasMappableCoordinates } from "@/lib/shared/map-coordinates";

export default function DiscoveryCard({ entry, selected, onSelect, occurrences = 1, point, returnTo }: {
  entry: Entry; selected?: boolean; onSelect: () => void; occurrences?: number; point?: Point; returnTo: string;
}) {
  const event = isEvent(entry);
  const mapped = hasMappableCoordinates(entry);
  return <article id={`result-${entry.id}`} tabIndex={-1}
    className={`discovery-card relative rounded-lg border p-5 bg-card ${selected ? "border-water ring-2 ring-water" : "border-border"}`}>
    <p className={`mb-2 flex items-center gap-2 text-sm font-semibold ${event ? "text-reed" : "text-ink-soft"}`}>
      <CalendarDays size={15} aria-hidden="true" />{formatEntryDate(entry)}
    </p>
    <h2 className="font-display text-xl leading-snug text-ink">
      <Link className="hover:underline focus-visible:underline" href={`/eintrag/${entry.slug}?from=${encodeURIComponent(returnTo)}`}>{entry.title}</Link>
    </h2>
    <p className="mt-2 flex items-start gap-1.5 text-sm text-ink-soft"><MapPin size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
      {entry.venue || entry.location || "Ort noch offen"}
      {point && mapped && <span className="shrink-0">· ca. {distanceKm(point, entry).toFixed(1)} km</span>}
    </p>
    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-soft">{entry.ai_summary}</p>
    <div className="my-3 flex flex-wrap gap-1.5">{entry.tags.map(tag => <span key={tag} className="rounded bg-bg-deep px-2 py-1 text-xs text-ink-soft">{TAG_LABELS[tag]}</span>)}</div>
    {occurrences > 1 && <p className="mb-3 text-xs text-reed">+ {occurrences - 1} weitere Termine in dieser Auswahl</p>}
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-ink-soft">
      <a className="inline-flex min-h-9 items-center gap-1 underline underline-offset-4" href={entry.source_url} target="_blank" rel="noopener noreferrer">
        {entry.source}<ArrowUpRight size={12} aria-hidden="true" />
      </a>
      {mapped ? <button type="button" onClick={onSelect} aria-pressed={selected} className="inline-flex min-h-10 items-center gap-1 rounded-md border border-border px-3 font-semibold text-water hover:bg-bg-deep">
        <MapPin size={13} aria-hidden="true" />Auf Karte
      </button> : <span>Ohne genauen Kartenpunkt</span>}
    </div>
  </article>;
}
