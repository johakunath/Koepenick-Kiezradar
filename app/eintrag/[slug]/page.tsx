import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, CalendarDays, FileText, MapPin } from "lucide-react";
import Header from "@/components/Header";
import { getDisplayEntries, getDistrictBySlug, getEntryBySlug, getTopicBySlug } from "@/lib/data";
import { TAG_LABELS, type Tag } from "@/lib/types";

const TAG_ACCENT: Record<Tag, string> = {
  sicherheit: "#b85c3a",
  verkehr: "#2d6080",
  wahl: "#7a5c1e",
  veranstaltung: "#3a5c2a",
  verwaltung: "#143d56",
  politik: "#143d56",
  infrastruktur: "#5c4a1e",
  sonstiges: "#7a7060",
};

const TAG_BG: Record<Tag, string> = {
  sicherheit: "#fdf0eb",
  verkehr: "#eaf3f8",
  wahl: "#fdf5e6",
  veranstaltung: "#ecf4ea",
  verwaltung: "#e8f0f4",
  politik: "#e8f0f4",
  infrastruktur: "#f4ede8",
  sonstiges: "#f4f1ec",
};

export function generateStaticParams() {
  return getDisplayEntries().map((entry) => ({ slug: entry.slug! }));
}

export default async function EntryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getEntryBySlug(slug);
  if (!entry) notFound();

  const district = entry.district_slug ? getDistrictBySlug(entry.district_slug) : undefined;
  const topics = entry.topic_slugs?.map((topicSlug) => getTopicBySlug(topicSlug)).filter(Boolean) ?? [];

  const primaryTag = entry.tags[0] ?? "sonstiges";
  const accentColor = TAG_ACCENT[primaryTag] ?? "#7a7060";

  const related = getDisplayEntries()
    .filter((e) => {
      if (e.id === entry.id) return false;
      const sharedTopic =
        entry.topic_slugs && e.topic_slugs
          ? entry.topic_slugs.some((t) => e.topic_slugs!.includes(t))
          : false;
      const sharedDistrict = entry.district_slug && e.district_slug === entry.district_slug;
      return sharedTopic || sharedDistrict;
    })
    .slice(0, 3);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header />
      <div className="max-w-[1280px] mx-auto px-5 md:px-20 py-8">
        <article
          className="mt-6 p-6"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderLeft: `4px solid ${accentColor}`,
            borderRadius: 12,
          }}
        >
          {/* Tag chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  background: TAG_BG[tag] ?? "#f4f1ec",
                  color: TAG_ACCENT[tag] ?? "#7a7060",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                {TAG_LABELS[tag]}
              </span>
            ))}
          </div>

          <h1
            className="text-3xl leading-tight mb-4"
            style={{ fontFamily: "var(--font-fraunces)", color: "var(--ink)" }}
          >
            {entry.title}
          </h1>

          <p className="text-base leading-relaxed mb-6" style={{ color: "var(--ink-soft)" }}>
            {entry.ai_summary}
          </p>

          {/* AI reasoning callout */}
          {entry.ai_reasoning && (
            <div
              className="mb-6 px-4 py-3 rounded-lg"
              style={{ background: "#e8f0f4", borderLeft: `3px solid ${accentColor}` }}
            >
              <p
                className="text-xs uppercase mb-1"
                style={{ color: accentColor, letterSpacing: "0.06em", fontWeight: 600 }}
              >
                Kiez-Einschätzung
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink)" }}>
                {entry.ai_reasoning}
              </p>
            </div>
          )}

          <dl className="grid gap-3 sm:grid-cols-2 text-sm mb-6">
            <div>
              <dt className="text-xs uppercase" style={{ color: "var(--ink-soft)", letterSpacing: "0.06em" }}>
                Quelle
              </dt>
              <dd>{entry.source}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase" style={{ color: "var(--ink-soft)", letterSpacing: "0.06em" }}>
                Veröffentlicht
              </dt>
              <dd>{new Date(entry.published_at).toLocaleString("de-DE")}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase" style={{ color: "var(--ink-soft)", letterSpacing: "0.06em" }}>
                Ort
              </dt>
              <dd className="flex items-center gap-1">
                <MapPin size={14} />
                {entry.location}
              </dd>
            </div>
            {entry.event_start_at && (
              <div>
                <dt className="text-xs uppercase" style={{ color: "var(--ink-soft)", letterSpacing: "0.06em" }}>
                  Termin
                </dt>
                <dd className="flex items-center gap-1">
                  <CalendarDays size={14} />
                  {new Date(entry.event_start_at).toLocaleString("de-DE")}
                </dd>
              </div>
            )}
          </dl>

          {entry.raw_excerpt && (
            <section className="mb-6">
              <h2 className="text-sm font-medium mb-2" style={{ color: "var(--water-deep)" }}>
                Auszug aus der Quelle
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                {entry.raw_excerpt}
              </p>
            </section>
          )}

          {/* PDF excerpt block */}
          {entry.pdf_excerpt && (
            <section
              className="mb-6 p-4 rounded-lg"
              style={{ background: "#faf4e8", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} style={{ color: "var(--water-deep)" }} />
                <h2 className="text-sm font-medium" style={{ color: "var(--water-deep)" }}>
                  Originaldokument{entry.pdf_page ? ` · Seite ${entry.pdf_page}` : ""}
                </h2>
              </div>
              <p className="text-sm leading-relaxed italic mb-2" style={{ color: "var(--ink-soft)" }}>
                „{entry.pdf_excerpt}"
              </p>
              {entry.document_url && (
                <a
                  href={`${entry.document_url}${entry.pdf_page ? `#page=${entry.pdf_page}` : ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium"
                  style={{ color: "var(--water-mid)" }}
                >
                  Dokument öffnen ↗
                </a>
              )}
            </section>
          )}

          {/* District + topic links */}
          <div className="flex flex-wrap gap-2 mb-6">
            {district && (
              <Link
                href={`/orte#${district.slug}`}
                className="text-xs px-2 py-1 rounded"
                style={{ border: "1px solid var(--border)", color: "var(--forest)" }}
              >
                {district.label}
              </Link>
            )}
            {topics.map(
              (topic) =>
                topic && (
                  <Link
                    key={topic.slug}
                    href={`/thema/${topic.slug}`}
                    className="text-xs px-2 py-1 rounded"
                    style={{ border: "1px solid var(--border)", color: "var(--water-deep)" }}
                  >
                    {topic.label}
                  </Link>
                )
            )}
          </div>

          <a
            href={entry.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium"
            style={{ color: "var(--water-mid)" }}
          >
            Originalquelle öffnen <ArrowUpRight size={14} />
          </a>
        </article>

        {/* Related entries */}
        {related.length > 0 && (
          <section className="mt-8">
            <h2
              className="text-sm uppercase mb-3"
              style={{ color: "var(--ink-soft)", letterSpacing: "0.06em" }}
            >
              Ähnliche Einträge
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {related.map((rel) => {
                const relAccent = TAG_ACCENT[rel.tags[0] ?? "sonstiges"] ?? "#7a7060";
                return (
                  <Link
                    key={rel.id}
                    href={`/eintrag/${rel.slug}`}
                    className="block p-4 rounded-xl"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderLeft: `3px solid ${relAccent}`,
                    }}
                  >
                    <div className="flex flex-wrap gap-1 mb-2">
                      {rel.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs"
                          style={{ color: TAG_ACCENT[tag] ?? "#7a7060", fontWeight: 600 }}
                        >
                          {TAG_LABELS[tag]}
                        </span>
                      ))}
                    </div>
                    <p
                      className="text-sm leading-snug mb-1 line-clamp-2"
                      style={{ fontFamily: "var(--font-fraunces)", color: "var(--ink)" }}
                    >
                      {rel.title}
                    </p>
                    <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
                      {new Date(rel.published_at).toLocaleDateString("de-DE", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
