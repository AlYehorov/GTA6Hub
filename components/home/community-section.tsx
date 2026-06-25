import Link from "next/link";
import { ArrowRight, Award, Users } from "lucide-react";
import { getCommunityStats } from "@/lib/profile/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function CommunitySection() {
  if (!isSupabaseConfigured()) return null;

  const stats = await getCommunityStats();
  if (stats.total_players === 0 && stats.latest_achievements.length === 0) return null;

  return (
    <section className="section-reveal px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-[2rem]">
              Community Progress
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/40 sm:text-[0.95rem]">
              Players tracking completion across Leonida
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1.5 text-sm text-gta-pink hover:underline"
          >
            View leaderboard
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<Users className="size-5 text-gta-pink" />}
            label="Registered players"
            value={stats.total_players.toLocaleString()}
          />
          <StatCard
            icon={<Award className="size-5 text-gta-pink" />}
            label="Average completion"
            value={`${stats.average_completion}%`}
          />
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:col-span-1">
            <p className="mb-3 text-xs uppercase tracking-wider text-white/40">Latest achievements</p>
            {stats.latest_achievements.length === 0 ? (
              <p className="text-sm text-white/40">None yet</p>
            ) : (
              <ul className="space-y-2">
                {stats.latest_achievements.slice(0, 3).map((a, i) => (
                  <li key={`${a.username}-${i}`} className="text-sm text-white/60">
                    <Link href={`/profile/${a.username}`} className="text-white hover:text-gta-pink">
                      @{a.username}
                    </Link>{" "}
                    — {a.achievement_title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="mb-3">{icon}</div>
      <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1 font-heading text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
