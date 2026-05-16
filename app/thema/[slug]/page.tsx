import { notFound } from "next/navigation";
import Header from "@/components/Header";
import EntryCard from "@/components/EntryCard";
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
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header />
      <div className="max-w-[1280px] mx-auto px-5 md:px-20 py-8">
        <h1 style={{ fontFamily: "var(--font-fraunces)", fontWeight: 500, fontSize: "clamp(22px, 2.5vw, 30px)", color: "var(--ink)", margin: "0 0 8px" }}>
          {topic.label}
        </h1>
        <p style={{ fontFamily: "var(--font-inter-tight)", fontSize: 14, color: "var(--ink-soft)", marginBottom: 24 }}>
          {topic.description}
        </p>
        <div className="space-y-3">
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
    </div>
  );
}
