import { NextResponse } from "next/server";
import type { Entry } from "@/lib/types";
import entriesData from "@/data/entries.json";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://koepenick-kiezradar.vercel.app";

function escapeXml(str: string): string {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const allEntries = entriesData as Entry[];
  const hasRealData = allEntries.some((e) => !e.is_mock);
  const entries = (hasRealData ? allEntries.filter((e) => !e.is_mock) : allEntries)
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 50);

  const items = entries
    .map((e) => {
      const pubDate = new Date(e.published_at).toUTCString();
      const tags = e.tags.map((t) => `<category>${escapeXml(t)}</category>`).join("");
      return `    <item>
      <title>${escapeXml(e.title)}</title>
      <link>${escapeXml(e.source_url)}</link>
      <description>${escapeXml(e.ai_summary)}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${e.id}</guid>
      ${tags}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Köpenick Kiezradar</title>
    <link>${SITE_URL}</link>
    <description>Hyperlokaler Nachrichtenstream für Berlin-Köpenick</description>
    <language>de</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
