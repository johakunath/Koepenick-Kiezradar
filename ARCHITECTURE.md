# Architecture

Next.js 16 App Router · React 19 · TypeScript strict · Tailwind 4 · pnpm.
JSON files remain the database. Vercel serves the application; GitHub Actions collects content.

## Data flow

```text
Public sources → scripts/sources/* → validated records
  → new-record selection across sources/series (before caps)
  → optional Gemini enrichment → optional Nominatim geocoding
  → merge monthly archives → active snapshot (250) → run status

Server pages → lib/data.ts → normalized, local, consolidated entries
  → components/discovery/discovery-page.tsx → Explorer
  → shared discovery filters → same results for list and map
```

## Contracts and ownership

| Module | Responsibility |
|---|---|
| scripts/ingest.mjs | Bounded source fetching, per-source health, orchestration |
| scripts/lib/storage.mjs | Identity-aware merge, additive archive, atomic file replacement, active retention |
| lib/shared/entry-identity.mjs | Canonical source URL, occurrence identity, tags/references/alias consolidation |
| lib/shared/dates.mjs | Europe/Berlin day and wall-time parsing, explicit source/title dates |
| scripts/lib/enrich.mjs | Source-only prompt, complete-batch validation, permitted output fields |
| scripts/lib/geocode.mjs | Rate-limited venue/address lookup; persistent success cache |
| lib/data.ts | Server data access, legacy normalization, archive detail fallback |
| lib/shared/discovery.ts | Pure period/interest/search/distance filtering, occurrence groups, date and health labels |
| components/discovery/explorer.tsx | URL state, location opt-in, map/list selection and pagination |
| components/KiezMap.tsx | Lazy Leaflet map, co-located markers, explicit area search |

The original source and its dates are authoritative. AI cannot replace IDs, URLs, event dates or coordinates. Legacy source dates are day-precision until verified. Exact coordinates and district areas are distinct; area-only records stay in lists but not distance results.

Repeated dates are independent records. One activity card groups occurrences within the selected range; detail links use title plus ID. Alias IDs and monthly archive lookup keep older links working. The Next build traces archive files into the detail route's deployment bundle.

## Routes and rendering

`/`, `/karte` and `/termine` share the same server loader and client interaction component. Search parameters are shareable. `/woche` uses Berlin week boundaries at request time. `/eintrag/[slug]` resolves active and archived entries. Secondary content pages remain server-rendered.

JSON access stays on the server; client code imports only shared types and pure helpers. No database, accounts or persistent personal location are introduced.

## Operations

- Daily and weekly writers share a GitHub Actions concurrency group. Each JSON replacement is atomic; multiple files are written sequentially, status last. This is not a database transaction.
- Calendar traversal is capped at five pages; new records at 25 by default (CLI max 40), stale enrichment at 10; AI at 50 records per run. Upcoming records receive retention priority.
- Source failure preserves existing records. Stale/partial calendar coverage is surfaced. Successful geocodes are committed; failed queries retry on a later run.
- `pnpm test` runs parser, data and discovery regression checks; pull requests also build.
- `pnpm ingest:dry` fetches sources without writing snapshots or using AI.
- The manual POST trigger requires an admin secret and GitHub token, is disabled on previews, and never exposes either to the client.

## Environment

| Variable | Where | Purpose |
|---|---|---|
| GEMINI_API_KEY | GitHub Actions secret | Enrichment and weekly digest |
| GEMINI_MODEL | GitHub Actions variable | Optional override; default gemini-2.5-flash |
| GITHUB_TOKEN | Vercel Production only, optional | Repository-scoped Actions write token for manual dispatch |
| ADMIN_INGEST_SECRET | Vercel Production only, optional | Separate random secret for manual dispatch |

See `.env.example`. Local no-AI testing does not need secrets.

## Limits

Five calendar pages are not complete area coverage. Legacy AI text/geocodes may be inaccurate. VIZ and Amtsblatt remain defensive, optional imports; BVV is planned rather than a duplicate press feed. Per-run AI limits do not enforce a daily monetary budget. See `docs/discovery-review.md` for evidence, outstanding risks and rollout.
