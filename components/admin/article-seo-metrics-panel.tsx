import Link from "next/link";
import type { ArticleSeoMetrics } from "@/lib/integrations/types";
import { CreateWorkspaceButton } from "@/components/admin/insights/create-workspace-button";

export function ArticleSeoMetricsPanel({
  metrics,
}: {
  metrics: ArticleSeoMetrics | null;
}) {
  if (!metrics) {
    return (
      <section className="mb-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-heading text-lg font-semibold text-white">SEO & traffic</h2>
        <p className="mt-2 text-sm text-white/45">
          Connect Search Console and sync from{" "}
          <Link href="/admin/insights" className="text-gta-pink hover:underline">
            SEO Insights
          </Link>{" "}
          to see organic performance for this article.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-white">SEO & traffic</h2>
          <p className="mt-1 text-sm text-white/45">Search Console + knowledge graph (28d)</p>
        </div>
        <CreateWorkspaceButton
          articleId={metrics.articleId}
          insightType="low_ctr"
          reason="Improve article from SEO metrics panel"
          label="Improve in workspace"
        />
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Organic clicks" value={metrics.organicClicks} />
        <Metric label="Impressions" value={metrics.impressions} />
        <Metric
          label="Avg position"
          value={metrics.averagePosition?.toFixed(1) ?? "—"}
        />
        <Metric label="CTR" value={`${(metrics.ctr * 100).toFixed(1)}%`} />
        <Metric label="SEO score" value={metrics.seoScore} />
        <Metric label="Entities" value={metrics.entityCount} />
        <Metric label="Internal links" value={metrics.internalLinkCount} />
        <Metric label="Trend" value={metrics.trafficTrend} />
      </dl>
      <p className="mt-4 text-xs text-white/30">
        <Link href="/admin/insights" className="hover:text-white/50">
          Full insights dashboard
        </Link>
      </p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/30 px-3 py-3">
      <dt className="text-xs text-white/40">{label}</dt>
      <dd className="mt-1 font-medium text-white">{value}</dd>
    </div>
  );
}
