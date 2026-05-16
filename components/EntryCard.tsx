"use client";

import Link from "next/link";
import type { Entry, Tag } from "@/lib/types";
import { TAG_LABELS } from "@/lib/types";
import { slugify } from "@/lib/slug";
import Pegel from "@/components/Pegel";
import { TAG_COLORS } from "@/components/FilterBar";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}

function TagsRow({ tags }: { tags: Tag[] }) {
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
      {tags.map((t) => {
        const colors = TAG_COLORS[t];
        return (
          <span
            key={t}
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontSize: 9.5,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: colors.color,
              background: colors.bg,
              padding: "2px 6px",
              borderRadius: 3,
            }}
          >
            {TAG_LABELS[t]}
          </span>
        );
      })}
    </div>
  );
}

function MetaRow({ entry }: { entry: Entry }) {
  const detailHref = `/eintrag/${entry.slug ?? slugify(entry.title)}`;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 14,
        fontFamily: "var(--font-inter-tight)",
        fontSize: 11.5,
        color: "var(--ink-mute)",
      }}
    >
      <span
        style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0, flexWrap: "wrap" }}
      >
        <span style={{ color: "var(--ink-soft)", whiteSpace: "nowrap" }}>{entry.location}</span>
        <span style={{ color: "var(--rule)" }}>·</span>
        <span style={{ whiteSpace: "nowrap" }}>{formatDate(entry.published_at)}</span>
        <span style={{ color: "var(--rule)" }}>·</span>
        <a
          href={entry.source_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--ink-soft)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--water-2)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--ink-soft)")}
        >
          {entry.source}
        </a>
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <Pegel score={entry.local_relevance_score} />
        <Link
          href={detailHref}
          style={{ color: "var(--ink-mute)", textDecoration: "none", fontSize: 11 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--water)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--ink-mute)")}
          aria-label={`Details: ${entry.title}`}
        >
          →
        </Link>
      </div>
    </div>
  );
}

export default function EntryCard({ entry }: { entry: Entry }) {
  const detailHref = `/eintrag/${entry.slug ?? slugify(entry.title)}`;

  return (
    <article className="entry-card" style={{ paddingTop: 16, paddingBottom: 18, position: "relative" }}>
      {entry.is_mock && (
        <span
          style={{
            position: "absolute",
            top: 16,
            right: 10,
            fontSize: 9,
            padding: "1px 5px",
            borderRadius: 3,
            background: "rgba(180,120,40,0.1)",
            color: "var(--brick)",
            fontFamily: "var(--font-inter-tight)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Demo
        </span>
      )}

      <TagsRow tags={entry.tags} />

      <Link href={detailHref} style={{ textDecoration: "none" }}>
        <h3
          style={{
            fontFamily: "var(--font-fraunces)",
            fontWeight: 500,
            color: "var(--ink)",
            fontSize: 20,
            lineHeight: 1.2,
            letterSpacing: "-0.014em",
            margin: "8px 0 8px",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--water)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--ink)")}
        >
          {entry.title}
        </h3>
      </Link>

      <p
        style={{
          fontFamily: "var(--font-inter-tight)",
          color: "var(--ink-soft)",
          fontSize: 13.5,
          lineHeight: 1.55,
          margin: "0 0 12px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {entry.ai_summary}
      </p>

      <MetaRow entry={entry} />
    </article>
  );
}

// ── Hero variant (used by WeeklyView featured story if needed) ────────────────

export function EntryHero({ entry }: { entry: Entry }) {
  const detailHref = `/eintrag/${entry.slug ?? slugify(entry.title)}`;

  return (
    <article style={{ paddingTop: 8, paddingBottom: 32 }}>
      <TagsRow tags={entry.tags} />

      <Link href={detailHref} style={{ textDecoration: "none" }}>
        <h2
          style={{
            fontFamily: "var(--font-fraunces)",
            fontWeight: 500,
            color: "var(--ink)",
            fontSize: "clamp(28px, 4vw, 44px)",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            margin: "12px 0 14px",
            maxWidth: 800,
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--water)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--ink)")}
        >
          {entry.title}
        </h2>
      </Link>

      <p
        style={{
          fontFamily: "var(--font-inter-tight)",
          color: "var(--ink-soft)",
          fontSize: "clamp(14px, 1.8vw, 16px)",
          lineHeight: 1.55,
          margin: "0 0 18px",
          maxWidth: 640,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {entry.ai_summary}
      </p>

      <MetaRow entry={entry} />
    </article>
  );
}
