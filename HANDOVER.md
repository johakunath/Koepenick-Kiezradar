# HANDOVER.md - Codex / Claude Code Briefing

> Lies diese Datei vollständig, bevor du irgendetwas tust.
> Dann lies `CLAUDE.md`, dann `PRD.md`.

---

## Projekt-Status

**Iteration 1 ist abgeschlossen. PR #1 wurde gemergt.**

`main` enthält jetzt den vollständigen Next.js-Scaffold mit Feed, Wochenansicht, Komponenten, Mock-Daten und lauffähigem `pnpm build`.

Der nächste operative Schritt ist **Vercel-Deployment**:

1. GitHub-Repo bei Vercel importieren.
2. Build Command: `pnpm build`.
3. Framework: Next.js.
4. Nach erfolgreichem Deployment URL in README/Handover ergänzen.

Danach folgt **Iteration 2: echte Daten + KI-Pipeline**.

---

## Repo-Name vs. Produktname

- **Repo:** `Koepenick-Kiezradar`
- **Produktname:** Köpenick Kiezradar
- Für Code-Namen: `KoepenickKiezradar` / `koepenick-kiezradar`

---

## Aktuelle Architektur

| Komponente | Entscheidung | Stand |
|---|---|---|
| Framework | Next.js App Router, TypeScript | umgesetzt |
| Styling | Tailwind CSS + lokale Design Tokens | umgesetzt |
| Hosting | Vercel | nächster Schritt |
| Daten v0/v1 | JSON im Repo | umgesetzt, Archiv vorbereitet |
| Ingestion | Node-Script `scripts/ingest.mjs` | Iteration 2 vorbereitet |
| Cron | GitHub Action `daily-ingest.yml` | vorbereitet |
| KI | Claude API via `ANTHROPIC_API_KEY` | Script vorbereitet |

---

## Was im Repo liegt

```text
/
├── app/                         # Next.js App Router
├── components/                  # UI-Komponenten
├── data/
│   ├── entries.json             # Aktiver Feed
│   ├── archive/                 # Monatsarchive, JSON
│   └── weekly/                  # Spätere Wochenfazits
├── scripts/
│   ├── ingest.mjs               # Polizei + Veranstaltungen + Claude-Enrichment
│   └── fixtures/                # Smoke-Test-Fixtures
├── .github/workflows/
│   └── daily-ingest.yml         # täglicher Cron
├── prototype/                   # alte Design-Referenz
├── README.md
├── PRD.md
├── CLAUDE.md
└── HANDOVER.md
```

---

## Nächste Schritte

### 1. Deployment

- Vercel mit GitHub verbinden.
- Repo importieren.
- `pnpm build` prüfen.
- Deployment-URL dokumentieren.

### 2. Iteration 2 - echte Daten

Start klein halten:

1. Polizei Berlin Meldungen als erste echte Meldungsquelle.
2. Berlin.de Veranstaltungskalender Treptow-Köpenick als erste Event-Quelle:
   `https://www.berlin.de/land/kalender/index.php?c=13&suchmaske=`
3. Claude-Enrichment aktivieren, sobald `ANTHROPIC_API_KEY` als GitHub Secret gesetzt ist.
4. GitHub Action manuell testen, dann täglich laufen lassen.
5. Bezirksamt und BVV erst danach anbinden.

---

## Datenhaltung

**Keine Datenbank in Iteration 2.**

Wir speichern zunächst weiter im GitHub-Repo:

- `data/entries.json` = aktiver Feed, begrenzt auf aktuelle Einträge.
- `data/archive/YYYY-MM.json` = Monatsarchive für Verlauf.
- `data/weekly/YYYY-Www.json` = spätere KI-Wochenfazits.

Eine Datenbank wird erst relevant bei:

- mehr als ca. 1.000 Einträgen,
- Volltextsuche,
- Admin-/Korrektur-UI,
- komplexen Filtern,
- spürbar langsamen Builds.

---

## UI-Entscheidungen für die nächsten Versionen

- Wahl-Badge ist aus der Card-UI entfernt.
- Wahlrelevanz bleibt intern im Datenmodell.
- “Warum relevant?” bleibt als ausklappbarer Bereich pro Card.
- Veranstaltungen sind Teil des Feeds, keine eigene Event-Seite in Iteration 2.
- Wochenüberblick ist als Digest-Seite vorbereitet und wird später durch KI-Fazit ergänzt.

---

## Datenmodell

`Entry` lebt in `lib/types.ts`.

Neu bzw. wichtig für Iteration 2:

- `source_id?`
- `raw_excerpt?`
- `location_relevant?`
- `event_start_at?`
- `event_end_at?`
- `venue?`
- Tag `veranstaltung`

Wahlfelder bleiben erhalten:

- `political_relevance_score`
- `election_relevant`
- `election_topic?`

---

## Lokale Befehle

```bash
pnpm install
pnpm dev
pnpm build
pnpm ingest:dry
pnpm ingest
```

`pnpm ingest` braucht für Claude-Enrichment `ANTHROPIC_API_KEY`. Für lokale Strukturtests ohne API-Key:

```bash
pnpm ingest:dry
```

---

## Quellen Iteration 2

| Quelle | Typ | URL |
|---|---|---|
| Polizei Berlin | Webseite, RSS-Fallback falls verfügbar | https://www.berlin.de/polizei/polizeimeldungen/ |
| Berlin.de Veranstaltungskalender Treptow-Köpenick | HTML | https://www.berlin.de/land/kalender/index.php?c=13&suchmaske= |
| Bezirksamt TK Pressemitteilungen | später | https://www.berlin.de/ba-treptow-koepenick/aktuelles/ |
| BVV Treptow-Köpenick | später | https://www.berlin.de/ba-treptow-koepenick/politik-und-verwaltung/bezirksverordnetenversammlung/ |

---

## Push-Back-Mandat

Wenn neue Wünsche zu Datenbank, Suche, Admin-UI, Karten oder Newsletter kommen: erst prüfen, ob sie Iteration 2 wirklich stabiler machen. MVP-first bleibt die Leitplanke.

---

*Letzte Aktualisierung: 15.05.2026 - nach Abschluss Iteration 1 und Planung Iteration 2*
