import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
    const resp = await fetch(url, { headers: { "user-agent": NOMINATIM_UA } });
    if (!resp.ok) return null;
    const results = await resp.json();
    if (!results.length) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch {
    return null;
  }
}

export async function geocodeEntries(entries) {
  const cache = await loadGeocodeCache();
  const toGeocode = entries.filter(
    (e) => e.lat == null && (e.addresses?.length || e.venue || e.location),
  );
  if (toGeocode.length === 0) return entries;

  let added = 0;
  for (const entry of toGeocode) {
    const query = entry.addresses?.[0] ?? entry.venue ?? entry.location;
    if (!query || query === "Treptow-Köpenick") continue;

    if (cache[query]) {
      if (cache[query].lat) {
        entry.lat = cache[query].lat;
        entry.lng = cache[query].lng;
      }
      continue;
    }

    // Rate-limit: 1 req/sec per Nominatim policy
    await new Promise((r) => setTimeout(r, 1100));
    const coords = await nominatimLookup(query);
    cache[query] = coords ?? { lat: null, lng: null };
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
