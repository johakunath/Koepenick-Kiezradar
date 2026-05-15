"use client";

import { DISTRICTS, type District } from "@/lib/shared/koepenick-geo";

interface DistrictFilterProps {
  activeDistricts: District[];
  onToggle: (district: District) => void;
  onReset: () => void;
}

export default function DistrictFilter({ activeDistricts, onToggle, onReset }: DistrictFilterProps) {
  return (
    <div className="px-5 pb-2">
      <div className="max-w-2xl mx-auto">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
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
          {activeDistricts.length > 0 && (
            <button
              onClick={onReset}
              className="text-xs px-2.5 py-1 rounded-full whitespace-nowrap"
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
