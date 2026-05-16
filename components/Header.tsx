"use client";

import Link from "next/link";
import type { Tag } from "@/lib/types";
import { TAG_LABELS, ALL_TAGS } from "@/lib/types";
import ThemeToggle from "@/components/ThemeToggle";

// Tags shown inline in the header (wahl + sonstiges excluded — too narrow)
const HEADER_TAGS: Tag[] = ["verkehr", "sicherheit", "verwaltung", "politik", "infrastruktur", "veranstaltung"];

interface HeaderProps {
  activeTags: Tag[];
  onToggle: (tag: Tag) => void;
  onReset?: () => void;
}

export default function Header({ activeTags, onToggle, onReset }: HeaderProps) {
  const today = new Date().toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" });
  const hasActive = activeTags.length > 0;

  return (
    <>
      {/* ── Main header row (60px) ───────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 flex items-center px-5 md:px-10"
        style={{
          height: 60,
          background: "var(--bg)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        {/* Wordmark */}
        <Link
          href="/"
          className="shrink-0 flex flex-col justify-center"
          style={{ textDecoration: "none" }}
        >
          <div
            style={{
              fontFamily: "var(--font-fraunces)",
              fontWeight: 600,
              fontSize: 22,
              letterSpacing: "-0.022em",
              lineHeight: 1,
              color: "var(--water)",
            }}
          >
            Kiezradar
          </div>
          <div
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--ink-mute)",
              marginTop: 2,
            }}
          >
            № 020 · Köpenick
          </div>
        </Link>

        {/* Filter chips — desktop only, inline */}
        <nav
          className="hidden lg:flex items-center gap-0 mx-6 flex-1 min-w-0"
          style={{ overflowX: "auto", scrollbarWidth: "none" }}
        >
          {HEADER_TAGS.map((tag) => {
            const active = activeTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => onToggle(tag)}
                aria-pressed={active}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 10px",
                  fontFamily: "var(--font-inter-tight)",
                  fontSize: 13,
                  letterSpacing: "0.01em",
                  color: active ? "var(--ink)" : "var(--ink-soft)",
                  fontWeight: active ? 600 : 400,
                  borderBottom: active ? "1.5px solid var(--water)" : "1.5px solid transparent",
                  whiteSpace: "nowrap",
                  transition: "color 0.1s",
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--ink)"; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--ink-soft)"; }}
              >
                {TAG_LABELS[tag]}
              </button>
            );
          })}
          {hasActive && onReset && (
            <button
              onClick={onReset}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px",
                fontSize: 12,
                color: "var(--ink-mute)",
              }}
              aria-label="Filter zurücksetzen"
            >
              ✕
            </button>
          )}
        </nav>

        {/* Right: date + link + toggle */}
        <div className="ml-auto flex items-center gap-4 shrink-0">
          <span
            className="hidden md:block"
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontSize: 11.5,
              color: "var(--ink-mute)",
            }}
          >
            {today}
          </span>
          <div style={{ width: 1, height: 16, background: "var(--rule)" }} className="hidden md:block" />
          <Link
            href="/woche"
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--water-2)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Diese Woche ↗
          </Link>
          <ThemeToggle />
          <a
            href="/admin"
            className="opacity-0 hover:opacity-20 transition-opacity"
            aria-hidden="true"
            tabIndex={-1}
            style={{ fontSize: 10, color: "var(--ink-mute)" }}
          >
            ·
          </a>
        </div>
      </header>

      {/* ── Mobile filter bar (44px, second sticky row) ──────────────────── */}
      <div
        className="lg:hidden sticky z-10 flex items-center px-5 gap-2"
        style={{
          top: 60,
          height: 44,
          background: "var(--bg)",
          borderBottom: "1px solid var(--rule)",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-inter-tight)",
            fontSize: 9.5,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--ink-mute)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Ressorts
        </span>
        {ALL_TAGS.filter((t) => t !== "sonstiges").map((tag) => {
          const active = activeTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onToggle(tag)}
              aria-pressed={active}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "3px 8px",
                fontFamily: "var(--font-inter-tight)",
                fontSize: 12.5,
                color: active ? "var(--ink)" : "var(--ink-soft)",
                fontWeight: active ? 600 : 400,
                borderBottom: active ? "1.5px solid var(--water)" : "1.5px solid transparent",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {TAG_LABELS[tag]}
            </button>
          );
        })}
        {hasActive && onReset && (
          <button
            onClick={onReset}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--ink-mute)", flexShrink: 0 }}
          >
            ✕
          </button>
        )}
      </div>
    </>
  );
}
