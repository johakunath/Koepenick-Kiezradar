import { berlinDay } from "./dates.mjs";

export function canonicalSourceUrl(value) {
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol)) return "";
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|ls$|date_start$|suchmaske$)/.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    return url.toString();
  } catch { return ""; }
}

export function entryIdentity(entry) {
  const url = canonicalSourceUrl(entry.source_url);
  // A calendar series is not an occurrence. Keep every date/time and venue.
  if (entry.event_start_at) {
    const occurrence = entry.event_date_precision === "time" ? entry.event_start_at : berlinDay(entry.event_start_at);
    return `${url}|${occurrence}|${(entry.venue ?? "").replace(/\s+in Treptow-Köpenick\s*$/i, "").trim().toLowerCase()}`;
  }
  // Documents can contain multiple independent notices on the same PDF page.
  return `${url}|${entry.title.trim().toLocaleLowerCase("de-DE")}|${entry.pdf_page ?? ""}`;
}

export function sourceReferences(entry) {
  const refs = entry.source_refs ?? [{ name: entry.source, url: entry.source_url }];
  const byUrl = new Map();
  for (const ref of refs) {
    const url = canonicalSourceUrl(ref.url);
    if (url) byUrl.set(url, { ...ref, url });
  }
  return [...byUrl.values()];
}

export function consolidateEntries(entries) {
  const dayKey = entry => `${canonicalSourceUrl(entry.source_url)}|${berlinDay(entry.event_start_at)}|${(entry.venue ?? "").replace(/\s+in Treptow-Köpenick\s*$/i, "").trim().toLowerCase()}`;
  const preciseTimes = new Map();
  for (const entry of entries) {
    if (entry.event_date_precision !== "time" || !entry.event_start_at) continue;
    const key = dayKey(entry);
    const times = preciseTimes.get(key) ?? new Set();
    times.add(entry.event_start_at);
    preciseTimes.set(key, times);
  }
  const byIdentity = new Map();
  for (const entry of entries) {
    // Upgrade a legacy day-only calendar copy only if that day has one known time.
    // Multiple performances on the same day must remain separate.
    const times = entry.source_id === "berlin-events" && entry.event_date_precision !== "time" && entry.event_start_at ? preciseTimes.get(dayKey(entry)) : undefined;
    const key = times?.size === 1 ? entryIdentity({ ...entry, event_start_at: [...times][0], event_date_precision: "time" }) : entryIdentity(entry);
    const old = byIdentity.get(key);
    if (!old) {
      byIdentity.set(key, { ...entry, source_refs: sourceReferences(entry), alias_ids: entry.alias_ids ?? [] });
      continue;
    }
    // Stable canonical ID, richer original excerpt, all tags and source links.
    const rich = (entry.raw_excerpt?.length ?? 0) > (old.raw_excerpt?.length ?? 0) ? entry : old;
    const precise = old.event_date_precision === "time" ? old : entry.event_date_precision === "time" ? entry : null;
    byIdentity.set(key, {
      ...old, ...rich, id: old.id, slug: old.slug,
      ...(precise ? { event_start_at: precise.event_start_at, event_end_at: precise.event_end_at,
        event_date_precision: "time", event_date_origin: precise.event_date_origin, venue: precise.venue,
        ...(Number.isFinite(precise.lat) && Number.isFinite(precise.lng) ? { lat: precise.lat, lng: precise.lng, geocode_precision: precise.geocode_precision } : {}) } : {}),
      tags: [...new Set([...(old.tags ?? []), ...(entry.tags ?? [])])],
      source_refs: sourceReferences({ source_refs: [...sourceReferences(old), ...sourceReferences(entry)] }),
      alias_ids: [...new Set([...(old.alias_ids ?? []), entry.id, ...(entry.alias_ids ?? [])])].filter(id => id !== old.id),
      location_relevant: old.location_relevant === false && entry.location_relevant === false ? false : rich.location_relevant,
    });
  }
  return [...byIdentity.values()];
}
