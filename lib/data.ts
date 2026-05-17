import entriesData from "@/data/entries.json";
import topicsData from "@/data/topics.json";
import districtsData from "@/data/districts.json";
import sourcesData from "@/data/sources.json";
import bodiesData from "@/data/bodies.json";
import meetingsData from "@/data/meetings.json";
import documentsData from "@/data/documents.json";
import ingestStatus from "@/data/ingest-status.json";
import type {
  Body,
  DistrictRecord,
  Entry,
  Meeting,
  SourceDocument,
  SourceRecord,
  Tag,
  Topic,
} from "@/lib/types";
import { ALL_TAGS } from "@/lib/types";
import { slugify } from "@/lib/slug";
export { slugify };

const tagToTopic: Record<Tag, string> = {
  wahl: "wahl-2026",
  verkehr: "verkehr",
  sicherheit: "sicherheit",
  verwaltung: "verwaltung",
  politik: "politik",
  infrastruktur: "infrastruktur",
  veranstaltung: "veranstaltungen",
  sonstiges: "sonstiges",
};

const electionTopicMap: Record<string, string> = {
  wohnen: "wohnen",
  bildung: "bildung",
  "innere sicherheit": "sicherheit",
  sicherheit: "sicherheit",
  "wahl 2026": "wahl-2026",
};

function compactText(value = ""): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncateSentence(value: string, maxLength = 220): string {
  const text = compactText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}…`;
}

function isThinSummary(entry: Entry): boolean {
  const summary = compactText(entry.ai_summary);
  const title = compactText(entry.title);
  return summary.length === 0 || summary.toLocaleLowerCase("de-DE") === title.toLocaleLowerCase("de-DE");
}

function fallbackSummary(entry: Entry): string {
  if ((entry.tags ?? []).includes("veranstaltung") || entry.kind === "veranstaltung" || entry.event_start_at) {
    const date = entry.event_start_at
      ? new Date(entry.event_start_at).toLocaleString("de-DE", {
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;
    const where = entry.venue || entry.location;
    if (date && where) return `Veranstaltung am ${date} in ${where}.`;
    if (where) return `Veranstaltung in ${where}.`;
  }

  if (entry.raw_excerpt && compactText(entry.raw_excerpt).toLocaleLowerCase("de-DE") !== compactText(entry.title).toLocaleLowerCase("de-DE")) {
    return truncateSentence(entry.raw_excerpt);
  }

  if (entry.source_id === "bezirksamt-tk") {
    return `Offizielle Meldung des Bezirksamts Treptow-Köpenick. Details stehen in der Originalquelle.`;
  }

  if (entry.source_id === "polizei-berlin") {
    return `Polizeimeldung mit Köpenick-Bezug. Details stehen in der Originalquelle.`;
  }

  if (entry.source_id === "bvv-tk") {
    return `BVV-Vorgang mit Bezug zu Treptow-Köpenick. Details stehen in der Originalquelle.`;
  }

  return `Noch nicht KI-zusammengefasst. Details stehen in der Originalquelle.`;
}

function isTag(value: unknown): value is Tag {
  return typeof value === "string" && (ALL_TAGS as readonly string[]).includes(value);
}

function normalizeTags(entry: Entry): Tag[] {
  const tags = new Set<Tag>();
  const sourceId = entry.source_id ?? slugify(entry.source);
  const haystack = [
    entry.title,
    entry.ai_summary,
    entry.raw_excerpt ?? "",
    entry.location,
    entry.venue ?? "",
    entry.election_topic ?? "",
  ]
    .join(" ")
    .toLocaleLowerCase("de-DE");

  for (const tag of entry.tags ?? []) {
    if (isTag(tag)) tags.add(tag);
  }

  if (isTag(entry.tag)) tags.add(entry.tag);
  if (entry.election_relevant) tags.add("wahl");
  if (entry.kind === "veranstaltung" || entry.event_start_at || entry.venue || sourceId === "berlin-events") {
    tags.add("veranstaltung");
  }
  if (sourceId === "polizei-berlin") tags.add("sicherheit");
  if (sourceId === "bezirksamt-tk") tags.add("verwaltung");
  if (sourceId === "bvv-tk") {
    tags.add("politik");
    tags.add("verwaltung");
  }

  if (/verkehr|unfall|straße|strasse|sperrung|bahn|radweg|fahrrad|baustelle/.test(haystack)) tags.add("verkehr");
  if (/schule|kita|bau|sanierung|wasser|strom|brücke|infrastruktur/.test(haystack)) tags.add("infrastruktur");
  if (/bvv|partei|antrag|senat|wahl|kandidat|abgeordnetenhaus/.test(haystack)) tags.add("politik");
  if (/wahl|kandidat|wahlkreis|abgeordnetenhaus/.test(haystack)) tags.add("wahl");

  if (tags.size > 1) tags.delete("sonstiges");
  if (tags.size === 0) tags.add("sonstiges");

  return ALL_TAGS.filter((tag) => tags.has(tag));
}

export function getTopics(): Topic[] {
  return topicsData as Topic[];
}

export function getDistricts(): DistrictRecord[] {
  return districtsData as DistrictRecord[];
}

export function getSources(): SourceRecord[] {
  return sourcesData as SourceRecord[];
}

export function getBodies(): Body[] {
  return bodiesData as Body[];
}

export function getMeetings(): Meeting[] {
  return [...(meetingsData as Meeting[])].sort(
    (a, b) => new Date(a.meeting_at).getTime() - new Date(b.meeting_at).getTime()
  );
}

export function getDocuments(): SourceDocument[] {
  return documentsData as SourceDocument[];
}

export function getLatestUpdate(): string | undefined {
  return (ingestStatus as { last_run?: string }).last_run;
}

export function getDistrictForEntry(entry: Entry): DistrictRecord | undefined {
  if (entry.district_slug) {
    return getDistricts().find((district) => district.slug === entry.district_slug);
  }

  const haystack = `${entry.district ?? ""} ${entry.location ?? ""} ${entry.title ?? ""}`.toLocaleLowerCase("de-DE");
  return getDistricts().find((district) =>
    district.keywords.some((keyword) => haystack.includes(keyword.toLocaleLowerCase("de-DE")))
  );
}

function inferTopicSlugs(entry: Entry): string[] {
  const slugs = new Set<string>();

  for (const tag of entry.tags) {
    const slug = tagToTopic[tag];
    if (slug && slug !== "sonstiges") slugs.add(slug);
  }

  if (entry.election_relevant) slugs.add("wahl-2026");

  const electionTopic = entry.election_topic?.toLocaleLowerCase("de-DE");
  if (electionTopic) {
    for (const [needle, topicSlug] of Object.entries(electionTopicMap)) {
      if (electionTopic.includes(needle)) slugs.add(topicSlug);
    }
  }

  return [...slugs];
}

export function normalizeEntry(entry: Entry): Entry {
  const sourceId = entry.source_id ?? slugify(entry.source);
  const tags = normalizeTags({ ...entry, source_id: sourceId });
  const district = getDistrictForEntry(entry);
  const normalizedKind =
    entry.kind ??
    (tags.includes("veranstaltung")
      ? "veranstaltung"
      : entry.document_url || entry.document_type
        ? "dokument"
        : "meldung");
  const baseEntry = { ...entry, source_id: sourceId, kind: normalizedKind, tags };
  const topicSlugs = [...new Set([...(entry.topic_slugs ?? []), ...inferTopicSlugs(baseEntry)])];

  return {
    ...baseEntry,
    slug: entry.slug ?? slugify(entry.title),
    ai_summary: isThinSummary(baseEntry) ? fallbackSummary(baseEntry) : entry.ai_summary,
    topic_slugs: topicSlugs,
    district_slug: entry.district_slug ?? district?.slug,
  };
}

function isNavigationEvent(entry: Entry): boolean {
  if (entry.source_id !== "berlin-events") return false;

  const genericTitles = new Set([
    "ausstellungen",
    "spaziergänge, ausflüge",
    "infoveranstaltungen",
    "gesundheit, umwelt",
    "politik, bürgerservice",
  ]);
  const title = entry.title.trim().toLocaleLowerCase("de-DE");
  if (genericTitles.has(title)) return true;
  if (/^seite\s+\d+$/i.test(entry.title.trim())) return true;

  try {
    const url = new URL(entry.source_url);
    return (
      url.pathname.endsWith("index.php") &&
      (url.searchParams.has("kategorie[0]") ||
        (url.searchParams.has("ls") && !url.searchParams.has("detail")))
    );
  } catch {
    return false;
  }
}

function dedupeEntries(entries: Entry[]): Entry[] {
  const seen = new Set<string>();
  const result: Entry[] = [];

  for (const entry of entries) {
    // Events from the same source with the same title on the same day are the same event
    // listed under multiple berlin.de categories — dedupe by title+date instead of URL.
    const isEvent = entry.source_id === "berlin-events" || entry.kind === "veranstaltung";
    const eventDay = (entry.event_start_at ?? entry.published_at).slice(0, 10);
    // berlin-events: same event appears with different date_start params — dedupe by title only.
    // Non-events: bezirksamt-tk and bvv-tk both scrape the same press-release URLs, so key
    // by source_url+title (not source_id) to catch cross-source dupes.
    const key = entry.source_id === "berlin-events"
      ? `berlin-events|${entry.title.trim().toLowerCase()}`
      : isEvent
        ? `${entry.source_id ?? entry.source}|${entry.title}|${eventDay}`
        : `${entry.source_url}|${entry.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }

  return result;
}

export function getEntries(): Entry[] {
  return (entriesData as Entry[])
    .map(normalizeEntry)
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
}

export function getDisplayEntries(): Entry[] {
  const entries = getEntries();
  const hasRealData = entries.some((entry) => !entry.is_mock);
  const displayEntries = hasRealData ? entries.filter((entry) => !entry.is_mock) : entries;
  return dedupeEntries(displayEntries.filter((entry) => !isNavigationEvent(entry)));
}

export function getEntryBySlug(slug: string): Entry | undefined {
  return getDisplayEntries().find((entry) => entry.slug === slug);
}

export function getEntriesForTopic(topicSlug: string): Entry[] {
  return getDisplayEntries().filter((entry) => entry.topic_slugs?.includes(topicSlug));
}

export function getEntriesForDistrict(districtSlug: string): Entry[] {
  return getDisplayEntries().filter((entry) => entry.district_slug === districtSlug);
}

export function getTopicBySlug(slug: string): Topic | undefined {
  return getTopics().find((topic) => topic.slug === slug);
}

export function getDistrictBySlug(slug: string): DistrictRecord | undefined {
  return getDistricts().find((district) => district.slug === slug);
}

export function getMeetingBySlug(slug: string): Meeting | undefined {
  return getMeetings().find((meeting) => meeting.slug === slug);
}

export function searchEntries(entries: Entry[], query: string): Entry[] {
  const normalized = query.trim().toLocaleLowerCase("de-DE");
  if (!normalized) return entries;

  return entries.filter((entry) =>
    [
      entry.title,
      entry.ai_summary,
      entry.location,
      entry.district ?? "",
      entry.source,
      entry.election_topic ?? "",
      entry.raw_excerpt ?? "",
      ...(entry.tags ?? []),
    ]
      .join(" ")
      .toLocaleLowerCase("de-DE")
      .includes(normalized)
  );
}

export function formatCurrentWeekRange(now = new Date()): string {
  const start = new Date(now);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return `${start.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
  })} – ${end.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;
}
