import {
  field,
  hashId,
  containsKoepenick,
  inferTags,
  inferLocation,
  fallbackSourceSummary,
  parseGermanDate,
  decodeEntities,
} from "../lib/shared.mjs";

export const POLICE_RSS_URL = "https://www.berlin.de/polizei/polizeimeldungen/index/rss.php";
export const POLICE_PAGE_URL = "https://www.berlin.de/polizei/polizeimeldungen/";

export function parsePoliceRss(xml) {
  const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((m) => m[1]);

  return items
    .map((item) => {
      const title = decodeEntities(field(item, "title"));
      const sourceUrl = field(item, "link");
      const rawExcerpt = decodeEntities(field(item, "description"));
      const category = decodeEntities(field(item, "category"));
      const publishedAt = new Date(field(item, "pubDate") || Date.now()).toISOString();
      const text = `${title} ${rawExcerpt} ${category}`;

      return {
        id: hashId(["polizei-berlin", sourceUrl, title]),
        source_id: "polizei-berlin",
        source: "Polizei Berlin",
        source_url: sourceUrl,
        title,
        published_at: publishedAt,
        ingested_at: new Date().toISOString(),
        raw_excerpt: rawExcerpt,
        ai_summary: rawExcerpt || fallbackSourceSummary({ title, rawExcerpt, sourceId: "polizei-berlin" }),
        tags: inferTags(text, "polizei-berlin"),
        location: inferLocation(text),
        location_relevant: containsKoepenick(text),
        local_relevance_score: containsKoepenick(text) ? 0.75 : 0.25,
        political_relevance_score: 0.1,
        election_relevant: false,
        ai_reasoning: containsKoepenick(text)
          ? "Die Meldung nennt einen Ort im Köpenicker Kerngebiet."
          : "Die Meldung wurde importiert, muss aber noch auf Kiez-Relevanz geprüft werden.",
      };
    })
    .filter((entry) => entry.title && entry.source_url && entry.location_relevant);
}

export function parsePoliceHtml(html) {
  const matches = [
    ...html.matchAll(
      // Zwischen Link und "Ereignisort:" dürfen Wrapper-Tags stehen —
      // berlin.de ändert das Listen-Markup gelegentlich
      /(\d{1,2}\.\d{1,2}\.\d{4}\s+\d{1,2}:\d{2})\s*Uhr[\s\S]*?<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>(?:\s|<[^>]*>|&nbsp;)*Ereignisort:\s*([^<\n]+)/gi
    ),
  ];

  return matches
    .map((match) => {
      const [, dateText, href, titleHtml, locationHtml] = match;
      const title = decodeEntities(titleHtml);
      const location = decodeEntities(locationHtml);
      const sourceUrl = href.startsWith("http") ? href : new URL(href, POLICE_PAGE_URL).toString();
      const publishedAt = parseGermanDate(dateText) ?? new Date().toISOString();
      const rawExcerpt = `Ereignisort: ${location}`;
      const text = `${title} ${location}`;

      return {
        id: hashId(["polizei-berlin", sourceUrl, title]),
        source_id: "polizei-berlin",
        source: "Polizei Berlin",
        source_url: sourceUrl,
        title,
        published_at: publishedAt,
        ingested_at: new Date().toISOString(),
        raw_excerpt: rawExcerpt,
        ai_summary: fallbackSourceSummary({ title, rawExcerpt: location, sourceId: "polizei-berlin" }),
        tags: inferTags(text, "polizei-berlin"),
        location: inferLocation(text),
        location_relevant: containsKoepenick(text),
        local_relevance_score: containsKoepenick(text) ? 0.75 : 0.25,
        political_relevance_score: /wahl|plakat|versammlung|politik/i.test(text) ? 0.45 : 0.1,
        election_relevant: /wahl|plakat/i.test(text),
        election_topic: /wahl|plakat/i.test(text) ? "Wahl 2026" : undefined,
        ai_reasoning: containsKoepenick(text)
          ? "Die Meldung nennt Treptow-Köpenick oder einen Ort im Köpenicker Kerngebiet."
          : "Die Meldung wurde importiert, muss aber noch auf Kiez-Relevanz geprüft werden.",
      };
    })
    .filter((entry) => entry.title && entry.source_url && entry.location_relevant);
}

export function parsePoliceSource(text) {
  return /<item\b/i.test(text) ? parsePoliceRss(text) : parsePoliceHtml(text);
}
