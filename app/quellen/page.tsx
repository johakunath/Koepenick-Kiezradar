import Link from "next/link";
import { getSources } from "@/lib/data";

export default function SourcesPage() {
  const sources = getSources();

  return (
    <main className="min-h-screen px-5 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl lg:max-w-4xl mx-auto">
        <Link href="/" className="text-xs font-medium" style={{ color: "var(--water-mid)" }}>
          ← Zum Feed
        </Link>
        <h1 className="text-3xl mt-4 mb-6" style={{ fontFamily: "var(--font-fraunces)", color: "var(--water-deep)" }}>
          Quellen
        </h1>
        <div className="space-y-3">
          {sources.map((source) => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10 }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg" style={{ fontFamily: "var(--font-fraunces)", color: "var(--ink)" }}>
                  {source.name}
                </h2>
                <span
                  className="text-xs uppercase"
                  style={{
                    color: source.status === "active" ? "var(--forest)" : "var(--ink-soft)",
                    letterSpacing: "0.06em",
                  }}
                >
                  {source.status}
                </span>
              </div>
              <p className="text-sm mt-2" style={{ color: "var(--ink-soft)" }}>
                {source.notes}
              </p>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
