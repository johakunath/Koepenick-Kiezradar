import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { readText, inferDistrictFromText, extractAddresses } from "./lib/shared.mjs";
import { parsePoliceSource, POLICE_RSS_URL, POLICE_PAGE_URL } from "./sources/police.mjs";
import { parseEventsHtml, EVENTS_URL } from "./sources/events.mjs";
import { parseBezirksamtSource, BEZIRKSAMT_RSS_URL, BEZIRKSAMT_PAGE_URL } from "./sources/bezirksamt.mjs";
import { parseBvvAllrisRss, BVV_ALLRIS_RSS_URL, BVV_ALLRIS_PAGE_URL } from "./sources/bvv.mjs";
import { fetchAmtsblattEntries } from "./sources/amtsblatt.mjs";
import { parseVizBaustellenGeoJson, VIZ_BAUSTELLEN_URLS } from "./sources/viz.mjs";
import { enrichWithAI } from "./lib/enrich.mjs";
import { geocodeEntries } from "./lib/geocode.mjs";

// Re-export parsers so parser-smoke-test.mjs can import from this file
export { parsePoliceRss, parsePoliceHtml, parsePoliceSource } from "./sources/police.mjs";
export { parseEventsHtml } from "./sources/events.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENTRIES_PATH = path.join(ROOT, "data", "entries.json");
const ARCHIVE_DIR = path.join(ROOT, "data", "archive");
const STATUS_PATH = path.join(ROOT, "data", "ingest-status.json");

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  const valueAfter = (name) => {
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : undefined;
  };

  return {
    dryRun: args.has("--dry-run"),
    skipClaude: args.has("--skip-ai") || args.has("--skip-claude"),
    fixturePolice: valueAfter("--fixture-polizei"),
    fixtureEvents: valueAfter("--fixture-events"),
    fixtureBezirksamt: valueAfter("--fixture-bezirksamt"),
    fixtureBvv: valueAfter("--fixture-bvv"),
    fixtureViz: valueAfter("--fixture-viz"),
    skipAmtsblatt: args.has("--skip-amtsblatt"),
    limit: Number(valueAfter("--limit") ?? "25"),
  };
}

function prefillGeoFields(entries) {
  return entries.map((e) => {
    if (e.district && e.addresses) return e;
    const text = `${e.title} ${e.raw_excerpt ?? ""} ${e.location ?? ""}`;
    const district = e.district ?? inferDistrictFromText(text);
    const addresses = e.addresses ?? extractAddresses(text);
    const street = e.street ?? addresses[0]?.replace(/\s+\d+\w*$/, "") ?? undefined;
    return { ...e, district, addresses, street };
  });
}

function mergeEntries(existing, incoming) {
  const byId = new Map(existing.map((entry) => [entry.id, entry]));

  for (const entry of incoming) {
    const oldEntry = byId.get(entry.id);
    byId.set(
      entry.id,
      oldEntry ? { ...oldEntry, ...entry, is_mock: false } : { ...entry, is_mock: false }
    );
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

async function writeArchive(entries) {
  await mkdir(ARCHIVE_DIR, { recursive: true });
  const byMonth = new Map();

  for (const entry of entries) {
    const month = entry.published_at.slice(0, 7);
    byMonth.set(month, [...(byMonth.get(month) ?? []), entry]);
  }

  for (const [month, monthEntries] of byMonth) {
    const archivePath = path.join(ARCHIVE_DIR, `${month}.json`);
    await writeFile(archivePath, `${JSON.stringify(monthEntries, null, 2)}\n`, "utf8");
  }
}

async function main() {
  const options = parseArgs();
  const existing = JSON.parse(await readFile(ENTRIES_PATH, "utf8"));
  const sourceStatus = {};

  const fetchSource = async (sourceId, primaryUrl, fallbackUrl, fixturePath) => {
    try {
      let text;
      if (fixturePath) {
        text = await readText(primaryUrl, fixturePath);
      } else {
        try {
          text = await readText(primaryUrl);
        } catch (err) {
          // Retry once after 3s on 429 rate-limit before trying fallback
          if (err.message.includes("429")) {
            console.log(`${sourceId}: 429 rate-limited, retrying in 3s…`);
            await new Promise((r) => setTimeout(r, 3000));
            try { text = await readText(primaryUrl); } catch {}
          }
          if (!text && fallbackUrl) text = await readText(fallbackUrl);
          if (!text) throw err;
        }
      }
      sourceStatus[sourceId] = { status: "ok", text };
      return text;
    } catch (err) {
      sourceStatus[sourceId] = { status: "error", error: err.message };
      return "";
    }
  };

  const policeText = await fetchSource(
    "polizei-berlin",
    POLICE_RSS_URL,
    POLICE_PAGE_URL,
    options.fixturePolice
  );
  const eventsHtml = await fetchSource("berlin-events", EVENTS_URL, null, options.fixtureEvents);
  const bezirksamtText = await fetchSource(
    "bezirksamt-tk",
    BEZIRKSAMT_RSS_URL,
    BEZIRKSAMT_PAGE_URL,
    options.fixtureBezirksamt
  );
  const bvvText = await fetchSource(
    "bvv-tk",
    BVV_ALLRIS_RSS_URL,
    BVV_ALLRIS_PAGE_URL,
    options.fixtureBvv
  );

  let vizText = null;
  if (options.fixtureViz) {
    vizText = await fetchSource("viz-baustellen", VIZ_BAUSTELLEN_URLS[0], null, options.fixtureViz);
  } else {
    for (const vizUrl of VIZ_BAUSTELLEN_URLS) {
      try {
        const resp = await fetch(vizUrl, {
          headers: {
            "user-agent": "Koepenick-Kiezradar/0.2 (+https://github.com/johakunath/Koepenick-Kiezradar)",
          },
        });
        if (!resp.ok) {
          console.log(`VIZ: ${vizUrl} → ${resp.status}`);
          continue;
        }
        vizText = await resp.text();
        sourceStatus["viz-baustellen"] = { status: "ok" };
        console.log(`VIZ: using ${vizUrl}`);
        break;
      } catch (err) {
        console.log(`VIZ: ${vizUrl} → ${err.message}`);
      }
    }
    if (!vizText) {
      sourceStatus["viz-baustellen"] = {
        status: "skipped",
        error: "Optionale Quelle aktuell nicht erreichbar: alle VIZ-URLs lieferten Fehler",
        raw_items: 0,
      };
    }
  }

  let amtsblattEntries = [];
  try {
    if (!options.skipAmtsblatt) {
      amtsblattEntries = await fetchAmtsblattEntries();
      sourceStatus["amtsblatt-berlin"] = {
        status: "ok",
        parsed: amtsblattEntries.length,
        raw_items: amtsblattEntries.length,
      };
    } else {
      sourceStatus["amtsblatt-berlin"] = {
        status: "skipped",
        error: "Optionale Quelle in diesem Lauf übersprungen",
        raw_items: 0,
      };
    }
  } catch (err) {
    sourceStatus["amtsblatt-berlin"] = {
      status: "skipped",
      error: `Optionale Quelle aktuell nicht erreichbar: ${err.message}`,
      raw_items: 0,
    };
  }

  const policeEntries = parsePoliceSource(policeText);
  const eventsEntries = parseEventsHtml(eventsHtml);
  const bezirksamtEntries = parseBezirksamtSource(bezirksamtText);
  const bvvEntries = parseBvvAllrisRss(bvvText);
  const vizEntries = parseVizBaustellenGeoJson(vizText);

  const countRawItems = (text, sourceType) => {
    if (!text) return 0;
    if (sourceType === "rss") return [...text.matchAll(/<item\b/gi)].length;
    if (sourceType === "html") return [...text.matchAll(/<li\b/gi)].length;
    if (sourceType === "json") {
      try {
        return (JSON.parse(text).features ?? JSON.parse(text).baustellen ?? []).length;
      } catch {
        return 0;
      }
    }
    return 0;
  };

  const rawCounts = {
    "polizei-berlin": countRawItems(policeText, /<item\b/i.test(policeText) ? "rss" : "html"),
    "berlin-events": countRawItems(eventsHtml, "html"),
    "bezirksamt-tk": countRawItems(bezirksamtText, /<item\b/i.test(bezirksamtText) ? "rss" : "html"),
    "bvv-tk": countRawItems(bvvText, "rss"),
    "viz-baustellen": countRawItems(vizText, "json"),
  };

  for (const [sourceId, parsed] of [
    ["polizei-berlin", policeEntries],
    ["berlin-events", eventsEntries],
    ["bezirksamt-tk", bezirksamtEntries],
    ["bvv-tk", bvvEntries],
    ["viz-baustellen", vizEntries],
  ]) {
    if (sourceStatus[sourceId]?.status === "ok") {
      sourceStatus[sourceId].parsed = parsed.length;
      sourceStatus[sourceId].raw_items = rawCounts[sourceId];
      delete sourceStatus[sourceId].text;
    }
  }

  // Cap per source so high-volume sources don't crowd out smaller/higher-quality ones
  const PER_SOURCE_CAP = Math.max(5, Math.floor(options.limit / 3));
  const rawEntries = [
    ...policeEntries.slice(0, PER_SOURCE_CAP),
    ...eventsEntries.slice(0, PER_SOURCE_CAP),
    ...bezirksamtEntries.slice(0, PER_SOURCE_CAP),
    ...bvvEntries.slice(0, PER_SOURCE_CAP),
    ...vizEntries.slice(0, PER_SOURCE_CAP),
    ...amtsblattEntries.slice(0, PER_SOURCE_CAP),
  ].slice(0, options.limit);

  const knownIds = new Set(existing.map((entry) => entry.id));
  const newEntries = prefillGeoFields(rawEntries.filter((entry) => !knownIds.has(entry.id)));

  // Re-enrich entries whose ai_summary is still a thin placeholder (title echo or known fallback)
  const REENRICH_CAP = 10;
  function isThinAiSummary(e) {
    const s = (e.ai_summary ?? "").trim().toLowerCase();
    const t = (e.title ?? "").trim().toLowerCase();
    if (!s || s === t) return true;
    return /^(offizielle pressemitteilung|veranstaltung im bezirk|bvv-vorgang|polizeimeldung|noch nicht ki)/.test(s);
  }
  const staleEntries = existing
    .filter((e) => !e.is_mock && isThinAiSummary(e))
    .slice(0, REENRICH_CAP);

  let enriched = newEntries;
  let aiError = null;
  try {
    const toEnrich = [...newEntries, ...staleEntries];
    const enrichedAll = prefillGeoFields(await enrichWithAI(toEnrich, options));
    enriched = enrichedAll.slice(0, newEntries.length);
    const enrichedStale = enrichedAll.slice(newEntries.length);
    if (enrichedStale.length > 0) {
      console.log(`Re-enriched ${enrichedStale.length} stale entries.`);
      enriched = [...enriched, ...enrichedStale];
    }
  } catch (err) {
    aiError = err.message;
    console.warn(`AI enrichment skipped: ${aiError}`);
  }

  const merged = mergeEntries(existing, enriched);

  console.log(
    `Fetched ${rawEntries.length} relevant entries, ${newEntries.length} new. Dry run: ${options.dryRun}`
  );

  const statusPayload = {
    last_run: new Date().toISOString(),
    sources: Object.fromEntries(
      Object.entries(sourceStatus).map(([id, s]) => [
        id,
        s.status === "ok"
          ? {
              status: "ok",
              fetched: newEntries.filter((e) => e.source_id === id).length,
              parsed: s.parsed ?? 0,
              raw_items: s.raw_items ?? 0,
            }
          : s.status === "skipped"
            ? { status: "skipped", error: s.error, fetched: 0, parsed: s.parsed ?? 0, raw_items: s.raw_items ?? 0 }
            : { status: "error", error: s.error, fetched: 0, raw_items: s.raw_items ?? 0 },
      ])
    ),
    new_entries: newEntries.length,
    total_entries: merged.length,
    dry_run: options.dryRun,
    ...(aiError ? { ai_error: aiError } : {}),
  };

  if (options.dryRun) {
    console.log(JSON.stringify(statusPayload, null, 2));
    return;
  }

  await writeFile(STATUS_PATH, `${JSON.stringify(statusPayload, null, 2)}\n`, "utf8");

  const geocoded = await geocodeEntries(enriched);
  // Also geocode existing entries that have addresses/location but no coordinates yet.
  // Cap at 10 per run to stay within Nominatim's rate limit.
  const BACKFILL_CAP = 10;
  const needsGeocode = existing
    .filter((e) => e.lat == null && !e.is_mock && (e.addresses?.length || (e.location && e.location !== "Treptow-Köpenick")))
    .slice(0, BACKFILL_CAP);
  const backfilled = needsGeocode.length > 0 ? await geocodeEntries(needsGeocode) : needsGeocode;

  const mergedWithCoords = mergeEntries(mergeEntries(existing, geocoded), backfilled);

  await writeFile(
    ENTRIES_PATH,
    `${JSON.stringify(mergedWithCoords.slice(0, 250), null, 2)}\n`,
    "utf8"
  );
  await writeArchive(mergedWithCoords);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
