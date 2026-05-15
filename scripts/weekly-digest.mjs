import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENTRIES_PATH = path.join(ROOT, "data", "entries.json");
const WEEKLY_DIR = path.join(ROOT, "data", "weekly");

function isoWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function weekRange(weekStr) {
  const [year, wStr] = weekStr.split("-W");
  const weekNum = Number(wStr);
  const jan4 = new Date(Number(year), 0, 4);
  const dayOfWeek = (jan4.getDay() + 6) % 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + (weekNum - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return monday.toLocaleDateString("de-DE", { day: "numeric", month: "long" })
    + " – "
    + sunday.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
}

async function main() {
  const entries = JSON.parse(await readFile(ENTRIES_PATH, "utf8"));
  const now = new Date();
  const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weekEntries = entries.filter(
    (e) => !e.is_mock && new Date(e.published_at) >= cutoff
  );

  const week = isoWeek(now);
  const range = weekRange(week);

  if (weekEntries.length === 0) {
    console.log(`No real entries in the last 7 days for week ${week}. Skipping.`);
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY fehlt.");
    process.exit(1);
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const prompt = `Du erstellst einen Wochenrückblick für den Kiezradar Köpenick.

Analysiere diese ${weekEntries.length} Einträge aus der Woche ${range} und fasse sie in 3–5 Themen zusammen.
Antworte ausschließlich als JSON-Objekt mit diesem Format:
{
  "topics": [
    {
      "name": "Themenname (max 5 Wörter)",
      "summary": "2–3 Sätze deutsch, sachlich, was in dieser Woche in Köpenick zu diesem Thema passiert ist",
      "entry_ids": ["id1", "id2"]
    }
  ]
}

Einträge:
${JSON.stringify(weekEntries.map((e) => ({ id: e.id, title: e.title, ai_summary: e.ai_summary, tags: e.tags })), null, 2)}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2000 },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API failed ${response.status}: ${await response.text()}`);
  }

  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch?.[0] ?? "{}");

  const digest = {
    week,
    range,
    generated_at: now.toISOString(),
    entry_count: weekEntries.length,
    topics: parsed.topics ?? [],
  };

  await mkdir(WEEKLY_DIR, { recursive: true });
  const outPath = path.join(WEEKLY_DIR, `${week}.json`);
  await writeFile(outPath, `${JSON.stringify(digest, null, 2)}\n`, "utf8");
  console.log(`Weekly digest written: ${outPath} (${digest.topics.length} topics)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
