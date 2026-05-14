# Köpenick Radar — PRD v0.2

## 1. Was

Hyperlokales Monitoring-Tool für Berlin-Köpenick. Aggregiert lokale Meldungen aus öffentlichen Quellen, fasst sie per KI zusammen, bewertet lokale und politische Relevanz, zeigt sie in einem Feed.

**Status:** Privates Spielzeug für zwei Nachbarn. Kein offizielles Produkt. Nicht für externe Nutzung gedacht (siehe Disclaimer in README).

## 2. Nordstern

> Was passiert gerade oder bald in unserem Kiez — und was davon ist politisch relevant, besonders im Hinblick auf die Berlin-Wahl am 20. September 2026?

## 3. Scope MVP (v0)

### Geografisch
- Altstadt Köpenick
- Dammvorstadt
- Bahnhof Köpenick
- Spindlersfeld
- Zentrales Köpenick

### Thematisch (mit Tags)
- Verkehr & Baustellen
- Sicherheit / Polizei
- Verwaltung / BVV / Bezirksamt
- Lokale Politik & Wahl 2026
- Infrastruktur
- Sonstiges

### Out of Scope v0
- Login, Accounts
- Newsletter, E-Mail
- Karte
- Suche
- Detailansicht als eigene Seite (Titel + Summary + Link reicht)
- Eigene DB
- App Store App

## 4. Datenquellen

### v0 — Must-have
| Quelle | Typ | Status |
|---|---|---|
| Polizei Berlin Pressemeldungen | RSS / Atom | https://www.berlin.de/polizei/polizeimeldungen/index/rss.php |
| Bezirksamt Treptow-Köpenick Pressemitteilungen | RSS / Webseite | https://www.berlin.de/ba-treptow-koepenick/aktuelles/ |
| BVV Treptow-Köpenick (Ratsinformationssystem) | OParl API / Webseite | https://www.berlin.de/ba-treptow-koepenick/politik-und-verwaltung/bezirksverordnetenversammlung/ |

### v1 — Nice-to-have
- VIZ Berlin (Verkehrsinformationszentrale, Baustellen)
- Feuerwehr Berlin Einsatzmeldungen
- Open Data Berlin (Wasserqualität, Wetter, etc.)
- BVG / S-Bahn Störungen Köpenick

## 5. Datenmodell (ein Eintrag)

```json
{
  "id": "uuid",
  "source": "polizei-berlin",
  "source_url": "https://...",
  "title": "Originaltitel",
  "published_at": "2026-05-14T10:00:00Z",
  "ingested_at": "2026-05-14T11:00:00Z",
  "raw_excerpt": "Erste 500 Zeichen der Originalmeldung",
  "ai_summary": "1–3 Sätze",
  "tags": ["sicherheit", "verkehr"],
  "location": "Altstadt Köpenick",
  "location_relevant": true,
  "local_relevance_score": 0.85,
  "political_relevance_score": 0.3,
  "election_relevant": false,
  "ai_reasoning": "Warum diese Meldung für Köpenick relevant ist (1 Satz)"
}
```

`location_relevant: false` → Eintrag wird nicht angezeigt (Pre-Filter).
Scores 0–1, von KI vergeben. Schwellenwert konfigurierbar.

## 6. Architektur (vereinfacht)

```
                 GitHub Action (täglich 06:00 CET)
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Ingestion Script (Node/TS)   │
        │  - RSS pullen                 │
        │  - Bezirksamt scrapen         │
        │  - BVV OParl pullen           │
        │  - Dedupe per Hash            │
        └──────────────┬────────────────┘
                       ▼
        ┌───────────────────────────────┐
        │  Claude API Enrichment        │
        │  - Köpenick relevant? J/N     │
        │  - Tags                       │
        │  - Summary                    │
        │  - Relevanz-Scores            │
        │  - Begründung                 │
        └──────────────┬────────────────┘
                       ▼
        ┌───────────────────────────────┐
        │  /data/entries.json (Repo)    │
        │  /data/weekly-2026-W20.json   │
        └──────────────┬────────────────┘
                       ▼
        ┌───────────────────────────────┐
        │  Next.js Static Site          │
        │  /         → Feed             │
        │  /woche    → Wochenüberblick  │
        └───────────────────────────────┘
```

## 7. UI v0

### `/` Feed (Mobile-first)
- Header: Logo + Subtitle + Wochen-Link
- Tag-Filter: 6 Toggle-Chips
- Liste: Cards mit Datum, Titel, KI-Summary (2 Zeilen), Tags, Quelle (Link)
- Klick auf Card → öffnet Originalquelle in neuem Tab
- Footer: Disclaimer, "Generiert am [Datum]"

### `/woche` Wochenüberblick
- Generiert sonntags 22:00 CET via GitHub Action
- KI-Summary "Was war wichtig diese Woche?" (3–5 Sätze)
- Top 5–7 Einträge der Woche
- Link zurück zum Feed

## 8. Designrichtung

**Kiez / Wasser / Wald** (eine Richtung, kein Auswahl-Theater).
- Helle Farben, leichte Pastelltöne
- Wasser-Akzent (Müggelsee-Blau, Dahme-Blau)
- Wald-/Naturbezug dezent
- Klare Typo (Inter oder ähnliches), gute mobile Lesbarkeit
- Karten mit weichen Schatten, Rundungen
- Keine Stockfotos, kein "Verwaltungs-Grau"

Konkrete Tokens werden in der Implementierung (Tailwind config) definiert.

## 9. Relevanzlogik

Hybrid:
1. **Geofilter (hart):** KI prüft, ob die Meldung Köpenick betrifft. Wenn nein → wird nicht angezeigt.
2. **Tag-Klassifikation:** KI vergibt 1–3 Tags aus festem Set.
3. **Local Relevance Score (0–1):** Wie sehr betrifft das Alltag in Köpenick?
4. **Political Relevance Score (0–1):** Wie sehr betrifft das lokale Politik / die Wahl 2026?
5. **Begründung:** Ein Satz, warum diese Meldung relevant ist.

KI darf irren. Originalquelle bleibt maßgeblich. Disclaimer prominent.

## 10. Politische Relevanz (Wahl 2026)

Das Tool macht sichtbar, was im Wahlkontext zählt — neutral, ohne Parteibewertung.

Fokus-Themen (top-down konfiguriert):
1. Wohnen / Mieten / Wohnungsbau
2. Mobilität / Verkehr
3. Bildung / Schulen / Kitas
4. Innere Sicherheit
5. Haushalt / Sparpolitik

KI markiert Einträge, die zu diesen Themen passen, mit `election_relevant: true` und ggf. einem oder mehreren Wahl-Topic-Tags.

## 11. Roadmap

### Iteration 1 — Klickbarer Prototyp (1 Wochenende)
- Next.js Skeleton
- Statische Mock-Daten in `entries.json`
- Feed + Filter funktionieren
- Eine Designrichtung umgesetzt
- Disclaimer-Footer
- Deploy auf Vercel

### Iteration 2 — Erste echte Daten + KI
- Polizei-RSS ziehen via GitHub Action
- Claude API Enrichment Pipeline
- `entries.json` automatisch aktualisiert
- BVV OParl-Anbindung (komplexer)
- Bezirksamt-Scraping

### Iteration 3 — Wochenüberblick + zweite Welle Quellen
- `/woche`-Seite
- VIZ Berlin / Baustellen
- Feuerwehr (falls verfügbar)

### Iteration 4 — Persistenz (wenn JSON zu groß wird)
- Vercel KV oder Supabase Free
- Archiv-Funktion
- ggf. Volltext-Suche

## 12. Erfolgskriterien MVP

- [ ] Beide Nutzer öffnen die Seite mindestens 1× pro Woche freiwillig
- [ ] Mindestens 5 echte Köpenick-relevante Einträge pro Woche
- [ ] Originalquelle ist in <2 Klicks erreichbar
- [ ] KI-Summary ist in 80%+ der Fälle korrekt
- [ ] Beide Nutzer können selbst neue Datenquellen hinzufügen (mit Claude Code Hilfe)

## 13. Anti-Goals

- Keine vollständige journalistische Redaktion
- Keine parteipolitische Bewertung
- Keine perfekte Kartenansicht
- Kein App-Store-Release
- Keine User-Accounts
- Kein Newsletter
- Keine Push-Notifications

## 14. Offene Fragen für Claude Code in der Implementierung

1. OParl-API von Berlin-Treptow-Köpenick: Existiert sie? In welchem Format? Wie stabil?
2. Bezirksamt-Webseite: RSS verfügbar oder muss gescraped werden?
3. Wie wird der Geofilter sicher? (Polizei-Meldungen erwähnen oft Bezirke, aber nicht immer)
4. Welches Token-Budget pro Tag für Claude API? Cost-Cap definieren.
5. Wie wird "Köpenick-relevant" bei stadtweiten Themen (z.B. Sparpolitik) behandelt? Eigene Logik nötig.

Diese Fragen werden in Iteration 1 nicht beantwortet — explizit Out of Scope.
