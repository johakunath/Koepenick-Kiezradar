import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DISTRICT_KEYWORDS } from "./shared.mjs";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const GEOCODE_CACHE_PATH = path.join(ROOT, "data", "geocode-cache.json");

const NOMINATIM_VIEWBOX = "13.44,52.56,13.76,52.34";
const NOMINATIM_UA =
  "Koepenick-Kiezradar/0.2 (+https://github.com/johakunath/Koepenick-Kiezradar)";

async function loadGeocodeCache() {
  try {
    return JSON.parse(await readFile(GEOCODE_CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}

const KNOWN_PLACES = [
  { pattern: /cajamarcaplatz|cajamarca-?platz/i, lat: 52.4559, lng: 13.5107 },
  {
    pattern: /s-?bahnhof schöneweide|bahnhof schöneweide/i,
    lat: 52.4547,
    lng: 13.5103,
  },
];

function knownPlaceLookup(query) {
  const match = KNOWN_PLACES.find((place) => place.pattern.test(query));
  return match ? { lat: match.lat, lng: match.lng } : null;
}

async function nominatimLookup(query) {
  const known = knownPlaceLookup(query);
  if (known) return known;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query + ", Berlin",
  )}&countrycodes=de&bounded=1&viewbox=${NOMINATIM_VIEWBOX}&format=json&limit=1`;
  try {
    const resp = await fetch(url, { headers: { "user-agent": NOMINATIM_UA }, signal: AbortSignal.timeout(15000) });
    if (!resp.ok) return null;
    const results = await resp.json();
    if (!results.length) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch {
    return null;
  }
}

export async function geocodeEntries(entries) {
  entries = entries.map(e => ({ ...e }));
  const cache = await loadGeocodeCache();
  const attempted = new Set();
  const toGeocode = entries.filter(
    (e) => (e.lat == null || e.lng == null) && (e.addresses?.length || e.venue || e.location),
  );
  if (toGeocode.length === 0) return entries;

  let added = 0;
  for (const entry of toGeocode) {
    const query = (entry.addresses?.[0] ?? entry.venue ?? entry.location)?.replace(/\s+in Treptow-Köpenick\s*$/i, "");
    if (!query || query === "Treptow-Köpenick") continue;
    const generic = query === "Köpenick" || DISTRICT_KEYWORDS.some(([, label]) => label.toLowerCase() === query.toLowerCase());
    entry.geocode_precision = generic ? "area" : entry.addresses?.length ? "address" : entry.venue ? "venue" : "area";

    if (cache[query]?.lat != null && cache[query]?.lng != null) {
      if (cache[query].lat) {
        entry.lat = cache[query].lat;
        entry.lng = cache[query].lng;
      }
      continue;
    }

    // Retry failed places on the next run, at most once per query in this run.
    if (attempted.has(query)) continue;
    attempted.add(query);
    // Rate-limit: 1 req/sec per Nominatim policy
    await new Promise((r) => setTimeout(r, 1100));
    const coords = await nominatimLookup(query);
    // Never cache a temporary network failure as a permanent missing place.
    if (coords) cache[query] = coords;
    if (coords) {
      entry.lat = coords.lat;
      entry.lng = coords.lng;
      added++;
    }
    console.log(
      `Geocoded "${query}": ${coords ? `${coords.lat},${coords.lng}` : "not found"}`,
    );
  }

  await writeFile(
    GEOCODE_CACHE_PATH,
    `${JSON.stringify(cache, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `Geocoding: ${added} new coordinates (${toGeocode.length} entries checked)`,
  );
  return entries;
}
