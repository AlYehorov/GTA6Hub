import type { SourceLabel, SourcePlatform } from "@/lib/types/source";

/** Rockstar / official sources — strict factual bar. */
export const MIN_OFFICIAL_CONFIDENCE = 0.9;

/** Community, media, Reddit — publishable with site unverified label. */
export const MIN_COMMUNITY_CONFIDENCE = 0.5;

const COMMUNITY_PLATFORMS: SourcePlatform[] = [
  "google_news",
  "reddit",
  "community_youtube",
  "x",
];

/** @deprecated Use minConfidenceForSource — kept for copy in admin UI. */
export const MIN_CONTENT_CONFIDENCE = MIN_OFFICIAL_CONFIDENCE;

export function isCommunityPlatform(platform: SourcePlatform): boolean {
  return COMMUNITY_PLATFORMS.includes(platform);
}

export function isOfficialSourceLabel(label: SourceLabel): boolean {
  return label === "official";
}

export function minConfidenceForSourceLabel(label: SourceLabel): number {
  return isOfficialSourceLabel(label) ? MIN_OFFICIAL_CONFIDENCE : MIN_COMMUNITY_CONFIDENCE;
}

export function minConfidenceForSource(input: {
  source_label: SourceLabel;
  source?: SourcePlatform;
}): number {
  if (input.source && isCommunityPlatform(input.source)) {
    return MIN_COMMUNITY_CONFIDENCE;
  }
  return minConfidenceForSourceLabel(input.source_label);
}

export function meetsConfidenceThreshold(
  confidence: number,
  sourceLabel?: SourceLabel,
  sourcePlatform?: SourcePlatform
): boolean {
  const min =
    sourceLabel != null || sourcePlatform != null
      ? minConfidenceForSource({
          source_label: sourceLabel ?? "unconfirmed",
          source: sourcePlatform,
        })
      : MIN_OFFICIAL_CONFIDENCE;
  return confidence >= min;
}

export function meetsDraftConfidenceThreshold(draft: {
  confidence: number;
  source_item: { source_label: SourceLabel; source?: SourcePlatform };
}): boolean {
  return meetsConfidenceThreshold(
    draft.confidence,
    draft.source_item.source_label,
    draft.source_item.source
  );
}

/** Manual/seed articles without a score stay visible. */
export function meetsArticleConfidenceThreshold(
  aiConfidence: number | null | undefined,
  sourceLabel?: SourceLabel | null,
  sourcePlatform?: SourcePlatform | null
): boolean {
  if (aiConfidence == null) return true;
  return meetsConfidenceThreshold(
    aiConfidence,
    sourceLabel ?? undefined,
    sourcePlatform ?? undefined
  );
}

export function confidencePercent(confidence: number): number {
  return Math.round(confidence * 100);
}

export function confidenceThresholdPercent(
  sourceLabel: SourceLabel,
  sourcePlatform?: SourcePlatform
): number {
  return confidencePercent(
    minConfidenceForSource({ source_label: sourceLabel, source: sourcePlatform })
  );
}

export function publishabilityHint(
  sourceLabel: SourceLabel,
  sourcePlatform?: SourcePlatform
): string {
  const min = confidenceThresholdPercent(sourceLabel, sourcePlatform);
  if (min === confidencePercent(MIN_OFFICIAL_CONFIDENCE)) {
    return `Official source — approve/publish when confidence ≥ ${min}%`;
  }
  return `Community source — approve/publish from ${min}%; article shows as unverified`;
}
