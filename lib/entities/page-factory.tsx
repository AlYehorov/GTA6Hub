import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityDetailPage } from "@/components/entities/entity-detail-page";
import { generateEntityFaqs } from "@/lib/entities/faq";
import { buildEntityPageData } from "@/lib/entities/related";
import { getEntityBySlug } from "@/lib/entities/queries";
import { buildEntityMetadata } from "@/lib/entities/structured-data";
import { ENTITY_KINDS } from "@/lib/entities/config";
import { createPageMetadata } from "@/lib/metadata";
import type { GameEntityKind } from "@/lib/types/game-entity";

export function createEntitySlugPage(kind: GameEntityKind) {
  const config = ENTITY_KINDS[kind];

  async function generateMetadata({
    params,
  }: {
    params: Promise<{ slug: string }>;
  }): Promise<Metadata> {
    const { slug } = await params;
    const entity = await getEntityBySlug(kind, slug);
    if (!entity) return { title: "Not Found" };

    const meta = buildEntityMetadata(entity, kind);
    return createPageMetadata({
      title: meta.title,
      description: meta.description,
      path: meta.path,
      image: meta.image,
      type: "article",
    });
  }

  async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const entity = await getEntityBySlug(kind, slug);
    if (!entity) notFound();

    const pageData = await buildEntityPageData(kind, entity);
    const faqs = generateEntityFaqs(entity, kind);

    return (
      <EntityDetailPage
        kind={kind}
        entity={entity}
        faqs={faqs}
        relatedArticles={pageData.relatedArticles}
        relatedGuides={pageData.relatedGuides}
        relatedTracker={pageData.relatedTracker}
        relatedEntities={pageData.relatedEntities}
      />
    );
  }

  return { generateMetadata, Page, config };
}
