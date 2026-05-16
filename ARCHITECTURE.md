# Architecture

## Stack

Next.js 16 App Router · React 19 · TypeScript strict · Tailwind v4 · pnpm  
Deployed on Vercel. Data stored as JSON files in the repo.

## Data Flow

```
GitHub Actions (04:00 UTC daily)
  └─ scripts/ingest.mjs            ← orchestrator
       ├─ scripts/sources/         ← one file per data source
       │    police.mjs, events.mjs, bezirksamt.mjs,
       │    bvv.mjs, amtsblatt.mjs, viz.mjs
       ├─ scripts/lib/enrich.mjs   ← Gemini AI enrichment
       ├─ scripts/lib/geocode.mjs  ← Nominatim geocoding
       └─ scripts/lib/shared.mjs   ← shared utilities
            │
            writes ──► data/entries.json        (≤250 active entries)
                       data/archive/YYYY-MM.json
                       data/ingest-status.json
                       data/geocode-cache.json

Next.js build / runtime
  └─ lib/data.ts                   ← reads JSON, normalises, exposes to pages
       ├─ getDisplayEntries()      ← deduped, filtered, sorted
       ├─ searchEntries()          ← client-side full-text filter
       └─ get*() accessors for topics, districts, meetings, documents
```

## Key Files

| Path | Purpose |
|---|---|
| `scripts/ingest.mjs` | Orchestrator: fetches sources, calls enrich + geocode, writes JSON |
| `scripts/lib/shared.mjs` | Shared parsing utilities (TAGS, KOEPENICK_KEYWORDS, decode helpers) |
| `scripts/sources/*.mjs` | One parser per data source |
| `lib/data.ts` | Server-side data access layer: normalisation, dedup, search |
| `lib/types.ts` | TypeScript types + TAG_LABELS/ALL_TAGS constants |
| `lib/shared/koepenick-geo.ts` | DISTRICTS list + DISTRICT_KEYWORDS (client + server) |
| `app/page.tsx` | Main feed page (client component) |
| `components/FilterBar.tsx` | Unified tag + district + search filter bar |

## Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes (CI) | — | Gemini AI enrichment |
| `GEMINI_MODEL` | No | `gemini-1.5-flash` | Override model |

See `.env.example`.

## Data Constraints

- `data/entries.json` capped at 250 entries; oldest are pruned on each ingest run
- Monthly archives written to `data/archive/YYYY-MM.json` (no cap)
- `data/geocode-cache.json` committed — prevents re-querying Nominatim on every run
- AI enrichment uses 1 Gemini call per batch of new entries; cost cap: 5 €/day

## Known Limitations

- VIZ Baustellen and Amtsblatt URLs are experimental — all may 404 on any given day
- Police parser uses RSS primary + HTML fallback; both are fragile to Berlin.de layout changes
- No database; JSON file store is sufficient for ≤250 live entries but will need revisiting if volume grows significantly
