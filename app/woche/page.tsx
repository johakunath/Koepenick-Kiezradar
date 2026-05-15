import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Entry } from "@/lib/types";
import entriesData from "@/data/entries.json";
import WeeklyView from "@/components/WeeklyView";

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
  const allEntries = entriesData as Entry[];
  const hasRealData = allEntries.some((e) => !e.is_mock);
  const entries = (hasRealData ? allEntries.filter((e) => !e.is_mock) : allEntries).sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
  const digest = await loadLatestDigest();

  const weekRange = digest?.range ?? (() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return (
      monday.toLocaleDateString("de-DE", { day: "numeric", month: "long" }) +
      " – " +
      sunday.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })
    );
  })();

  return <WeeklyView entries={entries} weekRange={weekRange} digest={digest} />;
}
