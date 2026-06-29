import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ContentEngineUsageBar } from "@/components/admin/content-engine/content-engine-usage-bar";
import { EditorIntakeStats } from "@/components/admin/editor/editor-intake-stats";
import { OpportunitiesSection } from "@/components/admin/editor/opportunities-section";
import { WeeklyGapsSection } from "@/components/admin/editor/weekly-gaps-section";
import { EditorialRecommendationSection } from "@/components/admin/editor/editorial-recommendation-section";
import type { EditorBriefingData } from "@/lib/opportunity-engine/types";

export function StudioEditorTab({
  briefing,
}: {
  briefing: EditorBriefingData;
}) {
  const hasOpportunities = briefing.opportunities.length > 0;
  const intakeEmpty =
    briefing.intake.rockstarPosts === 0 &&
    briefing.intake.redditDiscussions === 0 &&
    briefing.intake.youtubeVideos === 0 &&
    briefing.intake.googleNewsPosts === 0 &&
    briefing.intake.communityYoutubePosts === 0;

  return (
    <div className="space-y-6">
      {!briefing.configured && (
        <p className="rounded-lg border border-gta-pink/20 bg-gta-pink/5 px-4 py-3 text-sm text-gta-pink/80">
          Примени миграции 015–016 и добавь SUPABASE_SERVICE_ROLE_KEY.
        </p>
      )}

      {intakeEmpty && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-4">
          <p className="text-sm text-amber-200/90">
            За последние 7 дней нет свежих сигналов. Сначала подтяни sources.
          </p>
          <Link
            href="/admin/studio?tab=sources"
            className="mt-3 inline-block rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-500/30"
          >
            Перейти к Sources →
          </Link>
        </div>
      )}

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <p className="font-heading text-xl font-semibold text-white">
          Good morning, {briefing.adminName}.
        </p>
        <p className="mt-2 text-sm text-white/45">
          Кластеры за 7 дней — выбери тему, поправь focus, нажми Generate.
        </p>
      </section>

      <EditorIntakeStats intake={briefing.intake} />

      <ContentEngineUsageBar
        usage={briefing.usage}
        openAiConfigured={briefing.openAiConfigured}
      />

      {!briefing.openAiConfigured && (
        <p className="rounded-lg border border-white/10 px-4 py-3 text-sm text-white/50">
          OPENAI_API_KEY не задан — генерация будет mock или недоступна.
        </p>
      )}

      <OpportunitiesSection opportunities={briefing.opportunities} />

      {!hasOpportunities && !intakeEmpty && (
        <p className="text-center text-sm text-white/40">
          Opportunities слабые или уже опубликованы. Попробуй ingestion ещё раз завтра после
          Rockstar news.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <WeeklyGapsSection gaps={briefing.weeklyGaps} />
        <EditorialRecommendationSection recommendation={briefing.recommendation} />
      </div>

      <Link
        href="/admin/editor"
        className="inline-flex items-center gap-2 text-sm text-gta-pink hover:underline"
      >
        Открыть Editor на отдельной странице
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
