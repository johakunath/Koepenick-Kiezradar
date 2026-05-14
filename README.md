# Köpenick Radar

> Hyperlokales Monitoring-Tool für Berlin-Köpenick. Aggregiert öffentliche Meldungen aus Polizei, Bezirksamt, BVV. Fasst per KI zusammen. Bewertet lokale Relevanz.

## Status

🟡 **Experimentelles Privatprojekt zweier Nachbarn.** Vibe-coded mit Claude Code. Aktuell Iteration 1 (klickbarer Prototyp mit Mock-Daten).

## ⚠️ Disclaimer

Dieses Tool ist ein privates Lern- und Experimentierprojekt. Es ist **nicht** zur offiziellen oder allgemeinen Verwendung gedacht. Alle Inhalte sind KI-generiert und können falsch sein. Maßgeblich sind ausschließlich die jeweils verlinkten Originalquellen.

Das Tool verlinkt auf öffentlich zugängliche Informationen und stellt keine eigenständige journalistische Leistung dar. Für die Inhalte verlinkter Seiten übernehmen wir keine Verantwortung.

Wenn du diese Seite findest und sie dir auffällt: schreib uns gerne — aber bitte nicht weiterverbreiten oder darauf verlinken, ohne kurz Bescheid zu geben.

## Quick Start (für Maintainer)

```bash
pnpm install
pnpm dev          # läuft auf http://localhost:3000
```

### Daten neu ziehen (manuell)

```bash
pnpm ingest       # zieht Quellen, ruft Claude API, schreibt data/entries.json
```

In Produktion läuft `ingest` täglich um 06:00 CET via GitHub Action.

## Aufbau

```
/app              Next.js App Router
/components       UI-Komponenten
/data             entries.json, weekly-*.json
/scripts          Ingestion-Scripts
/.github/workflows  Daily-Cron für Ingestion
```

## Tech

- Next.js 15 (App Router, Static Export)
- Tailwind CSS
- TypeScript
- Claude API (Sonnet 4.5)
- GitHub Actions (Cron)
- Vercel (Hosting)

## Dokumente

- [PRD.md](./PRD.md) — Was, warum, Scope, Roadmap
- [CLAUDE.md](./CLAUDE.md) — Working Agreement für Claude Code

## Datenquellen

Aktuelle Liste in [PRD.md §4](./PRD.md#4-datenquellen).

## Lizenz

Privater, nicht öffentlich nutzbarer Code. Kein Re-use erlaubt.
