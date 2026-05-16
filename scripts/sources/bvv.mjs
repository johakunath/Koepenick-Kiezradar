import { field, hashId, inferTags, inferLocation, fallbackSourceSummary } from "../lib/shared.mjs";

export const BVV_ALLRIS_RSS_URL =
  "https://www.berlin.de/presse/pressemitteilungen/index/feed?institutions%5B%5D=Bezirksamt+Treptow-K%C3%B6penick";
export const BVV_ALLRIS_PAGE_URL =
  "https://www.berlin.de/ba-treptow-koepenick/politik-und-verwaltung/bezirksverordnetenversammlung/";

export function parseBvvAllrisRss(xml) {
  if (!xml) return [];
  const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((m) => m[1]);

  return items
    .map((item) => {
      const title = field(item, "title");
      const sourceUrl = field(item, "link");
      const rawExcerpt = field(item, "description");
      const pubDateRaw = field(item, "pubDate");
      const publishedAt = new Date(pubDateRaw || Date.now()).toISOString();
      const text = `${title} ${rawExcerpt}`;
      const hasElectionTopic = /wahl|kandidat|wahlkreis/i.test(text);

      if (!title || !sourceUrl) return null;

      return {
        id: hashId(["bvv-tk", sourceUrl, title]),
        source_id: "bvv-tk",
        source: "BVV Treptow-Köpenick",
        source_url: sourceUrl,
        title,
        published_at: publishedAt,
        ingested_at: new Date().toISOString(),
        raw_excerpt: rawExcerpt,
        ai_summary: rawExcerpt || fallbackSourceSummary({ title, rawExcerpt, sourceId: "bvv-tk" }),
        tags: inferTags(text, "bvv-tk"),
        location: inferLocation(text),
        location_relevant: true,
        local_relevance_score: 0.8,
        political_relevance_score: 0.7,
        election_relevant: hasElectionTopic,
        election_topic: hasElectionTopic ? "Wahl 2026" : undefined,
        ai_reasoning: "Antrag oder Vorlage der Bezirksverordnetenversammlung Treptow-Köpenick.",
        document_type: "oparl",
        document_url: sourceUrl,
      };
    })
    .filter(Boolean);
}
