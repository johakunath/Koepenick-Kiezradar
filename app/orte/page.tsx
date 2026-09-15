import Link from "next/link";
import Header from "@/components/Header";
import { getDistricts, getDisplayEntries } from "@/lib/data";
import { isEvent, formatEntryDate } from "@/lib/shared/discovery";
export default function PlacesPage() {
  const entries = getDisplayEntries();
  const places = new Map<string, (typeof entries)[number]>();
  for (const entry of entries) if (isEvent(entry) && entry.venue && entry.venue !== "Treptow-Köpenick") {
    const key = entry.venue.trim().toLocaleLowerCase("de-DE");
    if (!places.has(key)) places.set(key, entry);
  }
  return <div className="min-h-screen bg-bg"><Header /><main id="main-content" className="relative z-10 mx-auto max-w-6xl px-5 py-8">
    <h1 className="font-display text-3xl">Dein Kiez. Und ein Stück weiter.</h1>
    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">Entdecke Orte aus unseren Veranstaltungsmeldungen oder stöbere nach Ortsteil. Ein genannter Ort ist noch keine Empfehlung; aktuelle Programme und Öffnungszeiten stehen bei den Veranstaltern.</p>
    <h2 className="mb-4 mt-8 font-display text-2xl">Nach Ortsteil stöbern</h2>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{getDistricts().map(district => <Link id={district.slug} key={district.slug} href={`/?district=${district.slug}`} className="rounded-lg border border-border bg-card p-4 hover:border-water">
      <h3 className="font-display text-xl">{district.label}</h3><p className="mt-2 text-sm text-ink-soft">{district.description}</p>
      <p className="mt-3 text-xs text-water">Entdeckungen ansehen →</p>
    </Link>)}</div>
    <h2 className="mb-4 mt-8 font-display text-2xl">Orte im Radar</h2>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[...places.values()].slice(0, 24).map(entry => <article key={entry.id} className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-display text-xl">{entry.venue}</h3><p className="mt-2 text-xs text-ink-soft">Zuletzt erfasst: {formatEntryDate(entry)}</p>
      <Link className="mt-3 inline-flex min-h-10 items-center text-sm text-water underline" href={`/?q=${encodeURIComponent(entry.venue!)}`}>Programm im Radar →</Link>
      <a className="mt-1 block text-xs text-ink-soft underline" href={entry.source_url} target="_blank" rel="noopener noreferrer">Aktuelle Angaben beim Veranstalter ↗</a>
    </article>)}</div>
  </main></div>;
}
