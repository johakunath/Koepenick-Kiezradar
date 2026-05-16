import { TAGS, DISTRICT_KEYWORDS } from "./shared.mjs";

const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_FALLBACK_MODELS = ["gemini-2.0-flash-lite"];

function parseJsonArray(raw) {
  // Strip markdown code fences Gemini sometimes wraps the response in
  const text = raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();

  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1) return [];

  const candidate = text.slice(start, end + 1);

  try {
    return JSON.parse(candidate);
  } catch {
    // Truncate at last complete object and close the array
    const lastItem = Math.max(candidate.lastIndexOf("},"), candidate.lastIndexOf("}]"));
    if (lastItem > 0) {
      try {
        return JSON.parse(candidate.slice(0, lastItem + 1) + "]");
      } catch {}
    }
    console.warn("AI response JSON could not be parsed, enrichment skipped for this batch.");
    return [];
  }
}

export async function enrichWithAI(entries, { skipClaude }) {
  if (skipClaude || entries.length === 0) return entries;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY fehlt. Für lokale Tests nutze --skip-ai.");
  }

  const modelCandidates = [
    process.env.GEMINI_MODEL,
    DEFAULT_GEMINI_MODEL,
    ...GEMINI_FALLBACK_MODELS,
  ].filter(Boolean);
  const models = [...new Set(modelCandidates)];

  const districts = [
    ...new Set(DISTRICT_KEYWORDS.map(([, label]) => label)),
  ];

  // Send only the fields AI needs — avoids sending already-computed scores back and forth
  const slim = entries.map((e) => ({
    id: e.id,
    source_id: e.source_id,
    title: e.title,
    ...(e.raw_excerpt ? { raw_excerpt: e.raw_excerpt } : {}),
    ...(e.venue ? { venue: e.venue } : {}),
    ...(e.event_start_at ? { event_start_at: e.event_start_at } : {}),
  }));

  const prompt =
    `Du enrichst Einträge für Köpenick Kiezradar (Berlin-Köpenick / Treptow-Köpenick). Antworte ausschließlich als JSON-Array. Behalte id bei.

Pflichtfelder pro Eintrag:
- id (unverändert)
- ai_summary: 1–2 Sätze, sachlich, deutsch. Wenn kein Auszug vorhanden: nutze Fachwissen über Berliner Bezirksverwaltung, BVV und Lokalpolitik, um aus dem Titel eine informative Zusammenfassung zu generieren.
- tags: Array, nur aus [${TAGS.join(", ")}], 1-5 Tags. Nutze mehrere Tags wenn mehrere Kategorien passen; Events nur "wahl" wenn inhaltlich Wahlbezug.
- location: kurze Ortsbezeichnung im Bezirk
- location_relevant: boolean
- local_relevance_score: 0.0–1.0
- political_relevance_score: 0.0–1.0
- election_relevant: boolean
- election_topic: string oder null
- ai_reasoning: EXAKT 2 Sätze. Satz 1: Was passiert konkret (nicht den Titel wiederholen)? Satz 2: Warum ist das für Köpenick-Anwohner wichtig? Konkret, kein Marketing-Sprech, max 40 Wörter gesamt.
- district: Stadtteil aus dieser Liste oder null: [${districts.join(", ")}]
- street: Hauptstraße wenn erkennbar, sonst null
- addresses: Array mit erkannten Adressen (Format "Straße Hausnummer"), leer wenn keine

Eingabe:\n\n` +
    JSON.stringify(slim, null, 2);

  let payload = null;
  const failures = [];

  for (const model of models) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 4000 },
        }),
      }
    );

    if (response.ok) {
      payload = await response.json();
      break;
    }

    const errorText = await response.text();
    failures.push(`${model}: ${response.status} ${errorText}`);
    if (response.status !== 404) break;
  }

  if (!payload) {
    throw new Error(`Gemini API failed: ${failures.join(" | ")}`);
  }

  const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
  const enriched = parseJsonArray(raw);
  const byId = new Map(enriched.map((entry) => [entry.id, entry]));

  return entries.map((entry) => ({ ...entry, ...(byId.get(entry.id) ?? {}) }));
}
