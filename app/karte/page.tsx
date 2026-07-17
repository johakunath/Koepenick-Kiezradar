"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useMemo } from "react";
import type { Tag } from "@/lib/types";
import { TAG_LABELS, ALL_TAGS } from "@/lib/types";
import { DISTRICTS, type District } from "@/lib/shared/koepenick-geo";
import { getDisplayEntries } from "@/lib/data";
import { getMappableEntries } from "@/lib/shared/map-coordinates";
import Header from "@/components/Header";

const KiezMap = dynamic(() => import("@/components/KiezMap"), { ssr: false });

const entries = getDisplayEntries();
const mappable = getMappableEntries(entries);

export default function KartePage() {
  const [activeTags, setActiveTags] = useState<Tag[]>([]);
  const [activeDistricts, setActiveDistricts] = useState<District[]>([]);

  const toggleTag = (tag: Tag) =>
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  const toggleDistrict = (d: District) =>
    setActiveDistricts((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );

  const filtered = useMemo(
    () =>
      mappable.filter((e) => {
        const tagOk =
          activeTags.length === 0 || e.tags.some((t) => activeTags.includes(t));
        const districtOk =
          activeDistricts.length === 0 ||
          (e.district != null &&
            activeDistricts.includes(e.district as District));
        return tagOk && districtOk;
      }),
    [activeTags, activeDistricts],
  );

  const hasFilters = activeTags.length > 0 || activeDistricts.length > 0;

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg)" }}>
      <Header />

      {/* Filter rows — aligned to content max-width */}
      <div
        className="shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-[1280px] mx-auto px-5 md:px-20 py-2 flex items-center gap-3 flex-wrap">
          <span
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-mute)",
              whiteSpace: "nowrap",
            }}
          >
            {filtered.length} von {mappable.length} kartiert
          </span>
          <div
            className="flex gap-1.5 overflow-x-auto flex-1"
            style={{ scrollbarWidth: "none" }}
          >
            {ALL_TAGS.filter((t) => t !== "sonstiges").map((tag) => {
              const active = activeTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="shrink-0"
                  style={{
                    padding: "2px 9px",
                    borderRadius: 20,
                    fontSize: 12,
                    border: `1px solid ${active ? "var(--water-2)" : "var(--border)"}`,
                    background: active ? "var(--water-2)" : "transparent",
                    color: active ? "#fff" : "var(--ink-soft)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {TAG_LABELS[tag]}
                </button>
              );
            })}
          </div>
          <div
            className="flex gap-1.5 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {DISTRICTS.map((district) => {
              const active = activeDistricts.includes(district);
              return (
                <button
                  key={district}
                  onClick={() => toggleDistrict(district)}
                  className="shrink-0"
                  style={{
                    fontSize: 11,
                    padding: "2px 7px",
                    borderRadius: 20,
                    border: `1px solid ${active ? "var(--reed)" : "var(--border)"}`,
                    background: active ? "var(--reed)" : "transparent",
                    color: active ? "#fff" : "var(--ink-soft)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {district}
                </button>
              );
            })}
          </div>
          {hasFilters && (
            <button
              onClick={() => {
                setActiveTags([]);
                setActiveDistricts([]);
              }}
              style={{
                fontSize: 12,
                color: "var(--ink-mute)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Map — fills remaining height */}
      <div className="flex-1 min-h-0 p-3">
        {filtered.length === 0 ? (
          <div
            className="h-full flex flex-col items-center justify-center gap-3 rounded-xl"
            style={{
              border: "1px dashed var(--border)",
              color: "var(--ink-soft)",
            }}
          >
            <p className="text-sm">
              {mappable.length === 0
                ? "Noch keine Einträge mit Koordinaten — wird beim nächsten Ingest befüllt."
                : "Keine Einträge mit diesen Filtern auf der Karte."}
            </p>
            {mappable.length === 0 && (
              <Link
                href="/admin"
                className="text-xs"
                style={{ color: "var(--water-2)" }}
              >
                Ingest starten →
              </Link>
            )}
          </div>
        ) : (
          <KiezMap entries={filtered} />
        )}
      </div>
    </div>
  );
}
