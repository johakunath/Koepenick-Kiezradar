"use client";

import { useState, useMemo } from "react";
import type { Tag } from "@/lib/types";
import type { District } from "@/lib/shared/koepenick-geo";
import entriesData from "@/data/entries.json";
import Header from "@/components/Header";
import WahlWatch from "@/components/WahlWatch";
import TagFilter from "@/components/TagFilter";
import DistrictFilter from "@/components/DistrictFilter";
import EntryCard from "@/components/EntryCard";
import Footer from "@/components/Footer";

const allEntries = entriesData as import("@/lib/types").Entry[];
const hasRealData = allEntries.some((e) => !e.is_mock);
const entries = hasRealData ? allEntries.filter((e) => !e.is_mock) : allEntries;

export default function FeedPage() {
  const [activeTags, setActiveTags] = useState<Tag[]>([]);
  const [activeDistricts, setActiveDistricts] = useState<District[]>([]);

  const toggleTag = (tag: Tag) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleDistrict = (district: District) => {
    setActiveDistricts((prev) =>
      prev.includes(district) ? prev.filter((d) => d !== district) : [...prev, district]
    );
  };

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const tagMatch =
        activeTags.length === 0 ||
        e.tags.some((t) => activeTags.includes(t)) ||
        (activeTags.includes("wahl") && e.election_relevant);
      const districtMatch =
        activeDistricts.length === 0 ||
        (e.district != null && activeDistricts.includes(e.district as District));
      return tagMatch && districtMatch;
    });
  }, [activeTags, activeDistricts]);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  const politikEntries = sorted.filter(
    (e) => e.election_relevant || (e.political_relevance_score ?? 0) >= 0.6
  );
  const feedEntries = sorted.filter(
    (e) => !e.election_relevant && (e.political_relevance_score ?? 0) < 0.6
  );

  const noFilters = activeTags.length === 0 && activeDistricts.length === 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header count={entries.length} />

      <WahlWatch electionCount={entries.filter((e) => e.election_relevant).length} />

      <TagFilter activeTags={activeTags} onToggle={toggleTag} onReset={() => setActiveTags([])} />
      <DistrictFilter
        activeDistricts={activeDistricts}
        onToggle={toggleDistrict}
        onReset={() => setActiveDistricts([])}
      />

      <main className="px-5 pt-2">
        <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-5">
          {sorted.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: "var(--ink-soft)" }}>
              Keine Einträge mit diesen Filtern.
            </div>
          ) : (
            <>
              {noFilters && politikEntries.length > 0 && (
                <section className="space-y-3">
                  <h2
                    className="text-xs font-medium uppercase tracking-widest pt-1"
                    style={{ color: "var(--water-deep)", letterSpacing: "0.08em" }}
                  >
                    Politik &amp; Wahl 2026
                  </h2>
                  {politikEntries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} />
                  ))}
                  {feedEntries.length > 0 && (
                    <h2
                      className="text-xs font-medium uppercase tracking-widest pt-3"
                      style={{ color: "var(--ink-soft)", letterSpacing: "0.08em" }}
                    >
                      Aktuell im Kiez
                    </h2>
                  )}
                </section>
              )}
              {(noFilters ? feedEntries : sorted).map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
