import Link from "next/link";
import EntryCard from "@/components/EntryCard";
import RadarNav from "@/components/RadarNav";
import { getDistricts, getEntriesForDistrict } from "@/lib/data";

export default function DistrictsPage() {
  const districts = getDistricts();

  return (
    <main className="min-h-screen px-5 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl lg:max-w-4xl mx-auto">
        <RadarNav />
        <Link href="/" className="text-xs font-medium" style={{ color: "var(--water-mid)" }}>
          ← Zum Feed
        </Link>
        <h1 className="text-3xl mt-4 mb-6" style={{ fontFamily: "var(--font-fraunces)", color: "var(--water-deep)" }}>
          Orte
        </h1>
        <div className="space-y-8">
          {districts.map((district) => {
            const entries = getEntriesForDistrict(district.slug).slice(0, 3);
            return (
              <section key={district.slug} id={district.slug}>
                <div className="mb-3">
                  <h2 className="text-xl" style={{ fontFamily: "var(--font-fraunces)", color: "var(--ink)" }}>
                    {district.label}
                  </h2>
                  <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
                    {district.description}
                  </p>
                </div>
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} />
                  ))}
                  {entries.length === 0 && (
                    <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
                      Noch keine Einträge für diesen Ort.
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
