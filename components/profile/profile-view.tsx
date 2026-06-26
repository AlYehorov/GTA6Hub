import Link from "next/link";
import {
  Award,
  Bookmark,
  Calendar,
  Gem,
  MapPin,
  Sparkles,
  Trophy,
  User as UserIcon,
} from "lucide-react";
import { TrackerProgressBar } from "@/components/tracker/tracker-progress-bar";
import { xpProgressInLevel } from "@/lib/profile/xp";
import type {
  ActivityEvent,
  ProfileWithStats,
  SavedArticle,
  SavedLocation,
  UserAchievement,
} from "@/lib/types/profile";
import type { CommunityPost, CommunityProfileStats } from "@/lib/types/community";
import { CommunityProfileSection } from "@/components/profile/community-profile-section";

interface ProfileViewProps {
  profile: ProfileWithStats;
  achievements: UserAchievement[];
  recentActivity: ActivityEvent[];
  savedArticles: SavedArticle[];
  savedLocations: SavedLocation[];
  categories: Awaited<ReturnType<typeof import("@/lib/profile/queries").getCategoryBreakdown>>;
  communityStats?: CommunityProfileStats;
  communityPosts?: CommunityPost[];
  isOwner?: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function articleHref(article: SavedArticle) {
  return article.type === "guide" ? `/guides/${article.slug}` : `/news/${article.slug}`;
}

export function ProfileView({
  profile,
  achievements,
  recentActivity,
  savedArticles,
  savedLocations,
  categories,
  communityStats,
  communityPosts = [],
  isOwner,
}: ProfileViewProps) {
  const xpBar = xpProgressInLevel(profile.xp);
  const displayName = profile.display_name || profile.username;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {isOwner && (
        <p className="mb-4 text-sm text-gta-pink/80">Your private dashboard</p>
      )}

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gta-pink/10 text-gta-pink sm:size-24">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="size-full object-cover"
              />
            ) : (
              <UserIcon className="size-10 sm:size-12" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-3xl font-bold text-white">{displayName}</h1>
            <p className="text-sm text-white/50">@{profile.username}</p>
            {profile.bio && <p className="mt-2 text-sm text-white/60">{profile.bio}</p>}
            <p className="mt-2 flex items-center gap-1.5 text-sm text-white/50">
              <Calendar className="size-3.5" />
              Joined {formatDate(profile.created_at)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <StatPill icon={<Sparkles className="size-3.5" />} label={`Level ${profile.level} · ${profile.level_label}`} />
              <StatPill icon={<Trophy className="size-3.5" />} label={`${profile.xp} XP`} />
              <StatPill icon={<Trophy className="size-3.5" />} label={`${profile.completion_percentage}% complete`} />
              <StatPill icon={<Award className="size-3.5" />} label={`${profile.achievements_unlocked} achievements`} />
              <StatPill icon={<Gem className="size-3.5" />} label={`${profile.collectibles_found} collectibles`} />
              {profile.community_reputation > 0 && (
                <StatPill icon={<Sparkles className="size-3.5" />} label={`${profile.community_reputation} rep`} />
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-heading text-4xl font-bold text-white">{profile.completion_percentage}%</p>
            <p className="text-sm text-white/40">
              {profile.completed_items} / {profile.total_items} items
            </p>
            <p className="mt-1 text-xs text-white/35">
              {profile.categories_completed} categories completed
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>Level {profile.level} progress</span>
            <span>
              {xpBar.current} / {xpBar.max} XP to next level
            </span>
          </div>
          <TrackerProgressBar percentage={xpBar.percent} />
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs text-white/40">Overall completion</p>
          <TrackerProgressBar percentage={profile.completion_percentage} />
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-heading text-xl font-semibold text-white">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-white/40">No activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentActivity.map((event) => (
                <li
                  key={event.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                >
                  <p className="font-medium text-white">{event.title}</p>
                  <p className="text-xs text-white/40">
                    {event.type.replace(/_/g, " ")} · {formatDate(event.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-heading text-xl font-semibold text-white">Achievements</h2>
          {achievements.length === 0 ? (
            <p className="text-sm text-white/40">No achievements unlocked yet.</p>
          ) : (
            <ul className="space-y-2">
              {achievements.map((ua) => (
                <li
                  key={ua.id}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                >
                  <Award className="size-5 shrink-0 text-gta-pink" />
                  <div>
                    <p className="font-medium text-white">{ua.achievement?.title}</p>
                    <p className="text-xs text-white/40">{ua.achievement?.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section id="saved-articles">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-semibold text-white">
            <Bookmark className="size-5 text-gta-cyan" />
            Saved Articles
          </h2>
          {savedArticles.length === 0 ? (
            <p className="text-sm text-white/40">No saved articles yet.</p>
          ) : (
            <ul className="space-y-2">
              {savedArticles.map((article) => (
                <li key={article.id}>
                  <Link
                    href={articleHref(article)}
                    className="block rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/12"
                  >
                    <p className="font-medium text-white">{article.title}</p>
                    <p className="text-xs text-white/40 capitalize">
                      {article.type} · saved {formatDate(article.created_at)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="saved-locations">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-semibold text-white">
            <MapPin className="size-5 text-gta-orange" />
            Saved Locations
          </h2>
          {savedLocations.length === 0 ? (
            <p className="text-sm text-white/40">No saved locations yet.</p>
          ) : (
            <ul className="space-y-2">
              {savedLocations.map((loc) => (
                <li key={loc.id}>
                  <Link
                    href="/map"
                    className="block rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/12"
                  >
                    <p className="font-medium text-white">{loc.title}</p>
                    <p className="text-xs text-white/40 capitalize">
                      {loc.type.replace(/_/g, " ")}
                      {loc.district ? ` · ${loc.district}` : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {communityStats && (
        <div className="mt-10">
          <CommunityProfileSection stats={communityStats} posts={communityPosts} />
        </div>
      )}

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-xl font-semibold text-white">Category Breakdown</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/tracker/${cat.slug}`}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-white/12"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium text-white">{cat.title}</p>
                <span className="font-mono text-sm text-white/50">{cat.percentage}%</span>
              </div>
              <TrackerProgressBar percentage={cat.percentage} size="sm" />
              <p className="mt-1 text-xs text-white/35">
                {cat.completed} / {cat.total} completed
              </p>
            </Link>
          ))}
        </div>
      </section>

      {!isOwner && (
        <p className="mt-8 text-center text-xs text-white/30">
          Public profile · /u/{profile.username}
        </p>
      )}
      {isOwner && (
        <p className="mt-8 text-center text-xs text-white/30">
          Public link:{" "}
          <Link href={`/u/${profile.username}`} className="text-gta-pink hover:underline">
            /u/{profile.username}
          </Link>
        </p>
      )}
    </div>
  );
}

function StatPill({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-white/60">
      {icon}
      {label}
    </span>
  );
}
