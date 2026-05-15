"use client";

import { useState } from "react";
import { ArrowUpRight, CalendarDays, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import type { Entry, Tag } from "@/lib/types";
import { TAG_LABELS } from "@/lib/types";

function timeAgo(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const hours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
  if (hours < 1) return "gerade eben";
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} Tag${days > 1 ? "en" : ""}`;
}

function formatEventDate(iso?: string): string | null {
  if (!iso) return null;

  return new Date(iso).toLocaleString("de-DE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface EntryCardProps {
  entry: Entry;
}

export default function EntryCard({ entry }: EntryCardProps) {
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const eventDate = formatEventDate(entry.event_start_at);
  const reasoning =
    entry.ai_reasoning && entry.ai_reasoning.trim().length > 0
      ? entry.ai_reasoning
      : `Aus Quelle ${entry.source}. Originallink prüfen für vollständigen Kontext.`;

  return (
    <article
      className="relative p-5 transition-all duration-150 hover:-translate-y-px"
      style={{
        borderRadius: 12,
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--water-mid)";
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 4px 16px -8px rgba(31, 78, 107, 0.2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {entry.is_mock && (
        <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-100 text-amber-700">
          Demo
        </span>
      )}

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {entry.tags.map((t: Tag, i: number) => (
          <span key={t}>
            {i > 0 && (
              <span className="mr-2" style={{ color: "var(--ink-soft)" }}>
                ·
              </span>
            )}
            <span
              style={{
                color: "var(--water-deep)",
                fontSize: "10.5px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {TAG_LABELS[t]}
            </span>
          </span>
        ))}
        {entry.election_relevant && (
          <span className="ml-auto shrink-0">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--brick)",
                background: "rgba(156,74,46,0.08)",
                border: "1px solid rgba(156,74,46,0.25)",
                borderRadius: 4,
                padding: "2px 6px",
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 999,
                  background: "var(--brick)",
                  display: "inline-block",
                }}
              />
              Wahl 2026
            </span>
          </span>
        )}
      </div>

      <h2
        className="text-xl leading-snug mb-2"
        style={{
          fontFamily: "var(--font-fraunces)",
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: "var(--ink)",
        }}
      >
        {entry.title}
      </h2>

      <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--ink-soft)" }}>
        {entry.ai_summary}
      </p>

      {eventDate && (
        <div
          className="flex flex-wrap items-center gap-3 text-xs mb-4 px-3 py-2 rounded"
          style={{
            background: "rgba(74, 107, 58, 0.08)",
            border: "1px solid rgba(74, 107, 58, 0.18)",
            color: "var(--forest)",
          }}
        >
          <span className="flex items-center gap-1">
            <CalendarDays size={12} />
            {eventDate}
          </span>
          {entry.venue && <span>{entry.venue}</span>}
        </div>
      )}

      {entry.pdf_excerpt && entry.document_type === "pdf" && (
        <div
          className="text-xs mb-4 px-3 py-2 rounded leading-relaxed"
          style={{
            background: "rgba(31, 78, 107, 0.06)",
            border: "1px solid rgba(31, 78, 107, 0.14)",
            color: "var(--ink-soft)",
            fontStyle: "italic",
          }}
        >
          <span style={{ color: "var(--water-deep)", fontStyle: "normal", fontWeight: 500 }}>
            Auszug S. {entry.pdf_page}:{" "}
          </span>
          {entry.pdf_excerpt}
        </div>
      )}

      <div className="mb-3">
        <div
          className="flex items-center justify-between text-xs mb-1"
          style={{ color: "var(--ink-soft)" }}
        >
          <span>Lokale Relevanz</span>
          <span style={{ fontFamily: "var(--font-fraunces)", fontWeight: 500 }}>
            {Math.round(entry.local_relevance_score * 100)} %
          </span>
        </div>
        <div
          style={{
            height: "3px",
            background: "var(--border)",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${entry.local_relevance_score * 100}%`,
              background: "linear-gradient(90deg, var(--water-mid), var(--water-deep))",
            }}
          />
        </div>
      </div>

      <div
        className="flex items-center justify-between gap-3 pt-3"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--ink-soft)" }}>
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {entry.location}
          </span>
          <span>{timeAgo(entry.published_at)}</span>
        </div>
        <a
          href={entry.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-medium transition-colors"
          style={{ color: "var(--water-mid)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "var(--water-deep)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "var(--water-mid)")
          }
        >
          {entry.source}
          <ArrowUpRight size={12} />
        </a>
      </div>

      <button
        onClick={() => setReasoningOpen((v) => !v)}
        className="flex items-center gap-1 text-xs mt-3 transition-opacity opacity-60 hover:opacity-100"
        style={{ color: "var(--ink-soft)" }}
      >
        {reasoningOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        Warum relevant?
      </button>
      {reasoningOpen && (
        <p
          className="text-xs mt-1 leading-relaxed"
          style={{ color: "var(--ink-soft)", fontStyle: "italic" }}
        >
          {reasoning}
        </p>
      )}
    </article>
  );
}
