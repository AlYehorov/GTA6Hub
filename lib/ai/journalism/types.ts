export type SourceBadge = "Official" | "Community" | "Rumor" | "Unconfirmed";
export type ConfidenceLabel = "High" | "Medium" | "Low";

export interface JournalismHero {
  headline: string;
  summary: string;
  source_badge: SourceBadge;
  confidence_label: ConfidenceLabel;
}

export interface JournalismSeo {
  title: string;
  meta_description: string;
  slug: string;
  og_title: string;
  twitter_title: string;
  canonical: string;
  keywords: string[];
  excerpt: string;
}

export interface SourceCardItem {
  label: string;
  kind: "rockstar_newswire" | "rockstar_youtube" | "reddit" | "youtube" | "community" | "official_trailer";
  url: string;
  source_id?: string;
}

export type JournalismBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "entity"; kind: string; slug: string; entity_id?: string; label: string }
  | { type: "faq"; items: Array<{ question: string; answer: string }> }
  | { type: "youtube"; youtube_id: string; title: string }
  | { type: "sources"; items: SourceCardItem[] }
  | { type: "image"; url: string; alt: string; credit?: string };

export interface EditorArticleJson {
  title: string;
  summary: string;
  hero_caption?: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
  }>;
  faq?: Array<{ question: string; answer: string }>;
  internal_links?: Array<{ label: string; href: string }>;
  related_entities?: Array<{ kind: string; slug: string; label: string }>;
  seo: {
    title: string;
    description: string;
    slug?: string;
    og_title?: string;
    twitter_title?: string;
    canonical?: string;
    keywords?: string[];
  };
  confidence?: number;
  category?: string;
  tags?: string[];
}

export interface JournalismArticleJson {
  hero: JournalismHero;
  blocks: JournalismBlock[];
  seo: JournalismSeo;
  confidence: number;
  category: string;
  tags: string[];
}

export interface JournalismGenerationInput {
  articleType: "news" | "guide";
  primarySourceLabel: string;
  opportunityTitle?: string;
  targetKeyword?: string;
  contentType?: string;
  existingArticle?: { title: string; slug: string; excerpt: string | null };
  sources: Array<{
    id?: string;
    platform: string;
    label: string;
    sourceLabel: string;
    title: string;
    url: string;
    excerpt: string;
    publishedAt?: string | null;
  }>;
  videos: Array<{
    id?: string;
    title: string;
    url: string;
    youtube_id?: string;
    description: string;
  }>;
  entities: Array<{
    id?: string;
    kind: string;
    slug: string;
    title: string;
    href?: string;
    image_url?: string | null;
  }>;
  internalLinkTargets?: string[];
}

export interface JournalismDraftResult {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  content_blocks: JournalismBlock[];
  faq: Array<{ question: string; answer: string }>;
  seo_title: string;
  seo_description: string;
  seo_og_title: string;
  seo_twitter_title: string;
  seo_canonical: string;
  seo_keywords: string[];
  related_entity_slugs: string[];
  internal_link_suggestions: string[];
  confirmed_facts: string[];
  speculation_notes: string[];
  source_attribution: string;
  confidence: number;
  category: string;
  tags: string[];
  source_badge: SourceBadge;
  confidence_label: ConfidenceLabel;
}
