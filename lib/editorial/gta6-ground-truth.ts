/**
 * Verified public facts about GTA VI launch performance.
 * Used to block community rumors that contradict record-breaking official results.
 */
export const GTA6_LAUNCH_GROUND_TRUTH = {
  preorderUnitsMillions: 39,
  preorderUnitsLabel: "39 million",
  launchRevenueBillions: 3,
  launchRevenueLabel: "over $3 billion",
  summary:
    "Grand Theft Auto VI broke industry records at launch with roughly 39 million units sold in the opening days and more than $3 billion in revenue — one of the biggest entertainment launches ever.",
} as const;

export function formatGroundTruthForPrompt(): string {
  return `VERIFIED LAUNCH CONTEXT (use when community claims contradict blockbuster sales):
- ${GTA6_LAUNCH_GROUND_TRUTH.summary}
- Do NOT present unverified retail anecdotes as proof that GTA VI is selling poorly.
- If covering weak-sales rumors, headline must hedge (Reports Claim / Alleged / Unverified) and body must note the record launch context.`;
}
