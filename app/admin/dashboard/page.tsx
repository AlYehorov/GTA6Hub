import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import {
  buildEditorialReportSnapshot,
  loadEditorialDashboardData,
} from "@/lib/editorial/dashboard-data";
import { getEditorialDailyReport } from "@/lib/editorial/daily-report";
import { TodaySummarySection } from "@/components/admin/editorial-dashboard/today-summary-section";
import { ContentOpportunitiesSection } from "@/components/admin/editorial-dashboard/content-opportunities-section";
import { MissingSeoPagesSection } from "@/components/admin/editorial-dashboard/missing-seo-pages-section";
import { OutdatedArticlesSection } from "@/components/admin/editorial-dashboard/outdated-articles-section";
import { InternalLinksSection } from "@/components/admin/editorial-dashboard/internal-links-section";
import { SeoHealthSection } from "@/components/admin/editorial-dashboard/seo-health-section";
import { OneClickActionsSection } from "@/components/admin/editorial-dashboard/one-click-actions-section";
import { DailyReportSection } from "@/components/admin/editorial-dashboard/daily-report-section";
import { WorkflowAttentionSection } from "@/components/admin/editorial-dashboard/workflow-attention-section";

export default async function EditorialDashboardPage() {
  const data = await loadEditorialDashboardData();
  const snapshot = buildEditorialReportSnapshot(data);
  const report = await getEditorialDailyReport({ snapshot });

  return (
    <>
      <PageHeader
        title="Editorial Dashboard"
        description="Your morning briefing — what happened, what to write, what to update, and what drives traffic."
      />
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        {!data.configured && (
          <p className="rounded-lg border border-gta-pink/20 bg-gta-pink/5 px-4 py-3 text-sm text-gta-pink/80">
            Add SUPABASE_SERVICE_ROLE_KEY to enable editorial data.
          </p>
        )}

        <DailyReportSection
          report={report}
          openAiConfigured={data.openAiConfigured}
        />

        <TodaySummarySection summary={data.summary} />

        <WorkflowAttentionSection />

        <ContentOpportunitiesSection opportunities={data.opportunities} />

        <MissingSeoPagesSection pages={data.missingPages} />

        <OutdatedArticlesSection articles={data.outdatedArticles} />

        <div id="internal-links">
          <InternalLinksSection suggestions={data.internalLinkSuggestions} />
        </div>

        <SeoHealthSection items={data.weakestSeo} />

        <OneClickActionsSection />

        <p className="text-center text-xs text-white/30">
          <Link href="/admin/insights" className="hover:text-white/50">
            SEO insights
          </Link>
          {" · "}
          <Link href="/admin/workflow" className="hover:text-white/50">
            Editorial workflow
          </Link>
          {" · "}
          <Link href="/admin/seo" className="hover:text-white/50">
            SEO command center
          </Link>
          {" · "}
          <Link href="/admin/editorial" className="hover:text-white/50">
            Legacy editorial calendar
          </Link>
          {" · "}
          <Link href="/admin" className="hover:text-white/50">
            Admin hub
          </Link>
        </p>
      </div>
    </>
  );
}
