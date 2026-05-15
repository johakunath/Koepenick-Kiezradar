# HANDOVER.md — Projektübergabe & aktueller Stand

> **Für KI-Assistenten (Claude Code, Codex):** Lies diese Datei vollständig, dann CLAUDE.md, dann PRD.md.
> **Für Georg:** Direkt bei "Was ist fertig" einsteigen, dann "Was kommt als nächstes".

---

## Was ist das hier?

**Köpenick Kiezradar** — ein privates Monitoring-Tool für Berlin-Köpenick.
Es sammelt öffentliche Meldungen (Polizei, Bezirksamt, BVV), fasst sie per KI zusammen und zeigt sie in einem Feed — sortiert nach Relevanz für unseren Kiez.

Gebaut von zwei Nachbarn ohne Programmiererfahrung, mit Hilfe von KI-Coding-Assistenten.
Vollständiges Briefing: `PRD.md`.

- **Repo:** `Koepenick-Kiezradar`
- **Produktname:** Köpenick Kiezradar
- Für Code-Namen: `KoepenickKiezradar` / `koepenick-kiezradar`

---

## Stand: 15. Mai 2026

### ✅ Fertig

- **Iteration 1 live auf Vercel** — auto-deploy bei push auf `main`
- **Next.js-App** mit Feed, Wochenüberblick, Tag-Filter (7 Tags inkl. Veranstaltungen)
- **Design-System**: Kiez/Wasser/Wald-Palette, Fraunces + Inter Tight Fonts
- **Entry-Cards**: KI-Summary, Relevanz-Balken, „Warum relevant?"-Klapptext, Veranstaltungs-Datum
- **10 Mock-Einträge** in `data/entries.json` (werden durch ersten echten Ingest ersetzt)
- **Ingestion-Script** `scripts/ingest.mjs` — Polizei RSS + Berlin.de Veranstaltungskalender + Gemini Enrichment
- **GitHub Action** `.github/workflows/daily-ingest.yml` — täglich 04:00 UTC (= 06:00 CEST)
- **Archiv-Struktur** vorbereitet (`data/archive/`, `data/weekly/`)
- **AGENTS.md** für Georg / Codex

### ⏳ Noch zu tun

- [ ] `GEMINI_API_KEY` als GitHub Secret setzen (Settings → Secrets → Actions)
- [ ] GitHub Action manuell triggern und erstes echtes Ergebnis prüfen
- [ ] Mock-Daten durch echte Daten ersetzen (passiert automatisch beim ersten Ingest)
- [ ] Bezirksamt-Scraping (Iteration 3)
- [ ] BVV-Anbindung (Iteration 3)

---

## Quick Start

```bash
git clone https://github.com/johakunath/Koepenick-Kiezradar
pnpm install
pnpm dev              # → http://localhost:3000
pnpm build            # Produktions-Build testen
pnpm ingest:dry       # Ingest testen ohne API-Key und ohne Schreiben
GEMINI_API_KEY=xxx pnpm ingest   # Echter Ingest mit Gemini-Enrichment
```

---

## Architektur

| Komponente | Entscheidung | Stand |
|---|---|---|
| Framework | Next.js 15, App Router, TypeScript | ✅ umgesetzt |
| Styling | Tailwind CSS + CSS-Variablen | ✅ umgesetzt |
| Hosting | Vercel (Free Tier) | ✅ live |
| Daten | JSON im Repo (`data/entries.json`) | ✅ umgesetzt |
| Archiv | `data/archive/YYYY-MM.json` | ✅ vorbereitet |
| Ingestion | `scripts/ingest.mjs` (pures Node.js, keine Extra-Deps) | ✅ bereit |
| Cron | GitHub Action `daily-ingest.yml` | ✅ konfiguriert |
| KI | Gemini API (Free Tier) via `GEMINI_API_KEY` env-var | ⏳ Secret setzen |
| Paketmanager | pnpm | ✅ |

---

## Repo-Struktur

```
/
├── app/
│   ├── globals.css           # CSS-Variablen, Farb-Tokens
│   ├── layout.tsx            # Root-Layout, Fonts, Metadaten
│   ├── page.tsx              # Feed-Seite (/)
│   └── woche/
│       └── page.tsx          # Wochenüberblick (/woche)
├── components/
│   ├── EntryCard.tsx         # Eine Meldungskarte (inkl. Veranstaltungs-Datum)
│   ├── TagFilter.tsx         # Tag-Filter-Leiste
│   ├── Header.tsx
│   ├── DisclaimerBanner.tsx
│   ├── WeeklyView.tsx        # Wochenüberblick mit Stats
│   └── Footer.tsx
├── lib/
│   └── types.ts              # Entry-Interface, Tag-Typ, Konstanten
├── data/
│   ├── entries.json          # Aktiver Feed (max. 250 Einträge)
│   ├── archive/              # Monatsarchive YYYY-MM.json
│   └── weekly/               # Spätere KI-Wochenfazits
├── scripts/
│   ├── ingest.mjs            # Polizei + Veranstaltungen + Gemini-Enrichment
│   └── fixtures/             # Test-Fixtures für --dry-run
├── .github/workflows/
│   └── daily-ingest.yml      # Täglicher Cron 04:00 UTC
├── prototype/
│   └── koepenick-radar-v0.jsx   # Original-Prototyp, nur Design-Referenz
├── AGENTS.md                 # Working Agreement für ChatGPT Codex (Georg)
├── CLAUDE.md                 # Working Agreement für Claude Code (Joha)
├── HANDOVER.md               # diese Datei
├── PRD.md                    # Vollständiges Produktbriefing
└── README.md                 # Öffentliche Beschreibung + Disclaimer
```

---

## Datenquellen

| Quelle | Typ | Status |
|---|---|---|
| Polizei Berlin | RSS + HTML-Fallback | ✅ im Script |
| Berlin.de Veranstaltungskalender TK | HTML | ✅ im Script |
| Bezirksamt TK Pressemitteilungen | HTML-Scraping | ⏳ Iteration 3 |
| BVV Treptow-Köpenick | OParl / HTML | ⏳ Iteration 3 |

---

## Datenmodell

`Entry` in `lib/types.ts`. Wichtige Felder für Iteration 2:

- `source_id?` — Quellen-Bezeichner (`polizei-berlin`, `berlin-events`)
- `raw_excerpt?` — erste 500 Zeichen des Originals
- `location_relevant?` — Geofilter (false = wird nicht angezeigt)
- `event_start_at?` — Veranstaltungsbeginn ISO 8601
- `venue?` — Veranstaltungsort
- Tag `veranstaltung` — für Kalender-Einträge

Wahlfelder bleiben: `political_relevance_score`, `election_relevant`, `election_topic?`

---

## Wer arbeitet wie

| Person | Tool | Zugang |
|---|---|---|
| Joha | Claude Code (CLI / Web) | GitHub + Vercel |
| Georg | ChatGPT Codex | GitHub Collaborator |

---

## Wahl-Kontext

Berlin-Abgeordnetenhauswahl: **20. September 2026**.
Treptow-Köpenick bekommt einen zusätzlichen (siebten) Wahlkreis.

Top-5-Wahlthemen:
1. Wohnen / Mieten / Wohnungsbau
2. Mobilität / Verkehr
3. Bildung / Schulen / Kitas
4. Innere Sicherheit
5. Haushalt / Sparpolitik

---

## Was wir NICHT bauen

- Login / Accounts
- Newsletter / E-Mail
- Kartenansicht
- Volltext-Suche (frühestens Iteration 4)
- App Store App
- Parteipolitische Bewertung
- Eigene Datenbank (erst bei > 1.000 Einträgen relevant)

---

*Letzte Aktualisierung: 15.05.2026 — Iteration 2 Pipeline fertig, wartet auf GEMINI_API_KEY Secret*
