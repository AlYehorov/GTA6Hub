import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { loadInsightsDashboard } from "@/lib/integrations/insights/loader";
import { InsightsDashboard } from "@/components/admin/insights/insights-dashboard";

export default async function InsightsPage() {
  const data = await loadInsightsDashboard();

  return (
    <>
      <PageHeader
        title="SEO Insights"
        description="Unified SEO control center — Search Console, GA4, and Clarity in one view."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {!data.configured && (
          <p className="mb-8 rounded-lg border border-gta-pink/20 bg-gta-pink/5 px-4 py-3 text-sm text-gta-pink/80">
            Add SUPABASE_SERVICE_ROLE_KEY to enable insights data.
          </p>
        )}
        <InsightsDashboard data={data} />
        <p className="mt-10 text-center text-xs text-white/30">
          <Link href="/admin/integrations/search-console" className="hover:text-white/50">
            Search Console
          </Link>
          {" · "}
          <Link href="/admin/integrations/analytics" className="hover:text-white/50">
            Analytics
          </Link>
          {" · "}
          <Link href="/admin/integrations/clarity" className="hover:text-white/50">
            Clarity
          </Link>
          {" · "}
          <Link href="/admin/seo" className="hover:text-white/50">
            SEO Command Center
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
