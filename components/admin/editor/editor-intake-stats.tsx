import type { BriefingIntake } from "@/lib/opportunity-engine/types";

interface EditorIntakeStatsProps {
  intake: BriefingIntake;
}

export function EditorIntakeStats({ intake }: EditorIntakeStatsProps) {
  const rows = [
    { label: "Rockstar", value: intake.rockstarPosts, suffix: "new posts" },
    { label: "YouTube", value: intake.youtubeVideos, suffix: "videos" },
    { label: "Reddit", value: intake.redditDiscussions, suffix: "discussions" },
    { label: "Newswire", value: intake.newswireUpdates, suffix: "updates" },
    { label: "Knowledge Graph", value: intake.affectedEntities, suffix: "affected entities" },
    { label: "Articles", value: intake.outdatedArticles, suffix: "outdated" },
  ];

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3"
          >
            <p className="text-xs uppercase tracking-wider text-white/40">{row.label}</p>
            <p className="mt-1 text-sm text-white/70">
              <span className="font-heading text-2xl font-semibold text-white">
                {row.value.toLocaleString()}
              </span>{" "}
              {row.suffix}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
