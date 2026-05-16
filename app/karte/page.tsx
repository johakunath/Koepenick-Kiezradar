"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useMemo } from "react";
import type { Tag } from "@/lib/types";
import { TAG_LABELS, ALL_TAGS } from "@/lib/types";
import { DISTRICTS, type District } from "@/lib/shared/koepenick-geo";
import { getDisplayEntries } from "@/lib/data";

const KiezMap = dynamic(() => import("@/components/KiezMap"), { ssr: false });

const entries = getDisplayEntries();
const mappable = entries.filter((e) => e.lat != null && e.lng != null);

export default function KartePage() {
  const [activeTags, setActiveTags] = useState<Tag[]>([]);
  const [activeDistricts, setActiveDistricts] = useState<District[]>([]);

  const toggleTag = (tag: Tag) =>
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  const toggleDistrict = (d: District) =>
    setActiveDistricts((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const filtered = useMemo(
    () =>
      mappable.filter((e) => {
        const tagOk = activeTags.length === 0 || e.tags.some((t) => activeTags.includes(t));
        const districtOk =
          activeDistricts.length === 0 ||
          (e.district != null && activeDistricts.includes(e.district as District));
        return tagOk && districtOk;
      }),
    [activeTags, activeDistricts]
  );

  const hasFilters = activeTags.length > 0 || activeDistricts.length > 0;

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-baseline gap-3">
          <Link href="/" className="text-xs" style={{ color: "var(--water-mid)" }}>
            ← Feed
          </Link>
          <h1
            className="text-lg"
            style={{ fontFamily: "var(--font-fraunces)", fontWeight: 600, color: "var(--water-deep)" }}
          >
            Karte
          </h1>
          <span className="text-xs" style={{ color: "var(--ink-soft)" }}>
            {filtered.length} von {mappable.length} kartiert
          </span>
        </div>
        {hasFilters && (
          <button
            onClick={() => { setActiveTags([]); setActiveDistricts([]); }}
            className="text-xs px-2 py-1 rounded"
            style={{ color: "var(--ink-soft)", opacity: 0.7 }}
          >
            ✕ zurücksetzen
          </button>
        )}
      </div>

      {/* Tag filter row */}
      <div className="px-5 py-1.5 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {ALL_TAGS.map((tag) => {
            const active = activeTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className="px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all duration-100 shrink-0"
                style={
                  active
                    ? { background: "var(--water-deep)", border: "1px solid var(--water-deep)", color: "var(--bg)" }
                    : { background: "transparent", border: "1px solid var(--border)", color: "var(--ink-soft)" }
                }
              >
                {TAG_LABELS[tag]}
              </button>
            );
          })}
        </div>
      </div>

      {/* District filter row */}
      <div className="px-5 py-1.5 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {DISTRICTS.map((district) => {
            const active = activeDistricts.includes(district);
            return (
              <button
                key={district}
                onClick={() => toggleDistrict(district)}
                className="rounded-full whitespace-nowrap transition-all duration-100 shrink-0"
                style={{
                  fontSize: "10.5px",
                  padding: "2px 8px",
                  ...(active
                    ? { background: "var(--forest)", border: "1px solid var(--forest)", color: "var(--bg)" }
                    : { background: "transparent", border: "1px solid var(--border)", color: "var(--ink-soft)" }),
                }}
              >
                {district}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 p-4 min-h-0">
        {filtered.length === 0 ? (
          <div
            className="h-full flex flex-col items-center justify-center gap-3 rounded-xl"
            style={{ border: "1px dashed var(--border)", color: "var(--ink-soft)" }}
          >
            <p className="text-sm">
              {mappable.length === 0
                ? "Noch keine Einträge mit Koordinaten — wird beim nächsten Ingest befüllt."
                : "Keine Einträge mit diesen Filtern auf der Karte."}
            </p>
            {mappable.length === 0 && (
              <Link href="/admin" className="text-xs" style={{ color: "var(--water-mid)" }}>
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
