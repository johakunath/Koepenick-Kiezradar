"use client";

import { useState, useMemo } from "react";
import type { Tag } from "@/lib/types";
import entriesData from "@/data/entries.json";
import Header from "@/components/Header";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import TagFilter from "@/components/TagFilter";
import EntryCard from "@/components/EntryCard";
import Footer from "@/components/Footer";

const entries = entriesData as import("@/lib/types").Entry[];

export default function FeedPage() {
  const [activeTags, setActiveTags] = useState<Tag[]>([]);

  const toggleTag = (tag: Tag) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filtered = useMemo(() => {
    if (activeTags.length === 0) return entries;
    return entries.filter((e) => e.tags.some((t) => activeTags.includes(t)));
  }, [activeTags]);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header count={entries.length} />

      <div className="mb-4">
        <DisclaimerBanner />
      </div>

      <TagFilter activeTags={activeTags} onToggle={toggleTag} onReset={() => setActiveTags([])} />

      <main className="px-5">
        <div className="max-w-2xl mx-auto space-y-4">
          {sorted.length === 0 ? (
            <div
              className="text-center py-12 text-sm"
              style={{ color: "var(--ink-soft)" }}
            >
              Keine Einträge mit diesen Tags.
            </div>
          ) : (
            sorted.map((entry) => <EntryCard key={entry.id} entry={entry} />)
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
