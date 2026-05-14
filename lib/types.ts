export type Tag =
  | "verkehr"
  | "sicherheit"
  | "verwaltung"
  | "politik"
  | "infrastruktur"
  | "sonstiges";

export interface Entry {
  id: string;
  source: string;
  source_url: string;
  title: string;
  published_at: string;
  ingested_at: string;
  ai_summary: string;
  tags: Tag[];
  location: string;
  local_relevance_score: number;
  political_relevance_score: number;
  election_relevant: boolean;
  election_topic?: string;
  ai_reasoning: string;
  is_mock?: boolean;
}

export const TAG_LABELS: Record<Tag, string> = {
  verkehr: "Verkehr",
  sicherheit: "Sicherheit",
  verwaltung: "Verwaltung",
  politik: "Politik & Wahl",
  infrastruktur: "Infrastruktur",
  sonstiges: "Sonstiges",
};

export const ALL_TAGS: Tag[] = [
  "verkehr",
  "sicherheit",
  "verwaltung",
  "politik",
  "infrastruktur",
  "sonstiges",
];
