"use client";

import { useMemo, useState } from "react";
import type { Tag } from "@/lib/types";
import type { District } from "@/lib/shared/koepenick-geo";
import { getDisplayEntries, searchEntries } from "@/lib/data";
import Header from "@/components/Header";
import FilterBar from "@/components/FilterBar";
import EntryCard from "@/components/EntryCard";
import Footer from "@/components/Footer";

const entries = getDisplayEntries();
const electionCount = entries.filter((e) => e.election_relevant).length;

export default function FeedPage() {
  const [activeTags, setActiveTags] = useState<Tag[]>([]);
  const [activeDistricts, setActiveDistricts] = useState<District[]>([]);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const base = entries.filter((e) => {
      const tagMatch =
        activeTags.length === 0 ||
        e.tags.some((t) => activeTags.includes(t)) ||
        (activeTags.includes("wahl") && e.election_relevant);
      const districtMatch =
        activeDistricts.length === 0 ||
        (e.district != null && activeDistricts.includes(e.district as District));
      return tagMatch && districtMatch;
    });
    return searchEntries(base, query);
  }, [activeTags, activeDistricts, query]);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  const noFilters = activeTags.length === 0 && activeDistricts.length === 0 && query.trim() === "";

  const politikEntries = sorted.filter(
    (e) => e.election_relevant || (e.political_relevance_score ?? 0) >= 0.6
  );
  const feedEntries = sorted.filter(
    (e) => !e.election_relevant && (e.political_relevance_score ?? 0) < 0.6
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header count={entries.length} electionCount={electionCount} />

      <FilterBar
        activeTags={activeTags}
        activeDistricts={activeDistricts}
        query={query}
        onToggleTag={(tag) =>
          setActiveTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
          )
        }
        onToggleDistrict={(district) =>
          setActiveDistricts((prev) =>
            prev.includes(district) ? prev.filter((d) => d !== district) : [...prev, district]
          )
        }
        onQueryChange={setQuery}
        onReset={() => {
          setActiveTags([]);
          setActiveDistricts([]);
          setQuery("");
        }}
      />

      <main className="px-5 pt-4">
        <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-5">
          {sorted.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: "var(--ink-soft)" }}>
              Keine Einträge mit diesen Filtern.
            </div>
          ) : (
            <>
              {noFilters && politikEntries.length > 0 && (
                <section className="space-y-4">
                  <h2
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "var(--brick)", letterSpacing: "0.1em" }}
                  >
                    Politik &amp; Wahl 2026
                  </h2>
                  {politikEntries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} />
                  ))}
                  {feedEntries.length > 0 && (
                    <h2
                      className="text-xs font-semibold uppercase tracking-widest pt-2"
                      style={{ color: "var(--ink-soft)", letterSpacing: "0.1em" }}
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
