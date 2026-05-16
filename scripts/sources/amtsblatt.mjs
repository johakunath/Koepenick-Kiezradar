import { PDFParse } from "pdf-parse";
import { hashId, containsKoepenick, inferTags, inferLocation, KOEPENICK_KEYWORDS } from "../lib/shared.mjs";

export const AMTSBLATT_INDEX_URLS = [
  "https://www.berlin.de/landesverwaltungsamt/service/amtsblatt-fuer-berlin/",
  "https://www.berlin.de/landesverwaltungsamt/zentrale-dienste/amtsblatt-fuer-berlin/",
  "https://www.berlin.de/sen/justiz/service/amtsblatt-fuer-berlin/",
];

const UA = "Koepenick-Kiezradar/0.2 (+https://github.com/johakunath/Koepenick-Kiezradar)";

export async function fetchAmtsblattEntries() {
  let indexHtml;
  let resolvedBaseUrl;

  for (const url of AMTSBLATT_INDEX_URLS) {
    try {
      const resp = await fetch(url, { headers: { "user-agent": UA } });
      if (!resp.ok) {
        console.log(`Amtsblatt: ${url} → ${resp.status}`);
        continue;
      }
      indexHtml = await resp.text();
      resolvedBaseUrl = url;
      console.log(`Amtsblatt: using ${url}`);
      break;
    } catch (err) {
      console.log(`Amtsblatt: ${url} → ${err.message}`);
    }
  }

  if (!indexHtml) throw new Error("Amtsblatt index fetch failed: all URLs returned errors");

  const pdfLinks = [...indexHtml.matchAll(/href="([^"]*\.pdf[^"]*)"/gi)]
    .map((m) => {
      const href = m[1];
      return href.startsWith("http") ? href : new URL(href, resolvedBaseUrl).toString();
    })
    .filter((url, i, arr) => arr.indexOf(url) === i)
    .slice(0, 3); // only latest 3 PDFs to stay within cost/time budget

  const entries = [];

  for (const pdfUrl of pdfLinks) {
    try {
      const resp = await fetch(pdfUrl, { headers: { "user-agent": UA } });
      if (!resp.ok) continue;

      const buffer = Buffer.from(await resp.arrayBuffer());
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      const pages = result.pages.map((p) => p.text);

      pages.forEach((pageText, pageIndex) => {
        if (!containsKoepenick(pageText)) return;

        const lc = pageText.toLocaleLowerCase("de-DE");
        const mentionIdx = KOEPENICK_KEYWORDS.reduce((best, kw) => {
          const pos = lc.indexOf(kw);
          return pos >= 0 && pos < best ? pos : best;
        }, Infinity);

        const start = Math.max(0, mentionIdx - 100);
        const excerpt = pageText.slice(start, start + 300).replace(/\s+/g, " ").trim();

        const nearLines = pageText
          .slice(Math.max(0, mentionIdx - 400), mentionIdx + 400)
          .split(/\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 10 && l.length < 120);
        const title = nearLines[0] ?? `Amtsblatt für Berlin – Seite ${pageIndex + 1}`;

        const pageNumber = pageIndex + 1;
        const pdfPageUrl = `${pdfUrl}#page=${pageNumber}`;

        entries.push({
          id: hashId(["amtsblatt-berlin", pdfPageUrl, title]),
          source_id: "amtsblatt-berlin",
          source: "Amtsblatt für Berlin",
          source_url: pdfPageUrl,
          title: title.slice(0, 120),
          published_at: new Date().toISOString(),
          ingested_at: new Date().toISOString(),
          raw_excerpt: excerpt,
          ai_summary: excerpt,
          tags: inferTags(excerpt, "amtsblatt-berlin"),
          location: inferLocation(excerpt),
          location_relevant: true,
          local_relevance_score: 0.75,
          political_relevance_score: 0.5,
          election_relevant: /wahl|kandidat|wahlkreis/i.test(excerpt),
          ai_reasoning: `Köpenick-Bezug im Amtsblatt für Berlin (Seite ${pageNumber}).`,
          document_type: "pdf",
          document_url: pdfUrl,
          pdf_page: pageNumber,
          pdf_excerpt: excerpt,
        });
      });
    } catch {
      // skip individual PDF errors
    }
  }

  return entries;
}
