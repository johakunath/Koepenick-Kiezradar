import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import RadarNav from "@/components/RadarNav";
import { getDisplayEntries, getDistrictBySlug, getEntryBySlug, getTopicBySlug } from "@/lib/data";
import { TAG_LABELS } from "@/lib/types";

export function generateStaticParams() {
  return getDisplayEntries().map((entry) => ({ slug: entry.slug! }));
}

export default async function EntryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getEntryBySlug(slug);
  if (!entry) notFound();

  const district = entry.district_slug ? getDistrictBySlug(entry.district_slug) : undefined;
  const topics = entry.topic_slugs?.map((topicSlug) => getTopicBySlug(topicSlug)).filter(Boolean) ?? [];

  return (
    <main className="min-h-screen px-5 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl lg:max-w-4xl mx-auto">
        <RadarNav />
        <Link href="/" className="text-xs font-medium" style={{ color: "var(--water-mid)" }}>
          ← Zum Feed
        </Link>

        <article
          className="mt-6 p-6"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12 }}
        >
          <div className="flex flex-wrap gap-2 mb-4">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs uppercase"
                style={{ color: "var(--water-deep)", letterSpacing: "0.06em" }}
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

          {entry.ai_reasoning && (
            <section className="mb-6">
              <h2 className="text-sm font-medium mb-2" style={{ color: "var(--water-deep)" }}>
                Warum relevant?
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                {entry.ai_reasoning}
              </p>
            </section>
          )}

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
      </div>
    </main>
  );
}
