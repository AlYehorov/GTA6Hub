import type { TodaySummary } from "@/lib/editorial/types";

const ITEMS: Array<{
  key: keyof TodaySummary;
  label: string;
}> = [
  { key: "newRockstarNews", label: "New Rockstar News" },
  { key: "newVideos", label: "New Videos" },
  { key: "redditDiscussions", label: "Reddit Discussions" },
  { key: "newAiDrafts", label: "New AI Drafts" },
  { key: "draftsWaitingReview", label: "Drafts Waiting Review" },
  { key: "publishedToday", label: "Published Today" },
  { key: "articlesUpdatedToday", label: "Articles Updated Today" },
];

export function TodaySummarySection({ summary }: { summary: TodaySummary }) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        Today&apos;s Summary
      </h2>
      <p className="mt-1 text-sm text-white/45">UTC day totals and queue depth</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ key, label }) => (
          <li
            key={key}
            className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3"
          >
            <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
            <p className="mt-1 font-heading text-2xl font-semibold text-white">
              {summary[key]}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
