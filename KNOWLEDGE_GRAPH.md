# GTA Knowledge Graph Foundation (Sprint 6.0)

Transforms GTAVIHub from isolated articles into a connected knowledge platform — without changing public URLs or layout.

## Architecture

### `kg_entities` (canonical graph nodes)

| Field | Purpose |
|-------|---------|
| `kind` | character, location, vehicle, weapon, mission, business, animal, brand, song, organization |
| `slug` + `kind` | Unique key |
| `title`, `aliases[]` | Canonical name + alternate mentions |
| `description`, `image_url`, `category` | Entity metadata |
| `first_seen_source`, `first_seen_date` | Provenance |
| `legacy_game_table`, `legacy_game_id` | Link to existing `game_*` rows |

### Junction tables

| Table | Links |
|-------|-------|
| `article_entities` | articles ↔ kg_entities |
| `video_entities` | videos ↔ kg_entities |
| `map_entities` | map_points ↔ kg_entities |

Each link stores `confidence`, `source` (manual | extracted | rule | sync), `mention_count`.

## Backward compatibility

- Public entity pages remain `/characters/[slug]`, `/locations/[slug]`, etc.
- `game_*` tables unchanged — sync copies into `kg_entities` with legacy pointers
- Collectibles stay in `game_collectibles` only (not in kg kinds list)
- Article URLs `/news/[slug]`, `/guides/[slug]` unchanged
- `related_entities` loaded on article pages but **not rendered** in public UI yet

## Extraction (deterministic)

`lib/knowledge-graph/extractor.ts` — no OpenAI on scan:

1. **Dictionary** — seed terms (`lib/knowledge-graph/dictionaries.ts`)
2. **Aliases** — word-boundary regex per alias
3. **Regex patterns** — Vice City, Leonida, Rockstar, etc.
4. **Known entities** — match against synced `kg_entities`

Pipeline (`lib/knowledge-graph/pipeline.ts`):

1. Seed dictionary
2. Sync from `game_*` tables
3. Extract from published articles
4. Extract from videos + map points

## Admin

`/admin/entities` — Knowledge Graph command center:

- Total entities + link counts
- Duplicates (normalized title groups)
- Alias collisions
- Orphan entities (no links)
- Merge suggestions (rule-based)
- Run Extraction / Sync buttons

## Article integration

`getRelatedEntitiesForArticle(articleId)` returns published entities with hrefs using existing route prefixes.

Attached to `ArticleWithRelations.related_entities` in `getArticlePageData()` — available for future UI, SEO schema, and internal tools.

## OpenAI policy

- **Never** called automatically by extraction or admin page load
- Future: optional validation for ambiguous matches only (manual trigger)

## Migration

Apply `supabase/migrations/014_knowledge_graph.sql`, then `/admin/entities` → **Run Extraction**.

## Code map

| Path | Role |
|------|------|
| `lib/knowledge-graph/types.ts` | Types + route mapping |
| `lib/knowledge-graph/dictionaries.ts` | Seed dictionary + regex |
| `lib/knowledge-graph/extractor.ts` | Text → entity matches |
| `lib/knowledge-graph/queries.ts` | CRUD + junctions + related |
| `lib/knowledge-graph/analyzer.ts` | Duplicates, orphans, merges |
| `lib/knowledge-graph/pipeline.ts` | Full extraction run |
| `lib/knowledge-graph/loader.ts` | Admin page data |
| `lib/actions/knowledge-graph.ts` | Server actions |
