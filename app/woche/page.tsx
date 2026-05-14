import type { Entry } from "@/lib/types";
import entriesData from "@/data/entries.json";
import WeeklyView from "@/components/WeeklyView";

export default function WochePage() {
  const entries = (entriesData as Entry[]).sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  return (
    <WeeklyView
      entries={entries}
      weekRange="8. – 14. Mai 2026"
    />
  );
}
