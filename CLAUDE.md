# CLAUDE.md — Working Agreement

Diese Datei ist die Anleitung für Claude Code (und Codex), wenn an diesem Repo gearbeitet wird. Bitte vor jeder Session lesen.

## Projekt-Kontext in 3 Sätzen

Köpenick Kiezradar ist ein hyperlokales Monitoring-Tool für Berlin-Köpenick, gebaut von zwei Nachbarn ohne Programmiererfahrung. Es aggregiert öffentliche Meldungen, Termine und Dokumente, fasst sie per KI zusammen und zeigt sie in Feed, Karte, Wochenblick und Detailseiten. Vollständiges Briefing in `PRD.md`.

## Working Principles

1. **MVP-First.** Wenn eine Frage zwischen "klein und stabil" und "groß und elegant" entscheidet → immer klein. Wir liefern lieber drei einfache Iterationen als eine perfekte.
2. **Token-Effizienz ist Pflicht, nicht Kür.** Wir bezahlen jede Claude-API-Anfrage. Lies nur, was du brauchst. Schreib nur, was nötig ist. Vermeide unnötige Wiederholungen in Prompts.
3. **Keine Architektur-Astronautik.** Keine Microservices, keine Event-Buses, keine Monorepos, keine eigenen DSLs. Boring tech wins.
4. **Skalierbar und sauber, aber nicht over-engineered.** Code soll von einem zweiten Vibe-Coder verstanden werden können. Komponenten klein, Naming klar, keine cleveren Abkürzungen.
5. **Push back.** Wenn der Maintainer etwas verlangt, was schlecht für das Projekt ist (Scope-Creep, Over-Engineering, Premature Optimization) → klar und konstruktiv widersprechen, nicht einfach umsetzen.

## Konventionen

### Code-Stil
- TypeScript strict
- Funktionale React-Komponenten, keine Klassen
- `kebab-case` für Dateinamen
- `PascalCase` für Komponenten
- Tailwind statt Custom CSS
- Keine inline Styles
- Async/Await statt Promise-Ketten

### Struktur
- App-Router, nicht Pages-Router
- Komponenten in `/components`, sortiert nach Domäne nicht nach Typ
- Server-only Code in `/lib/server`, Client-Code in `/lib/client`, Shared in `/lib/shared`
- Daten in `/data` als JSON, gitcommitted

### Commits
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`)
- Eine Sache pro Commit
- Deutsche oder englische Commit-Messages, beides OK

### Tests
- Keine Test-Coverage-Pflicht in Iteration 1
- Ab Iteration 2: Smoke-Tests für Ingestion-Pipeline (kritische Pfad)
- Keine UI-Tests bis Iteration 4+

## Token-Effizienz-Regeln (für Claude Code Sessions)

1. **Nicht alle Dateien einlesen.** Lies nur die, die du wirklich brauchst.
2. **Keine ungebetenen Refactors.** Wenn du Code änderst, ändere nur, was nötig ist.
3. **Keine Status-Updates en passant.** Wenn ich eine Frage stelle, antworte darauf — nicht zusätzlich auf 5 andere Dinge.
4. **Vorher fragen statt nachher fixen.** Wenn eine Anforderung unklar ist, eine knappe Rückfrage statt ein 200-Zeilen-Patch in die falsche Richtung.
5. **Keine Dokumentations-Inflation.** Kommentare nur, wo der Code nicht selbsterklärend ist.

## KI API Usage (für das Tool selbst)

- **Aktuell:** Gemini API via `GEMINI_API_KEY` für Enrichment
- **Modell:** `GEMINI_MODEL` env-var, sonst Script-Default
- **Max Tokens:** 1000 pro Aufruf reicht für Summary + Tags + Scores
- **Batching:** Wenn möglich mehrere Einträge in einem Call, max 10 pro Batch
- **Cost-Cap:** Hard limit 5 € / Tag bei der Ingestion. Wenn überschritten → Action stoppt, Issue erstellen.
- **Cache:** Bereits enrichte Einträge (per Hash) nicht neu ans LLM schicken.

## Was nicht angefasst werden soll

- `PRD.md` — nur über Pull Request mit Diskussion
- `README.md` Disclaimer — bleibt drin, in welcher Form auch immer
- `.github/workflows/daily-ingest.yml` — kritischer Pfad, Änderungen mit Vorsicht

## Wenn du nicht weiterkommst

Lieber Stopp-and-Ask als blind weiterprogrammieren. Frag konkret, was unklar ist, und schlage 1–2 Optionen vor.

## Stand der Iteration

Stand 15.05.2026: App ist live auf Vercel; GitHub `main` ist Quelle der Wahrheit. Vor lokaler Arbeit immer fetch/pull. Aktueller Stand und nächste Schritte: siehe `HANDOVER.md` und `PRD.md §15`.
