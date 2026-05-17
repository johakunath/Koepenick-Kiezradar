import Header from "@/components/Header";
import IllusBanner from "@/components/IllusBanner";
import { getSources } from "@/lib/data";

const STATUS_LABELS: Record<string, string> = {
  active: "Aktiv",
  experimental: "Experimentell",
  error: "Fehlerhaft",
};

function StatusDot({ status }: { status: string }) {
  const color =
    status === "active"
      ? "var(--reed)"
      : status === "error"
      ? "var(--brick)"
      : "var(--ink-mute)";
  return (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: color,
        marginRight: 6,
        flexShrink: 0,
        marginTop: 2,
      }}
    />
  );
}

export default function AboutPage() {
  const sources = getSources();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header />

      <div className="mx-auto max-w-[760px] px-5 md:px-10 py-10 pb-20">
        {/* Page title */}
        <h1
          style={{
            fontFamily: "var(--font-fraunces)",
            fontWeight: 500,
            fontSize: "clamp(32px, 5vw, 48px)",
            color: "var(--ink)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            marginBottom: 40,
          }}
        >
          Über den
          <br />
          <i style={{ color: "var(--reed)", fontWeight: 400 }}>Kiezradar</i>
        </h1>

        {/* How it works */}
        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--ink-mute)",
              marginBottom: 16,
            }}
          >
            Wie es funktioniert
          </h2>
          <p
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--ink-soft)",
              marginBottom: 14,
            }}
          >
            Der Kiezradar sammelt täglich automatisch öffentliche Meldungen aus offiziellen Berliner
            Quellen — Bezirksamt, Polizei, Veranstaltungskalender und weiteren — und filtert dabei
            alles heraus, was keinen Bezug zu Berlin-Köpenick hat. Die Einträge landen in einem
            strukturierten Feed, sortiert nach Datum und Thema.
          </p>
          <p
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--ink-soft)",
            }}
          >
            Jeder Eintrag wird anschließend mit KI angereichert: automatische Zusammenfassung,
            thematische Kategorisierung und eine Einschätzung der lokalpolitischen Relevanz.
            Der Wochenrückblick fasst jeden Sonntag die wichtigsten Themen der Woche zusammen.
            Die Originalmeldungen bleiben stets verlinkt und sind maßgeblich — KI-Texte können irren.
          </p>
        </section>

        {/* Divider */}
        <div style={{ borderTop: "1px solid var(--rule)", marginBottom: 48 }} />

        {/* Sources */}
        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--ink-mute)",
              marginBottom: 16,
            }}
          >
            Quellen
          </h2>
          <div className="space-y-3">
            {sources.map((source) => (
              <div
                key={source.id}
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "14px 16px",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "var(--font-fraunces)",
                      fontWeight: 500,
                      fontSize: 16,
                      color: "var(--water)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.textDecoration = "underline")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.textDecoration = "none")
                    }
                  >
                    {source.name}
                  </a>
                  <span
                    className="flex items-start shrink-0"
                    style={{
                      fontFamily: "var(--font-inter-tight)",
                      fontSize: 11,
                      color:
                        source.status === "active"
                          ? "var(--reed)"
                          : source.status === "error"
                          ? "var(--brick)"
                          : "var(--ink-mute)",
                      marginTop: 3,
                    }}
                  >
                    <StatusDot status={source.status} />
                    {STATUS_LABELS[source.status] ?? source.status}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-inter-tight)",
                    fontSize: 13,
                    color: "var(--ink-soft)",
                    lineHeight: 1.55,
                    marginTop: 6,
                  }}
                >
                  {source.notes}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div style={{ borderTop: "1px solid var(--rule)", marginBottom: 48 }} />

        {/* About the project */}
        <section>
          <h2
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--ink-mute)",
              marginBottom: 16,
            }}
          >
            Über das Projekt
          </h2>
          <p
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--ink-soft)",
              marginBottom: 14,
            }}
          >
            Der Kiezradar ist ein privates Lern- und Experimentierprojekt — gebaut von einem
            Köpenicker, der neugierig auf KI-gestützte Civic-Tech-Werkzeuge ist. Keine Redaktion,
            kein Verlag, keine Förderung.
          </p>
          <p
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--ink-soft)",
            }}
          >
            Der Quellcode ist offen einsehbar. Keine Garantie auf Vollständigkeit oder
            Aktualität — alle verlinkten Originale bleiben die maßgebliche Quelle.
          </p>
        </section>
      </div>

      {/* Footer */}
      <footer
        className="relative mt-4"
        style={{ borderTop: "1px solid var(--rule)", position: "relative", zIndex: 6 }}
      >
        <IllusBanner />
        <div className="mx-auto max-w-[1280px] px-5 md:px-20 py-6 text-center">
          <p
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontSize: 12,
              color: "var(--ink-mute)",
              lineHeight: 1.6,
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            Köpenick Kiezradar — kein offizielles Angebot. KI-Texte können irren,
            die verlinkten Originale bleiben maßgeblich.
          </p>
        </div>
      </footer>
    </div>
  );
}
