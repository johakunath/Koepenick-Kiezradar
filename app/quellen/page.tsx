import Header from "@/components/Header";
import { getSources, getIngestHealth } from "@/lib/data";
import { formatDate } from "@/lib/shared/discovery";
export const dynamic = "force-dynamic";
export default function SourcesPage() {
  const health = getIngestHealth();
  return <div className="min-h-screen bg-bg"><Header /><main id="main-content" className="relative z-10 mx-auto max-w-4xl px-5 py-8">
    <h1 className="font-display text-3xl">Was unser Radar erfasst</h1>
    <p className="my-4 max-w-2xl text-sm leading-relaxed text-ink-soft">Öffentliche Quellen, automatisch gesammelt. Unser Radar ist kein vollständiger Veranstaltungskalender. Leere Ergebnisse können auch durch fehlende Daten entstehen.</p>
    <p className="mb-6 text-sm">Letzter Lauf: {health.last_run ? formatDate(health.last_run) : "unbekannt"}. {health.ai_error ? "Die KI-Zusammenfassung ist aktuell eingeschränkt; Quellenangaben bleiben verfügbar." : ""}</p>
    <div className="space-y-3">{getSources().map(source => {
      const status = health.sources[source.id];
      const label = source.status === "planned" ? "Geplant" : !status ? "Noch kein Lauf" : status.status === "skipped" ? "Pausiert / nicht verfügbar" : status.status === "error" ? "Abruf fehlgeschlagen" : status.status === "warning" ? "Teilweise verfügbar" : status.parsed === 0 ? "Keine Treffer im letzten Lauf" : "Daten empfangen";
      return <article key={source.id} className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap justify-between gap-2"><h2 className="font-display text-xl"><a className="text-water hover:underline" href={source.url} target="_blank" rel="noopener noreferrer">{source.name} ↗</a></h2><span className="text-xs text-ink-soft">{label}</span></div>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{source.notes}</p>
        {status && <p className="mt-3 text-xs text-ink-soft">{status.parsed ?? 0} erkannte Einträge · {status.fetched ?? 0} neue Einträge{status.last_success_at ? ` · Zuletzt mit Treffern: ${formatDate(status.last_success_at)}` : ""}</p>}
      </article>;
    })}</div>
  </main></div>;
}
