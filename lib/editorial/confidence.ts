import type { SourceLabel } from "@/lib/types/source";

/** Rockstar / official sources — strict factual bar. */
export const MIN_OFFICIAL_CONFIDENCE = 0.9;

/** Community, media, Reddit — publishable with site unverified label. */
export const MIN_COMMUNITY_CONFIDENCE = 0.5;

/** @deprecated Use minConfidenceForSourceLabel — kept for copy in admin UI. */
export const MIN_CONTENT_CONFIDENCE = MIN_OFFICIAL_CONFIDENCE;

export function isOfficialSourceLabel(label: SourceLabel): boolean {
  return label === "official";
}

export function minConfidenceForSourceLabel(label: SourceLabel): number {
  return isOfficialSourceLabel(label) ? MIN_OFFICIAL_CONFIDENCE : MIN_COMMUNITY_CONFIDENCE;
}

export function meetsConfidenceThreshold(
  confidence: number,
  sourceLabel?: SourceLabel
): boolean {
  const min =
    sourceLabel != null
      ? minConfidenceForSourceLabel(sourceLabel)
      : MIN_OFFICIAL_CONFIDENCE;
  return confidence >= min;
}

export function meetsDraftConfidenceThreshold(draft: {
  confidence: number;
  source_item: { source_label: SourceLabel };
}): boolean {
  return meetsConfidenceThreshold(draft.confidence, draft.source_item.source_label);
}

/** Manual/seed articles without a score stay visible. */
export function meetsArticleConfidenceThreshold(
  aiConfidence: number | null | undefined,
  sourceLabel?: SourceLabel | null
): boolean {
  if (aiConfidence == null) return true;
  if (sourceLabel) return meetsConfidenceThreshold(aiConfidence, sourceLabel);
  return meetsConfidenceThreshold(aiConfidence);
}

export function confidencePercent(confidence: number): number {
  return Math.round(confidence * 100);
}

export function confidenceThresholdPercent(sourceLabel: SourceLabel): number {
  return confidencePercent(minConfidenceForSourceLabel(sourceLabel));
}

export function publishabilityHint(sourceLabel: SourceLabel): string {
  if (isOfficialSourceLabel(sourceLabel)) {
    return "Official source — approve/publish when confidence ≥ 90%";
  }
  return "Community source — approve/publish from 50%; article shows as unverified";
}
