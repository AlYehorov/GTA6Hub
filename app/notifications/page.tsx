import { redirect } from "next/navigation";
import { NotificationList } from "@/components/community/notification-list";
import { PageHeader } from "@/components/shared/page-header";
import { getNotifications } from "@/lib/community/queries";
import { createClient } from "@/lib/supabase/server";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Notifications",
  description: "Community notifications — likes, replies, and contest wins.",
  path: "/notifications",
});

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/notifications");

  const notifications = await getNotifications(user.id);

  return (
    <>
      <PageHeader title="Notifications" description="Likes, replies, and community updates." />
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <NotificationList notifications={notifications} />
      </div>
    </>
  );
}
