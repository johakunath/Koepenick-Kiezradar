"use client";

import { useState, useRef, useEffect } from "react";
import type { Entry, Tag } from "@/lib/types";
import { TAG_LABELS, ALL_TAGS } from "@/lib/types";

interface FilterBarProps {
  /** Entries after district + search filters but before tag filter — used for computing counts */
  baseEntries: Entry[];
  activeTags: Tag[];
  onToggleTag: (tag: Tag) => void;
  onResetTags: () => void;
  activeDistricts: string[];
  onToggleDistrict: (slug: string) => void;
  query: string;
  onQuery: (q: string) => void;
}

const TAG_COLORS: Record<Tag, { color: string; bg: string }> = {
  verkehr:       { color: "var(--water-2)",  bg: "rgba(42,106,138,0.10)"  },
  sicherheit:    { color: "var(--brick)",    bg: "rgba(184,92,58,0.10)"   },
  verwaltung:    { color: "var(--reed)",     bg: "rgba(62,104,69,0.10)"   },
  politik:       { color: "var(--water)",    bg: "rgba(20,61,86,0.10)"    },
  infrastruktur: { color: "var(--water-2)",  bg: "rgba(42,106,138,0.08)"  },
  veranstaltung: { color: "var(--reed)",     bg: "rgba(62,104,69,0.10)"   },
  wahl:          { color: "var(--brick)",    bg: "rgba(184,92,58,0.12)"   },
  sonstiges:     { color: "var(--ink-mute)", bg: "rgba(138,135,117,0.08)" },
};

export { TAG_COLORS };

export default function FilterBar({
  baseEntries,
  activeTags,
  onToggleTag,
  onResetTags,
  activeDistricts,
  onToggleDistrict,
  query,
  onQuery,
}: FilterBarProps) {
  const [districtOpen, setDistrictOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const tagCounts = new Map<Tag, number>(
    ALL_TAGS.map((tag) => [tag, baseEntries.filter((e) => e.tags.includes(tag)).length])
  );

  const districts = Array.from(
    new Map(
      baseEntries
        .filter((e) => e.district_slug)
        .map((e) => [e.district_slug!, e.district ?? e.location ?? e.district_slug!])
    ).entries()
  ).sort(([, a], [, b]) => a.localeCompare(b, "de-DE"));

  useEffect(() => {
    if (!districtOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDistrictOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [districtOpen]);

  const chipBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 10px",
    borderRadius: 20,
    border: "1px solid var(--border)",
    background: "transparent",
    fontFamily: "var(--font-inter-tight)",
    fontSize: 12.5,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.1s",
    color: "var(--ink-soft)",
    fontWeight: 400,
  };

  const alleActive = activeTags.length === 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        padding: "10px 0",
        borderTop: "1px solid var(--rule)",
        borderBottom: "1px solid var(--rule)",
        marginBottom: 24,
      }}
    >
      {/* KATEGORIE label */}
      <span
        style={{
          fontFamily: "var(--font-inter-tight)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--ink-mute)",
          whiteSpace: "nowrap",
          marginRight: 2,
        }}
      >
        Kategorie:
      </span>

      {/* Alle chip */}
      <button
        style={{
          ...chipBase,
          background: alleActive ? "var(--water)" : "transparent",
          borderColor: alleActive ? "var(--water)" : "var(--border)",
          color: alleActive ? "#fff" : "var(--ink-soft)",
          fontWeight: alleActive ? 600 : 400,
        }}
        onClick={onResetTags}
      >
        Alle <span style={{ opacity: 0.75, fontSize: 11 }}>{baseEntries.length}</span>
      </button>

      {/* Per-tag chips */}
      {ALL_TAGS.filter((t) => t !== "sonstiges").map((tag) => {
        const active = activeTags.includes(tag);
        const count = tagCounts.get(tag) ?? 0;
        const colors = TAG_COLORS[tag];
        return (
          <button
            key={tag}
            style={{
              ...chipBase,
              background: active ? colors.bg : "transparent",
              borderColor: active ? colors.color : "var(--border)",
              color: active ? colors.color : "var(--ink-soft)",
              fontWeight: active ? 600 : 400,
            }}
            onClick={() => onToggleTag(tag)}
          >
            {TAG_LABELS[tag]} <span style={{ opacity: 0.65, fontSize: 11 }}>{count}</span>
          </button>
        );
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* BEZIRK dropdown */}
      {districts.length > 0 && (
        <div ref={dropRef} style={{ position: "relative" }}>
          <button
            onClick={() => setDistrictOpen((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              border: `1px solid ${activeDistricts.length > 0 ? "var(--water-2)" : "var(--border)"}`,
              borderRadius: 6,
              background: "var(--bg)",
              color: activeDistricts.length > 0 ? "var(--water-2)" : "var(--ink-soft)",
              fontFamily: "var(--font-inter-tight)",
              fontSize: 12.5,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "border-color 0.1s",
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-mute)",
              }}
            >
              Bezirk:
            </span>{" "}
            {activeDistricts.length > 0 ? `${activeDistricts.length} ausgewählt` : "Alle"} ▾
          </button>

          {districtOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "6px 0",
                minWidth: 210,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                zIndex: 100,
                maxHeight: 280,
                overflowY: "auto",
              }}
            >
              {districts.map(([slug, label]) => {
                const checked = activeDistricts.includes(slug);
                return (
                  <label
                    key={slug}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "6px 14px",
                      cursor: "pointer",
                      color: "var(--ink-soft)",
                      fontFamily: "var(--font-inter-tight)",
                      fontSize: 13,
                      background: checked ? "var(--water-pale)" : "transparent",
                      transition: "background 0.1s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleDistrict(slug)}
                      style={{ accentColor: "var(--water-2)", width: 14, height: 14 }}
                    />
                    {label}
                  </label>
                );
              })}
              {activeDistricts.length > 0 && (
                <button
                  onClick={() => {
                    activeDistricts.forEach((d) => onToggleDistrict(d));
                    setDistrictOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "6px 14px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    borderTop: "1px solid var(--rule)",
                    marginTop: 4,
                    color: "var(--brick)",
                    fontFamily: "var(--font-inter-tight)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Auswahl zurücksetzen
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <input
        type="search"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Suchen…"
        style={{
          padding: "4px 10px",
          border: "1px solid var(--border)",
          borderRadius: 6,
          background: "var(--bg)",
          color: "var(--ink)",
          fontFamily: "var(--font-inter-tight)",
          fontSize: 13,
          outline: "none",
          width: 140,
          transition: "border-color 0.1s",
        }}
        onFocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--water-2)")}
        onBlur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")}
      />
    </div>
  );
}
