"use client";

import type { Tag } from "@/lib/types";
import { TAG_LABELS, ALL_TAGS } from "@/lib/types";

interface TagFilterProps {
  activeTags: Tag[];
  onToggle: (tag: Tag) => void;
  onReset: () => void;
}

export default function TagFilter({ activeTags, onToggle, onReset }: TagFilterProps) {
  return (
    <div
      className="px-5 py-2 sticky top-0 z-10"
      style={{ background: "var(--bg)" }}
    >
      <div className="max-w-2xl lg:max-w-4xl mx-auto flex items-center gap-2">
        <div
          className="flex gap-2 overflow-x-auto pb-1 flex-1 min-w-0"
          style={{ scrollbarWidth: "none" }}
        >
          {ALL_TAGS.map((tag) => {
            const active = activeTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => onToggle(tag)}
                className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all duration-100"
                style={
                  active
                    ? {
                        background: "var(--water-deep)",
                        border: "1px solid var(--water-deep)",
                        color: "var(--bg)",
                      }
                    : {
                        background: "transparent",
                        border: "1px solid var(--border)",
                        color: "var(--ink-soft)",
                      }
                }
              >
                {TAG_LABELS[tag]}
              </button>
            );
          })}
        </div>
        {activeTags.length > 0 && (
          <button
            onClick={onReset}
            className="text-xs px-2 py-1 rounded shrink-0 transition-opacity"
            style={{ color: "var(--ink-soft)", opacity: 0.7 }}
          >
            ✕ zurücksetzen
          </button>
        )}
      </div>
    </div>
  );
}
