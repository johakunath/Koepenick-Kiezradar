# Köpenick Kiezradar — PRD v0.3

> Zuletzt aktualisiert: 16.05.2026

---

## 1. Was

Hyperlokales Monitoring-Tool für Berlin-Köpenick. Aggregiert lokale Meldungen aus öffentlichen Quellen, fasst sie per KI zusammen, bewertet lokale und politische Relevanz, zeigt sie in Feed, Karte, Wochenblick und Detailseiten.

**Status:** Privates Spielzeug für zwei Nachbarn. Kein offizielles Produkt. Nicht für externe Nutzung gedacht (siehe Disclaimer in README).

**Live:** https://koepenick-kiezradar.vercel.app/

---

## 2. Nordstern

> Was passiert gerade oder bald in unserem Kiez — und was davon ist politisch relevant, besonders im Hinblick auf die Berlin-Wahl am 20. September 2026?

---

## 3. Scope

### Geografisch
- Altstadt Köpenick
- Dammvorstadt
- Bahnhof Köpenick
- Spindlersfeld
- Zentrales Köpenick

### Thematisch (Tags)
`sicherheit` · `verkehr` · `verwaltung` · `veranstaltung` · `infrastruktur` · `umwelt` · `wahl` · `baustelle` · `sonstiges`

Ein Eintrag kann mehrere Tags tragen. Legacy-Einträge mit `tag: string` werden beim Lesen in `tags: string[]` normalisiert.

### Dauerhaft Out of Scope
- Login / Accounts
- Newsletter / Push-Notifications
- App Store App
- Eigene Datenbank (solange JSON + statische Seiten reichen)
- Parteipolitische Bewertung

---

## 4. Datenquellen

| Quelle | Typ | Status |
|---|---|---|
| Polizei Berlin | HTML + RSS | aktiv, experimentell |
| Berlin.de Veranstaltungskalender TK | HTML-Scraping | aktiv, experimentell |
| Bezirksamt Treptow-Köpenick | HTML + RSS | aktiv, experimentell |
| BVV / politische Dokumente | HTML-Scraping | experimentell |
| VIZ Berlin (Baustellen) | GeoJSON API | vorbereitet, zuletzt instabil |
| Amtsblatt Berlin | HTML-Scraping | vorbereitet, zuletzt instabil |
| Feuerwehr Berlin | — | offen / nicht begonnen |
| BVG / S-Bahn Störungen | — | offen / Low Priority |

---

## 5. Datenmodell

```json
{
  "id": "hash-string",
  "source": "polizei-berlin",
  "source_id": "polizei-berlin",
  "source_url": "https://...",
  "title": "Originaltitel",
  "published_at": "2026-05-14T10:00:00Z",
  "ingested_at": "2026-05-14T11:00:00Z",
  "raw_excerpt": "Erste 500 Zeichen",
  "ai_summary": "1–3 Sätze",
  "tags": ["sicherheit", "verkehr"],
  "location": "Altstadt Köpenick",
  "location_relevant": true,
  "local_relevance_score": 0.85,
  "political_relevance_score": 0.3,
  "election_relevant": false,
  "ai_reasoning": "Ein Satz Begründung",
  "event_start_at": null,
  "venue": null,
  "lat": null,
  "lng": null
}
```

`location_relevant: false` → Eintrag wird nicht angezeigt (Pre-Filter).
Scores 0–1, KI-vergeben. Schwellenwert konfigurierbar.
`lat`/`lng` werden per Geocoding aus Adressen im Text extrahiert.

---

## 6. Architektur

```
GitHub Action (täglich 06:00 CET)
        │
        ▼
scripts/ingest.mjs
  ├── sources/police.mjs      → Polizei Berlin HTML + RSS
  ├── sources/events.mjs      → Berlin.de Veranstaltungskalender
  ├── sources/bezirksamt.mjs  → Bezirksamt TK Pressemitteilungen
  ├── sources/bvv.mjs         → BVV / politische Dokumente
  ├── sources/viz.mjs         → VIZ GeoJSON (Baustellen)
  └── sources/amtsblatt.mjs   → Amtsblatt (vorbereitet)
        │
        ├── lib/enrich.mjs    → Gemini AI: Tags, Summary, Scores
        ├── lib/geocode.mjs   → Adressextraktion + Koordinaten
        └── lib/shared.mjs    → Parser-Utilities
        │
        ▼
data/entries.json             → Quelle der Wahrheit (gitcommitted)
data/archive/YYYY-MM.json     → Monatsarchiv
data/ingest-status.json       → Letzter Ingest-Zeitstempel
        │
        ▼
Next.js App (Vercel, static + SSR)
  /              → Feed
  /woche         → Wochenüberblick (Logbook-Layout)
  /karte         → Karte mit geocodierten Einträgen
  /eintrag/[id]  → Detailseite
  /themen        → Themenübersicht
  /thema/[slug]  → Thema-Detailseite
  /orte          → Ortsübersicht
  /termine       → Terminübersicht
  /termin/[slug] → Termin-Detailseite
  /quellen       → Quellenübersicht
  /feed.xml      → RSS-Feed
  /admin         → Ingest-Trigger (kein Auth, nur intern)
```

---

## 7. UI (aktueller Stand)

### `/` Feed
- Header mit SVG-Illustration (Reiher, Schilf, Schloss Köpenick)
- Kompakte Filter-Bar: Tag-Chips, Ortsfilter, Wahl-Watch-Toggle, Search-Lite
- Cards: Datum, Titel, KI-Summary (2 Zeilen), Tag-Chips, Quellenlink
- Card-Titel → interne Detailseite

### `/woche` Wochenüberblick
- Logbook-Layout mit Datumstreifen und Tag-Akzentfarbe
- KI-Digest "Was war wichtig diese Woche?" (3–5 Sätze)
- Top-Einträge der Woche
- Generiert sonntags 22:00 CET

### `/karte`
- Geocodierte Einträge auf interaktiver Karte
- Marker-Popup mit Titel und KI-Summary

### Detailseiten `/eintrag/[id]`
- Volltext des Originalausschnitts
- KI-Summary + Begründung
- Tags, Ort, Datum, Quelle
- Link zurück zum Feed

### Weitere Seiten
- `/themen`, `/thema/[slug]` — Einträge nach Tag-Kategorie
- `/orte` — Einträge nach Ort
- `/termine`, `/termin/[slug]` — zukünftige Veranstaltungen
- `/quellen` — Quellenübersicht mit Beschreibung

---

## 8. Design

**Kiez / Wasser / Wald** — eine Richtung, keine Wahl.

- Helle Farben, Pastell-Akzente
- Müggelsee-Blau / Dahme-Blau als Primärfarbe
- SVG-Illustration im Header (kein Stockfoto)
- Inter als Schrift, mobile-first
- Tailwind, keine Custom CSS, keine Inline-Styles
- Tag-Chips mit Akzentfarben pro Kategorie

---

## 9. Relevanzlogik

1. **Geofilter (hart):** KI prüft, ob Meldung Köpenick betrifft. Wenn nein → nicht angezeigt.
2. **Tags:** KI vergibt 1–5 Tags aus festem Set. App normalisiert zusätzlich aus Quelle, Eventdaten, Wahlbezug, Textsignalen.
3. **Local Relevance Score (0–1):** Wie sehr betrifft das den Alltag in Köpenick?
4. **Political Relevance Score (0–1):** Wie sehr betrifft das lokale Politik / Wahl 2026?
5. **Begründung:** Ein Satz, warum diese Meldung relevant ist.

KI darf irren. Originalquelle bleibt maßgeblich. Disclaimer prominent.

---

## 10. Politische Relevanz (Wahl 2026)

Berlin-Wahl am 20. September 2026. Fokus-Themen:

1. Wohnen / Mieten / Wohnungsbau
2. Mobilität / Verkehr / Baustellen
3. Bildung / Schulen / Kitas
4. Innere Sicherheit
5. Haushalt / Sparpolitik

KI markiert passende Einträge mit `election_relevant: true`. Kein Parteibezug, keine Kandidatenbewertung.

---

## 11. Roadmap — neuer Stand

### ✅ Erledigt (Iterationen 1–3)

- [x] Next.js App auf Vercel deployed
- [x] Feed mit Tag-, Orts-, Wahl-Watch- und Search-Filter
- [x] Mehrfach-Tags pro Eintrag
- [x] Wochenüberblick `/woche` mit Logbook-Layout und KI-Digest
- [x] Karte mit geocodierten Einträgen
- [x] Detailseiten `/eintrag/[id]`
- [x] Themen, Orte, Termine, Quellen-Seiten
- [x] RSS-Feed `/feed.xml`
- [x] Admin-Trigger für manuellen Ingest
- [x] Ingestion via GitHub Action (täglich 06:00 CET)
- [x] Gemini Enrichment (Summary, Tags, Scores, Reasoning)
- [x] Hash-basierte Deduplizierung
- [x] Re-Enrichment veralteter Einträge
- [x] Geocoding aus Adresstexten
- [x] Monatsarchiv unter `data/archive/`
- [x] Parser Smoke Tests für Polizei + Events
- [x] SVG-Illustration im Header
- [x] Polizei, Events, Bezirksamt, BVV als Quellen

### 🔜 Iteration 4 — Datenqualität (nächster Schritt)

- [ ] **Duplikate zusammenführen:** Gleiche reale Meldung aus mehreren Quellen → ein kanonischer Eintrag mit mehreren Quellenlinks
- [ ] **Mehrere Source-URLs pro Eintrag** im Datenmodell und auf Detailseite anzeigen
- [ ] **Parser-Qualität:** Manueller Prüfdurchlauf der letzten 4 Wochen; auffällige Fehlklassifikationen dokumentieren und fixen
- [ ] **Ingest-Fehler-Report:** Wenn eine Quelle crasht, Slack/GitHub Issue statt lautlosem Fail

### 🗺️ Iteration 5 — Quellen & Tiefe

- [ ] **VIZ Berlin stabilisieren** oder aus Cron rausnehmen (klare Entscheidung)
- [ ] **Amtsblatt Berlin** — erneuter Versuch nach Stabilisierungspause
- [ ] **Feuerwehr Berlin** — Machbarkeitscheck (RSS? Webseite?)
- [ ] **BVV/OParl** — Tiefere Normalisierung wenn Quellenformat klar

### 🗳️ Iteration 6 — Wahl-2026-Sprint (bis August 2026)

- [ ] **Wahl-Watch-Seite** `/wahl` mit Timeline der wahlrelevanten Einträge
- [ ] **Kandidaten / Bezirksliste** — statische Übersicht der Köpenicker Direktkandidaten
- [ ] **Themen-Vergleich** — welches Thema dominiert die Meldungen in welchem Monat?

### 💡 Backlog / Ideen (kein Commitment)

- Volltext-Suche (Vercel KV oder Pagefind)
- Mehrsprachige Zusammenfassung (Englisch für Expats im Kiez)
- "Melden"-Button: Bürger können Meldung-URL einreichen (kein Auth nötig, nur URL-Form → GitHub Issue)
- Heatmap auf Karte nach Tag-Kategorie
- Archiv-Seite mit Monatsnavigation
- E-Mail-Digest (1×/Woche, self-hosted, opt-in) — nach Wahl-Sprint

---

## 12. Vergleich mit Düsseldorf Radar

Der Düsseldorf Radar war strukturelle Inspiration für die Seiten-Architektur (Themen, Orte, Termine, Quellenübersicht). Diese Struktur ist vollständig umgesetzt.

| Feature | Düsseldorf Radar | Kiezradar Status |
|---|---|---|
| Feed mit Filterung | ✅ | ✅ |
| Detailseiten | ✅ | ✅ |
| Themen-Seiten | ✅ | ✅ |
| Orts-Seiten | ✅ | ✅ |
| Termin-Seiten | ✅ | ✅ |
| Quellenübersicht | ✅ | ✅ |
| Karte | ✅ | ✅ |
| Wochenüberblick | — | ✅ (eigene Idee) |
| RSS-Feed | — | ✅ (eigene Idee) |
| SVG-Illustration | — | ✅ (eigene Idee) |
| Wahlbezug / Scores | — | ✅ (eigene Idee) |
| Duplikatzusammenführung | unbekannt | ❌ nächster Schritt |
| Multi-Source pro Eintrag | unbekannt | ❌ nächster Schritt |

---

## 13. Erfolgskriterien MVP

- [ ] Beide Nutzer öffnen die Seite ≥ 1× pro Woche freiwillig
- [ ] ≥ 5 echte Köpenick-relevante Einträge pro Woche
- [ ] Originalquelle in < 2 Klicks erreichbar
- [ ] KI-Summary in ≥ 80% der Fälle korrekt
- [ ] Beide Nutzer können selbst neue Datenquellen hinzufügen (mit Claude Code Hilfe)

---

## 14. Anti-Goals (unveränderlich)

- Keine vollständige journalistische Redaktion
- Keine Parteibewertung / Kandidatenempfehlung
- Keine perfekte Kartenansicht
- Kein App-Store-Release
- Keine User-Accounts
- Kein Push-Newsletter ohne expliziten Opt-in-Sprint
- Kein Over-Engineering (keine Microservices, keine eigene DB bevor JSON an Grenzen stößt)
