import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { loadSeoIntelligenceData } from "@/lib/seo/loader";
import { ContentInventorySection } from "@/components/admin/seo-intelligence/content-inventory-section";
import { ImproveQueueSection } from "@/components/admin/seo-intelligence/improve-queue-section";
import { FreshnessMonitorSection } from "@/components/admin/seo-intelligence/freshness-monitor-section";
import { CannibalizationSection } from "@/components/admin/seo-intelligence/cannibalization-section";
import { KeywordOpportunitiesSection } from "@/components/admin/seo-intelligence/keyword-opportunities-section";
import { ContentCoverageSection } from "@/components/admin/seo-intelligence/content-coverage-section";
import { BrokenLinksSection } from "@/components/admin/seo-intelligence/broken-links-section";
import { WeeklySeoReportPanel } from "@/components/admin/seo-intelligence/weekly-report-panel";

export default async function SeoIntelligencePage() {
  const data = await loadSeoIntelligenceData();

  return (
    <>
      <PageHeader
        title="SEO Command Center"
        description="What should we improve today? Every article measured — deterministic intelligence, AI only on demand."
      />
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        {!data.configured && (
          <p className="rounded-lg border border-gta-pink/20 bg-gta-pink/5 px-4 py-3 text-sm text-gta-pink/80">
            Add SUPABASE_SERVICE_ROLE_KEY to enable SEO intelligence data.
          </p>
        )}

        {!data.openAiConfigured && (
          <p className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/50">
            OPENAI_API_KEY not set — AI Editor and Weekly Report use template fallbacks.
          </p>
        )}

        <WeeklySeoReportPanel />

        <ContentInventorySection inventory={data.inventory} />

        <ImproveQueueSection items={data.improveQueue} />

        <FreshnessMonitorSection flags={data.freshnessFlags} />

        <CannibalizationSection pairs={data.cannibalization} />

        <KeywordOpportunitiesSection opportunities={data.keywordOpportunities} />

        <ContentCoverageSection coverage={data.coverage} />

        <BrokenLinksSection links={data.brokenLinks} />

        <p className="text-center text-xs text-white/30">
          <Link href="/admin/workflow" className="hover:text-white/50">
            Editorial workflow
          </Link>
          {" · "}
          <Link href="/admin/dashboard" className="hover:text-white/50">
            Editorial dashboard
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
