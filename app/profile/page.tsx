import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileView } from "@/components/profile/profile-view";
import {
  getActivityEvents,
  getCategoryBreakdown,
  getProfileByUserId,
  getProfileWithStats,
  getSavedArticles,
  getSavedLocations,
  getUserAchievements,
} from "@/lib/profile/queries";
import { getCommunityProfileStats, getUserCommunityPosts } from "@/lib/community/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Your Profile — GTA6Hub",
  description: "Your GTAVIHub dashboard: XP, achievements, tracker progress, and saved content.",
  path: "/profile",
});

export default async function PrivateProfilePage() {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/profile");

  const profile = await getProfileByUserId(user.id);
  if (!profile) redirect("/login?next=/profile");

  const profileWithStats = await getProfileWithStats(profile.username);
  if (!profileWithStats) redirect("/login");

  const [achievements, activity, savedArticles, savedLocations, categories, communityStats, communityPosts] =
    await Promise.all([
      getUserAchievements(profile.id),
      getActivityEvents(profile.id, 10),
      getSavedArticles(profile.id, 20),
      getSavedLocations(profile.id, 20),
      getCategoryBreakdown(profile.id),
      getCommunityProfileStats(profile.id),
      getUserCommunityPosts(profile.id, 6),
    ]);

  return (
    <>
      <PageHeader
        title="Your Profile"
        description="XP, achievements, tracker progress, and saved content."
      />
      <ProfileView
        profile={profileWithStats}
        achievements={achievements}
        recentActivity={activity}
        savedArticles={savedArticles}
        savedLocations={savedLocations}
        categories={categories}
        communityStats={communityStats}
        communityPosts={communityPosts}
        isOwner
      />
    </>
  );
}
