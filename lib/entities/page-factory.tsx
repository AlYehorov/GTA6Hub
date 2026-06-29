import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityDetailPage } from "@/components/entities/entity-detail-page";
import { EntityIndexPage } from "@/components/entities/entity-index-page";
import { PageHeader } from "@/components/shared/page-header";
import { generateEntityFaqs } from "@/lib/entities/faq";
import { buildEntityPageData } from "@/lib/entities/related";
import { getEntityBySlug, getPublishedEntities } from "@/lib/entities/queries";
import { buildEntityMetadata } from "@/lib/entities/structured-data";
import { ENTITY_KINDS } from "@/lib/entities/config";
import { createPageMetadata } from "@/lib/metadata";
import type { GameEntityKind } from "@/lib/types/game-entity";

export function createEntityIndexPage(kind: GameEntityKind) {
  const config = ENTITY_KINDS[kind];

  async function generateMetadata(): Promise<Metadata> {
    const entities = await getPublishedEntities(kind);
    const countLabel = entities.length > 0 ? `${entities.length}+ ` : "";

    return createPageMetadata({
      title: config.label,
      description: `Browse ${countLabel}${config.label.toLowerCase()} in GTA VI — profiles, lore, and everything we know about Leonida.`,
      path: config.routePrefix,
    });
  }

  async function Page() {
    const entities = await getPublishedEntities(kind);

    return (
      <>
        <PageHeader
          title={config.label}
          description={`Profiles and everything we know about GTA VI ${config.label.toLowerCase()} in Leonida.`}
        />
        <EntityIndexPage kind={kind} entities={entities} />
      </>
    );
  }

  return { generateMetadata, Page, config };
}

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
