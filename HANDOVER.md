# HANDOVER.md - Projektübergabe & aktueller Stand

> **Für KI-Assistenten (Claude Code, Codex):** Lies diese Datei vollständig, dann `CLAUDE.md`, dann `PRD.md`.

---

## Stand: 15. Mai 2026

**Wichtig:** GitHub `main` ist die Quelle der Wahrheit. Vor lokaler Arbeit immer zuerst `git fetch` / Pull bzw. neuen Branch von `origin/main` erstellen.

Köpenick Kiezradar ist live auf Vercel:

https://koepenick-kiezradar.vercel.app/

Der aktuelle Stand enthält deutlich mehr als Iteration 1:

- Feed mit Tagfilter, Ortsfilter, Wahl-Watch und Search-Lite
- Wochenüberblick mit Digest-Unterstützung
- Karte und geocodierte Einträge
- Admin-Trigger für Ingestion
- RSS-Feed unter `/feed.xml`
- interne Detailseiten `/eintrag/[slug]`
- Themen, Orte, Termine und Quellen-Seiten
- Ingestion-Script mit Polizei, Veranstaltungen, Bezirksamt, BVV/Presse, VIZ/Amtsblatt-Versuchen
- Parser-Smoke-Tests gegen Fixtures
- JSON-Datenhaltung im Repo mit Archiv und Statusdatei

---

## Arbeitsprinzip

- Keine Claude-Änderungen zurückdrehen.
- Keine Datenbank einführen, solange JSON + statische Seiten reichen.
- VIZ, Amtsblatt und tiefe BVV/OParl-Anbindung defensiv behandeln; wenn Quellen technisch instabil sind, nicht erzwingen.
- Map und Newsletter nicht weiter aufblasen, bis echte Datenqualität stabil ist.

---

## Quick Start

```bash
pnpm install
pnpm dev
pnpm build
pnpm test:parsers
pnpm ingest:dry
GEMINI_API_KEY=xxx pnpm ingest
pnpm weekly-digest
```

`pnpm build` braucht Netzwerkzugriff für Google Fonts. `pnpm ingest:dry` braucht Netzwerkzugriff auf Berlin.de.

---

## Aktuelle Architektur

| Bereich | Stand |
|---|---|
| App | Next.js App Router, TypeScript, Vercel |
| UI | Feed, Karte, Woche, Detailseiten, Themen, Orte, Termine, Quellen |
| Daten | JSON im Repo, Archiv unter `data/archive/`, Status unter `data/ingest-status.json` |
| Ingestion | `scripts/ingest.mjs`, Gemini-Enrichment, GitHub Action Cron |
| Tests | `pnpm test:parsers` für kritische Parser-Fälle |

---

## Datenquellen

| Quelle | Stand |
|---|---|
| Polizei Berlin | aktiv/experimentell, HTML-Fallback |
| Berlin.de Veranstaltungen | aktiv/experimentell, Kategorien/Pagination werden herausgefiltert |
| Bezirksamt TK | aktiv/experimentell |
| BVV / politische Dokumente | experimentell |
| VIZ Berlin | vorbereitet, zuletzt nicht erreichbar |
| Amtsblatt Berlin | vorbereitet, zuletzt nicht erreichbar |

---

## Out of Scope für den nächsten Schritt

- Supabase/Vercel KV oder andere Datenbank
- Newsletter
- Accounts/Login
- Vollständige journalistische Redaktion
- Partei- oder Kandidatenbewertung
- tiefe OParl-/BVV-Normalisierung, solange Quellenformate nicht stabil geklärt sind

---

## Nächster sinnvoller Schritt

1. Parser-Qualität weiter erhöhen und echte Quellenläufe manuell prüfen.
2. Interne Detailseiten mit echten Daten gegen Originalquellen reviewen.
3. Danach entscheiden, ob BVV/OParl, VIZ oder Amtsblatt als nächste robuste Quelle lohnt.

---

*Letzte Aktualisierung: 15.05.2026 - nach GitHub-Sync, Claude-Stand und Radar-Depth-Erweiterung*
