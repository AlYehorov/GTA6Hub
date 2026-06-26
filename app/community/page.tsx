import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCommunityFeed } from "@/lib/community/queries";
import { CommunityFeed } from "@/components/community/community-feed";
import { PageHeader } from "@/components/shared/page-header";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Community — GTA VI Hub",
  description: "Screenshots, theories, discoveries, polls, and discussions from the GTA VI community.",
  path: "/community",
});

export default async function CommunityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const feed = await getCommunityFeed(30, user?.id ?? null);

  return (
    <>
      <PageHeader
        title="Community"
        description="Screenshots, discoveries, theories, collections, and polls — newest first."
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/community/new"
            className="inline-flex min-h-11 items-center rounded-lg bg-gta-pink px-4 py-2 text-sm font-medium text-white"
          >
            Create post
          </Link>
          <Link
            href="/community/contest"
            className="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:text-white"
          >
            Screenshot of the Week
          </Link>
        </div>
        <CommunityFeed items={feed} />
      </div>
    </>
  );
}
