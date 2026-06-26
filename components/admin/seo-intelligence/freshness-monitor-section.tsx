import Link from "next/link";
import type { FreshnessFlag } from "@/lib/seo/types";

export function FreshnessMonitorSection({
  flags,
}: {
  flags: FreshnessFlag[];
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        Freshness Monitor
      </h2>
      <p className="mt-1 text-sm text-white/45">
        Articles older than 30 days with newer Rockstar sources
      </p>

      {flags.length === 0 ? (
        <p className="mt-6 text-sm text-white/40">No stale articles flagged.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {flags.map((flag) => (
            <li
              key={flag.articleId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-sm"
            >
              <div>
                <span className="rounded bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-300">
                  Needs Update
                </span>
                <p className="mt-2 font-medium text-white">{flag.title}</p>
                <p className="mt-1 text-xs text-white/40">
                  {flag.daysSinceUpdate} days since update · New:{" "}
                  {flag.newestRockstarSourceTitle}
                </p>
              </div>
              <Link
                href={`/admin/articles/${flag.articleId}?focus=content`}
                className="text-xs text-gta-pink hover:underline"
              >
                Update →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
