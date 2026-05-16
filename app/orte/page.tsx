import Header from "@/components/Header";
import EntryCard from "@/components/EntryCard";
import { getDistricts, getEntriesForDistrict } from "@/lib/data";

export default function DistrictsPage() {
  const districts = getDistricts();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header />
      <div className="max-w-[1280px] mx-auto px-5 md:px-20 py-8">
        <h1 style={{ fontFamily: "var(--font-fraunces)", fontWeight: 500, fontSize: "clamp(22px, 2.5vw, 30px)", color: "var(--ink)", marginBottom: 24 }}>
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
    </div>
  );
}
