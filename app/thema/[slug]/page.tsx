import Link from "next/link";
import { notFound } from "next/navigation";
import EntryCard from "@/components/EntryCard";
import RadarNav from "@/components/RadarNav";
import { getEntriesForTopic, getTopicBySlug, getTopics } from "@/lib/data";

export function generateStaticParams() {
  return getTopics().map((topic) => ({ slug: topic.slug }));
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();
  const entries = getEntriesForTopic(slug);

  return (
    <main className="min-h-screen px-5 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl lg:max-w-4xl mx-auto">
        <RadarNav />
        <Link href="/themen" className="text-xs font-medium" style={{ color: "var(--water-mid)" }}>
          ← Alle Themen
        </Link>
        <h1 className="text-3xl mt-4" style={{ fontFamily: "var(--font-fraunces)", color: "var(--water-deep)" }}>
          {topic.label}
        </h1>
        <p className="text-sm mt-2 mb-6" style={{ color: "var(--ink-soft)" }}>
          {topic.description}
        </p>
        <div className="space-y-4">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
          {entries.length === 0 && (
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
              Noch keine Einträge in diesem Thema.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
