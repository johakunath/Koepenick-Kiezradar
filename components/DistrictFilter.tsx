"use client";

import { DISTRICTS, type District } from "@/lib/shared/koepenick-geo";

interface DistrictFilterProps {
  activeDistricts: District[];
  onToggle: (district: District) => void;
  onReset: () => void;
}

export default function DistrictFilter({ activeDistricts, onToggle, onReset }: DistrictFilterProps) {
  return (
    <div
      className="px-5 py-2"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="max-w-2xl mx-auto flex items-center gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1 min-w-0" style={{ scrollbarWidth: "none" }}>
          {DISTRICTS.map((district) => {
            const active = activeDistricts.includes(district);
            return (
              <button
                key={district}
                onClick={() => onToggle(district)}
                className="px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-all duration-100"
                style={
                  active
                    ? {
                        background: "var(--forest)",
                        border: "1px solid var(--forest)",
                        color: "var(--bg)",
                      }
                    : {
                        background: "transparent",
                        border: "1px solid var(--border)",
                        color: "var(--ink-soft)",
                      }
                }
              >
                {district}
              </button>
            );
          })}
        </div>
        {activeDistricts.length > 0 && (
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
