import { TrackerSectionClient } from "@/components/home/tracker-section-client";
import { getHomepageTrackerSnapshot } from "@/lib/home/queries";

export async function TrackerSection() {
  const snapshot = await getHomepageTrackerSnapshot();
  if (!snapshot) return null;

  return (
    <TrackerSectionClient
      items={snapshot.items}
      totalCategories={snapshot.totalCategories}
    />
  );
}
