export type Tag =
  | "verkehr"
  | "sicherheit"
  | "verwaltung"
  | "politik"
  | "infrastruktur"
  | "veranstaltung"
  | "sonstiges";

export interface Entry {
  id: string;
  source_id?: string;
  source: string;
  source_url: string;
  title: string;
  published_at: string;
  ingested_at: string;
  raw_excerpt?: string;
  ai_summary: string;
  tags: Tag[];
  location: string;
  location_relevant?: boolean;
  local_relevance_score: number;
  political_relevance_score: number;
  election_relevant: boolean;
  election_topic?: string;
  ai_reasoning?: string;
  event_start_at?: string;
  event_end_at?: string;
  venue?: string;
  document_type?: "rss" | "html" | "pdf" | "oparl" | "geojson";
  document_url?: string;
  pdf_page?: number;
  pdf_excerpt?: string;
  is_mock?: boolean;
}

export const TAG_LABELS: Record<Tag, string> = {
  verkehr: "Verkehr",
  sicherheit: "Sicherheit",
  verwaltung: "Verwaltung",
  politik: "Politik & Wahl",
  infrastruktur: "Infrastruktur",
  veranstaltung: "Veranstaltung",
  sonstiges: "Sonstiges",
};

export const ALL_TAGS: Tag[] = [
  "verkehr",
  "sicherheit",
  "verwaltung",
  "politik",
  "infrastruktur",
  "veranstaltung",
  "sonstiges",
];
