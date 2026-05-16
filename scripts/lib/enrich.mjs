import { TAGS, DISTRICT_KEYWORDS } from "./shared.mjs";

const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_FALLBACK_MODELS = [];

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

  const prompt =
    `Du enrichst Einträge für Köpenick Kiezradar. Antworte ausschließlich als JSON-Array. Behalte id bei.

Pflichtfelder pro Eintrag:
- id (unverändert)
- ai_summary: 1–2 Sätze, sachlich, deutsch, was passiert ist
- tags: Array, nur aus [${TAGS.join(", ")}], 1-5 Tags. Nutze mehrere Tags, wenn mehrere Kategorien wirklich passen; Events nur "politik" wenn inhaltlich Wahl-/Politikbezug
- location: kurze Ortsbezeichnung im Bezirk
- location_relevant: boolean
- local_relevance_score: 0.0–1.0
- political_relevance_score: 0.0–1.0
- election_relevant: boolean
- election_topic: string oder null
- ai_reasoning: EXAKT 2 Sätze auf Deutsch. Satz 1: Was passiert konkret? Satz 2: Warum ist das für Köpenick-Anwohner relevant? Konkret, kein Marketing-Sprech, max 40 Wörter gesamt.
- district: Stadtteil aus dieser Liste oder null: [${districts.join(", ")}]
- street: Hauptstraße wenn erkennbar, sonst null
- addresses: Array mit erkannten Adressen (Format "Straße Hausnummer"), leer wenn keine

Eingabe:\n\n` +
    JSON.stringify(entries, null, 2);

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

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  const enriched = JSON.parse(jsonMatch?.[0] ?? "[]");
  const byId = new Map(enriched.map((entry) => [entry.id, entry]));

  return entries.map((entry) => ({ ...entry, ...(byId.get(entry.id) ?? {}) }));
}
