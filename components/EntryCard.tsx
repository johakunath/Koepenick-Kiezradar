"use client";

import Link from "next/link";
import type { Entry, Tag } from "@/lib/types";
import { TAG_LABELS } from "@/lib/types";
import { slugify } from "@/lib/slug";
import Pegel from "@/components/Pegel";

function timeAgo(iso: string): string {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "gerade eben";
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} Tag${days > 1 ? "en" : ""}`;
}

function TagsRow({ tags, accentFirst = false }: { tags: Tag[]; accentFirst?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      {tags.map((t, i) => (
        <span key={t} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {i > 0 && <span style={{ color: "var(--rule)", fontSize: 11 }}>·</span>}
          <span
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: accentFirst && i === 0 ? "var(--brick)" : "var(--water)",
            }}
          >
            {TAG_LABELS[t]}
          </span>
        </span>
      ))}
    </div>
  );
}

function MetaRow({ entry, size = "sm" }: { entry: Entry; size?: "sm" | "lg" }) {
  const fs = size === "lg" ? 12.5 : 11.5;
  const detailHref = `/eintrag/${entry.slug ?? slugify(entry.title)}`;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 14,
        fontFamily: "var(--font-inter-tight)",
        fontSize: fs,
        color: "var(--ink-mute)",
        letterSpacing: "0.01em",
      }}
    >
      <span style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
        <span style={{ color: "var(--ink-soft)", whiteSpace: "nowrap" }}>{entry.location}</span>
        <span style={{ color: "var(--rule)" }}>·</span>
        <span style={{ whiteSpace: "nowrap" }}>{timeAgo(entry.published_at)}</span>
        <span style={{ color: "var(--rule)" }}>·</span>
        <a
          href={entry.source_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--ink-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: "none" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--water)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--ink-soft)")}
        >
          {entry.source}
        </a>
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
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

// ── Standard card (grid, mobile list) ────────────────────────────────────────

interface EntryCardProps {
  entry: Entry;
  variant?: "default" | "lg";
}

export default function EntryCard({ entry, variant = "default" }: EntryCardProps) {
  const isLg = variant === "lg";
  const detailHref = `/eintrag/${entry.slug ?? slugify(entry.title)}`;

  return (
    <article
      className="entry-card"
      style={{
        borderTop: "1px solid var(--rule)",
        paddingTop: isLg ? 22 : 18,
        paddingBottom: isLg ? 26 : 22,
        position: "relative",
      }}
    >
      {entry.is_mock && (
        <span
          style={{
            position: "absolute", top: isLg ? 22 : 18, right: 0,
            fontSize: 9, padding: "1px 5px", borderRadius: 3,
            background: "rgba(180,120,40,0.1)", color: "var(--brick)",
            fontFamily: "var(--font-inter-tight)", letterSpacing: "0.06em", textTransform: "uppercase",
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
            fontSize: isLg ? 28 : 22,
            lineHeight: isLg ? 1.12 : 1.18,
            letterSpacing: "-0.014em",
            margin: isLg ? "12px 0 12px" : "10px 0 10px",
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
          fontSize: isLg ? 15.5 : 14,
          lineHeight: 1.55,
          margin: isLg ? "0 0 18px" : "0 0 14px",
          maxWidth: isLg ? 620 : 540,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {entry.ai_summary}
      </p>

      <MetaRow entry={entry} size={isLg ? "lg" : "sm"} />
    </article>
  );
}

// ── Hero / lead card (first entry on feed, large Fraunces) ────────────────────

export function EntryHero({ entry }: { entry: Entry }) {
  const detailHref = `/eintrag/${entry.slug ?? slugify(entry.title)}`;

  return (
    <article style={{ paddingTop: 8, paddingBottom: 32 }}>
      <TagsRow tags={entry.tags} accentFirst />

      <Link href={detailHref} style={{ textDecoration: "none" }}>
        <h2
          style={{
            fontFamily: "var(--font-fraunces)",
            fontWeight: 500,
            color: "var(--ink)",
            fontSize: "clamp(34px, 5vw, 56px)",
            lineHeight: 1.02,
            letterSpacing: "-0.025em",
            margin: "16px 0 18px",
            maxWidth: 920,
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
          fontSize: "clamp(15px, 2vw, 18px)",
          lineHeight: 1.55,
          margin: "0 0 22px",
          maxWidth: 720,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {entry.ai_summary}
      </p>

      <MetaRow entry={entry} size="lg" />
    </article>
  );
}
