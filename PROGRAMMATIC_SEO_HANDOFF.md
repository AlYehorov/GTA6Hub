# Programmatic SEO Engine — Handoff

Transform GTA6Hub from a news site into a GTA VI knowledge base with programmatic entity pages, FAQ schema, and internal linking.

> Note: User Profiles sprint is documented in `SPRINT6_HANDOFF.md`. This doc covers the SEO knowledge base layer.

## Entity Architecture

Migration: `supabase/migrations/008_game_entities.sql`

Eight entity tables with identical schema:

| Table | Route prefix |
|-------|----------------|
| `game_locations` | `/locations/[slug]` |
| `game_characters` | `/characters/[slug]` |
| `game_vehicles` | `/vehicles/[slug]` |
| `game_weapons` | `/weapons/[slug]` |
| `game_businesses` | `/businesses/[slug]` |
| `game_animals` | `/animals/[slug]` |
| `game_collectibles` | `/collectibles/[slug]` |
| `game_missions` | `/missions/[slug]` |

### Columns

`id`, `slug`, `title`, `description`, `image_url`, `category`, `seo_title`, `seo_description`, `status` (draft/published), `created_at`, `updated_at`

RLS: public read on `status = 'published'`.

### Code layout

```
lib/types/game-entity.ts       — shared types
lib/entities/config.ts         — kind → table, route, tracker mapping
lib/entities/queries.ts        — getBySlug, search, sitemap helpers
lib/entities/faq.ts            — FAQ generation engine
lib/entities/related.ts        — internal linking (articles, guides, tracker, entities)
lib/entities/structured-data.ts — JSON-LD (Breadcrumb, FAQ, Article)
lib/entities/page-factory.ts   — shared route handler factory
components/entities/           — EntityDetailPage, RelatedLinks, view tracker
```

## Routing

Each entity kind uses `createEntitySlugPage(kind)` from `page-factory.ts`:

```tsx
// app/characters/[slug]/page.tsx
const { generateMetadata, Page } = createEntitySlugPage("characters");
export { generateMetadata };
export default Page;
```

## Page Template

Every entity page includes:

1. **Hero** — breadcrumb, title, category badge, optional image
2. **Overview** — description
3. **Known Information** — structured facts panel
4. **Related Articles** — keyword match + fallback latest news
5. **Related Guides** — keyword match + fallback latest guides
6. **Related Tracker Categories** — mapped tracker slugs per entity kind
7. **Explore More** — cross-entity + map/leaderboard/news links (≥5 total related)
8. **FAQ** — generated per entity + global Leonida FAQs
9. **JSON-LD** — BreadcrumbList, Article, FAQPage

## FAQ Engine

`lib/entities/faq.ts`:

- Entity-specific: "What is {title}?", "Where can I find {title}?"
- Kind-specific: locations, characters, vehicles, animals, businesses
- Global: Vice City location, Leonida size, Jason, businesses in GTA 6

## Internal Linking

`lib/entities/related.ts` connects:

- Articles/guides via `ilike` on entity title keyword
- Tracker categories via `ENTITY_KINDS[kind].trackerCategorySlug`
- Cross-entity links from same/other kinds
- Static hub links: `/map`, `/leaderboard`, `/news`, `/guides`

Minimum 5 related links per page via combined sections.

## SEO Strategy

### Per-entity metadata

`seo_title` / `seo_description` columns override defaults. Fallback: `{title} — GTA 6 {Kind}`.

### Sitemap

`app/sitemap.ts` — all published entity slugs across 8 tables.

### Structured data

- `BreadcrumbList` — Home → Category → Entity
- `Article` — headline, description, dates, publisher
- `FAQPage` — all FAQ items on page

### Tracker SEO (existing)

`lib/tracker/seo-metadata.ts` targets:

- gta 6 completion tracker
- gta 6 progress tracker
- gta 6 100 percent checklist

## Search

`/search` queries:

- `articles` (news + guides)
- All 8 `game_*` tables via `searchEntities()`

Analytics: `search_query` (+ legacy `search` event).

## Analytics

| Event | Trigger |
|-------|---------|
| `entity_view` | Entity detail page load |
| `search_query` | Search with query |
| `related_link_click` | Click on related link section |

## Seed

```bash
# After migration 008:
npm run seed:entities
```

Demo content:

- Locations: Vice City, Leonida Keys, Port Gellhorn, Ambrosia, Mount Kalaga
- Characters: Lucia, Jason, Raul Bautista, Boobie Ike
- Vehicles: Airboat, Police Cruiser, Sports Car
- Animals: Alligator, Flamingo, Shark

## Setup Checklist

1. Run `008_game_entities.sql` in Supabase SQL Editor
2. `npm run seed:entities`
3. Verify `/locations/vice-city`, `/characters/lucia`, `/animals/alligator`
4. Check `/sitemap.xml` for entity URLs
5. Test `/search?q=lucia`

## Constraints Preserved

- No homepage/hero redesign
- Tracker, articles, ingestion, admin systems untouched
- Map implementation frozen

## Future Expansion

- Admin CRUD for game entities (`/admin/entities`)
- Auto-generate entities from AI drafts / ingestion
- Cross-link map points to location entities
- Weapon/business/mission seed batches
- `generateStaticParams` for top entities at build time
- hreflang / multi-language entity pages

## Next Recommended Sprint

**Sprint 7: Entity Admin + Auto-generation**

- Unified admin UI for all 8 entity types
- Bulk import from trailers/sources
- Entity ↔ map point linking
- Related entity graph (manual curation)
