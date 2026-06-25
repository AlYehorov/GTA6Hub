import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { TrackerCategoryClient } from "@/components/tracker/tracker-category-client";
import {
  getCategoryBySlug,
  getPublishedItemsByCategory,
} from "@/lib/tracker/queries";
import { getTrackerCategoryMetadata } from "@/lib/tracker/seo-metadata";

interface TrackerCategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({
  params,
}: TrackerCategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return { title: "Category Not Found" };
  }
  return getTrackerCategoryMetadata(slug, category.title);
}

export default async function TrackerCategoryPage({ params }: TrackerCategoryPageProps) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  const items = await getPublishedItemsByCategory(category.id);

  return (
    <>
      <PageHeader
        title={category.title}
        description={`Track your GTA 6 ${category.title.toLowerCase()} progress. Mark completed items and monitor your percentage.`}
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <TrackerCategoryClient category={category} items={items} />
      </div>
    </>
  );
}
