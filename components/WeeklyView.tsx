"use client";

import Link from "next/link";
import type { Entry, Tag } from "@/lib/types";
import { TAG_LABELS } from "@/lib/types";
import { slugify } from "@/lib/slug";
import IllusBanner from "@/components/IllusBanner";
import Header from "@/components/Header";

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
  weekNumber: number;
  digest?: Digest | null;
}

interface DayGroup {
  dateKey: string;
  dayNumber: string;
  dayName: string;
  entries: Entry[];
}

function getTimelineDate(entry: Entry): Date {
  return new Date(entry.event_start_at ?? entry.published_at);
}

function groupByDay(entries: Entry[]): DayGroup[] {
  const groups = new Map<string, Entry[]>();
  for (const entry of entries) {
    const key = getTimelineDate(entry).toISOString().slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, dayEntries]) => {
      const d = new Date(key + "T12:00:00");
      return {
        dateKey: key,
        dayNumber: d.toLocaleDateString("de-DE", { day: "numeric" }),
        dayName: d.toLocaleDateString("de-DE", { weekday: "short" }),
        entries: [...dayEntries].sort(
          (a, b) => getTimelineDate(a).getTime() - getTimelineDate(b).getTime(),
        ),
      };
    });
}

function LogbookEntry({ entry }: { entry: Entry }) {
  const primaryTag = entry.tags[0];
  const href = `/eintrag/${entry.slug ?? slugify(entry.title)}`;

  return (
    <div className="relative mb-5 last:mb-0">
      <div
        style={{
          position: "absolute",
          left: -25,
          top: 6,
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "var(--water-2)",
          border: "2px solid var(--bg)",
        }}
      />
      {primaryTag && (
        <span
          style={{
            fontFamily: "var(--font-inter-tight)",
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontWeight: 700,
            color: "var(--water)",
            marginBottom: 4,
            display: "inline-block",
          }}
        >
          {TAG_LABELS[primaryTag]}
        </span>
      )}
      <Link
        href={href}
        style={{
          display: "block",
          fontFamily: "var(--font-fraunces)",
          fontWeight: 500,
          fontSize: "0.97rem",
          color: "var(--ink)",
          lineHeight: 1.35,
          textDecoration: "none",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.color = "var(--water)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.color = "var(--ink)")
        }
      >
        {entry.title}
      </Link>
      <div
        className="flex gap-2 mt-1 flex-wrap"
        style={{
          color: "var(--ink-mute)",
          fontSize: 11,
          fontFamily: "var(--font-inter-tight)",
        }}
      >
        <span>{entry.location}</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <a
          href={entry.source_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--water-2)", textDecoration: "none" }}
        >
          {entry.source}
        </a>
      </div>
    </div>
  );
}

function Logbook({ entries }: { entries: Entry[] }) {
  const days = groupByDay(entries);
  if (days.length === 0) return null;
  return (
    <div className="space-y-8">
      {days.map(({ dateKey, dayNumber, dayName, entries: dayEntries }) => (
        <div
          key={dateKey}
          style={{
            display: "grid",
            gridTemplateColumns: "44px 1fr",
            gap: "0 20px",
          }}
        >
          <div style={{ textAlign: "right", paddingTop: 2, lineHeight: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-fraunces)",
                fontWeight: 600,
                fontSize: "1.15rem",
                color: "var(--water)",
              }}
            >
              {dayNumber}
            </div>
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--ink-mute)",
                marginTop: 3,
                fontFamily: "var(--font-inter-tight)",
              }}
            >
              {dayName}
            </div>
          </div>
          <div style={{ borderLeft: "2px solid var(--rule)", paddingLeft: 20 }}>
            {dayEntries.map((entry) => (
              <LogbookEntry key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WeeklyView({
  entries,
  weekRange,
  weekNumber,
  digest,
}: WeeklyViewProps) {
  const entryById = new Map(entries.map((e) => [e.id, e]));
  const electionCount = entries.filter((e) => e.election_relevant).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header />

      <div className="relative mx-auto max-w-[1280px] px-5 md:px-20 pt-4">
        {/* Hero */}
        <section className="relative pb-4 pt-6">
          <h1
            style={{
              fontFamily: "var(--font-fraunces)",
              fontWeight: 500,
              color: "var(--ink)",
              fontSize: "clamp(22px, 2.5vw, 30px)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Blick in die Woche
          </h1>
          <p
            style={{
              fontFamily: "var(--font-inter-tight)",
              color: "var(--ink-soft)",
              fontSize: 14,
              marginTop: 6,
              lineHeight: 1.55,
            }}
          >
            Was diese Woche in Köpenick ansteht oder neu gemeldet wurde —
            automatisch zusammengefasst.
          </p>
          <p
            style={{
              fontFamily: "var(--font-inter-tight)",
              color: "var(--ink-mute)",
              fontSize: 12,
              marginTop: 6,
            }}
          >
            {weekRange} · KW {weekNumber} · {entries.length} Meldungen
            {electionCount > 0 ? ` · ${electionCount} mit Wahlbezug` : ""}
          </p>
        </section>

        {/* AI digest topics */}
        {digest && digest.topics.length > 0 && (
          <div className="mt-8 mb-10 space-y-6">
            <h2
              style={{
                fontFamily: "var(--font-inter-tight)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--ink-mute)",
              }}
            >
              KI-Wochenblick
            </h2>
            {digest.topics.map((topic) => {
              const topicEntries = topic.entry_ids
                .map((id) => entryById.get(id))
                .filter((e): e is Entry => e != null);
              return (
                <div key={topic.name}>
                  <h3
                    style={{
                      fontFamily: "var(--font-fraunces)",
                      fontWeight: 600,
                      fontSize: "1.05rem",
                      color: "var(--water)",
                      marginBottom: 6,
                    }}
                  >
                    {topic.name}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-inter-tight)",
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: "var(--ink-soft)",
                      marginBottom: 10,
                    }}
                  >
                    {topic.summary}
                  </p>
                  {topicEntries.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {topicEntries.map((e) => (
                        <Link
                          key={e.id}
                          href={`/eintrag/${e.slug ?? slugify(e.title)}`}
                          style={{
                            fontFamily: "var(--font-inter-tight)",
                            fontSize: 11,
                            padding: "3px 8px",
                            borderRadius: 3,
                            border: "1px solid var(--rule)",
                            color: "var(--water-2)",
                            textDecoration: "none",
                          }}
                        >
                          {e.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <p
              style={{
                fontFamily: "var(--font-inter-tight)",
                fontSize: 11,
                color: "var(--ink-mute)",
                opacity: 0.7,
              }}
            >
              KI-generiert · Stand:{" "}
              {new Date(digest.generated_at).toLocaleDateString("de-DE")}
            </p>
          </div>
        )}

        {/* Logbook */}
        <div className="pb-16">
          <h2
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--ink-mute)",
              marginBottom: 24,
            }}
          >
            Diese Woche
          </h2>

          {entries.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-inter-tight)",
                fontSize: 14,
                color: "var(--ink-soft)",
                padding: "20px 0",
              }}
            >
              Für die laufende Woche gibt es noch keine passenden Einträge. Neue
              Meldungen und Termine erscheinen hier nach dem nächsten Import.
            </p>
          ) : (
            <Logbook entries={entries} />
          )}
        </div>
      </div>

      {/* Footer */}
      <footer
        className="relative mt-4"
        style={{
          borderTop: "1px solid var(--rule)",
          position: "relative",
          zIndex: 6,
        }}
      >
        <IllusBanner />
        <div className="mx-auto max-w-[1280px] px-5 md:px-20 py-6 text-center">
          <p
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontSize: 12,
              color: "var(--ink-mute)",
              lineHeight: 1.6,
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            Blick in die Woche — automatisch zusammengefasst, redaktionell nicht
            geprüft. Kein offizielles Angebot.
          </p>
        </div>
      </footer>
    </div>
  );
}
