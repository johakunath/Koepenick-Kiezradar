import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const TAGS = [
  "verkehr",
  "sicherheit",
  "verwaltung",
  "politik",
  "infrastruktur",
  "veranstaltung",
  "wahl",
  "sonstiges",
];

export const KOEPENICK_KEYWORDS = [
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
  // Köpenick postal codes — match reports that reference PLZ without district name
  "12555", "12557", "12559", "12587", "12589",
];

export const DISTRICT_KEYWORDS = [
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

// German address: "Musterstraße 12" or "Muster-Str. 15a"
export const ADDRESS_REGEX =
  /[A-ZÄÖÜ][a-zäöüß]+-?(?:straße|strasse|str\.|weg|allee|platz|damm|ufer|ring|gasse)\s+\d+\w*/gi;

export function decodeEntities(value = "") {
  return value
    .replaceAll("<![CDATA[", "")
    .replaceAll("]]>", "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&ouml;", "ö").replaceAll("&Ouml;", "Ö")
    .replaceAll("&auml;", "ä").replaceAll("&Auml;", "Ä")
    .replaceAll("&uuml;", "ü").replaceAll("&Uuml;", "Ü")
    .replaceAll("&szlig;", "ß")
    .replaceAll("&ndash;", "–").replaceAll("&mdash;", "—")
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

export function compactText(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

export function truncateText(value = "", maxLength = 220) {
  const text = compactText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}…`;
}

export function hashId(parts) {
  return createHash("sha256").update(parts.filter(Boolean).join("|")).digest("hex").slice(0, 16);
}

export function containsKoepenick(text) {
  const haystack = text.toLocaleLowerCase("de-DE");
  return KOEPENICK_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

export function inferTags(text, sourceId) {
  const haystack = text.toLocaleLowerCase("de-DE");
  const tags = new Set();

  if (sourceId === "polizei-berlin") tags.add("sicherheit");
  if (sourceId === "berlin-events") tags.add("veranstaltung");
  if (sourceId === "bezirksamt-tk") tags.add("verwaltung");
  if (sourceId === "bvv-tk") {
    tags.add("politik");
    tags.add("verwaltung");
  }
  if (/verkehr|unfall|straße|strasse|sperrung|bahn|rad/.test(haystack)) tags.add("verkehr");
  if (/bvv|partei|antrag|senat|politik/.test(haystack)) tags.add("politik");
  if (/wahl|kandidat|wahlkreis|abgeordnetenhaus/.test(haystack)) tags.add("wahl");
  if (/bau|schule|kita|wasser|strom|sanierung|infrastruktur/.test(haystack)) {
    tags.add("infrastruktur");
  }
  if (/bezirksamt|bürgeramt|verwaltung|amt/.test(haystack)) tags.add("verwaltung");

  if (tags.size === 0) tags.add("sonstiges");
  return [...tags].filter((tag) => TAGS.includes(tag));
}

export function inferLocation(text) {
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

export function inferDistrictFromText(text) {
  const lc = text.toLocaleLowerCase("de-DE");
  return DISTRICT_KEYWORDS.find(([kw]) => lc.includes(kw))?.[1] ?? undefined;
}

export function extractAddresses(text) {
  return [...new Set((text.match(ADDRESS_REGEX) ?? []).map((a) => a.trim()))].slice(0, 5);
}

export function fallbackSourceSummary({ title, rawExcerpt, sourceId, venue, eventStartAt }) {
  if (sourceId === "berlin-events") {
    const date = eventStartAt
      ? new Date(eventStartAt).toLocaleString("de-DE", {
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;
    if (date && venue) return `Veranstaltung am ${date} in ${venue}.`;
    if (venue) return `Veranstaltung in ${venue}.`;
  }

  const cleanedExcerpt = truncateText(rawExcerpt);
  if (
    cleanedExcerpt &&
    cleanedExcerpt.toLocaleLowerCase("de-DE") !== compactText(title).toLocaleLowerCase("de-DE")
  ) {
    return cleanedExcerpt;
  }

  if (sourceId === "bezirksamt-tk") {
    return "Offizielle Meldung des Bezirksamts Treptow-Köpenick. Details stehen in der Originalquelle.";
  }
  if (sourceId === "polizei-berlin") {
    return "Polizeimeldung mit Köpenick-Bezug. Details stehen in der Originalquelle.";
  }
  if (sourceId === "bvv-tk") {
    return "BVV-Vorgang mit Bezug zu Treptow-Köpenick. Details stehen in der Originalquelle.";
  }
  return "Noch nicht KI-zusammengefasst. Details stehen in der Originalquelle.";
}

export function field(block, name) {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  return decodeEntities(match?.[1] ?? "");
}

export function parseGermanDate(text) {
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

export async function readText(url, fixturePath) {
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
