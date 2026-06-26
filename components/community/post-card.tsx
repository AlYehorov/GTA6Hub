"use client";

import Link from "next/link";
import { MessageCircle, Sparkles } from "lucide-react";
import { LikeButton } from "@/components/community/like-button";
import { SpoilerReveal } from "@/components/community/spoiler-reveal";
import { COMMUNITY_POST_TYPE_LABELS } from "@/lib/types/community";
import type { CommunityPost } from "@/lib/types/community";

interface PostCardProps {
  post: CommunityPost;
  compact?: boolean;
}

export function PostCard({ post, compact }: PostCardProps) {
  const authorName = post.author?.display_name || post.author?.username || "Player";

  return (
    <article className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <Link href={`/u/${post.author?.username ?? ""}`} className="text-sm font-medium text-white hover:text-gta-pink">
            @{post.author?.username}
          </Link>
          <p className="text-xs text-white/40">{authorName}</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/50">
          {COMMUNITY_POST_TYPE_LABELS[post.type]}
        </span>
      </div>

      <Link href={`/community/${post.id}`} className="block">
        <SpoilerReveal containsSpoilers={post.contains_spoilers}>
          {post.image_url && (
            <div className="aspect-video w-full overflow-hidden bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.image_url} alt={post.title} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="space-y-2 px-4 py-4 sm:px-5">
            <h3 className={`font-heading font-semibold text-white ${compact ? "text-base" : "text-lg"}`}>
              {post.title}
            </h3>
            {post.body && !compact && (
              <p className="line-clamp-3 text-sm text-white/60">{post.body}</p>
            )}
          </div>
        </SpoilerReveal>
      </Link>

      {(post.related_map_point || post.related_article || post.related_tracker_item) && (
        <div className="flex flex-wrap gap-2 px-4 pb-3 sm:px-5">
          {post.related_map_point && (
            <Link href="/map" className="rounded-full bg-white/5 px-2 py-1 text-xs text-white/50 hover:text-gta-pink">
              Map: {post.related_map_point.title}
            </Link>
          )}
          {post.related_article && (
            <Link
              href={post.related_article.type === "guide" ? `/guides/${post.related_article.slug}` : `/news/${post.related_article.slug}`}
              className="rounded-full bg-white/5 px-2 py-1 text-xs text-white/50 hover:text-gta-pink"
            >
              Article: {post.related_article.title}
            </Link>
          )}
          {post.related_tracker_item && (
            <Link href={`/tracker`} className="rounded-full bg-white/5 px-2 py-1 text-xs text-white/50 hover:text-gta-pink">
              Tracker: {post.related_tracker_item.title}
            </Link>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-white/[0.06] px-4 py-3 sm:px-5">
        <LikeButton postId={post.id} initialCount={post.like_count} initiallyLiked={post.liked_by_me} />
        <Link
          href={`/community/${post.id}#comments`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/60 hover:text-white"
        >
          <MessageCircle className="size-4" />
          {post.comment_count}
        </Link>
        {post.featured && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-amber-400">
            <Sparkles className="size-3.5" />
            Featured
          </span>
        )}
      </div>
    </article>
  );
}
