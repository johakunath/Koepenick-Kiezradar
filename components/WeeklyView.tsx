import Link from "next/link";
import type { Entry, Tag } from "@/lib/types";
import { TAG_LABELS } from "@/lib/types";
import EntryCard from "./EntryCard";

interface WeeklyViewProps {
  entries: Entry[];
  weekRange: string;
}

function getWeekStats(entries: Entry[]) {
  const electionCount = entries.filter((e) => e.election_relevant).length;

  const tagCounts = entries
    .flatMap((e) => e.tags)
    .reduce<Record<string, number>>((acc, t) => {
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});

  const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as
    | Tag
    | undefined;

  return { electionCount, topTag };
}

export default function WeeklyView({ entries, weekRange }: WeeklyViewProps) {
  const { electionCount, topTag } = getWeekStats(entries);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="text-xs font-medium transition-colors mb-4 inline-block"
            style={{ color: "var(--water-mid)" }}
          >
            ← Zum Feed
          </Link>
          <h1
            className="text-3xl mt-2"
            style={{
              fontFamily: "var(--font-fraunces)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--water-deep)",
            }}
          >
            Diese Woche in Köpenick
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--ink-soft)" }}>
            {weekRange}
          </p>
        </div>

        <div
          className="flex gap-4 text-sm mb-8 p-4 rounded-lg"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div>
            <span
              style={{
                fontFamily: "var(--font-fraunces)",
                fontWeight: 600,
                fontSize: "1.5rem",
                color: "var(--water-deep)",
              }}
            >
              {entries.length}
            </span>
            <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
              Einträge
            </p>
          </div>
          <div
            className="w-px self-stretch"
            style={{ background: "var(--border)" }}
          />
          <div>
            <span
              style={{
                fontFamily: "var(--font-fraunces)",
                fontWeight: 600,
                fontSize: "1.5rem",
                color: "var(--brick)",
              }}
            >
              {electionCount}
            </span>
            <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
              wahlrelevant
            </p>
          </div>
          {topTag && (
            <>
              <div
                className="w-px self-stretch"
                style={{ background: "var(--border)" }}
              />
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-fraunces)",
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: "var(--forest)",
                  }}
                >
                  {TAG_LABELS[topTag]}
                </span>
                <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
                  Top-Thema
                </p>
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}
