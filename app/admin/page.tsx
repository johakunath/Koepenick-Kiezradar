import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import RadarNav from "@/components/RadarNav";
import TriggerButton from "./trigger-button";

interface SourceStatus {
  status: "ok" | "error" | "skipped";
  fetched?: number;
  parsed?: number;
  raw_items?: number;
  error?: string;
}

interface IngestStatus {
  last_run: string;
  sources: Record<string, SourceStatus>;
  new_entries: number;
  total_entries: number;
  dry_run: boolean;
  ai_error?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  "polizei-berlin": "Polizei Berlin",
  "berlin-events": "Berlin Events",
  "bezirksamt-tk": "Bezirksamt TK",
  "bvv-tk": "BVV Treptow-Köpenick",
  "amtsblatt-berlin": "Amtsblatt für Berlin",
  "viz-baustellen": "VIZ Baustellen",
};

const OPTIONAL_SOURCES = new Set(["viz-baustellen", "amtsblatt-berlin"]);

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} Tag${days > 1 ? "en" : ""}`;
}

function friendlyAiError(error: string): string {
  if (error.includes("gemini-1.5-flash") && error.includes("NOT_FOUND")) {
    return "Das bisherige Standardmodell gemini-1.5-flash ist für diese API nicht mehr verfügbar. Der nächste Lauf nutzt gemini-2.0-flash bzw. ein Fallback-Modell.";
  }

  if (error.includes("GEMINI_API_KEY")) {
    return "Der Gemini API-Key fehlt. In Vercel muss GEMINI_API_KEY gesetzt sein.";
  }

  return error.split("\n")[0] ?? error;
}

function sourceHint(id: string, source: SourceStatus): { text: string; tone: "muted" | "warning" | "error" } {
  const optionalUnavailable = OPTIONAL_SOURCES.has(id) && source.status === "error";

  if (source.status === "skipped" || optionalUnavailable) {
    return {
      text: source.error
        ? `Optionale Quelle aktuell nicht verfügbar: ${source.error}`
        : "Optionale Quelle in diesem Lauf übersprungen.",
      tone: "muted",
    };
  }

  if (source.status === "error") {
    return { text: source.error ?? "Unbekannter Fehler", tone: "error" };
  }

  if ((source.parsed ?? 0) === 0) {
    return {
      text: "Quelle erreichbar, aber keine neuen Köpenick-Treffer im aktuellen Lauf.",
      tone: "warning",
    };
  }

  return { text: "", tone: "muted" };
}

async function loadStatus(): Promise<IngestStatus | null> {
  try {
    const statusPath = path.join(process.cwd(), "data", "ingest-status.json");
    const raw = await readFile(statusPath, "utf8");
    return JSON.parse(raw) as IngestStatus;
  } catch {
    return null;
  }
}

export default async function AdminPage() {
  const status = await loadStatus();

  return (
    <div className="min-h-screen px-5 py-10" style={{ background: "var(--bg)" }}>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <RadarNav />
          <h1
            className="text-2xl mb-1"
            style={{ fontFamily: "var(--font-fraunces)", color: "var(--ink)" }}
          >
            Kiezradar Admin
          </h1>
          <Link href="/" className="text-xs" style={{ color: "var(--water-mid)" }}>
            Zurück zum Feed
          </Link>
        </div>

        <section
          className="rounded-lg p-5 space-y-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
            Letzter Ingest
          </h2>

          {status ? (
            <>
              <p className="text-sm" style={{ color: "var(--ink)" }}>
                {timeAgo(status.last_run)}{" "}
                <span style={{ color: "var(--ink-soft)" }}>
                  ({new Date(status.last_run).toLocaleString("de-DE")})
                </span>
                {status.dry_run && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                    Dry-run
                  </span>
                )}
              </p>

              {status.ai_error && (
                <div
                  className="text-xs px-3 py-2 rounded"
                  style={{
                    background: "rgba(156,74,46,0.08)",
                    border: "1px solid rgba(156,74,46,0.3)",
                    color: "var(--brick)",
                  }}
                >
                  <span className="font-semibold">KI-Enrichment Hinweis: </span>
                  {friendlyAiError(status.ai_error)}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-sm border-collapse">
                  <thead>
                    <tr className="text-xs text-left" style={{ color: "var(--ink-soft)" }}>
                      <th className="pb-2 font-normal">Quelle</th>
                      <th className="pb-2 font-normal text-right">Status</th>
                      <th className="pb-2 font-normal text-right">Roh</th>
                      <th className="pb-2 font-normal text-right">Geparst</th>
                      <th className="pb-2 font-normal text-right">Neu</th>
                      <th className="pb-2 font-normal pl-4">Hinweis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(status.sources).map(([id, source]) => {
                      const hint = sourceHint(id, source);
                      const optionalUnavailable = OPTIONAL_SOURCES.has(id) && source.status === "error";
                      const icon =
                        source.status === "ok" && (source.parsed ?? 0) > 0
                          ? "✓"
                          : source.status === "error" && !optionalUnavailable
                            ? "✕"
                            : source.status === "skipped" || optionalUnavailable
                              ? "–"
                              : "!";
                      const iconColor =
                        icon === "✓"
                          ? "var(--forest)"
                          : icon === "✕"
                            ? "var(--brick)"
                            : icon === "!"
                              ? "#b58900"
                              : "var(--ink-soft)";
                      const hintColor =
                        hint.tone === "error"
                          ? "var(--brick)"
                          : hint.tone === "warning"
                            ? "#8a6d00"
                            : "var(--ink-soft)";

                      return (
                        <tr key={id} style={{ borderTop: "1px solid var(--border)" }}>
                          <td className="py-2" style={{ color: "var(--ink)" }}>
                            {SOURCE_LABELS[id] ?? id}
                          </td>
                          <td className="py-2 text-right" style={{ color: iconColor }}>
                            {icon}
                          </td>
                          <td className="py-2 text-right" style={{ color: "var(--ink-soft)" }}>
                            {source.raw_items ?? "—"}
                          </td>
                          <td className="py-2 text-right" style={{ color: "var(--ink-soft)" }}>
                            {source.parsed ?? "—"}
                          </td>
                          <td className="py-2 text-right" style={{ color: "var(--ink-soft)" }}>
                            {source.fetched ?? "—"}
                          </td>
                          <td className="py-2 pl-4 text-xs" style={{ color: hintColor }}>
                            {hint.text}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
                {status.new_entries} neue Einträge · {status.total_entries} gesamt
              </p>
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
              Noch kein Ingest-Status vorhanden. Starte den ersten Lauf unten.
            </p>
          )}
        </section>

        <section
          className="rounded-lg p-5 space-y-3"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
            Manueller Ingest
          </h2>
          <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
            Startet den GitHub Actions Workflow. Braucht GITHUB_TOKEN in den Vercel-Env-Vars.
          </p>
          <TriggerButton />
        </section>
      </div>
    </div>
  );
}
