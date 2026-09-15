import type { Entry } from "@/lib/types";

export function searchEntries(entries: Entry[], query: string): Entry[] {
  const normalized = query.trim().toLocaleLowerCase("de-DE");
  if (!normalized) return entries;

  return entries.filter((entry) =>
    [
      entry.title,
      entry.ai_summary,
      entry.location,
      entry.venue ?? "",
      entry.district ?? "",
      entry.source,
      entry.election_topic ?? "",
      entry.raw_excerpt ?? "",
      ...(entry.tags ?? []),
    ]
      .join(" ")
      .toLocaleLowerCase("de-DE")
      .includes(normalized),
  );
}

