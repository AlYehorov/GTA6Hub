import { redirect } from "next/navigation";
import { CreatePostForm } from "@/components/community/create-post-form";
import { PageHeader } from "@/components/shared/page-header";
import { createClient } from "@/lib/supabase/server";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Create Community Post",
  description: "Share a screenshot, theory, discovery, or discussion with the GTA VI community.",
  path: "/community/new",
});

export default async function CreateCommunityPostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/community/new");

  return (
    <>
      <PageHeader title="Create post" description="Share with the Leonida community." />
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <CreatePostForm />
      </div>
    </>
  );
}
