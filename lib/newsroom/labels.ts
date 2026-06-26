import type { SourceLabel } from "@/lib/types/source";

export type EditorialLabel = "Official" | "Analysis" | "Rumor" | "Community" | "Trailer";

export const EDITORIAL_LABEL_STYLES: Record<
  EditorialLabel,
  { bg: string; text: string }
> = {
  Official: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  Analysis: { bg: "bg-violet-500/15", text: "text-violet-400" },
  Rumor: { bg: "bg-amber-500/15", text: "text-amber-400" },
  Community: { bg: "bg-cyan-500/15", text: "text-cyan-400" },
  Trailer: { bg: "bg-gta-pink/15", text: "text-gta-pink" },
};

export function editorialLabelFromCategory(
  categorySlug: string | null | undefined,
  sourceLabel?: SourceLabel | null
): EditorialLabel {
  if (categorySlug === "trailer") return "Trailer";
  if (categorySlug === "official") return "Official";
  if (categorySlug === "analysis") return "Analysis";
  if (sourceLabel === "rumor" || sourceLabel === "unconfirmed") return "Rumor";
  if (sourceLabel === "community") return "Community";
  if (categorySlug === "walkthrough" || categorySlug === "secrets") return "Analysis";
  return "Official";
}
