import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENTRIES_PATH = path.join(ROOT, "data", "entries.json");
const ARCHIVE_DIR = path.join(ROOT, "data", "archive");
const STATUS_PATH = path.join(ROOT, "data", "ingest-status.json");

const POLICE_RSS_URL = "https://www.berlin.de/polizei/polizeimeldungen/index/rss.php";
const POLICE_PAGE_URL = "https://www.berlin.de/polizei/polizeimeldungen/";
const EVENTS_URL = "https://www.berlin.de/land/kalender/index.php?c=13&suchmaske=";
const BEZIRKSAMT_RSS_URL = "https://www.berlin.de/ba-treptow-koepenick/aktuelles/pressemitteilungen/index/rss.php";
const BEZIRKSAMT_PAGE_URL = "https://www.berlin.de/ba-treptow-koepenick/aktuelles/pressemitteilungen/";

const TAGS = [
  "verkehr",
  "sicherheit",
  "verwaltung",
  "politik",
  "infrastruktur",
  "veranstaltung",
  "sonstiges",
];

const KOEPENICK_KEYWORDS = [
  "köpenick",
  "koepenick",
  "alt-köpenick",
  "altstadt",
  "dammvorstadt",
  "spindlersfeld",
  "müggelsee",
  "mueggelsee",
  "bahnhofstraße",
  "bahnhofstrasse",
  "bahnhof köpenick",
  "wuhlheide",
];

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
    limit: Number(valueAfter("--limit") ?? "25"),
  };
}

function decodeEntities(value = "") {
  return value
    .replaceAll("<![CDATA[", "")
    .replaceAll("]]>", "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/&#(\d+);/g, (_, code) => {
      const n = Number(code);
      if (n === 173) return ""; // soft hyphen → strip
      return String.fromCharCode(n);
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function field(block, name) {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  return decodeEntities(match?.[1] ?? "");
}

function hashId(parts) {
  return createHash("sha256").update(parts.filter(Boolean).join("|")).digest("hex").slice(0, 16);
}

function containsKoepenick(text) {
  const haystack = text.toLocaleLowerCase("de-DE");
  return KOEPENICK_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

function inferTags(text, sourceId) {
  const haystack = text.toLocaleLowerCase("de-DE");
  const tags = new Set();

  if (sourceId === "polizei-berlin") tags.add("sicherheit");
  if (sourceId === "berlin-events") tags.add("veranstaltung");
  if (sourceId === "bezirksamt-tk") tags.add("verwaltung");
  if (/verkehr|unfall|straße|strasse|sperrung|bahn|rad/.test(haystack)) tags.add("verkehr");
  if (/bvv|wahl|partei|antrag|senat|politik/.test(haystack)) tags.add("politik");
  if (/bau|schule|kita|wasser|strom|sanierung|infrastruktur/.test(haystack)) {
    tags.add("infrastruktur");
  }
  if (/bezirksamt|bürgeramt|verwaltung|amt/.test(haystack)) tags.add("verwaltung");

  if (tags.size === 0) tags.add("sonstiges");
  return [...tags].filter((tag) => TAGS.includes(tag)).slice(0, 3);
}

function inferLocation(text) {
  const haystack = text.toLocaleLowerCase("de-DE");
  const knownLocations = [
    ["spindlersfeld", "Spindlersfeld"],
    ["dammvorstadt", "Dammvorstadt"],
    ["müggelsee", "Müggelsee"],
    ["mueggelsee", "Müggelsee"],
    ["bahnhof", "Bahnhof Köpenick"],
    ["altstadt", "Altstadt Köpenick"],
    ["alt-köpenick", "Altstadt Köpenick"],
    ["köpenick", "Köpenick"],
  ];

  return knownLocations.find(([needle]) => haystack.includes(needle))?.[1] ?? "Treptow-Köpenick";
}

async function readText(url, fixturePath) {
  if (fixturePath) {
    return readFile(path.resolve(ROOT, fixturePath), "utf8");
  }

  const response = await fetch(url, {
    headers: {
      "user-agent": "Koepenick-Kiezradar/0.2 (+https://github.com/johakunath/Koepenick-Kiezradar)",
    },
  });

  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${url}`);
  }

  return response.text();
}

function parsePoliceRss(xml) {
  const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);

  return items
    .map((item) => {
      const title = field(item, "title");
      const sourceUrl = field(item, "link");
      const rawExcerpt = field(item, "description");
      const publishedAt = new Date(field(item, "pubDate") || Date.now()).toISOString();
      const text = `${title} ${rawExcerpt}`;

      return {
        id: hashId(["polizei-berlin", sourceUrl, title]),
        source_id: "polizei-berlin",
        source: "Polizei Berlin",
        source_url: sourceUrl,
        title,
        published_at: publishedAt,
        ingested_at: new Date().toISOString(),
        raw_excerpt: rawExcerpt,
        ai_summary: rawExcerpt || title,
        tags: inferTags(text, "polizei-berlin"),
        location: inferLocation(text),
        location_relevant: containsKoepenick(text),
        local_relevance_score: containsKoepenick(text) ? 0.75 : 0.25,
        political_relevance_score: 0.1,
        election_relevant: false,
        ai_reasoning: containsKoepenick(text)
          ? "Die Meldung nennt einen Ort im Köpenicker Kerngebiet."
          : "Die Meldung wurde importiert, muss aber noch auf Kiez-Relevanz geprüft werden.",
      };
    })
    .filter((entry) => entry.title && entry.source_url && entry.location_relevant);
}

function parsePoliceHtml(html) {
  const matches = [
    ...html.matchAll(
      /(\d{1,2}\.\d{1,2}\.\d{4}\s+\d{1,2}:\d{2})\s*Uhr[\s\S]*?<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*Ereignisort:\s*([^<\n]+)/gi
    ),
  ];

  return matches
    .map((match) => {
      const [, dateText, href, titleHtml, locationHtml] = match;
      const title = decodeEntities(titleHtml);
      const location = decodeEntities(locationHtml);
      const sourceUrl = href.startsWith("http") ? href : new URL(href, POLICE_PAGE_URL).toString();
      const publishedAt = parseGermanDate(dateText) ?? new Date().toISOString();
      const rawExcerpt = `Ereignisort: ${location}`;
      const text = `${title} ${location}`;

      return {
        id: hashId(["polizei-berlin", sourceUrl, title]),
        source_id: "polizei-berlin",
        source: "Polizei Berlin",
        source_url: sourceUrl,
        title,
        published_at: publishedAt,
        ingested_at: new Date().toISOString(),
        raw_excerpt: rawExcerpt,
        ai_summary: title,
        tags: inferTags(text, "polizei-berlin"),
        location: inferLocation(text),
        location_relevant: containsKoepenick(text),
        local_relevance_score: containsKoepenick(text) ? 0.75 : 0.25,
        political_relevance_score: /wahl|plakat|versammlung|politik/i.test(text) ? 0.45 : 0.1,
        election_relevant: /wahl|plakat/i.test(text),
        election_topic: /wahl|plakat/i.test(text) ? "Wahl 2026" : undefined,
        ai_reasoning: containsKoepenick(text)
          ? "Die Meldung nennt Treptow-Köpenick oder einen Ort im Köpenicker Kerngebiet."
          : "Die Meldung wurde importiert, muss aber noch auf Kiez-Relevanz geprüft werden.",
      };
    })
    .filter((entry) => entry.title && entry.source_url && entry.location_relevant);
}

function parsePoliceSource(text) {
  return /<item\b/i.test(text) ? parsePoliceRss(text) : parsePoliceHtml(text);
}

function parseGermanDate(text) {
  const match = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\D+(\d{1,2}):(\d{2}))?/);
  if (!match) return null;

  const [, day, month, year, hour = "12", minute = "00"] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  ).toISOString();
}

function parseEventsHtml(html) {
  if (!html) return [];

  // berlin.de event list: <li> blocks containing a link and a German date
  const items = [...html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => m[1]);
  const entries = items
    .map((item) => {
      const linkMatch = item.match(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!linkMatch) return null;
      const [, href, titleHtml] = linkMatch;
      const title = decodeEntities(titleHtml);

      // Filter: must have a real title (not a year, not navigation, not too short)
      if (!title) return null;
      if (/^\d{4}$/.test(title.trim())) return null;
      if (title.trim().length < 8) return null;

      const sourceUrl = href.startsWith("http") ? href : new URL(href, EVENTS_URL).toString();
      const dateMatch = item.match(/(\d{1,2}\.\d{1,2}\.\d{4}(?:\s+\d{1,2}:\d{2})?)/);

      // Filter: require a date — real events always have one, nav items don't
      if (!dateMatch) return null;

      const eventStartAt = parseGermanDate(dateMatch[1]);
      const publishedAt = eventStartAt ?? new Date().toISOString();
      const venueMatch = item.match(/(?:Ort|Veranstaltungsort|venue):\s*([^<\n,]+)/i);
      const venue = venueMatch ? decodeEntities(venueMatch[1].trim()) : undefined;

      return {
        id: hashId(["berlin-events", sourceUrl, title]),
        source_id: "berlin-events",
        source: "Berlin.de Veranstaltungskalender",
        source_url: sourceUrl,
        title,
        published_at: publishedAt,
        ingested_at: new Date().toISOString(),
        raw_excerpt: venue ? `Ort: ${venue}` : "",
        ai_summary: title,
        tags: inferTags(title, "berlin-events"),
        location: venue ? inferLocation(venue) : "Treptow-Köpenick",
        location_relevant: true,
        local_relevance_score: 0.75,
        political_relevance_score: 0.1,
        election_relevant: false,
        ai_reasoning: "Veranstaltung im Bezirk Treptow-Köpenick.",
        event_start_at: eventStartAt ?? undefined,
        venue,
      };
    })
    .filter((e) => e && e.title && e.source_url);

  console.log(`Events parsed: ${entries.length} from ${items.length} list items`);
  return entries;
}

function parseBezirksamtRss(xml) {
  const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((m) => m[1]);

  return items
    .map((item) => {
      const title = field(item, "title");
      const sourceUrl = field(item, "link");
      const rawExcerpt = field(item, "description");
      const publishedAt = new Date(field(item, "pubDate") || Date.now()).toISOString();
      const text = `${title} ${rawExcerpt}`;
      const hasElectionTopic = /wahl|kandidat|wahlkreis/i.test(text);

      return {
        id: hashId(["bezirksamt-tk", sourceUrl, title]),
        source_id: "bezirksamt-tk",
        source: "Bezirksamt Treptow-Köpenick",
        source_url: sourceUrl,
        title,
        published_at: publishedAt,
        ingested_at: new Date().toISOString(),
        raw_excerpt: rawExcerpt,
        ai_summary: rawExcerpt || title,
        tags: inferTags(text, "bezirksamt-tk"),
        location: inferLocation(text),
        location_relevant: true,
        local_relevance_score: 0.7,
        political_relevance_score: /wahl|partei|bvv|antrag|senat/.test(text.toLocaleLowerCase("de-DE")) ? 0.6 : 0.3,
        election_relevant: hasElectionTopic,
        election_topic: hasElectionTopic ? "Wahl 2026" : undefined,
        ai_reasoning: "Offizielle Pressemitteilung des Bezirksamts Treptow-Köpenick.",
      };
    })
    .filter((e) => e.title && e.source_url);
}

function parseBezirksamtHtml(html) {
  const matches = [
    ...html.matchAll(
      /(\d{1,2}\.\d{1,2}\.\d{4})[^<]*<\/[^>]+>[\s\S]{0,300}?<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
    ),
  ];

  return matches
    .map(([, dateText, href, titleHtml]) => {
      const title = decodeEntities(titleHtml);
      if (!title) return null;
      const sourceUrl = href.startsWith("http") ? href : new URL(href, BEZIRKSAMT_PAGE_URL).toString();
      const publishedAt = parseGermanDate(dateText) ?? new Date().toISOString();
      const hasElectionTopic = /wahl|kandidat|wahlkreis/i.test(title);

      return {
        id: hashId(["bezirksamt-tk", sourceUrl, title]),
        source_id: "bezirksamt-tk",
        source: "Bezirksamt Treptow-Köpenick",
        source_url: sourceUrl,
        title,
        published_at: publishedAt,
        ingested_at: new Date().toISOString(),
        raw_excerpt: "",
        ai_summary: title,
        tags: inferTags(title, "bezirksamt-tk"),
        location: inferLocation(title),
        location_relevant: true,
        local_relevance_score: 0.7,
        political_relevance_score: /wahl|partei|bvv|antrag|senat/.test(title.toLocaleLowerCase("de-DE")) ? 0.6 : 0.3,
        election_relevant: hasElectionTopic,
        election_topic: hasElectionTopic ? "Wahl 2026" : undefined,
        ai_reasoning: "Offizielle Pressemitteilung des Bezirksamts Treptow-Köpenick.",
      };
    })
    .filter((e) => e && e.title && e.source_url);
}

function parseBezirksamtSource(text) {
  return /<item\b/i.test(text) ? parseBezirksamtRss(text) : parseBezirksamtHtml(text);
}

async function enrichWithAI(entries, { skipClaude }) {
  if (skipClaude || entries.length === 0) return entries;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY fehlt. Für lokale Tests nutze --skip-ai.");
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const prompt =
    "Du enrichst Einträge für Köpenick Kiezradar. Antworte ausschließlich als JSON-Array. Behalte id bei. Felder: id, ai_summary, tags, location, location_relevant, local_relevance_score, political_relevance_score, election_relevant, election_topic, ai_reasoning. Tags nur aus: " +
    TAGS.join(", ") +
    ". Events nur dann politisch bewerten, wenn sie inhaltlich Wahl-/Politikbezug haben.\n\n" +
    JSON.stringify(entries, null, 2);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4000 },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API failed ${response.status}: ${await response.text()}`);
  }

  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  const enriched = JSON.parse(jsonMatch?.[0] ?? "[]");
  const byId = new Map(enriched.map((entry) => [entry.id, entry]));

  return entries.map((entry) => ({ ...entry, ...(byId.get(entry.id) ?? {}) }));
}

function mergeEntries(existing, incoming) {
  const byId = new Map(existing.map((entry) => [entry.id, entry]));

  for (const entry of incoming) {
    const oldEntry = byId.get(entry.id);
    byId.set(entry.id, oldEntry ? { ...oldEntry, ...entry, is_mock: false } : { ...entry, is_mock: false });
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
      const text = fixturePath
        ? await readText(primaryUrl, fixturePath)
        : await readText(primaryUrl).catch(async (e) =>
            fallbackUrl ? readText(fallbackUrl) : Promise.reject(e)
          );
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

  const policeEntries = parsePoliceSource(policeText);
  const eventsEntries = parseEventsHtml(eventsHtml);
  const bezirksamtEntries = parseBezirksamtSource(bezirksamtText);

  for (const [sourceId, parsed] of [
    ["polizei-berlin", policeEntries],
    ["berlin-events", eventsEntries],
    ["bezirksamt-tk", bezirksamtEntries],
  ]) {
    if (sourceStatus[sourceId]?.status === "ok") {
      sourceStatus[sourceId].parsed = parsed.length;
      delete sourceStatus[sourceId].text;
    }
  }

  const rawEntries = [...policeEntries, ...eventsEntries, ...bezirksamtEntries].slice(
    0,
    options.limit
  );
  const knownIds = new Set(existing.map((entry) => entry.id));
  const newEntries = rawEntries.filter((entry) => !knownIds.has(entry.id));

  let enriched = newEntries;
  let aiError = null;
  try {
    enriched = await enrichWithAI(newEntries, options);
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
          ? { status: "ok", fetched: newEntries.filter((e) => e.source_id === id).length, parsed: s.parsed ?? 0 }
          : { status: "error", error: s.error, fetched: 0 },
      ])
    ),
    new_entries: newEntries.length,
    total_entries: merged.length,
    dry_run: options.dryRun,
    ...(aiError ? { ai_error: aiError } : {}),
  };
  await writeFile(STATUS_PATH, `${JSON.stringify(statusPayload, null, 2)}\n`, "utf8");

  if (options.dryRun) return;

  await writeFile(ENTRIES_PATH, `${JSON.stringify(merged.slice(0, 250), null, 2)}\n`, "utf8");
  await writeArchive(merged);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
