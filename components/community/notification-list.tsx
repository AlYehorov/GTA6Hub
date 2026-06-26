"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { markNotificationsRead } from "@/lib/actions/community";
import type { CommunityNotification } from "@/lib/types/community";

interface NotificationListProps {
  notifications: CommunityNotification[];
}

export function NotificationList({ notifications }: NotificationListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function markAllRead() {
    startTransition(async () => {
      await markNotificationsRead();
      router.refresh();
    });
  }

  if (notifications.length === 0) {
    return <p className="text-sm text-white/40">No notifications yet.</p>;
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        disabled={pending}
        onClick={markAllRead}
        className="text-sm text-gta-pink hover:underline disabled:opacity-50"
      >
        Mark all as read
      </button>

      <ul className="space-y-3">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`rounded-xl border p-4 ${
              n.read_at ? "border-white/[0.06] bg-white/[0.02]" : "border-gta-pink/20 bg-gta-pink/5"
            }`}
          >
            {n.link ? (
              <Link href={n.link} className="block hover:text-gta-pink">
                <p className="font-medium text-white">{n.title}</p>
                {n.body && <p className="mt-1 text-sm text-white/55">{n.body}</p>}
              </Link>
            ) : (
              <>
                <p className="font-medium text-white">{n.title}</p>
                {n.body && <p className="mt-1 text-sm text-white/55">{n.body}</p>}
              </>
            )}
            <time className="mt-2 block text-xs text-white/35">
              {new Date(n.created_at).toLocaleString()}
            </time>
          </li>
        ))}
      </ul>
    </div>
  );
}
