"use client";

import Link from "next/link";
import type { Entry, Tag } from "@/lib/types";
import { TAG_LABELS } from "@/lib/types";
import { slugify } from "@/lib/slug";

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

interface DayGroup {
  dateKey: string;
  dayNumber: string;
  dayName: string;
  entries: Entry[];
}

function groupByDay(entries: Entry[]): DayGroup[] {
  const groups = new Map<string, Entry[]>();
  for (const entry of entries) {
    const key = new Date(entry.published_at).toISOString().slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, dayEntries]) => {
      const d = new Date(key + "T12:00:00");
      return {
        dateKey: key,
        dayNumber: d.toLocaleDateString("de-DE", { day: "numeric" }),
        dayName: d.toLocaleDateString("de-DE", { weekday: "short" }),
        entries: dayEntries,
      };
    });
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
  const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as Tag | undefined;
  return { electionCount, eventCount, topTag };
}

function LogbookEntry({ entry }: { entry: Entry }) {
  const primaryTag = entry.tags[0];
  const href = `/eintrag/${entry.slug ?? slugify(entry.title)}`;

  return (
    <div className="relative mb-5 last:mb-0">
      {/* Timeline dot */}
      <div
        style={{
          position: "absolute",
          left: -25,
          top: 6,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "var(--water-mid)",
          border: "2px solid var(--bg)",
          flexShrink: 0,
        }}
      />

      {primaryTag && (
        <span
          style={{
            display: "inline-block",
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 700,
            color: "var(--water-deep)",
            background: "rgba(20, 61, 86, 0.07)",
            border: "1px solid rgba(20, 61, 86, 0.12)",
            borderRadius: 3,
            padding: "1px 5px",
            marginBottom: 4,
          }}
        >
          {TAG_LABELS[primaryTag]}
        </span>
      )}

      <Link
        href={href}
        className="block hover:underline"
        style={{
          fontFamily: "var(--font-fraunces)",
          fontWeight: 500,
          fontSize: "0.97rem",
          color: "var(--ink)",
          lineHeight: 1.35,
        }}
      >
        {entry.title}
      </Link>

      <div
        className="flex gap-2 mt-1 text-xs flex-wrap"
        style={{ color: "var(--ink-soft)", fontSize: 11 }}
      >
        <span>{entry.location}</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <a
          href={entry.source_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--water-mid)" }}
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
          style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: "0 20px" }}
        >
          {/* Date column */}
          <div style={{ textAlign: "right", paddingTop: 2, lineHeight: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-fraunces)",
                fontWeight: 600,
                fontSize: "1.15rem",
                color: "var(--water-deep)",
              }}
            >
              {dayNumber}
            </div>
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--ink-soft)",
                marginTop: 3,
              }}
            >
              {dayName}
            </div>
          </div>

          {/* Entries with timeline line */}
          <div style={{ borderLeft: "2px solid var(--border)", paddingLeft: 20 }}>
            {dayEntries.map((entry) => (
              <LogbookEntry key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WeeklyView({ entries, weekRange, digest }: WeeklyViewProps) {
  const { electionCount, eventCount, topTag } = getWeekStats(entries);
  const entryById = new Map(entries.map((e) => [e.id, e]));

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl lg:max-w-4xl mx-auto px-5 py-8">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-xs font-medium inline-block mb-4"
            style={{ color: "var(--water-mid)" }}
          >
            ← Zum Feed
          </Link>

          {/* Heron spot illustration */}
          <svg width="72" height="72" viewBox="0 0 80 80" fill="none" aria-hidden="true" style={{ opacity: 0.75, marginBottom: 8, display: "block" }}>
            <g stroke="#143d56" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M34 60 L32 72" />
              <path d="M40 60 L42 72" />
              <path d="M30 50 C30 40, 45 40, 45 50 C45 60, 30 60, 30 50 Z" />
              <path d="M42 48 C48 42, 46 34, 52 28 C56 24, 58 22, 60 20" />
              <path d="M60 20 C62 19, 64 20, 63 22 C61 23, 59 22, 60 20 Z" />
              <path d="M63 21 L70 19" />
              <circle cx="62" cy="21" r="0.8" fill="#143d56" />
              <path d="M32 50 C36 46, 40 46, 44 50" strokeOpacity="0.5" />
              <line x1="20" y1="72" x2="60" y2="72" strokeOpacity="0.2" />
            </g>
          </svg>

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

        {/* Stats strip */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg mb-8"
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
            <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>Einträge</p>
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
            <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>wahlrelevant</p>
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
            <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>Veranstaltungen</p>
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
              <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>Top-Thema</p>
            </div>
          )}
        </div>

        {/* AI digest topics (when available) */}
        {digest && digest.topics.length > 0 && (
          <div className="mb-10 space-y-5">
            <h2
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--ink-soft)", letterSpacing: "0.1em" }}
            >
              KI-Wochenrückblick
            </h2>
            {digest.topics.map((topic) => {
              const topicEntries = topic.entry_ids
                .map((id) => entryById.get(id))
                .filter((e): e is Entry => e != null);
              return (
                <div key={topic.name}>
                  <h3
                    className="text-base mb-1"
                    style={{
                      fontFamily: "var(--font-fraunces)",
                      fontWeight: 600,
                      color: "var(--water-deep)",
                    }}
                  >
                    {topic.name}
                  </h3>
                  <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--ink-soft)" }}>
                    {topic.summary}
                  </p>
                  {topicEntries.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {topicEntries.map((e) => (
                        <Link
                          key={e.id}
                          href={`/eintrag/${e.slug ?? slugify(e.title)}`}
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            border: "1px solid var(--border)",
                            color: "var(--water-mid)",
                            background: "var(--bg-card)",
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
            <p className="text-xs" style={{ color: "var(--ink-soft)", opacity: 0.6 }}>
              KI-generiert · Stand:{" "}
              {new Date(digest.generated_at).toLocaleDateString("de-DE")}
            </p>
          </div>
        )}

        {/* Logbook — always shown */}
        <div>
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-6"
            style={{ color: "var(--ink-soft)", letterSpacing: "0.1em" }}
          >
            Wochenchronik
          </h2>

          {entries.length === 0 ? (
            <div
              className="rounded-lg p-5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
                Der KI-Wochenrückblick wird jeden Sonntag automatisch generiert. Bis dahin sind
                hier die relevantesten Einträge der Woche nach lokaler Relevanz sortiert.
              </p>
            </div>
          ) : (
            <Logbook entries={entries} />
          )}
        </div>
      </div>
    </div>
  );
}
