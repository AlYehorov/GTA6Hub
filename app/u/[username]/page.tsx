import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileView } from "@/components/profile/profile-view";
import {
  getActivityEvents,
  getCategoryBreakdown,
  getProfileWithStats,
  getSavedArticles,
  getSavedLocations,
  getUserAchievements,
} from "@/lib/profile/queries";
import { getCommunityProfileStats, getUserCommunityPosts } from "@/lib/community/queries";
import { createPageMetadata } from "@/lib/metadata";

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileWithStats(username);

  if (!profile) {
    return { title: "Profile Not Found" };
  }

  return createPageMetadata({
    title: `${profile.display_name || profile.username} — GTA 6 Profile`,
    description: `${profile.username} · Level ${profile.level} ${profile.level_label} · ${profile.completion_percentage}% completion on GTAVIHub.`,
    path: `/u/${username}`,
  });
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params;
  const profile = await getProfileWithStats(username);

  if (!profile) notFound();

  const [achievements, activity, savedArticles, savedLocations, categories, communityStats, communityPosts] =
    await Promise.all([
      getUserAchievements(profile.id),
      getActivityEvents(profile.id, 10),
      getSavedArticles(profile.id, 12),
      getSavedLocations(profile.id, 12),
      getCategoryBreakdown(profile.id),
      getCommunityProfileStats(profile.id),
      getUserCommunityPosts(profile.id, 6),
    ]);

  return (
    <>
      <PageHeader
        title="Player Profile"
        description={`@${username} · Level ${profile.level} · ${profile.level_label}`}
      />
      <ProfileView
        profile={profile}
        achievements={achievements}
        recentActivity={activity}
        savedArticles={savedArticles}
        savedLocations={savedLocations}
        categories={categories}
        communityStats={communityStats}
        communityPosts={communityPosts}
      />
    </>
  );
}
