import { PageHeader } from "@/components/shared/page-header";
import { loadWorkflowPageData } from "@/lib/workflow/loader";
import { TodaysTasksSection } from "@/components/admin/workflow/todays-tasks-section";
import { TaskGeneratorSection } from "@/components/admin/workflow/task-generator-section";
import { WorkflowKanban } from "@/components/admin/workflow/workflow-kanban";
import { TaskDetailSection } from "@/components/admin/workflow/task-detail-section";
import {
  WorkflowStatsBar,
  OneClickActionsSection,
  TaskHistorySection,
  DashboardLinksSection,
} from "@/components/admin/workflow/workflow-stats-sections";

export default async function WorkflowPage() {
  const data = await loadWorkflowPageData();

  return (
    <>
      <PageHeader
        title="Editorial Workflow"
        description="Task-driven editorial work — know exactly what to write today."
      />
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        {!data.configured && (
          <p className="rounded-lg border border-gta-pink/20 bg-gta-pink/5 px-4 py-3 text-sm text-gta-pink/80">
            Apply migration 012 and add SUPABASE_SERVICE_ROLE_KEY. Run:{" "}
            <code className="text-gta-pink">supabase db push</code>
          </p>
        )}

        <WorkflowStatsBar
          dailyCapacity={data.dailyCapacity}
          weeklyStats={data.weeklyStats}
          metrics={data.metrics}
          openAiUsage={data.openAiUsage}
        />

        <TodaysTasksSection todayByStatus={data.todayByStatus} />

        <div id="generator">
          <TaskGeneratorSection preview={data.generatorPreview} />
        </div>

        <WorkflowKanban kanban={data.kanban} />

        <TaskDetailSection tasks={data.tasks} />

        <OneClickActionsSection />

        <TaskHistorySection history={data.history} />

        <DashboardLinksSection />
      </div>
    </>
  );
}
