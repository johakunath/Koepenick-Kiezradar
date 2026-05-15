import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import TriggerButton from "./trigger-button";

interface SourceStatus {
  status: "ok" | "error";
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
}

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

const SOURCE_LABELS: Record<string, string> = {
  "polizei-berlin": "Polizei Berlin",
  "berlin-events": "Berlin Events",
  "bezirksamt-tk": "Bezirksamt TK",
  "bvv-tk": "BVV Treptow-Köpenick",
  "amtsblatt-berlin": "Amtsblatt für Berlin",
  "viz-baustellen": "VIZ Baustellen",
};

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
      <div className="max-w-lg mx-auto space-y-8">
        <div>
          <h1
            className="text-2xl mb-1"
            style={{ fontFamily: "var(--font-fraunces)", color: "var(--ink)" }}
          >
            Kiezradar Admin
          </h1>
          <Link href="/" className="text-xs" style={{ color: "var(--water-mid)" }}>
            ← Zurück zum Feed
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

              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-xs text-left" style={{ color: "var(--ink-soft)" }}>
                    <th className="pb-2 font-normal">Quelle</th>
                    <th className="pb-2 font-normal text-right">Status</th>
                    <th className="pb-2 font-normal text-right">Roh</th>
                    <th className="pb-2 font-normal text-right">Geparst</th>
                    <th className="pb-2 font-normal text-right">Neu</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(status.sources).map(([id, src]) => (
                    <tr key={id} style={{ borderTop: "1px solid var(--border)" }}>
                      <td className="py-2" style={{ color: "var(--ink)" }}>
                        {SOURCE_LABELS[id] ?? id}
                      </td>
                      <td className="py-2 text-right">
                        {src.status === "ok" ? (
                          (src.parsed ?? 0) > 0 ? (
                            <span style={{ color: "var(--forest)" }}>✓</span>
                          ) : (
                            <span
                              title="Quelle erreichbar, aber keine Einträge geparst — Parser prüfen"
                              style={{ color: "#b58900", cursor: "help" }}
                            >
                              ⚠
                            </span>
                          )
                        ) : (
                          <span
                            title={src.error}
                            style={{ color: "var(--brick)", cursor: "help" }}
                          >
                            ✗
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right" style={{ color: "var(--ink-soft)" }}>
                        {src.raw_items ?? "—"}
                      </td>
                      <td className="py-2 text-right" style={{ color: "var(--ink-soft)" }}>
                        {src.status === "ok" ? (src.parsed ?? "—") : "—"}
                      </td>
                      <td className="py-2 text-right" style={{ color: "var(--ink-soft)" }}>
                        {src.status === "ok" ? (src.fetched ?? "—") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

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
