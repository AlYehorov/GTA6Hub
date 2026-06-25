import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { getProfileWithStats } from "@/lib/profile/queries";
import { createPageMetadata } from "@/lib/metadata";

interface ProfileLayoutProps {
  params: Promise<{ username: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: ProfileLayoutProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileWithStats(username);

  if (!profile) {
    return { title: "Profile Not Found" };
  }

  return createPageMetadata({
    title: `${profile.username} — GTA 6 Progress`,
    description: `${profile.username} has ${profile.completion_percentage}% GTA 6 completion, ${profile.achievements_unlocked} achievements, and ${profile.collectibles_found} collectibles on GTA6Hub.`,
    path: `/profile/${username}`,
  });
}

export default async function ProfileLayout({ children, params }: ProfileLayoutProps) {
  const { username } = await params;

  return (
    <>
      <PageHeader
        title="Player Profile"
        description={`Public completion stats for @${username} across Leonida.`}
      />
      {children}
    </>
  );
}
