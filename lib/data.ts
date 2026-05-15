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
  const district = getDistrictForEntry(entry);
  return {
    ...entry,
    slug: entry.slug ?? slugify(entry.title),
    kind:
      entry.kind ??
      (entry.tags.includes("veranstaltung")
        ? "veranstaltung"
        : entry.document_url || entry.document_type
          ? "dokument"
          : "meldung"),
    source_id: entry.source_id ?? slugify(entry.source),
    topic_slugs: entry.topic_slugs ?? inferTopicSlugs(entry),
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
      (url.searchParams.has("kategorie[0]") || url.searchParams.has("ls"))
    );
  } catch {
    return false;
  }
}

function dedupeEntries(entries: Entry[]): Entry[] {
  const seen = new Set<string>();
  const result: Entry[] = [];

  for (const entry of entries) {
    const key = `${entry.source_id ?? entry.source}|${entry.source_url}|${entry.title}`;
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
