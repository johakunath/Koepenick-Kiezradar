import { hashId, inferLocation } from "../lib/shared.mjs";

// CKAN dataset ID on daten.berlin.de — resolves the actual GeoJSON download URL dynamically
const CKAN_API = "https://daten.berlin.de/api/3/action/package_show?id=baustellen-sperrungen-und-sonstige-storungen-von-besonderem-verkehrlichem-interesse";

// Fallback direct URLs (require VIZ API access — likely blocked without credentials)
const VIZ_FALLBACK_URLS = [
  "https://api.viz.berlin.de/api/verkehr/baustellen",
  "https://api.viz.berlin.de/daten/baustellen",
];

export const VIZ_BAUSTELLEN_URLS = VIZ_FALLBACK_URLS;

export async function resolveVizUrl() {
  try {
    const res = await fetch(CKAN_API, { headers: { "Accept": "application/json" } });
    if (!res.ok) return null;
    const json = await res.json();
    const resources = json?.result?.resources ?? [];
    const geojson = resources.find((r) =>
      r.format?.toLowerCase().includes("geo") || r.url?.toLowerCase().includes("geojson")
    );
    return geojson?.url ?? null;
  } catch {
    return null;
  }
}

// Bounding box for Treptow-Köpenick
const LAT_MIN = 52.38, LAT_MAX = 52.52, LNG_MIN = 13.47, LNG_MAX = 13.75;

export function parseVizBaustellenGeoJson(json) {
  let features;
  try {
    const data = JSON.parse(json);
    features = data.features ?? data.baustellen ?? [];
  } catch {
    return [];
  }

  return features
    .filter((f) => {
      const coords = f.geometry?.coordinates;
      if (!coords) return false;
      const [lng, lat] = Array.isArray(coords[0]) ? coords[0] : coords;
      return lat >= LAT_MIN && lat <= LAT_MAX && lng >= LNG_MIN && lng <= LNG_MAX;
    })
    .map((f) => {
      const props = f.properties ?? {};
      const title = props.beschreibung ?? props.title ?? props.name ?? "Baustelle";
      const street = props.strasse ?? props.street ?? props.strasseName ?? "";
      const start = props.gueltigVon ?? props.gueltig_von ?? props.startDate;
      const end = props.gueltigBis ?? props.gueltig_bis ?? props.endDate;
      const sourceUrl = props.url ?? VIZ_BAUSTELLEN_URLS[0];
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
