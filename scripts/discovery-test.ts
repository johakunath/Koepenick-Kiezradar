import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Entry } from "../lib/types";
import { parseSourceDate, berlinDay, eventDateFromTitle } from "../lib/shared/dates.mjs";
import { consolidateEntries, canonicalSourceUrl } from "../lib/shared/entry-identity.mjs";
import { filterDiscovery, DEFAULT_FILTERS, periodBounds, interestsForEntry, parseFilters, filterParams, groupOccurrences, healthMessage } from "../lib/shared/discovery";
import { normalizeEntry, getDisplayEntries, getEntryBySlug, getCurrentWeekBounds, getIsoWeekId, searchEntries } from "../lib/data";
import { POST } from "../app/api/trigger-ingest/route";
import { hasMappableCoordinates } from "../lib/shared/map-coordinates";
import { discoveryListPath, discoveryUrl } from "../lib/shared/discovery-navigation";
import { writeArchive, retainActiveEntries, selectNewEntries } from "./lib/storage.mjs";
import { applyEnrichment } from "./lib/enrich.mjs";
import { parseEventsHtml, nextEventsPage } from "./sources/events.mjs";
import { parsePoliceHtml } from "./sources/police.mjs";

function entry(overrides: Partial<Entry> = {}): Entry {
  return { id: "a", title: "Familienfest in Köpenick", source: "Kalender", source_id: "berlin-events",
    source_url: "https://www.berlin.de/land/kalender/index.php?detail=123",
    published_at: "2026-09-14T08:00:00Z", ingested_at: "2026-09-14T08:00:00Z",
    ai_summary: "Ein Familienfest.", tags: ["veranstaltung"], location: "Köpenick",
    local_relevance_score: .7, political_relevance_score: 0, election_relevant: false,
    event_start_at: "2026-09-19T08:00:00Z", event_date_precision: "time", venue: "Rathaus Köpenick", ...overrides };
}
const now = new Date("2026-09-14T12:00:00Z");

test("Berlin time: summer, winter, invalid date, DST gap and midnight", () => {
  assert.equal(parseSourceDate("19.09.2026 10:00")?.iso, "2026-09-19T08:00:00.000Z");
  assert.equal(parseSourceDate("19.01.2026 10:00")?.iso, "2026-01-19T09:00:00.000Z");
  assert.equal(parseSourceDate("31.02.2026"), null);
  assert.equal(parseSourceDate("29.03.2026 02:30"), null);
  assert.equal(parseSourceDate("19.09.2026")?.precision, "day");
  assert.equal(berlinDay("2026-09-14T22:30:00Z"), "2026-09-15");
});
test("title dates: only explicit unambiguous original dates", () => {
  assert.ok(eventDateFromTitle("Konzert am 25. September 2026"));
  assert.equal(eventDateFromTitle("Ausstellung vom 1. bis 4. September 2026"), null);
  assert.equal(eventDateFromTitle("Konzert am Freitag"), null);
  assert.equal(eventDateFromTitle("Lesung 12. – 13.09.2026"), null);
});
test("weekend does not jump ahead on Saturday or Sunday, including DST weekend", () => {
  assert.deepEqual(periodBounds("weekend", now), ["2026-09-19", "2026-09-21"]);
  assert.deepEqual(periodBounds("weekend", new Date("2026-09-20T12:00:00Z")), ["2026-09-20", "2026-09-21"]);
  assert.deepEqual(periodBounds("weekend", new Date("2026-10-25T12:00:00Z")), ["2026-10-25", "2026-10-26"]);
});
test("today uses event date; news publication is never a substitute", () => {
  const undated = entry({ event_start_at: undefined });
  assert.equal(filterDiscovery([undated], { ...DEFAULT_FILTERS, period: "today" }, now).length, 0);
  assert.equal(filterDiscovery([undated], DEFAULT_FILTERS, now).length, 1);
  assert.equal(filterDiscovery([entry({ event_start_at: "2026-09-13T10:00:00Z" })], DEFAULT_FILTERS, now).length, 0);
  const ongoing = entry({ event_start_at: "2026-09-13T10:00:00Z", event_end_at: "2026-09-15T16:00:00Z" });
  assert.equal(filterDiscovery([ongoing], { ...DEFAULT_FILTERS, period: "today" }, now).length, 1);
});
test("non-local entries and mocks never enter discovery, including news", () => {
  const entries = [entry({ location_relevant: false }), entry({ is_mock: true })];
  assert.equal(filterDiscovery(entries, { ...DEFAULT_FILTERS, mode: "news" }, now).length, 0);
  assert.ok(getDisplayEntries().every(e => e.location_relevant !== false && !e.is_mock));
});
test("recurrences and multiple times on same day survive; duplicate category links merge", () => {
  const a = entry({ source_url: entry().source_url + "&ls=10&date_start=14.09.2026", tags: ["veranstaltung"] });
  const duplicate = entry({ id: "b", tags: ["verwaltung"] });
  const anotherDay = entry({ id: "c", event_start_at: "2026-09-20T08:00:00Z" });
  const anotherTime = entry({ id: "d", event_start_at: "2026-09-19T14:00:00Z" });
  const merged = consolidateEntries([a, duplicate, anotherDay, anotherTime]);
  assert.equal(merged.length, 3);
  assert.deepEqual(new Set(merged[0].tags), new Set(["veranstaltung", "verwaltung"]));
  assert.ok(merged[0].alias_ids?.includes("b"));
  assert.equal(groupOccurrences(merged).length, 1);
  assert.equal(groupOccurrences(merged)[0].occurrences.length, 3);
});
test("different venues and unrelated PDF notices remain distinct", () => {
  assert.equal(consolidateEntries([entry(), entry({ venue: "Anderes Rathaus" })]).length, 2);
  assert.equal(consolidateEntries([entry({ event_start_at: undefined, title: "Mitteilung A" }), entry({ event_start_at: undefined, title: "Mitteilung B" })]).length, 2);
  assert.equal(canonicalSourceUrl("javascript:alert(1)"), "");
});

test("legacy day-only calendar copies merge only with one unambiguous timed occurrence", () => {
  const precise = entry({ id: "precise", venue: "Museum", event_start_at: "2026-09-19T08:00:00Z" });
  const legacy = entry({ id: "legacy", venue: "Museum in Treptow-Köpenick", event_start_at: "2026-09-19T12:00:00Z", event_date_precision: "day" });
  const merged = consolidateEntries([legacy, precise]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].event_start_at, precise.event_start_at);
  assert.equal(merged[0].venue, "Museum");
  assert.ok(merged[0].alias_ids?.includes("precise"));
  assert.equal(consolidateEntries([legacy, precise, { ...precise, id: "second", event_start_at: "2026-09-19T15:00:00Z" }]).length, 3);
});
test("new records are selected before caps and across source groups and series", () => {
  const known = entry();
  const newer = entry({ id: "new", event_start_at: "2026-09-21T08:00:00Z" });
  assert.equal(selectNewEntries([[known, newer]], [known], 1)[0].id, "new");
  const secondSource = entry({ id: "news", title: "Nachricht", source_url: "https://www.berlin.de/news", event_start_at: undefined });
  assert.equal(selectNewEntries([[known, newer], [secondSource]], [], 2)[1].id, "news");
});
test("archiving is additive, preserves history and updates matching records", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "kiezradar-test-"));
  try {
    await writeArchive([entry()], directory);
    await writeArchive([entry({ id: "new", title: "Anderes Ereignis", source_url: "https://www.berlin.de/other" })], directory);
    let stored = JSON.parse(await readFile(path.join(directory, "2026-09.json"), "utf8"));
    assert.equal(stored.length, 2);
    await writeArchive([entry({ ai_summary: "Aktualisiert" })], directory);
    stored = JSON.parse(await readFile(path.join(directory, "2026-09.json"), "utf8"));
    assert.equal(stored.length, 2);
    assert.equal(stored.find((e: Entry) => e.id === "a").ai_summary, "Aktualisiert");
  } finally {
    if (path.dirname(directory) === path.resolve(os.tmpdir()) && path.basename(directory).startsWith("kiezradar-test-")) await rm(directory, { recursive: true });
  }
});
test("active window retains future events published earlier", () => {
  const future = entry({ id: "future", published_at: "2026-01-01T12:00:00Z" });
  const recent = entry({ id: "news", event_start_at: undefined });
  assert.equal(retainActiveEntries([recent, future], now, 1)[0].id, "future");
});
test("family inference is based on explicit source evidence, not AI or school construction", () => {
  assert.ok(interestsForEntry(entry()).includes("family"));
  assert.ok(!interestsForEntry(entry({ title: "Ausstellung: Die Kids sind nicht alright", raw_excerpt: "", ai_summary: "Für Kinder und Familien" })).includes("family"));
  assert.equal(interestsForEntry(entry({ title: "Neue Kita", source_id: "bezirksamt-tk", tags: ["infrastruktur"], event_start_at: undefined })).length, 0);
});
test("map validates coordinates and excludes area centroids from nearby search", () => {
  const area = entry({ lat: 52.455, lng: 13.578, geocode_precision: "area" });
  assert.equal(hasMappableCoordinates(area), false);
  assert.equal(hasMappableCoordinates(entry({ lat: Number.NaN, lng: 13.5 })), false);
  assert.equal(filterDiscovery([area], DEFAULT_FILTERS, now, { point: { lat: 52.455, lng: 13.578 }, radius: 5 }).length, 0);
  assert.equal(hasMappableCoordinates(entry({ lat: 52.455, lng: 13.578, geocode_precision: "venue" })), true);
});
test("filter URL round trip and invalid values", () => {
  const filters = { ...DEFAULT_FILTERS, query: "Müggelsee & Musik", interest: "culture" as const, district: "friedrichshagen", period: "weekend" as const };
  assert.deepEqual(parseFilters(filterParams(filters)), filters);
  assert.equal(parseFilters(new URLSearchParams("when=toString&interest=constructor&tag=evil")).period, "upcoming");
});
test("Termine filters and detail return links retain the list route across map navigation", () => {
  const filters = { ...DEFAULT_FILTERS, query: "Musik & Kunst", period: "weekend" as const };
  const listUrl = new URL(discoveryUrl(filters, false, "/termine", "event-a"), "https://example.test");
  assert.equal(listUrl.pathname, "/termine");
  assert.deepEqual(parseFilters(listUrl.searchParams), filters);
  assert.equal(listUrl.searchParams.get("selected"), "event-a");
  const detail = new URL(`/eintrag/event-a?from=${encodeURIComponent(listUrl.pathname + listUrl.search)}`, listUrl);
  assert.equal(detail.searchParams.get("from"), listUrl.pathname + listUrl.search);

  const mapUrl = new URL(discoveryUrl(filters, true, "/termine", "event-a"), listUrl);
  assert.equal(mapUrl.pathname, "/karte");
  const restoredPath = discoveryListPath(mapUrl.pathname, mapUrl.searchParams);
  assert.equal(restoredPath, "/termine");
  assert.equal(discoveryUrl(parseFilters(mapUrl.searchParams), false, restoredPath, mapUrl.searchParams.get("selected")!), listUrl.pathname + listUrl.search);
  assert.equal(discoveryListPath(listUrl.pathname, listUrl.searchParams), "/termine");
  assert.equal(discoveryUrl(DEFAULT_FILTERS, false, restoredPath), "/termine");
});
test("feed and direct map links retain their defaults and ignore unsupported list routes", () => {
  assert.equal(discoveryUrl(DEFAULT_FILTERS, false, "/"), "/");
  assert.equal(discoveryUrl(DEFAULT_FILTERS, true, "/"), "/karte");
  assert.equal(discoveryListPath("/karte", new URLSearchParams()), "/");
  assert.equal(discoveryListPath("/karte", new URLSearchParams("list=https://example.test")), "/");
  assert.equal(discoveryListPath("/", new URLSearchParams("list=termine")), "/");
});
test("AI output cannot change source facts, invent a location or silently pass incomplete JSON", () => {
  const source = entry();
  const enriched = applyEnrichment(source, { id: source.id, ai_summary: "Kurzinfo", source_url: "https://evil.invalid", lat: 0, event_start_at: "2030-01-01", location: "Paris", tags: ["invalid", "kultur"], local_relevance_score: 4 });
  assert.equal(enriched.source_url, source.source_url);
  assert.equal(enriched.event_start_at, source.event_start_at);
  assert.equal(enriched.location, source.location);
  assert.equal(enriched.local_relevance_score, 1);
  assert.deepEqual(enriched.tags, source.tags);
  assert.throws(() => applyEnrichment(source, { id: "wrong", ai_summary: "..." }));
});
test("stable slugs, legacy links and truthful BVV attribution", () => {
  const normalized = normalizeEntry(entry());
  assert.ok(normalized.slug?.endsWith("--a"));
  const legacy = normalizeEntry(entry({ source_id: "bvv-tk", source_url: "https://www.berlin.de/ba-treptow-koepenick/pressemitteilung.123.php" }));
  assert.equal(legacy.source_id, "bezirksamt-tk");
  const actual = getDisplayEntries()[0];
  assert.equal(getEntryBySlug(actual.slug!)?.id, actual.id);
});
test("actual September parser fixtures preserve dates, closing times, recurrence IDs and local police matches", async () => {
  const calendar = parseEventsHtml(await readFile("scripts/fixtures/events-current.html", "utf8"));
  assert.equal(calendar.length, 2);
  assert.ok(calendar[0] && calendar[1]);
  assert.notEqual(calendar[0].id, calendar[1].id);
  assert.equal(calendar[0].event_start_at, "2026-09-15T08:00:00.000Z");
  assert.equal(calendar[0].event_end_at, "2026-09-15T16:00:00.000Z");
  assert.equal(calendar[0].venue, "Dokumentationszentrum NS-Zwangsarbeit");
  assert.equal(parsePoliceHtml(await readFile("scripts/fixtures/police-current.html", "utf8")).length, 1);
  assert.equal(nextEventsPage('<li class="pager-item-next"><a href="https://evil.invalid">'), null);
});
test("stale data is visible even when the last recorded import succeeded", () => {
  assert.match(healthMessage({ last_run: "2026-09-01T12:00:00Z", sources: {} }, now), /älter/);
});

test("week boundaries and ISO year are independent of the server timezone", () => {
  const bounds = getCurrentWeekBounds(new Date("2026-09-20T22:30:00Z"));
  assert.equal(bounds.start.toISOString(), "2026-09-20T22:00:00.000Z");
  assert.equal(bounds.end.toISOString(), "2026-09-27T22:00:00.000Z");
  assert.equal(getIsoWeekId(new Date("2027-01-01T12:00:00Z")), "2026-W53");
  assert.equal(searchEntries([entry({ venue: "Testmuseum" })], "Testmuseum").length, 1);
});

test("yearless announcements require nearby publication context and do not remain upcoming forever", () => {
  assert.equal(eventDateFromTitle("Familienfest am 13. September", "2026-09-01T12:00:00Z")?.iso, "2026-09-13T10:00:00.000Z");
  assert.equal(eventDateFromTitle("Konzert am 4. Januar", "2026-12-20T12:00:00Z")?.iso, "2027-01-04T11:00:00.000Z");
  assert.equal(eventDateFromTitle("Rückblick am 13. September", "2026-10-01T12:00:00Z"), null);
  const expired = normalizeEntry(entry({ title: "Familienfest am 13. September", published_at: "2026-09-01T12:00:00Z", event_start_at: undefined }));
  assert.equal(expired.event_date_origin, "title-context");
  assert.equal(filterDiscovery([expired], DEFAULT_FILTERS, now).length, 0);
});

test("manual import requires credentials and an explicit production environment", async () => {
  const original = { secret: process.env.ADMIN_INGEST_SECRET, token: process.env.GITHUB_TOKEN, env: process.env.VERCEL_ENV, fetch: globalThis.fetch };
  let dispatched = 0;
  globalThis.fetch = async () => { dispatched++; return new Response(null, { status: 204 }); };
  try {
    process.env.GITHUB_TOKEN = "test-only";
    process.env.VERCEL_ENV = "production";
    delete process.env.ADMIN_INGEST_SECRET;
    assert.equal((await POST(new Request("https://example.test", { method: "POST" }))).status, 503);
    process.env.ADMIN_INGEST_SECRET = "test-only-secret";
    assert.equal((await POST(new Request("https://example.test", { method: "POST" }))).status, 401);
    assert.equal(dispatched, 0);
    const authorized = () => new Request("https://example.test", { method: "POST", headers: { authorization: "Bearer test-only-secret" } });
    assert.equal((await POST(authorized())).status, 200);
    assert.equal(dispatched, 1);
    for (const environment of [undefined, "", "preview", "development", "staging"]) {
      if (environment === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = environment;
      assert.equal((await POST(authorized())).status, 503, `must reject environment: ${environment}`);
      assert.equal(dispatched, 1, "disabled environments must never call GitHub");
    }
    process.env.VERCEL_ENV = "production";
    delete process.env.GITHUB_TOKEN;
    assert.equal((await POST(authorized())).status, 503);
    assert.equal(dispatched, 1);
  } finally {
    globalThis.fetch = original.fetch;
    for (const [key, value] of Object.entries({ ADMIN_INGEST_SECRET: original.secret, GITHUB_TOKEN: original.token, VERCEL_ENV: original.env })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
