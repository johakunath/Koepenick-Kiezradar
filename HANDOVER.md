# HANDOVER.md — Aktueller Stand & Übergabe

> **Für KI-Assistenten:** Diese Datei zuerst lesen, dann `CLAUDE.md`, dann `PRD.md`.
> Zuletzt aktualisiert: 16.05.2026

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
| VIZ Berlin (Baustellen) | vorbereitet, zuletzt nicht stabil erreichbar |
| Amtsblatt Berlin | vorbereitet, zuletzt nicht stabil erreichbar |

---

## Bekannte Probleme

| Problem | Datei | Prio |
|---|---|---|
| VIZ / Amtsblatt manchmal 503 | `sources/viz.mjs`, `sources/amtsblatt.mjs` | Low — defensiv behandeln |
| Duplikate: gleiche Meldung aus Bezirksamt + Events | data-Layer | High — nächster Schritt |
| Kein Fehlerreport wenn Quelle crasht | `ingest.mjs` | Medium |

---

## Nächste Schritte (Priorität)

1. **Duplikate zusammenführen** — gleiche reale Meldung aus mehreren Quellen → ein kanonischer Eintrag, mehrere `source_urls[]`
2. **Multi-Source-URLs im Datenmodell** — Detailseite zeigt alle Quelllinks
3. **Manueller Qualitäts-Check** — letzte 4 Wochen Einträge durchgehen, Fehlklassifikationen dokumentieren
4. **Ingest-Error-Report** — bei Quell-Fehler GitHub Issue erstellen statt lautlos faillen
5. **VIZ / Amtsblatt** — klare Entscheidung: aktivieren oder aus Cron entfernen

Danach: Wahl-2026-Sprint (siehe PRD.md §11).

---

## Architektur-Prinzipien (nicht verhandelbar)

- Kein Revert von Claude-Änderungen ohne Diskussion
- Keine Datenbank einführen, solange JSON + statische Seiten reichen
- VIZ / Amtsblatt defensiv — wenn instabil, nicht erzwingen
- Map und Newsletter nicht aufblasen, bis Datenqualität stabil ist
- Kein Over-Engineering: boring tech wins
