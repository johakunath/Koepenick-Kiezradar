# AGENTS.md - Codex Working Agreement

> Read this file fully before doing anything. Then read `CLAUDE.md`, then `PRD.md`.

---

## Current Status

Stand 15.05.2026: GitHub `main` is the source of truth. Always fetch/pull before local work.

Köpenick Kiezradar is live on Vercel at https://koepenick-kiezradar.vercel.app/. It now has feed, filters, Wahl-Watch, map, weekly overview, admin trigger, RSS feed, ingestion status, parser fixtures, archive data, internal detail pages, topics, places, meetings and sources.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js App Router, TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| Package manager | pnpm |
| Hosting | Vercel |
| Data | JSON files in `/data/` |
| AI enrichment | Gemini API via `GEMINI_API_KEY` |
| Cron | GitHub Actions |

---

## Setup

```bash
pnpm install
pnpm dev
pnpm build
pnpm test:parsers
pnpm ingest:dry
```

`pnpm build` needs network access for Google Fonts. `pnpm ingest:dry` needs network access to Berlin.de sources.

---

## Repository Layout

```text
/app                    App Router pages, API route, feed.xml
/components             Domain-oriented UI components
/data                   entries, archive, weekly, topics, districts, sources
/lib                    shared types, data helpers, geo helpers
/scripts                ingest, weekly digest, parser smoke tests
/.github/workflows      daily ingest and weekly digest automation
/prototype              old design reference only
```

---

## Coding Rules

- Do not revert Claude or user changes.
- Keep changes additive and scoped.
- Server components by default; use `"use client"` only for interaction.
- Keep JSON-as-database until scale or search requires a real DB.
- Do not add newsletter, accounts, or deep OParl normalization without a fresh plan.
- If VIZ, Amtsblatt, or other public sources are unstable, treat them defensively instead of forcing brittle imports.

---

## Current Anti-Goals

- No login/accounts
- No newsletter/email
- No partisan political judgement
- No database yet
- No full editorial CMS
- No large source expansion before parser/data quality is stable
