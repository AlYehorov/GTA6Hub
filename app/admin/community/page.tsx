import { AdminCommunityForms } from "@/components/admin/admin-community-forms";
import { AdminCommunityPanel } from "@/components/admin/admin-community-panel";
import { PageHeader } from "@/components/shared/page-header";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import {
  getCommunityContestsAdmin,
  getCommunityPollsAdmin,
  getCommunityPostsAdmin,
} from "@/lib/community/queries";

export default async function AdminCommunityPage() {
  const configured = isSupabaseAdminConfigured();
  const [pendingPosts, allPosts, polls, contests] = configured
    ? await Promise.all([
        getCommunityPostsAdmin("pending"),
        getCommunityPostsAdmin(),
        getCommunityPollsAdmin(),
        getCommunityContestsAdmin(),
      ])
    : [[], [], [], []];

  return (
    <>
      <PageHeader
        title="Community moderation"
        description="Approve posts, feature highlights, manage polls and weekly contests."
      />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        {!configured && (
          <p className="rounded-lg border border-gta-pink/20 bg-gta-pink/5 px-4 py-3 text-sm text-gta-pink/80">
            Add `SUPABASE_SERVICE_ROLE_KEY` to enable community moderation.
          </p>
        )}

        <AdminCommunityForms />
        <AdminCommunityPanel posts={pendingPosts} polls={polls} contests={contests} />

        <section>
          <h2 className="mb-4 font-heading text-lg font-semibold text-white">All posts</h2>
          <div className="space-y-2 text-sm text-white/50">
            {allPosts.slice(0, 20).map((post) => (
              <p key={post.id}>
                {post.title} — {post.status} — @{post.author?.username}
              </p>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
