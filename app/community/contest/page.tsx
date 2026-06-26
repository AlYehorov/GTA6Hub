import Link from "next/link";
import { ContestLeaderboard } from "@/components/community/contest-leaderboard";
import { PageHeader } from "@/components/shared/page-header";
import { getActiveContest } from "@/lib/community/queries";
import { createClient } from "@/lib/supabase/server";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Screenshot of the Week",
  description: "Vote for the best GTA VI community screenshot of the week.",
  path: "/community/contest",
});

export default async function CommunityContestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const contest = await getActiveContest();
  const enriched = contest ? await import("@/lib/community/queries").then((m) =>
    m.getContestWithEntries(contest.id, user?.id ?? null)
  ) : null;

  return (
    <>
      <PageHeader
        title="Screenshot of the Week"
        description="Community voting and weekly highlights."
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {enriched ? (
          <ContestLeaderboard contest={enriched} />
        ) : (
          <p className="text-sm text-white/50">No active contest right now. Check back soon.</p>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/community/new" className="text-sm text-gta-pink hover:underline">
            Submit a screenshot
          </Link>
          <Link href="/community" className="text-sm text-white/50 hover:text-white">
            Community feed
          </Link>
        </div>
      </div>
    </>
  );
}
