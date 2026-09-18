import type { Entry, IngestHealth } from "@/lib/types";
import { ALL_TAGS } from "@/lib/types";
import { berlinDay, addDays, TIME_ZONE } from "./dates.mjs";
import { canonicalSourceUrl } from "./entry-identity.mjs";
import { hasMappableCoordinates } from "./map-coordinates";
import { searchEntries } from "./search";

export const PERIODS = { upcoming: "Demnächst", today: "Heute", weekend: "Wochenende", week: "7 Tage", past: "Vergangenes" } as const;
export const INTERESTS = { family: "Kinder & Familie", culture: "Kunst & Kultur", outdoors: "Draußen", markets: "Märkte & Feste", community: "Mitmachen" } as const;
export type Period = keyof typeof PERIODS;
export type Interest = keyof typeof INTERESTS;
export type Point = { lat: number; lng: number };
export type Bounds = { north: number; south: number; east: number; west: number };
export interface DiscoveryFilters { mode: "discover" | "news"; period: Period; interest: Interest | ""; district: string; tag: string; query: string }
export const DEFAULT_FILTERS: DiscoveryFilters = { mode: "discover", period: "upcoming", interest: "", district: "", tag: "", query: "" };

export function parseFilters(params: URLSearchParams): DiscoveryFilters {
  const period = params.get("when") ?? "upcoming";
  const interest = params.get("interest") ?? "";
  return {
    mode: params.get("mode") === "news" ? "news" : "discover",
    period: Object.hasOwn(PERIODS, period) ? period as Period : "upcoming",
    interest: Object.hasOwn(INTERESTS, interest) ? interest as Interest : "",
    district: (params.get("district") ?? "").slice(0, 80),
    tag: ALL_TAGS.includes(params.get("tag") as never) ? params.get("tag")! : "",
    query: (params.get("q") ?? "").slice(0, 150),
  };
}

export function filterParams(filters: DiscoveryFilters) {
  const params = new URLSearchParams();
  if (filters.mode !== "discover") params.set("mode", filters.mode);
  if (filters.period !== "upcoming") params.set("when", filters.period);
  if (filters.interest) params.set("interest", filters.interest);
  if (filters.district) params.set("district", filters.district);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.query) params.set("q", filters.query);
  return params;
}

export function isEvent(entry: Entry) {
  return entry.source_id !== "viz-baustellen" && (entry.kind === "veranstaltung" || entry.tags.includes("veranstaltung"));
}

export function interestsForEntry(entry: Entry): Interest[] {
  // Source text only. A school's building works or an artwork titled "Kids" isn't a family activity.
  if (!isEvent(entry)) return [];
  const text = `${entry.title} ${entry.raw_excerpt ?? ""}`.toLocaleLowerCase("de-DE");
  const matches: [Interest, RegExp][] = [
    ["family", /familien(?:fest|festival|tag|nachmittag|angebot)|kinder(?:fest|theater|kino|programm|konzert|workshop)|für (?:kinder|familien)|mit kindern|großeltern.*enkel|temporäre spielstraße/],
    ["culture", /ausstellung|konzert|lesung|museum|theater|galerie|musik|kino|führung/],
    ["outdoors", /spaziergang|wanderung|radtour|naturführung|draußen|regatta|freiluft|open air/],
    ["markets", /flohmarkt|wochenmarkt|weihnachtsmarkt|kiezfest|sommerfest|straßenfest|winzersommer|familienfest/],
    ["community", /mitmach|workshop|nachbarschaft|ehrenamt|freiwillig|herbstputz|aktionstag|sprechstunde/],
  ];
  return matches.filter(([, pattern]) => pattern.test(text)).map(([interest]) => interest);
}

export function periodBounds(period: Period, now: Date): [string, string] {
  const today = berlinDay(now);
  if (period === "today") return [today, addDays(today, 1)];
  if (period === "week") return [today, addDays(today, 7)];
  if (period === "weekend") {
    const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
    const saturday = addDays(today, weekday === 0 ? -1 : 6 - weekday);
    return [today > saturday ? today : saturday, addDays(saturday, 2)];
  }
  return [today, addDays(today, 31)];
}

export function distanceKm(a: Point, b: Point) {
  const radians = Math.PI / 180;
  const x = Math.sin((b.lat - a.lat) * radians / 2) ** 2 + Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin((b.lng - a.lng) * radians / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function insideBounds(entry: Entry, bounds: Bounds) {
  return hasMappableCoordinates(entry) && entry.lat >= bounds.south && entry.lat <= bounds.north && entry.lng >= bounds.west && entry.lng <= bounds.east;
}

export function filterDiscovery(entries: Entry[], filters: DiscoveryFilters, now: Date, nearby?: { point: Point; radius: number }) {
  const [from, to] = periodBounds(filters.period, now);
  const today = berlinDay(now);
  const results = searchEntries(entries, filters.query).filter(entry => {
    if (entry.location_relevant === false || entry.is_mock) return false;
    if (filters.district && entry.district_slug !== filters.district) return false;
    if (filters.tag && !entry.tags.some(t => t === filters.tag)) return false;
    if (filters.interest && !interestsForEntry(entry).includes(filters.interest)) return false;
    if (nearby && (!hasMappableCoordinates(entry) || entry.geocode_precision === "area" || distanceKm(nearby.point, entry) > nearby.radius)) return false;
    if (filters.mode === "news") return true;
    if (!isEvent(entry)) return false;
    if (!entry.event_start_at) return filters.period === "upcoming" && berlinDay(entry.published_at) >= addDays(today, -21);
    const start = berlinDay(entry.event_start_at);
    const end = berlinDay(entry.event_end_at ?? entry.event_start_at);
    if (!start || !end) return false;
    if (filters.period === "past") return end < today;
    if (entry.event_end_at && new Date(entry.event_end_at) < now) return false;
    return start < to && end >= from;
  });
  return results.sort((a, b) => {
    if (nearby && hasMappableCoordinates(a) && hasMappableCoordinates(b)) return distanceKm(nearby.point, a) - distanceKm(nearby.point, b);
    if (filters.mode === "news" || filters.period === "past") return b.published_at.localeCompare(a.published_at);
    if (!!a.event_start_at !== !!b.event_start_at) return a.event_start_at ? -1 : 1;
    return (a.event_start_at ?? "").localeCompare(b.event_start_at ?? "") || b.published_at.localeCompare(a.published_at) || a.id.localeCompare(b.id);
  });
}

export function groupOccurrences(entries: Entry[]) {
  const groups = new Map<string, { entry: Entry; occurrences: Entry[] }>();
  for (const entry of entries) {
    const key = isEvent(entry) && entry.event_start_at ? `${canonicalSourceUrl(entry.source_url)}|${entry.title}|${entry.venue ?? ""}` : entry.id;
    const group = groups.get(key);
    if (group) group.occurrences.push(entry);
    else groups.set(key, { entry, occurrences: [entry] });
  }
  return [...groups.values()];
}

export function formatEntryDate(entry: Entry) {
  if (!isEvent(entry)) return `Meldung vom ${formatDate(entry.published_at)}`;
  if (!entry.event_start_at) return "Termin noch offen";
  const date = formatDate(entry.event_start_at);
  if (entry.event_date_precision !== "time") return `${date} · Uhrzeit offen`;
  const time = (iso: string) => new Date(iso).toLocaleTimeString("de-DE", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time(entry.event_start_at)}${entry.event_end_at ? `–${time(entry.event_end_at)}` : ""} Uhr`;
}

export function formatDate(iso: string) {
  if (!berlinDay(iso)) return "Datum unbekannt";
  return new Date(iso).toLocaleDateString("de-DE", { timeZone: TIME_ZONE, day: "numeric", month: "short", year: "numeric" });
}

export function healthMessage(health: IngestHealth, now: Date) {
  if (!health.last_run) return "Aktualität unbekannt. Bitte prüfe die Originalquelle.";
  if (now.getTime() - new Date(health.last_run).getTime() > 48 * 3600000) return "Datenstand älter als zwei Tage. Neue Termine oder Änderungen können fehlen.";
  const calendar = health.sources["berlin-events"];
  if (calendar?.status === "warning" && (calendar.parsed ?? 0) > 0) return `Kalender teilweise abgeglichen am ${formatDate(health.last_run)}. Weitere Termine können fehlen.`;
  if (!calendar || calendar.status !== "ok" || calendar.parsed === 0) return "Der Kalender liefert gerade keine verlässliche Aktualisierung. Termine können fehlen.";
  return `Zuletzt abgeglichen am ${formatDate(health.last_run)}. Termine können sich ändern.`;
}
