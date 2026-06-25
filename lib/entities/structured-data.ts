import { absoluteUrl, getSiteUrl, SITE_NAME } from "@/lib/constants/site";
import { ENTITY_KINDS, entityHref } from "@/lib/entities/config";
import type { EntityFaqItem, GameEntity, GameEntityKind } from "@/lib/types/game-entity";

export function buildEntityMetadata(entity: GameEntity, kind: GameEntityKind) {
  const config = ENTITY_KINDS[kind];
  const title = entity.seo_title ?? `${entity.title} — GTA 6 ${config.labelSingular}`;
  const description =
    entity.seo_description ??
    (entity.description.slice(0, 160) ||
      `Everything we know about ${entity.title} in GTA VI and Leonida.`);

  const path = entityHref(kind, entity.slug);
  const image = entity.image_url ?? undefined;

  return { title, description, path, image };
}

export function buildBreadcrumbJsonLd(
  entity: GameEntity,
  kind: GameEntityKind
): Record<string, unknown> {
  const config = ENTITY_KINDS[kind];
  const base = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      {
        "@type": "ListItem",
        position: 2,
        name: config.label,
        item: `${base}${config.routePrefix}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: entity.title,
        item: `${base}${entityHref(kind, entity.slug)}`,
      },
    ],
  };
}

export function buildFaqJsonLd(faqs: EntityFaqItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildArticleJsonLd(
  entity: GameEntity,
  kind: GameEntityKind
): Record<string, unknown> {
  const { title, description, path, image } = buildEntityMetadata(entity, kind);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: image ? absoluteUrl(image) : undefined,
    url: absoluteUrl(path),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    dateModified: entity.updated_at,
    datePublished: entity.created_at,
  };
}

export function buildEntityJsonLd(
  entity: GameEntity,
  kind: GameEntityKind,
  faqs: EntityFaqItem[]
): Record<string, unknown>[] {
  return [
    buildBreadcrumbJsonLd(entity, kind),
    buildArticleJsonLd(entity, kind),
    buildFaqJsonLd(faqs),
  ];
}
