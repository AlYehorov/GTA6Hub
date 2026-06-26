import Link from "next/link";
import { PostCard } from "@/components/community/post-card";
import { PollCard } from "@/components/community/poll-card";
import type { CommunityFeedItem } from "@/lib/types/community";

interface CommunityFeedProps {
  items: CommunityFeedItem[];
}

export function CommunityFeed({ items }: CommunityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
        <p className="text-white/50">No community posts yet. Be the first to share.</p>
        <Link href="/community/new" className="mt-4 inline-block text-sm text-gta-pink hover:underline">
          Create a post
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {items.map((item) =>
        item.kind === "poll" && item.poll ? (
          <PollCard key={`poll-${item.poll.id}`} poll={item.poll} />
        ) : item.post ? (
          <PostCard key={item.post.id} post={item.post} />
        ) : null
      )}
    </div>
  );
}
