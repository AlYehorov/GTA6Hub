import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { ContentEngineUsageBar } from "@/components/admin/content-engine/content-engine-usage-bar";
import { EditorIntakeStats } from "@/components/admin/editor/editor-intake-stats";
import { OpportunitiesSection } from "@/components/admin/editor/opportunities-section";
import { WeeklyGapsSection } from "@/components/admin/editor/weekly-gaps-section";
import { TrendingKeywordsSection } from "@/components/admin/editor/trending-keywords-section";
import { EditorialRecommendationSection } from "@/components/admin/editor/editorial-recommendation-section";
import { loadEditorBriefing } from "@/lib/opportunity-engine/loader";

export default async function EditorPage() {
  const data = await loadEditorBriefing();

  return (
    <>
      <PageHeader
        title="Editor-in-Chief"
        description="Morning briefing — scored opportunities, not raw source noise."
      />
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        {!data.configured && (
          <p className="rounded-lg border border-gta-pink/20 bg-gta-pink/5 px-4 py-3 text-sm text-gta-pink/80">
            Apply migrations 015–016 and add SUPABASE_SERVICE_ROLE_KEY.
          </p>
        )}

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <p className="font-heading text-2xl font-semibold text-white">
            Good morning, {data.adminName}.
          </p>
          <p className="mt-2 text-sm text-white/45">
            AI analyzed the last 7 days of ingested signals. Ranking and clustering are
            deterministic — no OpenAI on this page.
          </p>
        </section>

        <EditorIntakeStats intake={data.intake} />

        <ContentEngineUsageBar
          usage={data.usage}
          openAiConfigured={data.openAiConfigured}
        />

        <OpportunitiesSection opportunities={data.opportunities} />

        <div className="grid gap-6 lg:grid-cols-2">
          <WeeklyGapsSection gaps={data.weeklyGaps} />
          <TrendingKeywordsSection keywords={data.trendingKeywords} />
        </div>

        <EditorialRecommendationSection recommendation={data.recommendation} />

        <p className="text-center text-xs text-white/30">
          <Link href="/admin/drafts" className="hover:text-white/50">
            AI Drafts
          </Link>
          {" · "}
          <Link href="/admin/workflow" className="hover:text-white/50">
            Workflow
          </Link>
          {" · "}
          <Link href="/admin/entities" className="hover:text-white/50">
            Knowledge Graph
          </Link>
          {" · "}
          <Link href="/admin/dashboard" className="hover:text-white/50">
            Legacy dashboard
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
