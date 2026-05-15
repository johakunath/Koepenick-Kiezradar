"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Tag } from "@/lib/types";
import type { District } from "@/lib/shared/koepenick-geo";
import {
  getDisplayEntries,
  getDistricts,
  getLatestUpdate,
  getTopics,
  searchEntries,
} from "@/lib/data";
import Header from "@/components/Header";
import WahlWatch from "@/components/WahlWatch";
import TagFilter from "@/components/TagFilter";
import DistrictFilter from "@/components/DistrictFilter";
import EntryCard from "@/components/EntryCard";
import Footer from "@/components/Footer";

const entries = getDisplayEntries();
const topics = getTopics();
const districts = getDistricts();
const latestUpdate = getLatestUpdate();

export default function FeedPage() {
  const [activeTags, setActiveTags] = useState<Tag[]>([]);
  const [activeDistricts, setActiveDistricts] = useState<District[]>([]);
  const [query, setQuery] = useState("");

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
    const filterBase = entries.filter((e) => {
      const tagMatch =
        activeTags.length === 0 ||
        e.tags.some((t) => activeTags.includes(t)) ||
        (activeTags.includes("wahl") && e.election_relevant);
      const districtMatch =
        activeDistricts.length === 0 ||
        (e.district != null && activeDistricts.includes(e.district as District));
      return tagMatch && districtMatch;
    });

    return searchEntries(filterBase, query);
  }, [activeTags, activeDistricts, query]);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  const politikEntries = sorted.filter(
    (e) => e.election_relevant || (e.political_relevance_score ?? 0) >= 0.6
  );
  const feedEntries = sorted.filter(
    (e) => !e.election_relevant && (e.political_relevance_score ?? 0) < 0.6
  );

  const noFilters = activeTags.length === 0 && activeDistricts.length === 0 && query.trim() === "";

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
          <section
            className="grid gap-3 lg:grid-cols-[1.4fr_1fr] p-4"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
            }}
          >
            <div>
              <label
                htmlFor="feed-search"
                className="text-xs font-medium uppercase"
                style={{ color: "var(--water-deep)", letterSpacing: "0.08em" }}
              >
                Suche
              </label>
              <input
                id="feed-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Titel, Ort, Quelle oder Thema"
                className="mt-2 w-full rounded-md px-3 py-2 text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.45)",
                  border: "1px solid var(--border)",
                  color: "var(--ink)",
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link href="/themen" className="rounded-md px-3 py-2" style={{ border: "1px solid var(--border)", color: "var(--water-deep)" }}>
                {topics.length} Themen
              </Link>
              <Link href="/orte" className="rounded-md px-3 py-2" style={{ border: "1px solid var(--border)", color: "var(--water-deep)" }}>
                {districts.length} Orte
              </Link>
              <Link href="/termine" className="rounded-md px-3 py-2" style={{ border: "1px solid var(--border)", color: "var(--water-deep)" }}>
                Termine
              </Link>
              <Link href="/quellen" className="rounded-md px-3 py-2" style={{ border: "1px solid var(--border)", color: "var(--water-deep)" }}>
                Quellen
              </Link>
            </div>
          </section>

          {latestUpdate && (
            <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
              Letzter Datenlauf:{" "}
              {new Date(latestUpdate).toLocaleString("de-DE", {
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}

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
