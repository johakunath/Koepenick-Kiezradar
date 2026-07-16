import type { Metadata } from "next";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  getDisplayEntries,
  formatCurrentWeekRange,
  getEntriesForCurrentWeek,
} from "@/lib/data";
import WeeklyView from "@/components/WeeklyView";

export const metadata: Metadata = {
  title: "Blick in die Woche – Köpenick Kiezradar",
  description:
    "Aktuelle Meldungen und Termine dieser Woche in Berlin-Köpenick, automatisch zusammengefasst.",
  openGraph: {
    title: "Blick in die Woche – Köpenick Kiezradar",
    description:
      "Aktuelle Meldungen und Termine dieser Woche in Berlin-Köpenick, automatisch zusammengefasst.",
  },
};

interface DigestTopic {
  name: string;
  summary: string;
  entry_ids: string[];
}

interface Digest {
  week: string;
  range: string;
  generated_at: string;
  entry_count: number;
  topics: DigestTopic[];
}

async function loadLatestDigest(): Promise<Digest | null> {
  try {
    const weeklyDir = path.join(process.cwd(), "data", "weekly");
    const files = (await readdir(weeklyDir))
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();
    if (files.length === 0) return null;
    const raw = await readFile(path.join(weeklyDir, files[0]), "utf8");
    return JSON.parse(raw) as Digest;
  } catch {
    return null;
  }
}

export default async function WochePage() {
  const entries = getEntriesForCurrentWeek(getDisplayEntries());
  const digest = await loadLatestDigest();
  const currentWeekRange = formatCurrentWeekRange();
  const currentDigest = digest?.range === currentWeekRange ? digest : null;

  return (
    <WeeklyView
      entries={entries}
      weekRange={currentWeekRange}
      digest={currentDigest}
    />
  );
}
