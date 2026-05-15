import Link from "next/link";
import type { Entry, Tag } from "@/lib/types";
import { TAG_LABELS } from "@/lib/types";
import EntryCard from "./EntryCard";

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

interface WeeklyViewProps {
  entries: Entry[];
  weekRange: string;
  digest?: Digest | null;
}

function getWeekStats(entries: Entry[]) {
  const electionCount = entries.filter((e) => e.election_relevant).length;
  const eventCount = entries.filter((e) => e.tags.includes("veranstaltung")).length;

  const tagCounts = entries
    .flatMap((e) => e.tags)
    .reduce<Record<string, number>>((acc, t) => {
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});

  const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as
    | Tag
    | undefined;

  const topEntries = [...entries]
    .sort((a, b) => b.local_relevance_score - a.local_relevance_score)
    .slice(0, 5);

  return { electionCount, eventCount, topEntries, topTag };
}

export default function WeeklyView({ entries, weekRange, digest }: WeeklyViewProps) {
  const { electionCount, eventCount, topEntries, topTag } = getWeekStats(entries);
  const entryById = new Map(entries.map((e) => [e.id, e]));

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl lg:max-w-4xl mx-auto px-5 py-8">
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
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-6 p-4 rounded-lg"
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
          <div>
            <span
              style={{
                fontFamily: "var(--font-fraunces)",
                fontWeight: 600,
                fontSize: "1.5rem",
                color: "var(--forest)",
              }}
            >
              {eventCount}
            </span>
            <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
              Veranstaltungen
            </p>
          </div>
          {topTag && (
            <div>
              <span
                style={{
                  fontFamily: "var(--font-fraunces)",
                  fontWeight: 600,
                  fontSize: "1rem",
                  color: "var(--water-deep)",
                }}
              >
                {TAG_LABELS[topTag]}
              </span>
              <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
                Top-Thema
              </p>
            </div>
          )}
        </div>

        {digest && digest.topics.length > 0 ? (
          <div className="space-y-6 mb-8">
            {digest.topics.map((topic) => {
              const topicEntries = topic.entry_ids
                .map((id) => entryById.get(id))
                .filter((e): e is Entry => e != null);
              return (
                <section key={topic.name}>
                  <h2
                    className="text-lg mb-2"
                    style={{
                      fontFamily: "var(--font-fraunces)",
                      fontWeight: 600,
                      color: "var(--water-deep)",
                    }}
                  >
                    {topic.name}
                  </h2>
                  <p
                    className="text-sm leading-relaxed mb-3"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    {topic.summary}
                  </p>
                  {topicEntries.length > 0 && (
                    <div className="space-y-3">
                      {topicEntries.map((entry) => (
                        <EntryCard key={entry.id} entry={entry} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
            <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
              KI-generierter Wochenrückblick · Stand:{" "}
              {new Date(digest.generated_at).toLocaleDateString("de-DE")}
            </p>
          </div>
        ) : (
          <section
            className="mb-8 rounded-lg p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <h2
              className="text-xl mb-2"
              style={{
                fontFamily: "var(--font-fraunces)",
                fontWeight: 600,
                color: "var(--water-deep)",
              }}
            >
              Wochenfazit
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              Der KI-Wochenrückblick wird jeden Sonntag automatisch generiert. Bis dahin sind
              hier die relevantesten Einträge der Woche nach lokaler Relevanz sortiert.
            </p>
          </section>
        )}

        {!digest && (
          <div className="space-y-4">
            {topEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
