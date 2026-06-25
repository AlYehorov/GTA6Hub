# Sprint 5 Handoff — Interactive Map Foundation

Sprint 5 adds a Leonida/Vice City-inspired interactive map with admin management, placeholder artwork, and types for future article cross-linking.

## Database Changes

Migration: `supabase/migrations/005_map_points.sql`

### Table: `map_points`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | text | |
| slug | text | unique |
| description | text | |
| type | map_point_type enum | 10 types |
| district | text | optional |
| lat | numeric(0–100) | vertical position on map |
| lng | numeric(0–100) | horizontal position on map |
| image_url | text | optional |
| spoiler | boolean | hidden/blurred when spoiler mode off |
| verified | boolean | distinct marker badge |
| status | map_point_status enum | draft / pending / published / rejected |
| source_url | text | optional attribution link |
| created_by | text | admin email or seed tag |
| created_at / updated_at | timestamptz | auto |

### RLS

- Public: `SELECT` where `status = 'published'`
- Admin writes: service role only (same pattern as sources/drafts)

Run in Supabase SQL Editor if not applied yet.

## Map Architecture

```
app/map/page.tsx (Server)
  └── getPublishedMapPoints()
  └── MapExperience (Client)
        ├── MapSearch
        ├── SpoilerToggle
        ├── MapFilters (type + district)
        ├── MapCanvas
        │     ├── placeholder SVG background
        │     └── MapMarker[] (lng% / lat% positioning)
        └── MapPointDrawer
```

### Coordinates

- **Not geographic GPS** — normalized 0–100 over placeholder image
- `lng` = horizontal (left → right)
- `lat` = vertical (top → bottom)

### Placeholder map

- `public/map/leonida-placeholder.svg` — original stylized artwork, no copyrighted game assets

## Public Map Behavior

Route: **`/map`**

- Full-screen immersive layout (below navbar)
- Category filters for all 10 point types
- Search by title, description, district
- Spoiler toggle — blurs/hides spoiler point details when off
- Click marker → drawer with title, type, district, verified badge, source link
- Mobile: bottom drawer; desktop: right sidebar drawer
- Responsive filters and canvas

### SEO

- Title: **GTA 6 Interactive Map | GTA6Hub**
- Description: explore locations, secrets, districts, vehicles, wildlife, easter eggs across Leonida and Vice City

## Admin Flow

| Route | Purpose |
|-------|---------|
| `/admin/map` | List all points + stats |
| `/admin/map/create` | Create new point |
| `/admin/map/[id]` | Edit + publish/reject/delete actions |

Actions: create, edit, publish, reject, unpublish (draft), mark verified, set spoiler, set type/district/source_url.

Linked from `/admin` dashboard.

## Related Content (Prepared)

- `lib/types/related-content.ts` — `ArticleRelatedMapPoint`, `ArticleRelatedContent`
- `getRelatedMapPointsForArticle()` — stub returns `[]` until Sprint 6 linking
- `article-page.tsx` fetches related content structure (not rendered yet)

## Seed Data

```bash
npm run seed:map
```

10 demo points: Vice City Beach, Downtown Vice City, Leonida Keys, Grassrivers Wetlands, Port Gellhorn, Ambrosia, Mount Kalaga, Airport, Ocean Drive, Nightclub District (spoiler).

## Known Limitations

1. **Placeholder map only** — not georeferenced, not game-accurate
2. **No Mapbox** — image + percentage positioning
3. **No article↔map linking UI** — types only
4. **No map point detail pages** — drawer only
5. **No image upload** — image_url text field only
6. **Migration required** — run `005_map_points.sql` before seed/admin writes

## Next Steps (Sprint 6+)

- Article ↔ map point linking by district/tags
- `RelatedMapPoints` component on article pages
- Mapbox or custom tile layer (if licensed assets available)
- Map point detail routes `/map/[slug]`
- Clustering for dense marker areas
- User-submitted points / moderation queue

## How to Test

1. Run migration `005_map_points.sql` in Supabase
2. `npm run seed:map`
3. `npm run dev` → open http://localhost:3000/map
4. Toggle filters, search, spoiler mode; click markers
5. `/admin/map` → create/edit/publish points
6. Verify unpublished points do not appear on public map

## Files Added

- `supabase/migrations/005_map_points.sql`
- `lib/types/map-point.ts`, `lib/types/related-content.ts`
- `lib/map/queries.ts`, `lib/map/constants.ts`, `lib/actions/map-points.ts`
- `components/map/*` (6 components + MapExperience)
- `app/map/page.tsx`
- `app/admin/map/*`
- `components/admin/map-point-form.tsx`, `map-point-actions.tsx`
- `public/map/leonida-placeholder.svg`
- `scripts/seed-map.mjs`
