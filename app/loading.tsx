export default function Loading() {
  return <main id="main-content" className="mx-auto max-w-6xl px-5 py-16">
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-reed">Köpenick & nebenan</p>
    <h1 className="font-display text-3xl">Dein Kiezradar wird geladen…</h1>
    <p role="status" className="mt-3 text-sm text-ink-soft">Gleich sind die Einträge da.</p>
    <div aria-hidden="true" className="mt-10 grid gap-5 md:grid-cols-2">{[0, 1, 2, 3].map(key => <div key={key} className="h-56 animate-pulse rounded-2xl border border-border bg-card p-6"><div className="h-4 w-1/3 rounded bg-bg-deep" /><div className="mt-5 h-7 w-4/5 rounded bg-bg-deep" /><div className="mt-3 h-4 w-full rounded bg-bg-deep" /></div>)}</div>
  </main>;
}
