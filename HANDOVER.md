# HANDOVER.md — Claude Code Briefing

> Lies diese Datei vollständig, bevor du irgendetwas tust.
> Dann lies CLAUDE.md, dann PRD.md.

---

## Projekt-Status

Wir sind bei **Iteration 1** (klickbarer Prototyp, kein echter Datenimport).

Ein React-Prototyp existiert (`prototype/koepenick-radar-v0.jsx`) als Design-Referenz. Er ist ein Claude-Artifact-Prototyp, **kein produktionsreifer Code**. Dein Job ist es, daraus eine echte Next.js-App zu bauen.

---

## Repo-Name vs. Produktname

- **Repo:** `Koepenick-Kiezmonitor` (GitHub-URL)
- **Produktname:** Köpenick Radar (im UI, im Code)
- Wenn du Variablen, Komponent-Namen, etc. vergibst: nutze `KoepenickRadar` / `koepenick-radar`

---

## Was im Repo liegt

```
/
├── README.md          # GitHub-Frontmatter + Disclaimer
├── PRD.md             # Scope, Datenmodell, Architektur, Roadmap
├── CLAUDE.md          # Dein Working Agreement — lies das genau
├── HANDOVER.md        # diese Datei
└── prototype/
    └── koepenick-radar-v0.jsx   # Design-Referenz (Artifact-Code, nicht direkt verwenden)
```

---

## Entschiedene Architektur

| Komponente | Entscheidung | Begründung |
|---|---|---|
| Framework | **Next.js 15, App Router, TypeScript** | Beste Claude-Code-Kompatibilität, Static Export für GitHub Pages möglich |
| Styling | **Tailwind CSS** | Schnell, wartbar, Claude-freundlich |
| Hosting | **Vercel** | Free Tier, native GitHub-Integration, Cron-Jobs |
| "DB" v0 | **JSON-Dateien im Repo** (`/data/entries.json`) | Kein DB-Setup, git-versioniert, einfach erweiterbar |
| "DB" v1 | Vercel KV oder Supabase Free (wenn JSON > 500 Einträge) | Später entscheiden |
| Datenimport | **GitHub Actions Cron** (täglich 06:00 CET) | Pull RSS/Scraping → Claude API → JSON Commit |
| KI | **Claude API** (claude-sonnet-4-5) | Enrichment, Relevanz-Bewertung, Zusammenfassung |
| Paketmanager | **pnpm** | |

---

## Design-System (aus Prototyp übernehmen)

```css
--bg: #f4ede0
--bg-card: #faf6ec
--water-deep: #1f4e6b      /* Primär-Akzent */
--water-mid: #3a7396
--water-light: #c9dde6
--forest: #4a6b3a
--sand: #d4c4a8
--ink: #1a2933
--ink-soft: #4a5a64
--brick: #9c4a2e           /* Nur für Wahl-Badges */
--border: #e0d6c2
```

**Fonts:** Fraunces (Display/Headline, Google Fonts) + Inter Tight (Body)

**Designrichtung:** "Kiez/Wasser/Wald" — Müggelsee-Blau, Wald-Grün, warmer Cream-Hintergrund. Kein Verwaltungs-Grau, kein Tech-Blo-Blau.

---

## Datenmodell (ein Entry)

```typescript
interface Entry {
  id: string;               // hash aus title+source_url
  source: string;
  source_url: string;
  title: string;
  published_at: string;     // ISO 8601
  ingested_at: string;      // ISO 8601
  ai_summary: string;       // 1–3 Sätze
  tags: Tag[];              // aus: verkehr | sicherheit | verwaltung | politik | infrastruktur | sonstiges
  location: string;
  local_relevance_score: number;     // 0–1
  political_relevance_score: number; // 0–1
  election_relevant: boolean;
  election_topic?: string;  // z.B. "Wohnen", "Innere Sicherheit"
  ai_reasoning: string;     // 1 Satz Begründung
  is_mock?: boolean;        // true wenn Demo-Daten
}
```

Tags: `verkehr | sicherheit | verwaltung | politik | infrastruktur | sonstiges`

---

## UI-Anforderungen v0 (Iteration 1)

### Seiten
- `/` — Feed
- `/woche` — Wochenüberblick

### Feed (`/`)
- Header: Logo (Wasser-Wellen-SVG) + "Köpenick Radar" (Fraunces) + Datum + Eintrag-Count
- Disclaimer-Banner (dismissable, Session-State)
- Sticky Tag-Filter: 6 Toggle-Chips, Multi-Select
- Card-Liste (sorted by published_at desc)
- Footer: Disclaimer-Text

### Entry-Card
- Wahl-Badge wenn `election_relevant: true` — **prominent**, volle Breite oben an der Card, Brick-Rot, mit Vote-Icon + `election_topic`
- Titel (Fraunces, groß)
- AI-Summary (2–3 Zeilen)
- Lokal-Relevanz-Balken (0–100 %)
- Footer-Zeile: Ort · Zeitabstand · Quelle-Link (ArrowUpRight)
- Expandable "Warum relevant?" → zeigt `ai_reasoning`

### Wochenüberblick (`/woche`)
- Header: "Diese Woche in Köpenick" + Datumsrange
- Stats-Zeile: X Einträge · Y wahlrelevant · meistgenutzter Tag
- Einträge gruppiert nach Tag (neueste zuerst)
- Link zurück zum Feed

---

## Datenquellen (Iteration 2, nicht jetzt)

Quellen werden in **Iteration 2** angebunden:

| Quelle | Typ | URL |
|---|---|---|
| Polizei Berlin | RSS | https://www.berlin.de/polizei/polizeimeldungen/index/rss.php |
| Bezirksamt TK Pressemitteilungen | HTML-Scraping | https://www.berlin.de/ba-treptow-koepenick/aktuelles/ |
| BVV Treptow-Köpenick | OParl / HTML | https://www.berlin.de/ba-treptow-koepenick/politik-und-verwaltung/bezirksverordnetenversammlung/ |

**Jetzt nicht anpacken.** Erst wenn Iteration 1 deployed ist.

---

## Datei-Struktur (Ziel)

```
/
├── app/
│   ├── layout.tsx
│   ├── page.tsx            # Feed
│   └── woche/
│       └── page.tsx        # Wochenüberblick
├── components/
│   ├── EntryCard.tsx
│   ├── TagFilter.tsx
│   ├── WeeklyView.tsx
│   ├── Header.tsx
│   ├── DisclaimerBanner.tsx
│   └── Footer.tsx
├── lib/
│   └── types.ts            # Entry interface + Tag type
├── data/
│   └── entries.json        # Mock-Daten zu Beginn, später echt
├── scripts/
│   └── ingest.ts           # Ingestion-Script (Iteration 2)
├── .github/
│   └── workflows/
│       └── daily-ingest.yml # Cron (Iteration 2)
├── prototype/
│   └── koepenick-radar-v0.jsx  # Nur als Design-Referenz
├── public/
├── README.md
├── PRD.md
├── CLAUDE.md
├── HANDOVER.md
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

---

## Dein erster Task: Iteration 1 bauen

**Exakte Reihenfolge:**

1. `pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"` im Repo-Root
2. Google Fonts (Fraunces + Inter Tight) in `app/layout.tsx` einbinden
3. CSS-Variablen in `globals.css` anlegen (siehe Design-System oben)
4. `lib/types.ts` anlegen mit Entry-Interface und Tag-Type
5. `data/entries.json` anlegen mit den 8 Mock-Einträgen aus dem Prototyp
6. Komponenten bauen (Reihenfolge: EntryCard → TagFilter → Header → DisclaimerBanner → WeeklyView → Footer)
7. `app/page.tsx` (Feed) bauen
8. `app/woche/page.tsx` (Wochenüberblick) bauen
9. `next.config.ts` prüfen — Static Export wenn GitHub Pages, sonst Standard für Vercel
10. Deployment-Test auf Vercel

**Nicht tun ohne Rückfrage:**
- Eigene DB einführen (noch nicht)
- Ingestion-Script bauen (Iteration 2)
- Komponenten-Struktur großartig umbauen
- Abhängigkeiten hinzufügen, die nicht gebraucht werden

---

## Wahl-Kontext (wichtig für KI-Enrichment)

Berlin-Abgeordnetenhauswahl: **20. September 2026**. Treptow-Köpenick bekommt einen zusätzlichen Wahlkreis.

Top-5-Wahlthemen (relevant für `election_topic`-Tagging):
1. Wohnen / Mieten / Wohnungsbau
2. Mobilität / Verkehr
3. Bildung / Schulen / Kitas
4. Innere Sicherheit
5. Haushalt / Sparpolitik

---

## Anti-Goals (was wir NICHT bauen)

- Login / Accounts
- Newsletter / E-Mail
- Kartenansicht
- Suche (kommt later)
- App Store App
- Parteipolitische Bewertung
- Vollständige journalistische Redaktion

---

## Push-Back-Mandat

Wenn der Maintainer etwas verlangt, das gegen die Prinzipien in `CLAUDE.md` verstößt (Scope-Creep, Over-Engineering, Premature Optimization): klar widersprechen, nicht einfach umsetzen.

---

*Letzte Aktualisierung: 14.05.2026 — nach Chat-Session in Claude.ai*
