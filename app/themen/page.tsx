import Header from "@/components/Header";
import Link from "next/link";
import { getEntriesForTopic, getTopics } from "@/lib/data";

export default function TopicsPage() {
  const topics = getTopics();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header />
      <div className="max-w-[1280px] mx-auto px-5 md:px-20 py-8">
        <h1 style={{ fontFamily: "var(--font-fraunces)", fontWeight: 500, fontSize: "clamp(22px, 2.5vw, 30px)", color: "var(--ink)", marginBottom: 24 }}>
          Themen
        </h1>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => {
            const count = getEntriesForTopic(topic.slug).length;
            return (
              <Link
                key={topic.slug}
                href={`/thema/${topic.slug}`}
                className="block p-4"
                style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, textDecoration: "none" }}
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
    </div>
  );
}
