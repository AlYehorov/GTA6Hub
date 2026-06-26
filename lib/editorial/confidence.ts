/** Minimum AI confidence (0–1) required for review and publishing. */
export const MIN_CONTENT_CONFIDENCE = 0.9;

export function meetsConfidenceThreshold(confidence: number): boolean {
  return confidence >= MIN_CONTENT_CONFIDENCE;
}

/** Manual/seed articles without a score stay visible. */
export function meetsArticleConfidenceThreshold(
  aiConfidence: number | null | undefined
): boolean {
  if (aiConfidence == null) return true;
  return meetsConfidenceThreshold(aiConfidence);
}

export function confidencePercent(confidence: number): number {
  return Math.round(confidence * 100);
}
