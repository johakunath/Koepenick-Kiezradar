# Code Inspector Report - Köpenick Kiezradar
### Stack: Next.js 16.2.6 · React 19 · TypeScript · Tailwind 4 · JSON · GitHub Actions
### Scope: Focused architecture, ingestion and live discovery review, 14–15 September 2026

## Executive Summary
The existing small-file JSON architecture is appropriate for this project. Discovery was primarily limited by incorrect event identity, stale content, inconsistent filtering and source attribution, rather than by the lack of a database. The initial 250-record snapshot contained 33 calendar records and no calendar dates on or after 15 September; 22 records explicitly marked non-local still reached display helpers. This review implements a separate functional foundation before changing the visual design. No production deployment or paid AI call was performed.

## Maturity Assessment
Scores describe the baseline, not a certification of the revised application.

| Category | Score (1–5) | Headline |
|---|---:|---|
| Structure | 4 | Clear small app; unused legacy UI remains |
| Coupling | 2 | Client pages imported a shared data module containing all JSON |
| Token Efficiency | 3 | Good source modules; duplicated filtering and stale handover notes |
| Testing | 2 | Parser smoke tests, little coverage of occurrence identity or failure handling |
| Config / Env | 2 | Public import trigger, outdated Gemini defaults |
| Documentation | 3 | Useful agreements; operational claims diverged from code |
| **Overall** | **3** | Sensible foundation, discovery contracts needed repair |

## Main Problems Found
- **Import access:** `app/api/trigger-ingest/route.ts` allowed unauthenticated workflow dispatch using a server token. It now requires a separate admin secret, fails closed when missing and disables dispatch on Vercel previews.
- **Event loss:** title-only deduplication collapsed recurring dates; the source URL was insufficient as occurrence identity. Shared URL/date/time/venue identity preserves occurrences, merges tags/source references and retains alias IDs.
- **Archive loss:** `scripts/ingest.mjs` replaced month files with the active slice. `scripts/lib/storage.mjs` now merges existing archives, writes each file atomically and retains upcoming events in the 250-record window.
- **Wrong time semantics:** server-local dates and fabricated noon times affected “today”. Berlin wall-time parsing, date precision and Berlin week boundaries now have regression coverage. Legacy times are explicitly unverified.
- **Misleading sources:** the BVV importer was another copy of the district press feed, not OParl. It is now disabled and labelled planned; legacy press records and source references receive correct attribution.
- **Fragile live parsers:** police HTML tags after “Ereignisort” prevented matches. Calendar pagination and per-occurrence IDs were missing. Current HTML fixtures cover both.
- **Untrusted enrichment:** the old prompt invited added knowledge for thin inputs; model output could overwrite source facts. The prompt now requires source-only claims; validation accepts selected fields, checks complete batch IDs and protects dates/URLs/coordinates.
- **Disconnected UX:** `/termine` rendered two old mock meetings; map/list filters diverged. One tested discovery model now drives the feed, map and actual event calendar.
- **Unreliable orientation:** district centroids appeared as exact places; failed geocodes were cached permanently. Precise points are distinguished from areas; normalized venue queries and persistent successful results improve placement.
- **Build coupling:** making archives accessible exposed an unnecessary client boundary on `/about`. It is now a server page; search and discovery helpers are independent of JSON loading.

## Areas Already OK
- JSON snapshots, source modules and a daily GitHub Action fit the current scale.
- Multi-tag data, original source links and the water/nature identity are worth retaining.
- There is no need for accounts, a database, a CMS or broad source expansion for this iteration.

## Prioritized Improvement Backlog
### Critical (fix before next AI session)
The occurrence/archive/source/access issues above are implemented on `codex/discovery-foundation`. Review and merge that branch before enabling its optional manual trigger.

### Important (fix this sprint)
- Validate the first real scheduled Gemini run. No paid enrichment was executed in this review. Old AI summaries have not all been fact-checked or regenerated.
- Implement an auditable **daily monetary** budget if the documented €5/day requirement must be enforced. The current implementation caps records (50 per run), output tokens and workflow duration; it does **not** measure daily euro spending.
- Audit legacy geocodes and manually sampled summaries. Automatic venue matches can still be wrong.
- Extend bounded calendar traversal only after checking coverage: five pages can contain many occurrences of one exhibition. Partial coverage is now visible.
- Improve article-detail extraction so prices, age ranges, booking requirements and venue addresses can be presented from evidence. They are currently left to the original source.
- Monitor the next police import before closing GitHub issue #49.

### Nice to Have
- A fixture-backed independent BVV source, then carefully chosen family/outdoor sources.
- Source-aware cross-publisher duplicate matching. Current consolidation is deliberately conservative: different URLs are not fuzzy-merged.
- An archive browser and a compact display DTO if the active window grows.
- Remove unused legacy feed/filter components in a separate cleanup.

## Suggested First Stabilization Task
Completed: add occurrence-identity and append-only archive regression cases in `scripts/discovery-test.ts`, then use the tested helpers from both ingestion and display. The next small task is to sample 10 records after the first scheduled enrichment and compare summary claims with their original articles.

## Files Needing Closer Inspection
- `scripts/sources/amtsblatt.mjs`: a partially failed PDF batch can still report a successful source; detailed PDF diagnostics need a separate pass.
- `scripts/weekly-digest.mjs`: no paid end-to-end digest test was made; prose still needs editorial sampling.
- `lib/data.ts` (~390 lines): compatibility, normalization and secondary-page helpers remain together; split only when further changes justify it.
- `scripts/lib/shared.mjs`: legacy tag inference can over-classify mentions of streets, schools or public bodies.
- `data/entries.json`: old AI assertions and coordinates remain imperfect; new trust labels do not retroactively verify them.

## Functional review and rollout
Branch: `codex/discovery-foundation`. It is deployable without the design branch.
1. Open `/`: upcoming dates first, recurring dates grouped, undated recent hints afterwards.
2. Select Today / Weekend / Kids & Family. Empty results explain incomplete coverage and provide reset/source routes.
3. Select “Auf Karte”, open a marker detail and return: the period, category, query and selection remain in the URL.
4. Test map-area search, co-located markers, and entries without exact coordinates.
5. Location is opt-in, held only in memory and never placed in URLs. A reload/detail return requires selecting nearby again; approximate distance is straight-line.
6. Open `/termine`, `/orte`, `/quellen` and an old detail URL. No mock meeting is presented as a real upcoming event.

The design branch is stacked on this foundation: merge the functional work first, then review its visual-only diff. Reverting the design commit keeps the functional improvements.

### Validation
- 20 deterministic regression groups, existing parser smoke tests, existing data smoke tests and TypeScript passed.
- Production build passed with Google Fonts network access.
- Live source check on 15 September: 1 local police record, 10 district press records, 50 calendar occurrences across five pages. The pagination limit is explicitly reported.
- Review snapshot refreshed without AI: 250 active records, 87 calendar records, 55 calendar occurrences dated 15 September or later. These are dates, not 55 unique activities.
- Browser checked weekend filtering, list-to-map selection, selected marker popup and detail return URLs. Responsive/dark visual checks are recorded in the separate design review.
- A transient Windows rename lock occurred after data writes; the completed status file was recovered and bounded retry added.

### Deployment configuration
Normal daily ingestion remains in GitHub Actions; JSON changes trigger the existing deployment flow. Only the optional web trigger needs Vercel Production `ADMIN_INGEST_SECRET` (random, at least 32 characters) plus a repository-scoped `GITHUB_TOKEN` with Actions write permission. Without both, the trigger is disabled; GitHub's manual workflow remains available. Never use NEXT_PUBLIC variables for these secrets.

### Browser-found date correction
Yearless announcements such as “am 13. September” use publication context only within a 90-day future window, including year rollover. The inferred year is explicitly labelled on the detail page. This prevents an expired family event from remaining an undated upcoming hint. A regression test covers the case.
