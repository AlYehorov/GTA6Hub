import { SEO_ENTITY_KINDS } from "@/lib/editorial/constants";
import type { SeoEntityKind } from "@/lib/editorial/constants";
import { detectContentGaps, type ContentGap } from "@/lib/editorial/content-gaps";
import type { MissingSeoPage } from "@/lib/editorial/types";

const SEO_KIND_SET = new Set<string>(SEO_ENTITY_KINDS);

export function gapsToMissingSeoPages(
  gaps: ContentGap[],
  limit = 40
): MissingSeoPage[] {
  return gaps
    .filter((gap) => SEO_KIND_SET.has(gap.kind))
    .slice(0, limit)
    .map((gap) => ({
      kind: gap.kind as SeoEntityKind,
      slug: gap.slug,
      title: gap.title,
      reason: gap.reason,
      entityHref: gap.entityHref,
    }));
}

export async function detectMissingSeoPages(
  limit = 40
): Promise<MissingSeoPage[]> {
  const gaps = await detectContentGaps(500);
  return gapsToMissingSeoPages(gaps, limit);
}
