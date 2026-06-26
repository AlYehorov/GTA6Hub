import { PageHeader } from "@/components/shared/page-header";
import { loadWorkflowPageData } from "@/lib/workflow/loader";
import { ArticlesAttentionSection } from "@/components/admin/workflow/articles-attention-section";
import { ScanWorkspacesSection } from "@/components/admin/workflow/scan-workspaces-section";
import {
  WorkflowStatsBar,
  WorkspaceHistorySection,
  DashboardLinksSection,
} from "@/components/admin/workflow/workflow-stats-sections";

export default async function WorkflowPage() {
  const data = await loadWorkflowPageData();

  return (
    <>
      <PageHeader
        title="Editorial Workflow"
        description="Article-centric improvements — one workspace per article, checklist inside."
      />
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        {!data.configured && (
          <p className="rounded-lg border border-gta-pink/20 bg-gta-pink/5 px-4 py-3 text-sm text-gta-pink/80">
            Apply migration 013 and add SUPABASE_SERVICE_ROLE_KEY. Run:{" "}
            <code className="text-gta-pink">supabase/migrations/013_article_workspaces.sql</code>
          </p>
        )}

        <WorkflowStatsBar
          dailyCapacity={data.dailyCapacity}
          weeklyStats={data.weeklyStats}
          metrics={data.metrics}
          openAiUsage={data.openAiUsage}
        />

        <ScanWorkspacesSection />

        <ArticlesAttentionSection workspaces={data.activeWorkspaces} />

        <WorkspaceHistorySection history={data.history} />

        <DashboardLinksSection />
      </div>
    </>
  );
}
