"use client";

import type { Tag } from "@/lib/types";
import { TAG_LABELS, ALL_TAGS } from "@/lib/types";
import { DISTRICTS, type District } from "@/lib/shared/koepenick-geo";

interface FilterBarProps {
  activeTags: Tag[];
  activeDistricts: District[];
  query: string;
  onToggleTag: (tag: Tag) => void;
  onToggleDistrict: (district: District) => void;
  onQueryChange: (q: string) => void;
  onReset: () => void;
}

export default function FilterBar({
  activeTags,
  activeDistricts,
  query,
  onToggleTag,
  onToggleDistrict,
  onQueryChange,
  onReset,
}: FilterBarProps) {
  const hasActive = activeTags.length > 0 || activeDistricts.length > 0 || query.trim().length > 0;

  return (
    <div
      className="px-5 py-2 sticky top-0 z-10"
      style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
    >
      <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-1">

        {/* Tags row */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 overflow-x-auto flex-1 min-w-0" style={{ scrollbarWidth: "none" }}>
            {ALL_TAGS.map((tag) => {
              const active = activeTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => onToggleTag(tag)}
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
          {hasActive && (
            <button
              onClick={onReset}
              className="text-xs px-2 py-1 rounded shrink-0 transition-opacity"
              style={{ color: "var(--ink-soft)", opacity: 0.7 }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Districts + search row */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 overflow-x-auto flex-1 min-w-0" style={{ scrollbarWidth: "none" }}>
            {DISTRICTS.map((district) => {
              const active = activeDistricts.includes(district);
              return (
                <button
                  key={district}
                  onClick={() => onToggleDistrict(district)}
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
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Suche…"
            className="text-xs px-2.5 py-1 rounded-md outline-none shrink-0 w-28"
            style={{
              background: "rgba(255,255,255,0.5)",
              border: "1px solid var(--border)",
              color: "var(--ink)",
            }}
          />
        </div>

      </div>
    </div>
  );
}
