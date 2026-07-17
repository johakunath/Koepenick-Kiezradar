import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  getDisplayEntries,
  formatCurrentWeekRange,
  getEntriesForCurrentWeek,
  getIsoWeekId,
  getIsoWeekNumber,
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

async function loadDigestForWeek(weekId: string): Promise<Digest | null> {
  try {
    const digestPath = path.join(
      process.cwd(),
      "data",
      "weekly",
      `${weekId}.json`,
    );
    const raw = await readFile(digestPath, "utf8");
    return JSON.parse(raw) as Digest;
  } catch {
    return null;
  }
}

export default async function WochePage() {
  const entries = getEntriesForCurrentWeek(getDisplayEntries());
  const currentWeekId = getIsoWeekId();
  const digest = await loadDigestForWeek(currentWeekId);

  return (
    <WeeklyView
      entries={entries}
      weekRange={formatCurrentWeekRange()}
      weekNumber={getIsoWeekNumber()}
      digest={digest}
    />
  );
}
