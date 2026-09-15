import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ArrowUpRight, CalendarDays } from "lucide-react";
import Header from "@/components/Header";
import { getDisplayEntries, getEntryBySlug } from "@/lib/data";
import { TAG_LABELS } from "@/lib/types";
import { formatDate, formatEntryDate, isEvent } from "@/lib/shared/discovery";
import { sourceReferences, canonicalSourceUrl } from "@/lib/shared/entry-identity.mjs";
import { hasMappableCoordinates } from "@/lib/shared/map-coordinates";
import { berlinDay } from "@/lib/shared/dates.mjs";
import ShareLink from "@/components/discovery/share-link";

export function generateStaticParams() { return getDisplayEntries().map(entry => ({ slug: entry.slug! })); }

export default async function EntryDetailPage({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<{ from?: string }>;
}) {
  const { slug } = await params;
  const entry = getEntryBySlug(slug);
  if (!entry) notFound();
  const { from } = await searchParams;
  const back = from && /^\/(?:karte|termine)?(?:\?|$)/.test(from) ? from : "/";
  const event = isEvent(entry);
  const expired = entry.event_start_at && (entry.event_end_at ? Date.parse(entry.event_end_at) < Date.now() : berlinDay(entry.event_start_at) < berlinDay());
  const refs = sourceReferences(entry);
  const otherDates = getDisplayEntries().filter(e => e.id !== entry.id && e.event_start_at && e.title === entry.title &&
    canonicalSourceUrl(e.source_url) === canonicalSourceUrl(entry.source_url) && (e.event_end_at ? Date.parse(e.event_end_at) >= Date.now() : berlinDay(e.event_start_at) >= berlinDay()))
    .sort((a, b) => a.event_start_at!.localeCompare(b.event_start_at!)).slice(0, 12);
  const mapParams = new URLSearchParams(back.split("?")[1] ?? "");
  mapParams.set("selected", entry.id);
  if (!event) mapParams.set("mode", "news");
  if (expired) mapParams.set("when", "past");
  return <div className="min-h-screen bg-bg"><Header /><main id="main-content" className="detail-shell relative z-10 mx-auto max-w-4xl px-5 py-7 md:px-10">
    <Link href={back} className="inline-flex min-h-11 items-center text-sm text-water underline">← Zurück zur Auswahl</Link>
    <article className="detail-article mt-4 rounded-xl border border-border bg-card p-5 md:p-8">
      <div className="mb-4 flex flex-wrap gap-2">{entry.tags.map(tag => <span key={tag} className="rounded bg-bg-deep px-2 py-1 text-xs text-ink-soft">{TAG_LABELS[tag]}</span>)}</div>
      <h1 className="font-display text-3xl leading-tight md:text-4xl">{entry.title}</h1>
      <div className="detail-facts my-6 grid gap-4 border-y border-border py-5 sm:grid-cols-2">
        <div><p className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-ink-soft"><CalendarDays size={14} />{event ? "Wann" : "Veröffentlicht"}</p><p className="font-semibold">{formatEntryDate(entry)}</p>
          {entry.event_date_origin === "title" && <p className="mt-1 text-xs text-ink-soft">Datum aus der Ankündigung; Uhrzeit bitte beim Veranstalter prüfen.</p>}
          {entry.event_date_origin === "legacy" && <p className="mt-1 text-xs text-ink-soft">Älterer Import: Die Uhrzeit ist noch nicht verifiziert.</p>}
          {expired && <p className="mt-2 font-semibold text-brick">Dieser Termin liegt in der Vergangenheit.</p>}
        </div>
        <div><p className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-ink-soft"><MapPin size={14} />Wo</p><p className="font-semibold">{entry.venue || entry.location || "Noch nicht bekannt"}</p>
          <p className="mt-1 text-xs text-ink-soft">{hasMappableCoordinates(entry) ? "Kartenpunkt automatisch ermittelt; genaue Adresse in der Quelle prüfen." : "Kein genauer Kartenpunkt vorhanden."}</p>
        </div>
      </div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">{entry.summary_origin === "source" ? "Aus der Quelle" : entry.summary_origin === "fallback" ? "Kurzinfo aus der Quelle" : "Automatische Zusammenfassung"}</p>
      <p className="text-base leading-relaxed text-ink">{entry.ai_summary}</p>
      {event && <p className="mt-4 text-sm leading-relaxed text-ink-soft">Preise, Anmeldung, Altersangaben und mögliche Änderungen stehen in der Originalquelle. Fehlende Angaben bedeuten nicht „kostenlos“ oder „ohne Anmeldung“.</p>}
      <div className="detail-actions my-6 flex flex-wrap gap-3">
        <a className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-water px-5 text-sm font-semibold text-bg" href={entry.source_url} target="_blank" rel="noopener noreferrer">Original & Besuchsinfos <ArrowUpRight size={16} /></a>
        {hasMappableCoordinates(entry) && <Link className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-border px-4 text-sm text-water" href={`/karte?${mapParams}`}><MapPin size={16} />Auf der Karte</Link>}
        <ShareLink />
      </div>
      {refs.length > 1 && <section className="mt-6"><h2 className="font-display text-xl">Weitere Quellen zu diesem Eintrag</h2>
        <ul className="mt-2 space-y-2">{refs.map(ref => <li key={ref.url}><a className="text-sm text-water underline" href={ref.url} target="_blank" rel="noopener noreferrer">{ref.name} ↗</a></li>)}</ul>
      </section>}
      {entry.raw_excerpt && <details className="mt-6 border-t border-border pt-4"><summary className="min-h-10 text-sm font-semibold">Originalauszug ansehen</summary><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{entry.raw_excerpt}</p></details>}
      {entry.document_url && <a className="mt-4 inline-block text-sm text-water underline" href={`${entry.document_url}${entry.pdf_page ? `#page=${entry.pdf_page}` : ""}`} target="_blank" rel="noopener noreferrer">Dokument öffnen{entry.pdf_page ? ` · Seite ${entry.pdf_page}` : ""} ↗</a>}
      {entry.ai_reasoning && <details className="mt-4"><summary className="min-h-10 text-sm text-ink-soft">Warum im Radar?</summary><p className="text-sm text-ink-soft">Automatische Einschätzung: {entry.ai_reasoning}</p></details>}
      <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-ink-soft">{entry.source} · Erfasst am {formatDate(entry.ingested_at)}{entry.last_seen_at ? ` · Zuletzt in der Quelle gesehen: ${formatDate(entry.last_seen_at)}` : ""}. KI-Texte können irren; maßgeblich bleibt die Originalquelle.</p>
    </article>
    {otherDates.length > 0 && <section className="mt-7"><h2 className="font-display text-2xl">Weitere Termine</h2><div className="mt-3 grid gap-2 sm:grid-cols-2">{otherDates.map(other => <Link className="min-h-12 rounded-lg border border-border bg-card p-3 text-sm text-water" key={other.id} href={`/eintrag/${other.slug}?from=${encodeURIComponent(back)}`}>{formatEntryDate(other)} →</Link>)}</div></section>}
  </main></div>;
}
