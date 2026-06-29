export type SourcePlatform =
  | "rockstar_newswire"
  | "rockstar_youtube"
  | "reddit"
  | "google_news"
  | "community_youtube"
  | "x";

export type SourceLabel = "official" | "community" | "rumor" | "unconfirmed";

export interface SourceItem {
  id: string;
  source: SourcePlatform;
  source_type: string;
  source_label: SourceLabel;
  source_url: string;
  external_id: string;
  title: string;
  content: string;
  published_at: string | null;
  processed: boolean;
  created_at: string;
}

export interface SourceItemInput {
  source: SourcePlatform;
  source_type: string;
  source_label: SourceLabel;
  source_url: string;
  external_id: string;
  title: string;
  content: string;
  published_at?: string | null;
}

export type SourceItemListItem = SourceItem;

export const SOURCE_PLATFORM_LABELS: Record<SourcePlatform, string> = {
  rockstar_newswire: "Rockstar Newswire",
  rockstar_youtube: "Rockstar YouTube",
  reddit: "Reddit",
  google_news: "Google News",
  community_youtube: "Community YouTube",
  x: "X (Twitter)",
};

export const SOURCE_LABEL_STYLES: Record<
  SourceLabel,
  { label: string; className: string }
> = {
  official: { label: "Official", className: "bg-emerald-500/10 text-emerald-400" },
  community: { label: "Community", className: "bg-blue-500/10 text-blue-400" },
  rumor: { label: "Rumor", className: "bg-orange-500/10 text-orange-400" },
  unconfirmed: { label: "Unconfirmed", className: "bg-amber-500/10 text-amber-400" },
};

/** Reddit-sourced content must never be marked official. */
export function enforceSourceLabel(input: SourceItemInput): SourceLabel {
  if (input.source === "reddit") {
    return input.source_label === "official" ? "unconfirmed" : input.source_label;
  }
  if (input.source === "google_news" || input.source === "community_youtube") {
    return input.source_label === "official" ? "community" : input.source_label;
  }
  return input.source_label;
}
