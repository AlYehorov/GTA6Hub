"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { voteCommunityPoll } from "@/lib/actions/community";
import type { CommunityPoll } from "@/lib/types/community";
import { cn } from "@/lib/utils";

interface PollCardProps {
  poll: CommunityPoll;
}

export function PollCard({ poll }: PollCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const hasVoted = Boolean(poll.user_vote_option_id);
  const showResults = hasVoted || !poll.show_results_after_vote;

  function vote(optionId: string) {
    startTransition(async () => {
      const result = await voteCommunityPoll(poll.id, optionId);
      if (result.error === "login_required") {
        router.push("/login?next=/community");
        return;
      }
      router.refresh();
    });
  }

  return (
    <article className="rounded-2xl border border-gta-pink/20 bg-gta-pink/5 p-5">
      <p className="text-xs uppercase tracking-wider text-gta-pink/80">Community Poll</p>
      <h3 className="mt-1 font-heading text-lg font-semibold text-white">{poll.title}</h3>
      {poll.description && <p className="mt-2 text-sm text-white/55">{poll.description}</p>}

      <div className="mt-4 space-y-2">
        {poll.options.map((option) => {
          const percent =
            poll.total_votes > 0
              ? Math.round((option.vote_count / poll.total_votes) * 100)
              : 0;
          const selected = poll.user_vote_option_id === option.id;

          return (
            <button
              key={option.id}
              type="button"
              disabled={pending || (hasVoted && !selected)}
              onClick={() => vote(option.id)}
              className={cn(
                "relative w-full overflow-hidden rounded-xl border px-4 py-3 text-left text-sm transition-colors min-h-11",
                selected
                  ? "border-gta-pink/40 bg-gta-pink/10 text-white"
                  : "border-white/10 bg-black/20 text-white/75 hover:border-white/20"
              )}
            >
              {showResults && (
                <span
                  className="absolute inset-y-0 left-0 bg-gta-pink/15"
                  style={{ width: `${percent}%` }}
                />
              )}
              <span className="relative flex items-center justify-between gap-3">
                <span>{option.label}</span>
                {showResults && <span className="text-xs text-white/50">{percent}%</span>}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-white/40">
        {poll.total_votes.toLocaleString()} votes
        {!hasVoted && poll.show_results_after_vote ? " · Vote to see results" : ""}
      </p>
    </article>
  );
}
