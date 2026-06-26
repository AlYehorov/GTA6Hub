"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PostCard } from "@/components/community/post-card";
import { voteContestEntry } from "@/lib/actions/community";
import type { CommunityContest } from "@/lib/types/community";

interface ContestLeaderboardProps {
  contest: CommunityContest;
}

export function ContestLeaderboard({ contest }: ContestLeaderboardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function vote(postId: string) {
    startTransition(async () => {
      const result = await voteContestEntry(contest.id, postId);
      if (result.error === "login_required") {
        router.push("/login?next=/community/contest");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <p className="text-xs uppercase tracking-wider text-gta-pink/80">Screenshot of the Week</p>
        <h2 className="mt-1 font-heading text-2xl font-semibold text-white">{contest.title}</h2>
        <p className="mt-2 text-sm text-white/50">
          {contest.week_start} — {contest.week_end}
        </p>
        {contest.winning_post && (
          <p className="mt-3 text-sm text-amber-400">
            Winner: {contest.winning_post.title}
          </p>
        )}
      </div>

      {contest.entries && contest.entries.length > 0 ? (
        <ol className="space-y-4">
          {contest.entries.map((entry, index) => (
            <li key={entry.post.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="font-heading text-lg font-bold text-gta-pink">#{index + 1}</span>
                <span className="text-sm text-white/50">{entry.vote_count} votes</span>
                {contest.status === "voting" && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => vote(entry.post.id)}
                    className={`rounded-lg border px-3 py-2 text-xs min-h-11 ${
                      entry.voted_by_me
                        ? "border-gta-pink/40 bg-gta-pink/10 text-gta-pink"
                        : "border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    {entry.voted_by_me ? "Voted" : "Vote"}
                  </button>
                )}
              </div>
              <PostCard post={entry.post} compact />
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-white/40">
          No contest entries yet. Submit a screenshot and link it to this contest.
        </p>
      )}
    </div>
  );
}
