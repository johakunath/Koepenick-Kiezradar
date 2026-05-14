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
      className="px-5 py-3 sticky top-0 z-10"
      style={{ background: "var(--bg)" }}
    >
      <div className="max-w-2xl mx-auto">
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {ALL_TAGS.map((tag) => {
            const active = activeTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => onToggle(tag)}
                className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all duration-100"
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
          {activeTags.length > 0 && (
            <button
              onClick={onReset}
              className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap"
              style={{ color: "var(--ink-soft)" }}
            >
              zurücksetzen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
