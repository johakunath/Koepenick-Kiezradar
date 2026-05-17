"use client";

import { useMemo, useState } from "react";
import type { Tag } from "@/lib/types";
import { getDisplayEntries, searchEntries } from "@/lib/data";
import Header from "@/components/Header";
import EntryCard from "@/components/EntryCard";
import FilterBar from "@/components/FilterBar";
import IllusBanner from "@/components/IllusBanner";

const allEntries = getDisplayEntries();

export default function FeedPage() {
  const [activeTags, setActiveTags] = useState<Tag[]>([]);
  const [activeDistricts, setActiveDistricts] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const weekNo = Math.ceil(
    (Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 604_800_000
  );

  // District + search filter (no tag filter) — used for FilterBar counts
  const baseFiltered = useMemo(() => {
    let base = allEntries;
    if (activeDistricts.length > 0) {
      base = base.filter((e) => e.district_slug && activeDistricts.includes(e.district_slug));
    }
    return searchEntries(base, query);
  }, [activeDistricts, query]);

  // Final display entries: base + tag filter
  const filtered = useMemo(() => {
    if (activeTags.length === 0) return baseFiltered;
    return baseFiltered.filter(
      (e) =>
        e.tags.some((t) => activeTags.includes(t)) ||
        (activeTags.includes("wahl") && e.election_relevant)
    );
  }, [baseFiltered, activeTags]);

  function toggleTag(tag: Tag) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function toggleDistrict(slug: string) {
    setActiveDistricts((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  const left = filtered.filter((_, i) => i % 2 === 0);
  const right = filtered.filter((_, i) => i % 2 === 1);

  return (
    <div className="relative min-h-screen" style={{ background: "var(--bg)" }}>
      <Header />

      <div className="relative mx-auto max-w-[1280px] px-5 md:px-20">
        {/* Hero strip */}
        <section className="relative pb-6 pt-6">
          <div>
            <h1
              style={{
                fontFamily: "var(--font-fraunces)",
                fontWeight: 500,
                color: "var(--ink)",
                fontSize: "clamp(22px, 2.5vw, 30px)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Meldungen
            </h1>
            <p
              style={{
                fontFamily: "var(--font-inter-tight)",
                color: "var(--ink-mute)",
                fontSize: 13,
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              {filtered.length} Einträge aus Köpenick · KW {weekNo} · nach Datum sortiert
            </p>
          </div>
        </section>

        {/* Filter bar */}
        <FilterBar
          baseEntries={baseFiltered}
          activeTags={activeTags}
          onToggleTag={toggleTag}
          onResetTags={() => setActiveTags([])}
          activeDistricts={activeDistricts}
          onToggleDistrict={toggleDistrict}
          query={query}
          onQuery={setQuery}
        />

        {/* Card grid */}
        {filtered.length === 0 ? (
          <div
            className="py-16 text-center"
            style={{
              color: "var(--ink-mute)",
              fontSize: 14,
              fontFamily: "var(--font-inter-tight)",
            }}
          >
            Keine Einträge mit diesen Filtern.
          </div>
        ) : (
          <>
            {/* Mobile: single column */}
            <div className="md:hidden pb-12 space-y-3">
              {filtered.map((e) => (
                <EntryCard key={e.id} entry={e} />
              ))}
            </div>
            {/* Desktop: 2-column grid */}
            <div className="hidden md:grid md:grid-cols-2 md:gap-x-6 pb-16">
              <div className="space-y-3">
                {left.map((e) => (
                  <EntryCard key={e.id} entry={e} />
                ))}
              </div>
              <div className="space-y-3">
                {right.map((e) => (
                  <EntryCard key={e.id} entry={e} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="relative mt-8" style={{ borderTop: "1px solid var(--rule)", position: "relative", zIndex: 6 }}>
        <IllusBanner />
        <div className="mx-auto max-w-[1280px] px-5 md:px-20 py-6 text-center">
          <p
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontSize: 12,
              color: "var(--ink-mute)",
              lineHeight: 1.6,
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            Köpenick Kiezradar — privates Lern- und Experimentierprojekt zweier Nachbarn.
            Keine offizielle Quelle. KI-Texte können irren, die verlinkten Originale bleiben maßgeblich.
          </p>
        </div>
      </footer>
    </div>
  );
}
