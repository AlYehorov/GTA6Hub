export type NewsCategory = "Trailer" | "Leak" | "Official" | "Analysis";

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  category: NewsCategory;
  publishedAt: string;
  readTimeMinutes: number;
}
