import Link from "next/link";
import { ArrowRight, Camera, Heart, Trophy, Vote } from "lucide-react";
import { getCommunityHighlights } from "@/lib/community/queries";

export async function CommunityHighlightsSection() {
  const highlights = await getCommunityHighlights();
  if (!highlights) return null;

  const { latest_screenshot, most_liked_post, active_poll, active_contest } = highlights;
  const hasContent = latest_screenshot || most_liked_post || active_poll || active_contest;
  if (!hasContent) return null;

  return (
    <section className="section-reveal px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-[2rem]">
              Community Highlights
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/40 sm:text-[0.95rem]">
              Screenshots, theories, discoveries, and polls from Leonida players
            </p>
          </div>
          <Link
            href="/community"
            className="inline-flex items-center gap-1.5 text-sm text-gta-pink hover:underline"
          >
            Visit community
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {latest_screenshot && (
            <HighlightCard
              href={`/community/${latest_screenshot.id}`}
              icon={<Camera className="size-5 text-gta-pink" />}
              label="Latest screenshot"
              title={latest_screenshot.title}
              image={latest_screenshot.image_url}
            />
          )}
          {most_liked_post && (
            <HighlightCard
              href={`/community/${most_liked_post.id}`}
              icon={<Heart className="size-5 text-gta-pink" />}
              label="Most liked"
              title={most_liked_post.title}
              meta={`${most_liked_post.like_count} likes`}
            />
          )}
          {active_poll && (
            <HighlightCard
              href="/community"
              icon={<Vote className="size-5 text-gta-pink" />}
              label="Current poll"
              title={active_poll.title}
              meta={`${active_poll.total_votes} votes`}
            />
          )}
          {active_contest && (
            <HighlightCard
              href="/community/contest"
              icon={<Trophy className="size-5 text-gta-pink" />}
              label="Screenshot of the Week"
              title={active_contest.title}
              meta={`${active_contest.entries?.length ?? 0} entries`}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function HighlightCard({
  href,
  icon,
  label,
  title,
  image,
  meta,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  title: string;
  image?: string | null;
  meta?: string;
}) {
  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-colors hover:border-white/12 hover:bg-white/[0.04]"
    >
      {image && (
        <div className="aspect-video overflow-hidden bg-black/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        </div>
      )}
      <div className="p-5">
        <div className="mb-3">{icon}</div>
        <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
        <p className="mt-1 line-clamp-2 font-medium text-white">{title}</p>
        {meta && <p className="mt-2 text-xs text-white/45">{meta}</p>}
      </div>
    </Link>
  );
}
