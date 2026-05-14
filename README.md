# Köpenick Kiezradar

> Hyperlokales Monitoring-Tool für Berlin-Köpenick. Aggregiert öffentliche Meldungen aus Polizei, Bezirksamt, BVV und Veranstaltungen. Fasst per KI zusammen. Bewertet lokale Relevanz.

## Status

🟡 **Experimentelles Privatprojekt zweier Nachbarn.** Vibe-coded mit Claude Code / Codex.

Iteration 1 ist abgeschlossen und in `main` gemergt. Der nächste Schritt ist das Vercel-Deployment. Iteration 2 bereitet echte Daten vor: Polizei-Meldungen, Berlin.de-Veranstaltungen, GitHub Action Cron und Claude-Enrichment.

## Disclaimer

Dieses Tool ist ein privates Lern- und Experimentierprojekt. Es ist **nicht** zur offiziellen oder allgemeinen Verwendung gedacht. Alle Inhalte sind KI-generiert und können falsch sein. Maßgeblich sind ausschließlich die jeweils verlinkten Originalquellen.

Das Tool verlinkt auf öffentlich zugängliche Informationen und stellt keine eigenständige journalistische Leistung dar. Für die Inhalte verlinkter Seiten übernehmen wir keine Verantwortung.

Wenn du diese Seite findest und sie dir auffällt: schreib uns gerne, aber bitte nicht weiterverbreiten oder darauf verlinken, ohne kurz Bescheid zu geben.

## Quick Start

```bash
pnpm install
pnpm dev
pnpm build
```

## Daten neu ziehen

```bash
pnpm ingest:dry   # Strukturtest ohne Claude API
pnpm ingest       # echte Quellen + Claude API + JSON schreiben
```

`pnpm ingest` braucht `ANTHROPIC_API_KEY`. In Produktion läuft der Import über `.github/workflows/daily-ingest.yml` und committet nur, wenn sich Daten ändern.

## Datenhaltung

Vorerst keine Datenbank:

- `data/entries.json` hält den aktiven Feed.
- `data/archive/YYYY-MM.json` hält Monatsarchive.
- `data/weekly/YYYY-Www.json` ist für spätere Wochenfazits vorgesehen.

Eine Datenbank kommt erst bei größerem Archiv, Volltextsuche, Admin-UI oder langsamen Builds in Frage.

## Aufbau

```text
/app                    Next.js App Router
/components             UI-Komponenten
/data                   entries.json, archive/, weekly/
/scripts                Ingestion-Script und Fixtures
/.github/workflows      Daily-Cron für Ingestion
```

## Tech

- Next.js App Router
- Tailwind CSS
- TypeScript
- Claude API
- GitHub Actions Cron
- Vercel Hosting

## Dokumente

- [PRD.md](./PRD.md) - Was, warum, Scope, Roadmap
- [CLAUDE.md](./CLAUDE.md) - Working Agreement
- [HANDOVER.md](./HANDOVER.md) - aktueller Arbeitsstand

## Datenquellen

- Polizei Berlin Meldungen: https://www.berlin.de/polizei/polizeimeldungen/
- Berlin.de Veranstaltungskalender Treptow-Köpenick: https://www.berlin.de/land/kalender/index.php?c=13&suchmaske=
- Bezirksamt und BVV folgen nach stabilem Polizei-/Event-Import.

## Lizenz

Privater, nicht öffentlich nutzbarer Code. Kein Re-use erlaubt.
