import {
  field,
  hashId,
  inferTags,
  inferLocation,
  fallbackSourceSummary,
  parseGermanDate,
  decodeEntities,
} from "../lib/shared.mjs";

export const BEZIRKSAMT_RSS_URL =
  "https://www.berlin.de/ba-treptow-koepenick/aktuelles/pressemitteilungen/index/rss.php";
export const BEZIRKSAMT_PAGE_URL =
  "https://www.berlin.de/ba-treptow-koepenick/aktuelles/pressemitteilungen/";

function parseBezirksamtRss(xml) {
  const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((m) => m[1]);

  return items
    .map((item) => {
      const title = field(item, "title");
      const sourceUrl = field(item, "link");
      const rawExcerpt = field(item, "description");
      const publishedAt = new Date(field(item, "pubDate") || Date.now()).toISOString();
      const text = `${title} ${rawExcerpt}`;
      const hasElectionTopic = /wahl|kandidat|wahlkreis/i.test(text);

      return {
        id: hashId(["bezirksamt-tk", sourceUrl, title]),
        source_id: "bezirksamt-tk",
        source: "Bezirksamt Treptow-Köpenick",
        source_url: sourceUrl,
        title,
        published_at: publishedAt,
        ingested_at: new Date().toISOString(),
        raw_excerpt: rawExcerpt,
        ai_summary:
          rawExcerpt || fallbackSourceSummary({ title, rawExcerpt, sourceId: "bezirksamt-tk" }),
        tags: inferTags(text, "bezirksamt-tk"),
        location: inferLocation(text),
        location_relevant: true,
        local_relevance_score: 0.7,
        political_relevance_score: /wahl|partei|bvv|antrag|senat/.test(
          text.toLocaleLowerCase("de-DE")
        )
          ? 0.6
          : 0.3,
        election_relevant: hasElectionTopic,
        election_topic: hasElectionTopic ? "Wahl 2026" : undefined,
        ai_reasoning: "Offizielle Pressemitteilung des Bezirksamts Treptow-Köpenick.",
      };
    })
    .filter((e) => e.title && e.source_url);
}

function parseBezirksamtHtml(html) {
  const matches = [
    ...html.matchAll(
      /(\d{1,2}\.\d{1,2}\.\d{4})[^<]*<\/[^>]+>[\s\S]{0,300}?<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
    ),
  ];

  return matches
    .map(([, dateText, href, titleHtml]) => {
      const title = decodeEntities(titleHtml).trim();
      if (!title) return null;
      const sourceUrl = href.startsWith("http")
        ? href
        : new URL(href, BEZIRKSAMT_PAGE_URL).toString();
      // Reject sidebar/navigation links that point to other districts
      if (!sourceUrl.includes("/ba-treptow-koepenick/")) return null;
      const publishedAt = parseGermanDate(dateText) ?? new Date().toISOString();
      const hasElectionTopic = /wahl|kandidat|wahlkreis/i.test(title);

      return {
        id: hashId(["bezirksamt-tk", sourceUrl, title]),
        source_id: "bezirksamt-tk",
        source: "Bezirksamt Treptow-Köpenick",
        source_url: sourceUrl,
        title,
        published_at: publishedAt,
        ingested_at: new Date().toISOString(),
        raw_excerpt: "",
        ai_summary: fallbackSourceSummary({ title, sourceId: "bezirksamt-tk" }),
        tags: inferTags(title, "bezirksamt-tk"),
        location: inferLocation(title),
        location_relevant: true,
        local_relevance_score: 0.7,
        political_relevance_score: /wahl|partei|bvv|antrag|senat/.test(
          title.toLocaleLowerCase("de-DE")
        )
          ? 0.6
          : 0.3,
        election_relevant: hasElectionTopic,
        election_topic: hasElectionTopic ? "Wahl 2026" : undefined,
        ai_reasoning: "Offizielle Pressemitteilung des Bezirksamts Treptow-Köpenick.",
      };
    })
    .filter((e) => e && e.title && e.source_url);
}

export function parseBezirksamtSource(text) {
  return /<item\b/i.test(text) ? parseBezirksamtRss(text) : parseBezirksamtHtml(text);
}
