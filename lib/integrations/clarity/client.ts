import { getIntegrationsEnv } from "@/lib/integrations/config";
import type { ClaritySnapshot } from "@/lib/integrations/types";

interface ClarityApiMetric {
  metricName: string;
  information: Array<{ totalSessionCount?: string; sessionsCount?: string }>;
}

export async function fetchClaritySnapshot(): Promise<ClaritySnapshot> {
  const env = getIntegrationsEnv();
  const projectId = env.clarityProjectId;

  const heatmapUrl = projectId
    ? `https://clarity.microsoft.com/projects/view/${projectId}/heatmaps`
    : null;
  const recordingsUrl = projectId
    ? `https://clarity.microsoft.com/projects/view/${projectId}/recordings`
    : null;

  if (!projectId || !env.clarityApiToken) {
    return {
      projectId,
      heatmapUrl,
      recordingsUrl,
      deadClicks: 0,
      quickBacks: 0,
      rageClicks: 0,
      averageScrollDepth: 0,
      scrollDepthByPage: [],
      mostInteractedPages: [],
      syncedAt: new Date().toISOString(),
    };
  }

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);

  const params = new URLSearchParams({
    projectId,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  });

  const response = await fetch(
    `https://www.clarity.ms/export-data/api/v1/project-live-insights?${params}`,
    {
      headers: {
        Authorization: `Bearer ${env.clarityApiToken}`,
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    }
  );

  if (!response.ok) {
    throw new Error(`Clarity API error: HTTP ${response.status}`);
  }

  const data = (await response.json()) as ClarityApiMetric[];

  const metric = (name: string) =>
    Number(
      data.find((m) => m.metricName === name)?.information?.[0]?.totalSessionCount ??
        data.find((m) => m.metricName === name)?.information?.[0]?.sessionsCount ??
        0
    );

  return {
    projectId,
    heatmapUrl,
    recordingsUrl,
    deadClicks: metric("DeadClickCount"),
    quickBacks: metric("QuickbackCount"),
    rageClicks: metric("RageClickCount"),
    averageScrollDepth: metric("ScrollDepth"),
    scrollDepthByPage: [],
    mostInteractedPages: [],
    syncedAt: new Date().toISOString(),
  };
}
