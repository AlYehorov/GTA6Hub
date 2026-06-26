"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { moderateCommunityPost } from "@/lib/actions/community";
import { COMMUNITY_POST_STATUS_LABELS, COMMUNITY_POST_TYPE_LABELS } from "@/lib/types/community";
import type { CommunityContest, CommunityPoll, CommunityPost } from "@/lib/types/community";

interface AdminCommunityPanelProps {
  posts: CommunityPost[];
  polls: CommunityPoll[];
  contests: CommunityContest[];
}

export function AdminCommunityPanel({ posts, polls, contests }: AdminCommunityPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function moderate(postId: string, action: "approve" | "reject" | "delete" | "feature") {
    startTransition(async () => {
      await moderateCommunityPost(postId, action);
      router.refresh();
    });
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 font-heading text-xl font-semibold text-white">Moderation queue</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-white/40">No posts in queue.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{post.title}</p>
                    <p className="text-xs text-white/45">
                      @{post.author?.username} · {COMMUNITY_POST_TYPE_LABELS[post.type]} ·{" "}
                      {COMMUNITY_POST_STATUS_LABELS[post.status]}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {post.status === "pending" && (
                      <>
                        <ActionButton disabled={pending} onClick={() => moderate(post.id, "approve")}>
                          Approve
                        </ActionButton>
                        <ActionButton disabled={pending} onClick={() => moderate(post.id, "reject")}>
                          Reject
                        </ActionButton>
                      </>
                    )}
                    {post.status === "approved" && (
                      <ActionButton disabled={pending} onClick={() => moderate(post.id, "feature")}>
                        Feature
                      </ActionButton>
                    )}
                    <ActionButton disabled={pending} onClick={() => moderate(post.id, "delete")}>
                      Delete
                    </ActionButton>
                    <Link href={`/community/${post.id}`} className="text-xs text-gta-pink hover:underline">
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-heading text-xl font-semibold text-white">Polls</h2>
        {polls.length === 0 ? (
          <p className="text-sm text-white/40">No polls yet.</p>
        ) : (
          <ul className="space-y-2 text-sm text-white/60">
            {polls.map((poll) => (
              <li key={poll.id}>
                {poll.title} — {poll.status} — {poll.total_votes} votes
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-heading text-xl font-semibold text-white">Contests</h2>
        {contests.length === 0 ? (
          <p className="text-sm text-white/40">No contests yet.</p>
        ) : (
          <div className="space-y-4">
            {contests.map((contest) => (
              <div key={contest.id} className="rounded-xl border border-white/[0.06] p-4">
                <p className="font-medium text-white">{contest.title}</p>
                <p className="text-xs text-white/45">
                  {contest.week_start} — {contest.week_end} · {contest.status}
                </p>
                {contest.status === "voting" && (
                  <p className="mt-2 text-xs text-white/40">
                    Pick winner from approved contest screenshots in the moderation queue, then use post ID below.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:text-white disabled:opacity-50"
    >
      {children}
    </button>
  );
}
