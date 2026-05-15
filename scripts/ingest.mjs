import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENTRIES_PATH = path.join(ROOT, "data", "entries.json");
const ARCHIVE_DIR = path.join(ROOT, "data", "archive");
const STATUS_PATH = path.join(ROOT, "data", "ingest-status.json");

const POLICE_RSS_URL = "https://www.berlin.de/polizei/polizeimeldungen/index/rss.php";
const POLICE_PAGE_URL = "https://www.berlin.de/polizei/polizeimeldungen/";
const EVENTS_URL = "https://www.berlin.de/land/kalender/index.php?c=13&suchmaske=";
const BEZIRKSAMT_RSS_URL = "https://www.berlin.de/ba-treptow-koepenick/aktuelles/pressemitteilungen/index/rss.php";
const BEZIRKSAMT_PAGE_URL = "https://www.berlin.de/ba-treptow-koepenick/aktuelles/pressemitteilungen/";
const BVV_ALLRIS_RSS_URL = "https://www.berlin.de/presse/pressemitteilungen/index/feed?institutions%5B%5D=Bezirksamt+Treptow-K%C3%B6penick";
const BVV_ALLRIS_PAGE_URL = "https://www.berlin.de/ba-treptow-koepenick/politik-und-verwaltung/bezirksverordnetenversammlung/";
const AMTSBLATT_INDEX_URL = "https://www.berlin.de/landesverwaltungsamt/zentrale-dienste/amtsblatt-fuer-berlin/";
const VIZ_BAUSTELLEN_URL = "https://api.viz.berlin.de/daten/baustellen";

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
  "treptow-köpenick",
  "treptow köpenick",
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
  "friedrichshagen",
  "wendenschloss",
  "grünau",
  "müggelheim",
  "schmöckwitz",
  "rahnsdorf",
];

// District keyword → label (for pre-AI regex fallback, same order as koepenick-geo.ts)
const DISTRICT_KEYWORDS = [
  ["altstadt", "Altstadt Köpenick"],
  ["alt-köpenick", "Altstadt Köpenick"],
  ["dammvorstadt", "Dammvorstadt"],
  ["spindlersfeld", "Spindlersfeld"],
  ["friedrichshagen", "Friedrichshagen"],
  ["müggelheim", "Müggelheim"],
  ["mueggelsee", "Müggelheim"],
  ["müggelsee", "Müggelheim"],
  ["wendenschloss", "Wendenschloss"],
  ["grünau", "Grünau"],
  ["adlershof", "Adlershof"],
  ["köllnische heide", "Köllnische Heide"],
  ["rahnsdorf", "Rahnsdorf"],
  ["schmöckwitz", "Schmöckwitz"],
  ["bohnsdorf", "Bohnsdorf"],
  ["niederschöneweide", "Niederschöneweide"],
  ["oberschöneweide", "Oberschöneweide"],
  ["johannisthal", "Johannisthal"],
  ["altglienicke", "Altglienicke"],
  ["treptow", "Treptow"],
];

// German address pattern: "Musterstraße 12" or "Muster-Str. 15a"
const ADDRESS_REGEX = /[A-ZÄÖÜ][a-zäöüß]+-?(?:straße|strasse|str\.|weg|allee|platz|damm|ufer|ring|gasse)\s+\d+\w*/gi;

function inferDistrictFromText(text) {
  const lc = text.toLocaleLowerCase("de-DE");
  return DISTRICT_KEYWORDS.find(([kw]) => lc.includes(kw))?.[1] ?? undefined;
}

function extractAddresses(text) {
  return [...new Set((text.match(ADDRESS_REGEX) ?? []).map((a) => a.trim()))].slice(0, 5);
}

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

      // Filter: reject category-filter and pagination links (index.php with ?kategorie or ?ls)
      // Real events have dedicated URLs; nav items point back to index.php
      try {
        const u = new URL(sourceUrl);
        if (u.pathname.endsWith("index.php") || u.searchParams.has("kategorie[0]") || u.searchParams.has("ls")) return null;
      } catch {
        return null;
      }

      const dateMatch = item.match(/(\d{1,2}\.\d{1,2}\.\d{4}(?:\s+\d{1,2}:\d{2})?)/);

      // Filter: require a date — real events always have one, nav items don't
      if (!dateMatch) return null;

      const eventStartAt = parseGermanDate(dateMatch[1]);
      const publishedAt = eventStartAt ?? new Date().toISOString();
      const venueMatch = item.match(/(?:Ort|Veranstaltungsort|venue):\s*([^<\n,]+)/i);
      const venue = venueMatch ? decodeEntities(venueMatch[1].trim()) : undefined;

      // Filter: must mention Köpenick somewhere (title or venue)
      // Berlin.de calendar c=13 lists Treptow-Köpenick events but mixes in city-wide ones
      if (!containsKoepenick(`${title} ${venue ?? ""}`)) return null;

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

function parseBvvAllrisRss(xml) {
  if (!xml) return [];
  const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((m) => m[1]);

  return items
    .map((item) => {
      const title = field(item, "title");
      const sourceUrl = field(item, "link");
      const rawExcerpt = field(item, "description");
      const pubDateRaw = field(item, "pubDate");
      const publishedAt = new Date(pubDateRaw || Date.now()).toISOString();
      const text = `${title} ${rawExcerpt}`;
      const hasElectionTopic = /wahl|kandidat|wahlkreis/i.test(text);

      if (!title || !sourceUrl) return null;

      return {
        id: hashId(["bvv-tk", sourceUrl, title]),
        source_id: "bvv-tk",
        source: "BVV Treptow-Köpenick",
        source_url: sourceUrl,
        title,
        published_at: publishedAt,
        ingested_at: new Date().toISOString(),
        raw_excerpt: rawExcerpt,
        ai_summary: rawExcerpt || title,
        tags: inferTags(text, "bvv-tk"),
        location: inferLocation(text),
        location_relevant: true,
        local_relevance_score: 0.8,
        political_relevance_score: 0.7,
        election_relevant: hasElectionTopic,
        election_topic: hasElectionTopic ? "Wahl 2026" : undefined,
        ai_reasoning: "Antrag oder Vorlage der Bezirksverordnetenversammlung Treptow-Köpenick.",
        document_type: "oparl",
        document_url: sourceUrl,
      };
    })
    .filter(Boolean);
}

async function fetchAmtsblattEntries() {
  let indexHtml;
  try {
    const resp = await fetch(AMTSBLATT_INDEX_URL, {
      headers: { "user-agent": "Koepenick-Kiezradar/0.2 (+https://github.com/johakunath/Koepenick-Kiezradar)" },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    indexHtml = await resp.text();
  } catch (err) {
    throw new Error(`Amtsblatt index fetch failed: ${err.message}`);
  }

  // Extract links to PDF files from the index page
  const pdfLinks = [
    ...indexHtml.matchAll(/href="([^"]*\.pdf[^"]*)"/gi),
  ]
    .map((m) => {
      const href = m[1];
      return href.startsWith("http") ? href : new URL(href, AMTSBLATT_INDEX_URL).toString();
    })
    .filter((url, i, arr) => arr.indexOf(url) === i) // deduplicate
    .slice(0, 3); // only latest 3 PDFs to stay within cost/time budget

  const entries = [];

  for (const pdfUrl of pdfLinks) {
    try {
      const resp = await fetch(pdfUrl, {
        headers: { "user-agent": "Koepenick-Kiezradar/0.2" },
      });
      if (!resp.ok) continue;

      const buffer = Buffer.from(await resp.arrayBuffer());
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      const pages = result.pages.map((p) => p.text);

      // Find pages mentioning Köpenick
      pages.forEach((pageText, pageIndex) => {
        if (!containsKoepenick(pageText)) return;

        // Extract a short excerpt around the first Köpenick mention
        const lc = pageText.toLocaleLowerCase("de-DE");
        const mentionIdx = KOEPENICK_KEYWORDS.reduce((best, kw) => {
          const pos = lc.indexOf(kw);
          return pos >= 0 && pos < best ? pos : best;
        }, Infinity);

        const start = Math.max(0, mentionIdx - 100);
        const excerpt = pageText.slice(start, start + 300).replace(/\s+/g, " ").trim();

        // Try to extract a title from the surrounding text (first non-empty line near mention)
        const nearLines = pageText.slice(Math.max(0, mentionIdx - 400), mentionIdx + 400)
          .split(/\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 10 && l.length < 120);
        const title = nearLines[0] ?? `Amtsblatt für Berlin – Seite ${pageIndex + 1}`;

        const pageNumber = pageIndex + 1;
        const pdfPageUrl = `${pdfUrl}#page=${pageNumber}`;

        entries.push({
          id: hashId(["amtsblatt-berlin", pdfPageUrl, title]),
          source_id: "amtsblatt-berlin",
          source: "Amtsblatt für Berlin",
          source_url: pdfPageUrl,
          title: title.slice(0, 120),
          published_at: new Date().toISOString(),
          ingested_at: new Date().toISOString(),
          raw_excerpt: excerpt,
          ai_summary: excerpt,
          tags: inferTags(excerpt, "amtsblatt-berlin"),
          location: inferLocation(excerpt),
          location_relevant: true,
          local_relevance_score: 0.75,
          political_relevance_score: 0.5,
          election_relevant: /wahl|kandidat|wahlkreis/i.test(excerpt),
          ai_reasoning: `Köpenick-Bezug im Amtsblatt für Berlin (Seite ${pageNumber}).`,
          document_type: "pdf",
          document_url: pdfUrl,
          pdf_page: pageNumber,
          pdf_excerpt: excerpt,
        });
      });
    } catch {
      // skip individual PDF errors
    }
  }

  return entries;
}

function parseVizBaustellenGeoJson(json) {
  let features;
  try {
    const data = JSON.parse(json);
    features = data.features ?? data.baustellen ?? [];
  } catch {
    return [];
  }

  // Bounding box for Treptow-Köpenick
  const LAT_MIN = 52.38, LAT_MAX = 52.52, LNG_MIN = 13.47, LNG_MAX = 13.75;

  return features
    .filter((f) => {
      const coords = f.geometry?.coordinates;
      if (!coords) return false;
      // Support both Point and LineString
      const [lng, lat] = Array.isArray(coords[0]) ? coords[0] : coords;
      return lat >= LAT_MIN && lat <= LAT_MAX && lng >= LNG_MIN && lng <= LNG_MAX;
    })
    .map((f) => {
      const props = f.properties ?? {};
      const title = props.beschreibung ?? props.title ?? props.name ?? "Baustelle";
      const street = props.strasse ?? props.street ?? props.strasseName ?? "";
      const start = props.gueltigVon ?? props.gueltig_von ?? props.startDate;
      const end = props.gueltigBis ?? props.gueltig_bis ?? props.endDate;
      const sourceUrl = props.url ?? VIZ_BAUSTELLEN_URL;
      const text = `${title} ${street}`;
      const publishedAt = start ? new Date(start).toISOString() : new Date().toISOString();

      return {
        id: hashId(["viz-baustellen", title, street, String(start ?? "")]),
        source_id: "viz-baustellen",
        source: "VIZ Berlin Baustellen",
        source_url: sourceUrl,
        title: `Baustelle: ${title}`.slice(0, 120),
        published_at: publishedAt,
        ingested_at: new Date().toISOString(),
        raw_excerpt: street ? `Straße: ${street}` : "",
        ai_summary: street ? `Baustelle in ${street}: ${title}` : title,
        tags: ["verkehr", "infrastruktur"],
        location: street ? inferLocation(street) : "Treptow-Köpenick",
        location_relevant: true,
        local_relevance_score: 0.8,
        political_relevance_score: 0.1,
        election_relevant: false,
        ai_reasoning: "Verkehrseinschränkung oder Baustelle im Bezirk Treptow-Köpenick.",
        document_type: "geojson",
        event_start_at: start ? new Date(start).toISOString() : undefined,
        event_end_at: end ? new Date(end).toISOString() : undefined,
        venue: street || undefined,
      };
    })
    .filter((e) => e.title);
}

async function enrichWithAI(entries, { skipClaude }) {
  if (skipClaude || entries.length === 0) return entries;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY fehlt. Für lokale Tests nutze --skip-ai.");
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
  const districts = DISTRICT_KEYWORDS.map(([, label]) => [...new Set([label])]).flat().filter((v, i, a) => a.indexOf(v) === i);
  const prompt =
    `Du enrichst Einträge für Köpenick Kiezradar. Antworte ausschließlich als JSON-Array. Behalte id bei.

Pflichtfelder pro Eintrag:
- id (unverändert)
- ai_summary: 1–2 Sätze, sachlich, deutsch, was passiert ist
- tags: Array, nur aus [${TAGS.join(", ")}], max 3, Events nur "politik" wenn inhaltlich Wahl-/Politikbezug
- location: kurze Ortsbezeichnung im Bezirk
- location_relevant: boolean
- local_relevance_score: 0.0–1.0
- political_relevance_score: 0.0–1.0
- election_relevant: boolean
- election_topic: string oder null
- ai_reasoning: EXAKT 2 Sätze auf Deutsch. Satz 1: Was passiert konkret? Satz 2: Warum ist das für Köpenick-Anwohner relevant? Konkret, kein Marketing-Sprech, max 40 Wörter gesamt.
- district: Stadtteil aus dieser Liste oder null: [${districts.join(", ")}]
- street: Hauptstraße wenn erkennbar, sonst null
- addresses: Array mit erkannten Adressen (Format "Straße Hausnummer"), leer wenn keine

Eingabe:\n\n` +
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
  const bvvText = await fetchSource(
    "bvv-tk",
    BVV_ALLRIS_RSS_URL,
    BVV_ALLRIS_PAGE_URL,
    options.fixtureBvv
  );
  const vizText = await fetchSource("viz-baustellen", VIZ_BAUSTELLEN_URL, null, options.fixtureViz);

  // Amtsblatt: async PDF fetcher with its own error tracking
  let amtsblattEntries = [];
  try {
    if (!options.skipAmtsblatt) {
      amtsblattEntries = await fetchAmtsblattEntries();
    }
    sourceStatus["amtsblatt-berlin"] = { status: "ok", parsed: amtsblattEntries.length, raw_items: amtsblattEntries.length };
  } catch (err) {
    sourceStatus["amtsblatt-berlin"] = { status: "error", error: err.message, raw_items: 0 };
  }

  const policeEntries = parsePoliceSource(policeText);
  const eventsEntries = parseEventsHtml(eventsHtml);
  const bezirksamtEntries = parseBezirksamtSource(bezirksamtText);
  const bvvEntries = parseBvvAllrisRss(bvvText);
  const vizEntries = parseVizBaustellenGeoJson(vizText);

  // Count raw items in each source (before Köpenick-filter) for diagnostics
  const countRawItems = (text, sourceType) => {
    if (!text) return 0;
    if (sourceType === "rss") return [...text.matchAll(/<item\b/gi)].length;
    if (sourceType === "html") return [...text.matchAll(/<li\b/gi)].length;
    if (sourceType === "json") {
      try { return (JSON.parse(text).features ?? JSON.parse(text).baustellen ?? []).length; }
      catch { return 0; }
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

  const rawEntries = [
    ...policeEntries,
    ...eventsEntries,
    ...bezirksamtEntries,
    ...bvvEntries,
    ...vizEntries,
    ...amtsblattEntries,
  ].slice(0, options.limit);
  const knownIds = new Set(existing.map((entry) => entry.id));
  const newEntries = prefillGeoFields(rawEntries.filter((entry) => !knownIds.has(entry.id)));

  let enriched = newEntries;
  let aiError = null;
  try {
    enriched = prefillGeoFields(await enrichWithAI(newEntries, options));
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
          ? { status: "ok", fetched: newEntries.filter((e) => e.source_id === id).length, parsed: s.parsed ?? 0, raw_items: s.raw_items ?? 0 }
          : { status: "error", error: s.error, fetched: 0, raw_items: s.raw_items ?? 0 },
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
