# HANDOVER.md — Aktueller Stand & Übergabe

> **Für KI-Assistenten:** Diese Datei zuerst lesen, dann `CLAUDE.md`, dann `PRD.md`.
> Zuletzt aktualisiert: 11.07.2026

---

## Live-App

https://koepenick-kiezradar.vercel.app/

`main` ist die Quelle der Wahrheit. Vor jeder Arbeit: `git fetch && git pull`.

---

## Quick Start

```bash
pnpm install
pnpm dev              # lokaler Dev-Server
pnpm build            # Produktions-Build (braucht Netzwerk für Google Fonts)
pnpm test:parsers     # Parser Smoke Tests
pnpm ingest:dry       # Ingest-Testlauf ohne AI-Enrichment (braucht Berlin.de-Zugriff)
GEMINI_API_KEY=xxx pnpm ingest   # echter Ingest-Lauf
pnpm weekly-digest    # Wochenüberblick generieren
```

---

## Was funktioniert

| Bereich | Stand |
|---|---|
| Feed | Tag-, Orts-, Wahl-Watch-, Search-Filter; Card mit Multi-Tag-Chips |
| `/woche` | Logbook-Layout, KI-Digest, Top-Einträge der Woche |
| `/karte` | Geocodierte Marker, Popup mit Summary |
| `/eintrag/[id]` | Detailseite mit KI-Begründung und Originallink |
| `/themen`, `/thema/[slug]` | Einträge nach Tag-Kategorie |
| `/orte` | Einträge nach Ort |
| `/termine`, `/termin/[slug]` | Zukünftige Veranstaltungen |
| `/quellen` | Quellenübersicht |
| `/feed.xml` | RSS-Feed |
| `/admin` | Manueller Ingest-Trigger (kein Auth, nur intern) |
| Ingestion | GitHub Action täglich 06:00 CET; scripts/ingest.mjs |
| AI Enrichment | Gemini 2.0 Flash; Tags, Summary, Scores, Reasoning |
| Geocoding | Adressextraktion aus Texten, lat/lng im Eintrag |
| Deduplication | Hash-basiert; Re-Enrichment veralteter Einträge |
| Archiv | `data/archive/YYYY-MM.json`, Statusdatei `data/ingest-status.json` |
| Tests | `pnpm test:parsers` — Polizei-RSS, Polizei-HTML, Events |

---

## Datenquellen

| Quelle | Status |
|---|---|
| Polizei Berlin (HTML + RSS) | aktiv, experimentell |
| Berlin.de Veranstaltungen TK | aktiv, experimentell |
| Bezirksamt Treptow-Köpenick | aktiv, experimentell |
| BVV / politische Dokumente | experimentell |
| VIZ Berlin (Baustellen) | kein öffentlicher API-Endpunkt — Azure Blob Storage mit VIZ-Credentials; CKAN-Auflösung via daten.berlin.de eingebaut, ob das von GitHub Actions erreichbar ist wird beim nächsten Cron klar |
| Amtsblatt Berlin | URL korrigiert (umgezogen zu `/logistikservice/`); PDF-Scraping sollte wieder funktionieren |

---

## Bekannte Probleme

| Problem | Datei | Prio |
|---|---|---|
| VIZ: kein öffentlicher Endpunkt — api.viz.berlin.de ist IP-restricted (Azure Blob Storage, OCIT-C Credentials nötig) | `sources/viz.mjs` | Low — CKAN-Fallback eingebaut, sonst akzeptiert |
| Amtsblatt: Index-URL war 404 (umgezogen) | `sources/amtsblatt.mjs` | Behoben — neue URL eingetragen |
| Duplikate: gleiche Meldung aus Bezirksamt + Events | data-Layer | High — nächster Schritt |
| KI-Enrichment war seit 21.05. tot (Gemini 1.5/2.0 von Google abgeschaltet, alle Modelle 404) | `lib/enrich.mjs` | Behoben 11.07. — Modelle auf 2.5-Flash aktualisiert, nach nächstem Cron prüfen |
| Polizei-Parser lieferte seit 21.05. 0 Einträge (Markup-Änderung berlin.de) | `sources/police.mjs` | Behoben 11.07. — toleranterer Regex + RSS-Fallback, nach nächstem Cron prüfen |
| Kein Fehlerreport wenn Quelle crasht | `ingest.mjs` | Behoben 11.07. — `report-ingest-errors.mjs` erstellt GitHub Issue |
| Repo-Variable `GEMINI_MODEL` steht auf `gemini-1.5-flash` (404) | GitHub Settings → Variables | Low — Code fällt auf Defaults zurück, Variable trotzdem löschen/aktualisieren |

---

## Nächste Schritte (Priorität)

1. **Pipeline-Fixes vom 11.07. verifizieren** — nach nächstem Cron: kein `ai_error` mehr in `ingest-status.json`, `polizei-berlin.parsed > 0`, neue Einträge haben echte `ai_summary`. Außerdem Repo-Variable `GEMINI_MODEL` löschen oder auf `gemini-2.5-flash` setzen
2. **Duplikate zusammenführen** — gleiche reale Meldung aus mehreren Quellen → ein kanonischer Eintrag, mehrere `source_urls[]`
3. **Multi-Source-URLs im Datenmodell** — Detailseite zeigt alle Quelllinks
4. **Manueller Qualitäts-Check** — letzte 4 Wochen Einträge durchgehen, Fehlklassifikationen dokumentieren (Achtung: Einträge seit 21.05. haben nur Fallback-Summaries, Re-Enrichment läuft mit 10/Tag automatisch nach)
5. **VIZ** — nach nächstem Cron prüfen ob CKAN-Auflösung funktioniert; wenn nicht, Quelle aus Cron entfernen (kein öffentlicher Endpunkt ohne VIZ-Registrierung)
6. **Amtsblatt** — nach nächstem Cron prüfen ob neue URL funktioniert

Danach: Wahl-2026-Sprint (siehe PRD.md §11).

---

## Architektur-Prinzipien (nicht verhandelbar)

- Kein Revert von Claude-Änderungen ohne Diskussion
- Keine Datenbank einführen, solange JSON + statische Seiten reichen
- VIZ / Amtsblatt defensiv — wenn instabil, nicht erzwingen
- Map und Newsletter nicht aufblasen, bis Datenqualität stabil ist
- Kein Over-Engineering: boring tech wins
