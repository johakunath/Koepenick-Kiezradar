import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readText, inferDistrictFromText, extractAddresses } from "./lib/shared.mjs";
import { parsePoliceSource, POLICE_RSS_URL, POLICE_PAGE_URL } from "./sources/police.mjs";
import { parseEventsHtml, nextEventsPage, EVENTS_URL } from "./sources/events.mjs";
import { parseBezirksamtSource, BEZIRKSAMT_RSS_URL, BEZIRKSAMT_PAGE_URL } from "./sources/bezirksamt.mjs";
import { fetchAmtsblattEntries } from "./sources/amtsblatt.mjs";
import { parseVizBaustellenGeoJson, VIZ_BAUSTELLEN_URLS, resolveVizUrl } from "./sources/viz.mjs";
import { enrichWithAI } from "./lib/enrich.mjs";
import { geocodeEntries } from "./lib/geocode.mjs";
import { atomicJson, mergeEntries, writeArchive, retainActiveEntries, selectNewEntries } from "./lib/storage.mjs";
import { entryIdentity, canonicalSourceUrl } from "../lib/shared/entry-identity.mjs";

export { parsePoliceRss, parsePoliceHtml, parsePoliceSource } from "./sources/police.mjs";
export { parseEventsHtml } from "./sources/events.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");
const EXCLUDED_IDS = new Set(["4a78d327c5482f7e", "d346f35866059b16", "4fbcb986c28f510c"]);

function parseArgs() {
  const args = process.argv.slice(2);
  const value = key => args.includes(key) ? args[args.indexOf(key) + 1] : undefined;
  const limit = Number(value("--limit") ?? 25);
  if (!Number.isInteger(limit) || limit < 1 || limit > 40) throw new Error("--limit must be an integer between 1 and 40");
  return { dryRun: args.includes("--dry-run"), skipClaude: args.includes("--skip-ai") || args.includes("--skip-claude"),
    skipGeocode: args.includes("--skip-geocode"), skipAmtsblatt: args.includes("--skip-amtsblatt"),
    skipViz: args.includes("--skip-viz"), limit,
    fixtures: { "polizei-berlin": value("--fixture-polizei"), "berlin-events": value("--fixture-events"), "bezirksamt-tk": value("--fixture-bezirksamt"), "viz-baustellen": value("--fixture-viz") } };
}

function prefillGeoFields(entries) {
  return entries.map(e => {
    const text = `${e.title} ${e.raw_excerpt ?? ""} ${e.venue ?? ""} ${e.location ?? ""}`;
    const addresses = e.addresses ?? extractAddresses(text);
    return { ...e, district: e.district ?? inferDistrictFromText(text), addresses,
      street: e.street ?? addresses[0]?.replace(/\s+\d+\w*$/, "") };
  });
}

async function main() {
  const options = parseArgs();
  const existing = JSON.parse(await readFile(path.join(DATA, "entries.json"), "utf8")).filter(e => !EXCLUDED_IDS.has(e.id));
  const previous = JSON.parse(await readFile(path.join(DATA, "ingest-status.json"), "utf8"));
  const startedAt = new Date().toISOString();
  const sources = {};
  const groups = [];
  async function loadSource(id, urls, parse) {
    let lastError;
    for (const url of options.fixtures[id] ? urls.slice(0, 1) : urls) {
      try {
        const text = await readText(url, options.fixtures[id]);
        let parsed = parse(text);
        let rawItems = [...text.matchAll(/<item\b|<article\b[^>]*teaser--event|Ereignisort:/gi)].length;
        if (!parsed.length && urls.indexOf(url) < urls.length - 1 && !options.fixtures[id]) continue;
        let warning;
        if (id === "berlin-events" && !options.fixtures[id]) {
          const visited = new Set([url]);
          let next = nextEventsPage(text, url);
          while (next && visited.size < 5 && !visited.has(next)) {
            visited.add(next);
            try { const html = await readText(next); const rows = parse(html); parsed.push(...rows); rawItems += rows.length; next = nextEventsPage(html, next); }
            catch { warning = "Weitere Kalenderseiten nicht erreichbar"; break; }
          }
          if (next && visited.size >= 5) warning = "Kalender auf fünf Quellseiten begrenzt";
        }
        const valid = parsed.filter(e => e.id && e.title && canonicalSourceUrl(e.source_url) && Number.isFinite(Date.parse(e.published_at)));
        if (valid.length !== parsed.length) warning = `${parsed.length - valid.length} ungültige Datensätze übersprungen`;
        if (!valid.length && rawItems > 0) warning = "Quelle enthält Einträge, aber keine lokalen Treffer; Parser prüfen";
        sources[id] = { status: warning ? "warning" : "ok", ...(warning ? { error: warning } : {}), parsed: valid.length, raw_items: rawItems,
          last_success_at: valid.length ? startedAt : previous.sources?.[id]?.last_success_at };
        groups.push(valid);
        return;
      } catch (error) { lastError = error; }
    }
    sources[id] = { status: "error", error: lastError?.message ?? "Keine Quelle erreichbar", parsed: 0, raw_items: 0, last_success_at: previous.sources?.[id]?.last_success_at };
  }

  await loadSource("polizei-berlin", [POLICE_PAGE_URL, POLICE_RSS_URL], parsePoliceSource);
  await loadSource("berlin-events", [EVENTS_URL], parseEventsHtml);
  await loadSource("bezirksamt-tk", [BEZIRKSAMT_RSS_URL, BEZIRKSAMT_PAGE_URL], parseBezirksamtSource);
  sources["bvv-tk"] = { status: "skipped", error: "Keine eigenständige BVV-Quelle angebunden; Pressemitteilungen laufen über Bezirksamt.", parsed: 0 };
  if (options.skipViz) sources["viz-baustellen"] = { status: "skipped", parsed: 0 };
  else {
    const resolved = options.fixtures["viz-baustellen"] ? null : await resolveVizUrl();
    await loadSource("viz-baustellen", [...new Set([resolved, ...VIZ_BAUSTELLEN_URLS].filter(Boolean))], parseVizBaustellenGeoJson);
    if (sources["viz-baustellen"].status === "error") sources["viz-baustellen"].status = "skipped";
  }
  if (options.skipAmtsblatt) sources["amtsblatt-berlin"] = { status: "skipped", parsed: 0 };
  else {
    try {
      const entries = await fetchAmtsblattEntries();
      groups.push(entries);
      sources["amtsblatt-berlin"] = { status: "ok", parsed: entries.length, raw_items: entries.length, last_success_at: entries.length ? startedAt : previous.sources?.["amtsblatt-berlin"]?.last_success_at };
    } catch (error) { sources["amtsblatt-berlin"] = { status: "skipped", error: error.message, parsed: 0 }; }
  }

  const newEntries = prefillGeoFields(selectNewEntries(groups, existing, options.limit));
  const seen = new Map(groups.flat().map(e => [entryIdentity(e), e]));
  const refreshed = existing.map(e => {
    const latest = seen.get(entryIdentity(e));
    return latest ? { ...e, last_seen_at: startedAt,
      ...(latest.event_date_origin === "source" ? { event_end_at: latest.event_end_at, event_date_precision: latest.event_date_precision } : {}) } : e;
  });
  const stale = refreshed.filter(e => !e.is_mock && e.enrichment_version !== 2).slice(0, 10);
  let enriched = newEntries;
  let aiError;
  try { enriched = prefillGeoFields(await enrichWithAI([...newEntries, ...stale], options)); }
  catch (error) { aiError = error.message; console.warn(`AI enrichment skipped: ${aiError}`); }

  for (const [id, status] of Object.entries(sources)) status.fetched = newEntries.filter(e => e.source_id === id).length;
  const status = { last_run: startedAt, sources, new_entries: newEntries.length, dry_run: options.dryRun,
    ai_status: options.skipClaude ? "skipped" : aiError ? "error" : "ok", ...(aiError ? { ai_error: aiError } : {}) };
  console.log(`Parsed ${groups.flat().length} entries, ${newEntries.length} new. Dry run: ${options.dryRun}`);
  if (options.dryRun) { console.log(JSON.stringify(status, null, 2)); return; }

  const geocoded = options.skipGeocode ? enriched : await geocodeEntries(enriched);
  const backfill = options.skipGeocode ? [] : await geocodeEntries(refreshed.filter(e => e.lat == null && !e.is_mock && (e.venue || e.addresses?.length)).slice(0, 10));
  const merged = mergeEntries(mergeEntries(refreshed, backfill), geocoded);
  const active = retainActiveEntries(merged);
  // Archive first, then active snapshot, and publish status only when both succeeded.
  await writeArchive(merged, path.join(DATA, "archive"));
  await atomicJson(path.join(DATA, "entries.json"), active);
  await atomicJson(path.join(DATA, "ingest-status.json"), { ...status, total_entries: active.length, archived_entries: merged.length - active.length });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
