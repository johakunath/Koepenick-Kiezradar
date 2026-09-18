export type Tag =
  | "verkehr"
  | "sicherheit"
  | "verwaltung"
  | "politik"
  | "infrastruktur"
  | "veranstaltung"
  | "wahl"
  | "sonstiges";

export interface Entry {
  id: string;
  slug?: string;
  kind?: "meldung" | "veranstaltung" | "dokument";
  source_id?: string;
  source_record_id?: string;
  source: string;
  source_url: string;
  source_refs?: SourceReference[];
  alias_ids?: string[];
  title: string;
  published_at: string;
  ingested_at: string;
  raw_excerpt?: string;
  ai_summary: string;
  tag?: Tag;
  tags: Tag[];
  topic_slugs?: string[];
  location: string;
  district_slug?: string;
  location_relevant?: boolean;
  local_relevance_score: number;
  political_relevance_score: number;
  election_relevant: boolean;
  election_topic?: string;
  ai_reasoning?: string;
  event_start_at?: string;
  event_end_at?: string;
  event_date_precision?: "day" | "time";
  event_date_origin?: "source" | "title" | "title-context" | "legacy";
  summary_origin?: "ai" | "source" | "fallback";
  geocode_precision?: "address" | "venue" | "area";
  last_seen_at?: string;
  enrichment_version?: number;
  venue?: string;
  document_type?: "rss" | "html" | "pdf" | "oparl" | "geojson";
  document_url?: string;
  pdf_page?: number;
  pdf_excerpt?: string;
  addresses?: string[];
  district?: string;
  street?: string;
  lat?: number;
  lng?: number;
  is_mock?: boolean;
}

export interface SourceReference { name: string; url: string }

export interface SourceHealth {
  status: string;
  parsed?: number;
  fetched?: number;
  raw_items?: number;
  error?: string;
  last_success_at?: string;
}

export interface IngestHealth {
  last_run?: string;
  sources: Record<string, SourceHealth>;
  ai_error?: string;
}

export interface Topic {
  slug: string;
  label: string;
  description: string;
  tag?: Tag;
}

export interface DistrictRecord {
  slug: string;
  label: string;
  description: string;
  keywords: string[];
}

export interface SourceRecord {
  id: string;
  name: string;
  url: string;
  type: "rss" | "html" | "api" | "pdf" | "geojson";
  status: "active" | "experimental" | "planned" | "error";
  notes: string;
}

export interface Body {
  slug: string;
  name: string;
  type: "bvv" | "bezirksamt" | "source";
  url: string;
}

export interface Meeting {
  is_mock?: boolean;
  slug: string;
  title: string;
  kind: "sitzung" | "veranstaltung";
  meeting_at: string;
  place: string;
  district?: string;
  district_slug?: string;
  body_slug?: string;
  source_url: string;
  public_note: string;
  agenda_item?: string;
  summary: string;
}

export interface SourceDocument {
  slug: string;
  title: string;
  body_slug: string;
  source_url: string;
  document_url?: string;
  published_at: string;
  topic_slugs: string[];
  district_slug?: string;
  summary: string;
}

export const TAG_LABELS: Record<Tag, string> = {
  verkehr: "Verkehr",
  sicherheit: "Sicherheit",
  verwaltung: "Verwaltung",
  politik: "Politik",
  infrastruktur: "Infrastruktur",
  veranstaltung: "Veranstaltung",
  wahl: "Wahl 2026",
  sonstiges: "Sonstiges",
};

export const ALL_TAGS: Tag[] = [
  "wahl",
  "verkehr",
  "sicherheit",
  "verwaltung",
  "politik",
  "infrastruktur",
  "veranstaltung",
  "sonstiges",
];
