import {
  hashId,
  inferTags,
  inferLocation,
  fallbackSourceSummary,
  parseGermanDate,
  decodeEntities,
} from "../lib/shared.mjs";

export const EVENTS_URL = "https://www.berlin.de/land/kalender/index.php?c=13&suchmaske=";

export function parseEventsHtml(html) {
  if (!html) return [];

  // berlin.de renders event teasers as articles; keep the li fallback for fixtures/older markup.
  const articles = [
    ...html.matchAll(/<article\b[^>]*\b(?:teaser--event|js-ems-event-teaser)\b[^>]*>([\s\S]*?)<\/article>/gi),
  ].map((m) => m[1]);
  const items = articles.length
    ? articles
    : [...html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => m[1]);

  const entries = items
    .map((item) => {
      const headingLinkMatch = item.match(
        /<a\b[^>]*class="[^"]*\bjs-ems-event-teaser-heading\b[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
      );
      const detailLinkMatches = [...item.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
      const linkMatch =
        headingLinkMatch ??
        detailLinkMatches.find((m) => {
          const text = decodeEntities(m[2]);
          return m[1].includes("detail=") && text && !/^zur veranstaltung$/i.test(text);
        }) ??
        detailLinkMatches.find((m) => {
          const text = decodeEntities(m[2]);
          return text && !/^zur veranstaltung$/i.test(text);
        });
      if (!linkMatch) return null;

      const [, href, titleHtml] = linkMatch;
      const title = decodeEntities(titleHtml);

      if (!title) return null;
      if (/^\d{4}$/.test(title.trim())) return null;
      if (title.trim().length < 8) return null;

      // Reject berlin.de navigation category titles that slip through link extraction
      const NAVIGATION_TITLES = new Set([
        "ausstellungen",
        "spaziergänge, ausflüge",
        "infoveranstaltungen",
        "gesundheit, umwelt",
        "politik, bürgerservice",
      ]);
      if (NAVIGATION_TITLES.has(title.trim().toLocaleLowerCase("de-DE"))) return null;
      if (/^seite\s+\d+$/i.test(title.trim())) return null;

      const sourceUrl = href.startsWith("http") ? href : new URL(href, EVENTS_URL).toString();

      // Reject category-filter and pagination links.
      try {
        const u = new URL(sourceUrl);
        if (u.searchParams.has("kategorie[0]")) return null;
        if (u.searchParams.has("ls") && !u.searchParams.has("detail")) return null;
        if (u.pathname.endsWith("index.php") && !u.searchParams.has("detail")) return null;
      } catch {
        return null;
      }

      const explicitDate = item.match(/<span\b[^>]*class="[^"]*\bdate\b[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      const explicitTime = item.match(/<span\b[^>]*class="[^"]*\btime\b[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      const dateText = explicitDate
        ? `${decodeEntities(explicitDate[1])} ${decodeEntities(explicitTime?.[1] ?? "")}`
        : item;
      const dateMatch = dateText.match(/(\d{1,2}\.\d{1,2}\.\d{4}(?:\D+\d{1,2}:\d{2})?)/);

      if (!dateMatch) return null;

      const eventStartAt = parseGermanDate(dateMatch[1]);
      const publishedAt = eventStartAt ?? new Date().toISOString();
      const venueMatch =
        item.match(/<dt>\s*Veranstaltungsort:\s*<\/dt>\s*<dd>([\s\S]*?)<\/dd>/i) ??
        item.match(/(?:Ort|Veranstaltungsort|venue):\s*([^<\n,]+)/i);
      const venue = venueMatch ? decodeEntities(venueMatch[1].trim()) : undefined;
      const summary = fallbackSourceSummary({ title, sourceId: "berlin-events", venue, eventStartAt });

      return {
        id: hashId(["berlin-events", sourceUrl, title]),
        source_id: "berlin-events",
        source: "Berlin.de Veranstaltungskalender",
        source_url: sourceUrl,
        title,
        published_at: publishedAt,
        ingested_at: new Date().toISOString(),
        raw_excerpt: venue ? `Ort: ${venue}` : "",
        ai_summary: summary,
        tags: inferTags(title, "berlin-events"),
        location: venue ? inferLocation(venue) : "Treptow-Köpenick",
        location_relevant: true,
        local_relevance_score: 0.75,
        political_relevance_score: 0.1,
        election_relevant: false,
        ai_reasoning: "Veranstaltung im Bezirk Treptow-Köpenick.",
        event_start_at: eventStartAt ?? undefined,
        venue,
      };
    })
    .filter((e) => e && e.title && e.source_url);

  console.log(`Events parsed: ${entries.length} from ${items.length} list items`);
  return entries;
}
