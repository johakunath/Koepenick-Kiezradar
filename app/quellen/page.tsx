import Header from "@/components/Header";
import { getSources } from "@/lib/data";

export default function SourcesPage() {
  const sources = getSources();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header />
      <div className="max-w-[1280px] mx-auto px-5 md:px-20 py-8">
        <h1 style={{ fontFamily: "var(--font-fraunces)", fontWeight: 500, fontSize: "clamp(22px, 2.5vw, 30px)", color: "var(--ink)", marginBottom: 24 }}>
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
              style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, textDecoration: "none" }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg" style={{ fontFamily: "var(--font-fraunces)", color: "var(--ink)" }}>
                  {source.name}
                </h2>
                <span
                  className="text-xs uppercase"
                  style={{
                    color: source.status === "active" ? "var(--reed)" : "var(--ink-soft)",
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
    </div>
  );
}
