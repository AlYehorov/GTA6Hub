import type { Metadata } from "next";
import {
  ArticlePage,
  generateArticleMetadata,
} from "@/components/articles/article-page";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return generateArticleMetadata(slug, "news", "Article");
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params;
  return <ArticlePage slug={slug} type="news" />;
}
