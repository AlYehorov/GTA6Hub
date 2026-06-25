import Link from "next/link";
import { Award, Trophy, Zap } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { getLeaderboardData } from "@/lib/profile/queries";
import type { LeaderboardEntry } from "@/lib/types/profile";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "GTA 6 Leaderboard",
  description:
    "GTA 6 progress tracker leaderboard — top completion percentages, most achievements, and newest completions across Leonida.",
  path: "/leaderboard",
});

export default async function LeaderboardPage() {
  const data = await getLeaderboardData();

  return (
    <>
      <PageHeader
        title="Leaderboard"
        description="Top players by completion, achievements, and recent progress across Leonida."
      />
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <LeaderboardCard
            title="Top Completion"
            icon={<Trophy className="size-5 text-gta-pink" />}
            empty="No ranked players yet."
            entries={data.top_completion}
          />
          <LeaderboardCard
            title="Most Achievements"
            icon={<Award className="size-5 text-gta-pink" />}
            empty="No achievements unlocked yet."
            entries={data.most_achievements}
          />
        </div>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <Zap className="size-5 text-gta-pink" />
            <h2 className="font-heading text-xl font-semibold text-white">Newest Completions</h2>
          </div>
          {data.newest_completions.length === 0 ? (
            <p className="text-sm text-white/40">No recent completions yet.</p>
          ) : (
            <div className="space-y-2">
              {data.newest_completions.map((entry, i) => (
                <div
                  key={`${entry.username}-${entry.item_title}-${i}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                >
                  <div>
                    <Link
                      href={`/u/${entry.username}`}
                      className="font-medium text-white hover:text-gta-pink"
                    >
                      @{entry.username}
                    </Link>
                    <p className="text-sm text-white/50">
                      {entry.item_title} · {entry.category_title}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-white/35">
                    {new Date(entry.completed_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function LeaderboardCard({
  title,
  icon,
  empty,
  entries,
}: {
  title: string;
  icon: React.ReactNode;
  empty: string;
  entries: LeaderboardEntry[];
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="font-heading text-xl font-semibold text-white">{title}</h2>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-white/40">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry, i) => (
            <LeaderboardRow
              key={entry.user_id}
              rank={i + 1}
              username={entry.username}
              value={entry.label}
              href={`/u/${entry.username}`}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function LeaderboardRow({
  rank,
  username,
  value,
  href,
}: {
  rank: number;
  username: string;
  value: string;
  href: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <span className="w-6 font-mono text-sm text-white/40">#{rank}</span>
      <Link href={href} className="flex flex-1 items-center gap-2 hover:text-gta-pink">
        <span className="font-medium text-white">@{username}</span>
      </Link>
      <span className="text-sm text-white/50">{value}</span>
    </li>
  );
}
