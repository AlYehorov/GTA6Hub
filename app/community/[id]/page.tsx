import { notFound } from "next/navigation";
import Link from "next/link";
import { PostCard } from "@/components/community/post-card";
import { CommentThread } from "@/components/community/comment-thread";
import { CommunityMarkdown } from "@/components/community/spoiler-reveal";
import { PageHeader } from "@/components/shared/page-header";
import { getCommunityComments, getCommunityPostById } from "@/lib/community/queries";
import { createClient } from "@/lib/supabase/server";
import { createPageMetadata } from "@/lib/metadata";
import { COMMUNITY_POST_STATUS_LABELS } from "@/lib/types/community";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PostPageProps) {
  const { id } = await params;
  const post = await getCommunityPostById(id);
  if (!post) return { title: "Post not found" };
  return createPageMetadata({
    title: post.title,
    description: post.body?.slice(0, 160) ?? `Community post on GTAVIHub`,
    path: `/community/${id}`,
  });
}

export default async function CommunityPostPage({ params }: PostPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const post = await getCommunityPostById(id, user?.id ?? null);
  if (!post) notFound();

  const isOwner = user?.id === post.user_id;
  if (post.status !== "approved" && !isOwner) notFound();

  const comments = post.status === "approved" ? await getCommunityComments(id) : [];

  return (
    <>
      <PageHeader title={post.title} description={`@${post.author?.username}`} />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {post.status !== "approved" && (
          <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            Status: {COMMUNITY_POST_STATUS_LABELS[post.status]} — visible only to you until approved.
          </p>
        )}

        <PostCard post={post} />

        {post.body && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <CommunityMarkdown content={post.body} containsSpoilers={post.contains_spoilers} />
          </div>
        )}

        {post.status === "approved" && <CommentThread postId={id} comments={comments} />}

        <Link href="/community" className="text-sm text-gta-pink hover:underline">
          ← Back to community
        </Link>
      </div>
    </>
  );
}
