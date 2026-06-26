import Link from "next/link";
import { Heart, Camera, Sparkles, Trophy } from "lucide-react";
import { PostCard } from "@/components/community/post-card";
import type { CommunityPost, CommunityProfileStats } from "@/lib/types/community";

interface CommunityProfileSectionProps {
  stats: CommunityProfileStats;
  posts: CommunityPost[];
}

export function CommunityProfileSection({ stats, posts }: CommunityProfileSectionProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-white">Community</h2>
        <p className="mt-1 text-sm text-white/45">Screenshots, posts, and reputation</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat icon={<Sparkles className="size-4 text-gta-pink" />} label="Reputation" value={stats.community_reputation} />
        <Stat icon={<Camera className="size-4 text-gta-pink" />} label="Posts" value={stats.post_count} />
        <Stat icon={<Camera className="size-4 text-gta-pink" />} label="Screenshots" value={stats.screenshot_count} />
        <Stat icon={<Heart className="size-4 text-gta-pink" />} label="Likes received" value={stats.likes_received} />
        <Stat icon={<Trophy className="size-4 text-gta-pink" />} label="Contest wins" value={stats.contest_wins} />
      </div>

      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.slice(0, 6).map((post) => (
            <PostCard key={post.id} post={post} compact />
          ))}
          <Link href="/community" className="text-sm text-gta-pink hover:underline">
            View community feed
          </Link>
        </div>
      ) : (
        <p className="text-sm text-white/40">No published community posts yet.</p>
      )}
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-2">{icon}</div>
      <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-white">{value.toLocaleString()}</p>
    </div>
  );
}
