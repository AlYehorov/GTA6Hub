import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { TrackerOverviewClient } from "@/components/tracker/tracker-overview-client";
import { getCompletionCategories, getAllPublishedItems } from "@/lib/tracker/queries";
import { getTrackerIndexMetadata } from "@/lib/tracker/seo-metadata";

export const metadata: Metadata = getTrackerIndexMetadata();

export default async function TrackerPage() {
  const [categories, items] = await Promise.all([
    getCompletionCategories(),
    getAllPublishedItems(),
  ]);

  return (
    <>
      <PageHeader
        title="Completion Tracker"
        description="Track GTA 6 100% completion — missions, collectibles, weapons, achievements, and every category across Leonida."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <TrackerOverviewClient categories={categories} items={items} />
      </div>
    </>
  );
}
