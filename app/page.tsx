"use client";

import { useMemo, useState } from "react";
import type { Tag } from "@/lib/types";
import { getDisplayEntries, searchEntries } from "@/lib/data";
import Header from "@/components/Header";
import EntryCard, { EntryHero } from "@/components/EntryCard";
import IllusMark from "@/components/IllusMark";
import IllusBanner from "@/components/IllusBanner";

const entries = getDisplayEntries();

export default function FeedPage() {
  const [activeTags, setActiveTags] = useState<Tag[]>([]);

  const filtered = useMemo(() => {
    const base = activeTags.length
      ? entries.filter(
          (e) =>
            e.tags.some((t) => activeTags.includes(t)) ||
            (activeTags.includes("wahl") && e.election_relevant)
        )
      : entries;
    return [...searchEntries(base, "")].sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
  }, [activeTags]);

  function toggleTag(tag: Tag) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  const [hero, ...rest] = filtered;
  const left = rest.filter((_, i) => i % 2 === 0);
  const right = rest.filter((_, i) => i % 2 === 1);

  return (
    <div className="relative min-h-screen" style={{ background: "var(--bg)" }}>
      <Header
        activeTags={activeTags}
        onToggle={toggleTag}
        onReset={() => setActiveTags([])}
      />

      <div className="relative mx-auto max-w-[1280px] px-5 md:px-20">
        {/* Watermark illustrations — desktop only */}
        <IllusMark
          src="/illustrations/illus-heron.png"
          width={340}
          className="top-[80px] right-[40px] hidden md:block"
          opacity={0.34}
        />
        <IllusMark
          src="/illustrations/illus-reeds.png"
          width={220}
          className="top-[520px] left-[20px] hidden md:block"
          opacity={0.32}
        />
        <IllusMark
          src="/illustrations/illus-carp.png"
          width={210}
          className="top-[920px] right-[40px] hidden md:block"
          opacity={0.34}
        />
        <IllusMark
          src="/illustrations/illus-oak.png"
          width={170}
          className="top-[1320px] left-[40px] hidden md:block"
          opacity={0.32}
        />
        <IllusMark
          src="/illustrations/illus-reeds.png"
          width={170}
          className="top-[1620px] right-[40px] hidden md:block"
          opacity={0.30}
        />

        {filtered.length === 0 ? (
          <div
            className="py-16 text-center"
            style={{ color: "var(--ink-mute)", fontSize: 14 }}
          >
            Keine Einträge mit diesen Filtern.
          </div>
        ) : (
          <>
            {/* Hero — first entry, full width */}
            <section className="relative pt-8 md:pt-10" style={{ zIndex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-inter-tight)",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "var(--brick)",
                  }}
                >
                  Aufmacher
                </span>
                <div
                  style={{ flex: 1, height: 1, background: "var(--rule)", opacity: 0.6 }}
                />
              </div>
              {hero && <EntryHero entry={hero} />}
            </section>

            {/* Body grid */}
            <section className="relative pb-12 md:pb-16" style={{ zIndex: 1 }}>
              {/* Mobile: single column */}
              <div className="md:hidden">
                {rest.map((e) => (
                  <EntryCard key={e.id} entry={e} />
                ))}
              </div>
              {/* Desktop: 2-column grid */}
              <div className="hidden md:grid md:grid-cols-2 md:gap-x-14">
                <div>{left.map((e) => <EntryCard key={e.id} entry={e} />)}</div>
                <div>{right.map((e) => <EntryCard key={e.id} entry={e} />)}</div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="relative mt-8" style={{ borderTop: "1px solid var(--rule)" }}>
        <IllusBanner opacity={0.45} />
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
