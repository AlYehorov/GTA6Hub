import Link from "next/link";
import {
  Award,
  Calendar,
  Gem,
  Trophy,
  User as UserIcon,
} from "lucide-react";
import { TrackerProgressBar } from "@/components/tracker/tracker-progress-bar";
import {
  getCategoryBreakdown,
  getProfileWithStats,
  getRecentProgress,
  getUserAchievements,
} from "@/lib/profile/queries";
import { notFound } from "next/navigation";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const profile = await getProfileWithStats(username);

  if (!profile) notFound();

  const [achievements, recent, categories] = await Promise.all([
    getUserAchievements(profile.id),
    getRecentProgress(profile.id, 5),
    getCategoryBreakdown(profile.id),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gta-pink/10 text-gta-pink">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="size-full object-cover"
              />
            ) : (
              <UserIcon className="size-10" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-3xl font-bold text-white">@{profile.username}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/50">
              <Calendar className="size-3.5" />
              Joined {formatDate(profile.created_at)}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <StatPill icon={<Trophy className="size-3.5" />} label={`${profile.completion_percentage}% complete`} />
              <StatPill icon={<Award className="size-3.5" />} label={`${profile.achievements_unlocked} achievements`} />
              <StatPill icon={<Gem className="size-3.5" />} label={`${profile.collectibles_found} collectibles`} />
              {profile.favorite_category && (
                <StatPill label={`Favorite: ${profile.favorite_category.title}`} />
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-heading text-4xl font-bold text-white">{profile.completion_percentage}%</p>
            <p className="text-sm text-white/40">
              {profile.completed_items} / {profile.total_items} items
            </p>
          </div>
        </div>
        <TrackerProgressBar percentage={profile.completion_percentage} className="mt-6" />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-heading text-xl font-semibold text-white">Recent Progress</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-white/40">No completed items yet.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((item, i) => (
                <li
                  key={`${item.title}-${i}`}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                >
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="text-xs text-white/40">
                    {item.category} · {formatDate(item.completed_at)}
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

      <p className="mt-8 text-center text-xs text-white/30">
        Share this profile: /profile/{profile.username}
      </p>
    </div>
  );
}

function StatPill({
  icon,
  label,
}: {
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-white/60">
      {icon}
      {label}
    </span>
  );
}
