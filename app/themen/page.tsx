import Link from "next/link";
import { getEntriesForTopic, getTopics } from "@/lib/data";

export default function TopicsPage() {
  const topics = getTopics();

  return (
    <main className="min-h-screen px-5 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl lg:max-w-4xl mx-auto">
        <Link href="/" className="text-xs font-medium" style={{ color: "var(--water-mid)" }}>
          ← Zum Feed
        </Link>
        <h1 className="text-3xl mt-4 mb-6" style={{ fontFamily: "var(--font-fraunces)", color: "var(--water-deep)" }}>
          Themen
        </h1>
        <div className="grid gap-3 sm:grid-cols-2">
          {topics.map((topic) => {
            const count = getEntriesForTopic(topic.slug).length;
            return (
              <Link
                key={topic.slug}
                href={`/thema/${topic.slug}`}
                className="block p-4"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10 }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg" style={{ fontFamily: "var(--font-fraunces)", color: "var(--ink)" }}>
                    {topic.label}
                  </h2>
                  <span className="text-xs" style={{ color: "var(--ink-soft)" }}>
                    {count}
                  </span>
                </div>
                <p className="text-sm mt-2" style={{ color: "var(--ink-soft)" }}>
                  {topic.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
