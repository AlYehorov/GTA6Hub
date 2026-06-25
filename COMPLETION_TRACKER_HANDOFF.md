# Sprint 5: Completion Tracker — Handoff

GTA VI completion and progress tracker for user engagement and SEO.

## Schema

Migration: `supabase/migrations/006_completion_tracker.sql`

### `completion_categories`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| slug | text | unique, URL segment |
| title | text | display name |
| icon | text | lucide icon key |
| sort_order | integer | grid order |
| created_at | timestamptz | |

### `completion_items`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| category_id | uuid | FK → completion_categories |
| title | text | |
| description | text | |
| spoiler | boolean | hidden until toggle |
| difficulty | enum | easy, medium, hard |
| image_url | text | optional |
| sort_order | integer | |
| status | enum | draft, published |
| created_at / updated_at | timestamptz | |

### `user_progress`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| item_id | uuid | FK → completion_items |
| completed | boolean | |
| completed_at | timestamptz | |
| unique (user_id, item_id) | | |

RLS: public read on categories + published items; users read/write own progress only.

## Routes

### Public

| Route | Purpose |
|-------|---------|
| `/tracker` | Overview — overall %, category grid |
| `/tracker/[category]` | Category detail — items, spoiler toggle, progress |

### Admin

| Route | Purpose |
|-------|---------|
| `/admin/tracker` | Item list + stats |
| `/admin/tracker/create` | Create item |
| `/admin/tracker/[id]` | Edit, publish, delete |

## Categories (17)

100-percent-completion, main-missions, side-missions, random-events, strangers, collectibles, weapons, vehicles, businesses, properties, animals, wildlife, achievements, trophies, easter-eggs, secrets, activities

## Progress Flow

```
User visits /tracker
       │
       ▼
useTrackerProgress hook hydrates
       │
       ├── Authenticated (Supabase session)?
       │         │
       │         yes → fetch user_progress from Supabase
       │         no  → read localStorage (gta6hub-tracker-progress)
       │
       ▼
User toggles item complete
       │
       ├── Authenticated → upsert/delete user_progress row
       └── Anonymous   → update localStorage JSON array
       │
       ▼
Analytics: item_completed, category_completed (100%), overall_completion_updated
```

### localStorage fallback

- Key: `gta6hub-tracker-progress`
- Format: `[{ itemId: string, completedAt: ISO string }]`
- Used when no Supabase auth session
- Homepage section reads same key via client hook

### Future account support

- Public signup/login not built yet — only admin auth exists
- `user_progress` table + RLS ready for any authenticated user
- `syncLocalProgressToServer()` action available to merge localStorage → Supabase on login
- Recommended: add `/login` + OAuth, call sync on first authenticated session

## SEO

Optimized metadata in `lib/tracker/seo-metadata.ts` for:

- gta 6 100 completion → `/tracker/100-percent-completion`
- gta 6 collectibles → `/tracker/collectibles`
- gta 6 weapons → `/tracker/weapons`
- gta 6 achievements → `/tracker/achievements`
- gta 6 easter eggs → `/tracker/easter-eggs`
- gta 6 random events → `/tracker/random-events`

Sitemap includes `/tracker` and all category slugs.

## Analytics

Events (via `lib/analytics/track.ts`):

| Event | Trigger |
|-------|---------|
| `tracker_view` | Page load on /tracker or category |
| `item_completed` | User marks item complete |
| `category_completed` | Category reaches 100% |
| `overall_completion_updated` | Any completion changes overall % |

## Seed

```bash
# After running migration 006 in Supabase SQL Editor:
npm run seed:tracker
```

Seeds 17 categories + 2–3 published demo items each.

## Homepage

Added **Track Your Progress** section after Latest News (`components/home/tracker-section.tsx`). Shows overall %, recent completions, CTA — no hero redesign.

## Key Files

```
supabase/migrations/006_completion_tracker.sql
lib/types/completion.ts
lib/tracker/queries.ts
lib/tracker/seo-metadata.ts
lib/tracker/use-tracker-progress.ts
lib/actions/completion-items.ts
lib/actions/tracker-progress.ts
components/tracker/*
components/home/tracker-section*.tsx
app/tracker/*
app/admin/tracker/*
scripts/seed-tracker.mjs
```

## Setup Checklist

1. Run `006_completion_tracker.sql` in Supabase SQL Editor
2. `npm run seed:tracker`
3. Verify `/tracker`, `/tracker/collectibles`, `/admin/tracker`
4. Toggle items — confirm localStorage persists (DevTools → Application)
5. Admin login — confirm Supabase `user_progress` rows

## Constraints (unchanged)

- Map implementation frozen — no map file changes
- Articles, AI drafts, source engine untouched
- Homepage hero unchanged — only new tracker section added

## Next Recommended Sprint

**Sprint 6: Public Accounts + Progress Sync**

- Public signup/login (Supabase Auth)
- Merge localStorage progress on first login
- Profile page with completion stats
- Shareable completion card (OG image)
- Email digest for new tracker items in followed categories

Alternative: **Community submissions** — let users suggest missing collectibles/missions for admin review.
