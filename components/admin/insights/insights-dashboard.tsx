"use client";

import { useState } from "react";
import type { InsightsDashboardData } from "@/lib/integrations/types";
import {
  EmptyState,
  InsightSection,
  MetricGrid,
} from "@/components/admin/insights/insight-widgets";
import { CreateWorkspaceButton } from "@/components/admin/insights/create-workspace-button";
import { SyncButton } from "@/components/admin/integrations/sync-button";

function formatPct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export function InsightsDashboard({ data }: { data: InsightsDashboardData }) {
  const [summaryCopied, setSummaryCopied] = useState(false);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SyncButton source="all" label="Sync all integrations" />
        <div className="flex flex-wrap gap-4 text-xs text-white/40">
          <span>GSC: {data.lastSync.searchConsole ? new Date(data.lastSync.searchConsole).toLocaleString() : "Never"}</span>
          <span>GA4: {data.lastSync.analytics ? new Date(data.lastSync.analytics).toLocaleString() : "Never"}</span>
          <span>Clarity: {data.lastSync.clarity ? new Date(data.lastSync.clarity).toLocaleString() : "Never"}</span>
        </div>
      </div>

      {!data.integrationsConfigured.searchConsole &&
        !data.integrationsConfigured.analytics && (
          <p className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/50">
            Configure integrations in{" "}
            <a href="/admin/integrations/search-console" className="text-gta-pink hover:underline">
              Search Console
            </a>
            ,{" "}
            <a href="/admin/integrations/analytics" className="text-gta-pink hover:underline">
              Analytics
            </a>
            , or{" "}
            <a href="/admin/integrations/clarity" className="text-gta-pink hover:underline">
              Clarity
            </a>
            . See SEO_ANALYTICS_SETUP.md for setup steps.
          </p>
        )}

      <InsightSection title="Google Health" description="Index coverage and sitemap status">
        <MetricGrid
          items={[
            { label: "Indexed (est.)", value: data.googleHealth.indexed },
            { label: "Excluded", value: data.googleHealth.excluded },
            { label: "Errors", value: data.googleHealth.errors },
            { label: "Sitemap", value: data.googleHealth.sitemapStatus },
          ]}
        />
      </InsightSection>

      <InsightSection title="Traffic" description="Last 28 days from GA4">
        <MetricGrid
          items={[
            { label: "Users", value: data.traffic.users.toLocaleString() },
            { label: "Sessions", value: data.traffic.sessions.toLocaleString() },
            { label: "Organic", value: data.traffic.organic.toLocaleString() },
            { label: "Direct", value: data.traffic.direct.toLocaleString() },
            { label: "Referral", value: data.traffic.referral.toLocaleString() },
          ]}
        />
      </InsightSection>

      <InsightSection title="Search Performance" description="Last 28 days from Search Console">
        <MetricGrid
          items={[
            { label: "Impressions", value: data.searchPerformance.impressions.toLocaleString() },
            { label: "Clicks", value: data.searchPerformance.clicks.toLocaleString() },
            { label: "CTR", value: formatPct(data.searchPerformance.ctr) },
            {
              label: "Avg Position",
              value: data.searchPerformance.averagePosition.toFixed(1),
            },
          ]}
        />
      </InsightSection>

      <InsightSection title="Top Performing Pages" description="Top 20 by clicks">
        {data.topPerformingPages.length === 0 ? (
          <EmptyState message="Sync Search Console to load page performance." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-white/40">
                <tr>
                  <th className="pb-2 pr-4">Page</th>
                  <th className="pb-2 pr-4">Clicks</th>
                  <th className="pb-2 pr-4">Position</th>
                  <th className="pb-2">CTR</th>
                </tr>
              </thead>
              <tbody className="text-white/80">
                {data.topPerformingPages.map((page) => (
                  <tr key={page.page} className="border-t border-white/[0.06]">
                    <td className="max-w-xs truncate py-2 pr-4">{page.page}</td>
                    <td className="py-2 pr-4">{page.clicks}</td>
                    <td className="py-2 pr-4">{page.position.toFixed(1)}</td>
                    <td className="py-2">{formatPct(page.ctr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </InsightSection>

      <InsightSection
        title="Pages Losing Traffic"
        description="≥20% click drop vs previous 28 days — recommend review"
      >
        {data.pagesLosingTraffic.length === 0 ? (
          <EmptyState message="No significant traffic drops detected." />
        ) : (
          <ul className="space-y-3">
            {data.pagesLosingTraffic.map((page) => (
              <li
                key={page.path}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">{page.articleTitle ?? page.path}</p>
                  <p className="text-sm text-red-400">
                    {page.changePercent.toFixed(0)}% ({page.previousClicks} → {page.currentClicks} clicks)
                  </p>
                </div>
                {page.articleId && (
                  <CreateWorkspaceButton
                    articleId={page.articleId}
                    insightType="traffic_drop"
                    reason={`Traffic dropped ${Math.abs(page.changePercent).toFixed(0)}%`}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </InsightSection>

      <InsightSection title="Pages Rising" description="≥20% click gain vs previous period">
        {data.pagesRising.length === 0 ? (
          <EmptyState message="No rising pages in the current period." />
        ) : (
          <ul className="space-y-2">
            {data.pagesRising.map((page) => (
              <li
                key={page.path}
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm"
              >
                <span className="text-white">{page.articleTitle ?? page.path}</span>
                <span className="ml-2 text-emerald-400">+{page.changePercent.toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        )}
      </InsightSection>

      <InsightSection
        title="Low CTR Opportunities"
        description="High impressions, low CTR — improve title, meta, FAQ, internal links"
      >
        {data.lowCtrOpportunities.length === 0 ? (
          <EmptyState message="No low-CTR pages detected." />
        ) : (
          <ul className="space-y-3">
            {data.lowCtrOpportunities.map((opp) => (
              <li
                key={opp.path}
                className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{opp.articleTitle ?? opp.path}</p>
                    <p className="text-sm text-white/50">
                      {opp.impressions.toLocaleString()} impressions · CTR {formatPct(opp.ctr)}
                    </p>
                    <p className="mt-1 text-xs text-white/40">{opp.suggestions.join(" · ")}</p>
                  </div>
                  {opp.articleId && (
                    <CreateWorkspaceButton
                      articleId={opp.articleId}
                      insightType="low_ctr"
                      reason="Low CTR — improve title and meta"
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </InsightSection>

      <InsightSection
        title="Low Position Opportunities"
        description="Ranking positions 8–20 — expand content and entities"
      >
        {data.lowPositionOpportunities.length === 0 ? (
          <EmptyState message="No striking-distance pages found." />
        ) : (
          <ul className="space-y-3">
            {data.lowPositionOpportunities.map((opp) => (
              <li
                key={opp.path}
                className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{opp.articleTitle ?? opp.path}</p>
                    <p className="text-sm text-white/50">
                      Position {opp.position.toFixed(1)} · {opp.impressions} impressions
                    </p>
                  </div>
                  {opp.articleId && (
                    <CreateWorkspaceButton
                      articleId={opp.articleId}
                      insightType="low_position"
                      reason={`Striking distance — position ${opp.position.toFixed(1)}`}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </InsightSection>

      <InsightSection title="Crawl Issues" description="Sitemap errors and broken internal links">
        {data.crawlIssues.length === 0 ? (
          <EmptyState message="No crawl issues detected." />
        ) : (
          <ul className="space-y-2 text-sm text-white/70">
            {data.crawlIssues.map((issue, i) => (
              <li key={`${issue.url}-${i}`} className="rounded-lg bg-black/30 px-3 py-2">
                <span className="text-gta-pink">{issue.type}</span> — {issue.url}
                <span className="text-white/40"> · {issue.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </InsightSection>

      <InsightSection title="Article Performance" description="Organic clicks, entities, SEO score">
        {data.articleMetrics.length === 0 ? (
          <EmptyState message="No article metrics yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-white/40">
                <tr>
                  <th className="pb-2 pr-4">Article</th>
                  <th className="pb-2 pr-4">Clicks</th>
                  <th className="pb-2 pr-4">Position</th>
                  <th className="pb-2 pr-4">SEO</th>
                  <th className="pb-2 pr-4">Entities</th>
                  <th className="pb-2">Links</th>
                </tr>
              </thead>
              <tbody className="text-white/80">
                {data.articleMetrics.map((row) => (
                  <tr key={row.articleId} className="border-t border-white/[0.06]">
                    <td className="max-w-xs truncate py-2 pr-4">
                      <a
                        href={`/admin/articles/${row.articleId}?focus=seo`}
                        className="hover:text-gta-pink"
                      >
                        {row.title}
                      </a>
                    </td>
                    <td className="py-2 pr-4">{row.organicClicks}</td>
                    <td className="py-2 pr-4">
                      {row.averagePosition?.toFixed(1) ?? "—"}
                    </td>
                    <td className="py-2 pr-4">{row.seoScore}</td>
                    <td className="py-2 pr-4">{row.entityCount}</td>
                    <td className="py-2">{row.internalLinkCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </InsightSection>

      <InsightSection title="Weekly SEO Summary" description="One-click report">
        {data.weeklySummary ? (
          <div>
            <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-4 text-sm text-white/70 whitespace-pre-wrap">
              {data.weeklySummary}
            </pre>
            <button
              type="button"
              className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-sm text-white hover:border-gta-pink/40"
              onClick={async () => {
                await navigator.clipboard.writeText(data.weeklySummary ?? "");
                setSummaryCopied(true);
              }}
            >
              {summaryCopied ? "Copied!" : "Copy report"}
            </button>
          </div>
        ) : (
          <EmptyState message="Run a sync to generate the weekly summary." />
        )}
      </InsightSection>
    </div>
  );
}
