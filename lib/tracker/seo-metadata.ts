import { createPageMetadata } from "@/lib/metadata";

const SEO_BY_SLUG: Record<string, { title: string; description: string }> = {
  "100-percent-completion": {
    title: "GTA 6 100% Completion Tracker",
    description:
      "Track GTA 6 100 completion progress — missions, collectibles, activities, and every requirement for full completion in Leonida.",
  },
  collectibles: {
    title: "GTA 6 Collectibles Tracker",
    description:
      "Find and track every GTA 6 collectible across Vice City and Leonida. Mark found items and monitor completion percentage.",
  },
  weapons: {
    title: "GTA 6 Weapons Tracker",
    description:
      "Track all GTA 6 weapons — unlocks, acquisitions, and arsenal completion across Leonida.",
  },
  achievements: {
    title: "GTA 6 Achievements Tracker",
    description:
      "Track GTA 6 achievements and platform milestones. Monitor progress toward 100% completion.",
  },
  "easter-eggs": {
    title: "GTA 6 Easter Eggs Tracker",
    description:
      "Discover and track GTA 6 easter eggs, hidden references, and secrets across Vice City and Leonida.",
  },
  "random-events": {
    title: "GTA 6 Random Events Tracker",
    description:
      "Track GTA 6 random events — encounters, unlocks, and optional world activities in Leonida.",
  },
};

export function getTrackerIndexMetadata() {
  return createPageMetadata({
    title: "GTA 6 Completion Tracker",
    description:
      "GTA 6 completion tracker and progress tracker — track 100 percent checklist, collectibles, weapons, achievements, easter eggs, and random events across Leonida and Vice City.",
    path: "/tracker",
  });
}

export function getTrackerCategoryMetadata(slug: string, fallbackTitle: string) {
  const seo = SEO_BY_SLUG[slug];
  if (seo) {
    return createPageMetadata({
      title: seo.title,
      description: seo.description,
      path: `/tracker/${slug}`,
    });
  }

  return createPageMetadata({
    title: `${fallbackTitle} Tracker`,
    description: `Track GTA 6 ${fallbackTitle.toLowerCase()} progress on GTA6Hub. Mark completed items and monitor your Leonida completion percentage.`,
    path: `/tracker/${slug}`,
  });
}
