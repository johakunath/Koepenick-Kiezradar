import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Liest data/ingest-status.json nach dem Ingest-Lauf und erstellt ein GitHub
// Issue, wenn die Pipeline still degradiert ist (siehe HANDOVER.md "Nächste
// Schritte" #4). Läuft nur in GitHub Actions (GITHUB_TOKEN + GITHUB_REPOSITORY
// gesetzt), lokal ist es ein No-op.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATUS_PATH = path.join(ROOT, "data", "ingest-status.json");
const ISSUE_TITLE = "Ingest-Fehler: Pipeline liefert Fehler oder leere Quellen";

// Unter dieser Roh-Item-Zahl werten wir parsed=0 nicht als toten Parser —
// an manchen Tagen gibt es schlicht keine Köpenick-relevanten Meldungen.
const DEAD_PARSER_RAW_THRESHOLD = 100;

function findProblems(status) {
  const problems = [];

  if (status.ai_error) {
    problems.push(`**KI-Enrichment fehlgeschlagen:**\n\`\`\`\n${status.ai_error.slice(0, 1500)}\n\`\`\``);
  }

  for (const [sourceId, source] of Object.entries(status.sources ?? {})) {
    if (source.status === "error") {
      problems.push(`**Quelle \`${sourceId}\`:** Fetch fehlgeschlagen — ${source.error}`);
    } else if (
      source.status === "ok" &&
      source.parsed === 0 &&
      (source.raw_items ?? 0) >= DEAD_PARSER_RAW_THRESHOLD
    ) {
      problems.push(
        `**Quelle \`${sourceId}\`:** ${source.raw_items} Roh-Items geladen, aber 0 geparst — Parser vermutlich durch Markup-Änderung kaputt.`
      );
    }
  }

  return problems;
}

async function githubApi(url, options = {}) {
  const response = await fetch(`https://api.github.com${url}`, {
    ...options,
    headers: {
      authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      accept: "application/vnd.github+json",
      "user-agent": "Koepenick-Kiezradar-Ingest",
      ...(options.body ? { "content-type": "application/json" } : {}),
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${url}: ${await response.text()}`);
  }
  return response.json();
}

async function main() {
  const status = JSON.parse(await readFile(STATUS_PATH, "utf8"));
  const problems = findProblems(status);

  if (problems.length === 0) {
    console.log("Ingest-Report: keine Probleme gefunden.");
    return;
  }

  console.log(`Ingest-Report: ${problems.length} Problem(e) gefunden.`);

  const repo = process.env.GITHUB_REPOSITORY;
  if (!process.env.GITHUB_TOKEN || !repo) {
    console.log("Kein GITHUB_TOKEN/GITHUB_REPOSITORY — Issue-Erstellung übersprungen (lokaler Lauf).");
    console.log(problems.join("\n\n"));
    return;
  }

  // Nur ein offenes Report-Issue gleichzeitig — kein tägliches Issue-Spamming
  const openIssues = await githubApi(`/repos/${repo}/issues?state=open&per_page=100`);
  const existing = openIssues.find((issue) => issue.title === ISSUE_TITLE);
  if (existing) {
    console.log(`Offenes Report-Issue existiert bereits: ${existing.html_url}`);
    return;
  }

  const runUrl = process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL ?? "https://github.com"}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null;

  const body = [
    `Automatischer Report vom Ingest-Lauf \`${status.last_run}\`:`,
    "",
    ...problems.map((p) => `- ${p}`),
    "",
    runUrl ? `Workflow-Lauf: ${runUrl}` : "",
    "_Dieses Issue wird nicht dupliziert, solange es offen ist. Nach dem Fix einfach schließen._",
  ]
    .filter(Boolean)
    .join("\n");

  const issue = await githubApi(`/repos/${repo}/issues`, {
    method: "POST",
    body: JSON.stringify({ title: ISSUE_TITLE, body }),
  });
  console.log(`Issue erstellt: ${issue.html_url}`);
}

main().catch((error) => {
  // Report-Fehler sollen den Ingest-Workflow nicht rot machen
  console.error(`Ingest-Report fehlgeschlagen: ${error.message}`);
});
