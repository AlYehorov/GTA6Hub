import type { EntityCoverageStat } from "@/lib/seo/types";

function barColor(percent: number): string {
  if (percent >= 70) return "bg-emerald-500";
  if (percent >= 40) return "bg-amber-500";
  return "bg-red-500";
}

export function ContentCoverageSection({
  coverage,
}: {
  coverage: EntityCoverageStat[];
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        Content Coverage
      </h2>
      <p className="mt-1 text-sm text-white/45">
        Published entities mentioned in at least one article
      </p>

      <ul className="mt-6 space-y-4">
        {coverage.map((stat) => (
          <li key={stat.kind}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white">{stat.label}</span>
              <span className="text-white/50">
                {stat.percent}% ({stat.coveredEntities}/{stat.publishedEntities})
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full ${barColor(stat.percent)}`}
                style={{ width: `${stat.percent}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
