# Newsroom + Video Hub Handoff

## Overview

Turns GTAVIHub into a living GTA 6 newsroom with live homepage sections, `/newsroom`, `/videos`, editorial calendar, YouTube video ingestion, and stronger AI draft safety rules.

**Apply migration:** `supabase/migrations/010_newsroom_videos.sql`

**Backfill videos from existing YouTube sources (optional):**
```bash
npm run seed:videos
```

---

## New Routes

| Route | Purpose |
|-------|---------|
| `/newsroom` | Full newsroom with sections |
| `/videos` | Video hub (official YouTube embeds) |
| `/videos/[slug]` | Single video + related content |
| `/admin/editorial` | Editorial calendar & content gaps |
| `/trailers` | Redirects → `/videos` |

---

## Video Schema (`videos`)

| Column | Notes |
|--------|-------|
| `youtube_id` | Unique, official embed ID |
| `category` | `official_trailer`, `official_video`, `trailer_breakdown`, `community_analysis`, `news_recap` |
| `status` | `draft` \| `published` |
| `source_item_id` | Links to ingested YouTube source |

**Articles extended:** `source_label`, `source_url`, `source_item_id`, `video_id`, `ai_confidence`

---

## Editorial Workflow

1. **Cron** (`/api/cron/ingest`) ingests Rockstar Newswire + YouTube + Reddit
2. **YouTube videos** → upserted to `videos` (auto-published for official Rockstar)
3. **AI draft** created per new source — **never auto-published**
4. **Admin** reviews at `/admin/drafts` or `/admin/editorial`
5. **Approve** → **Publish as News/Guide** → article gets source attribution + YouTube thumbnail hero

---

## Source Ingestion Flow

```
Rockstar YouTube RSS
  → source_items (official)
  → videos table (published)
  → ai_drafts (pending)
  → human review
  → articles (published)
```

---

## AI Safety Rules (prompts)

Updated in `lib/ai/prompts/article-draft.ts`:

- Clear source attribution section
- Confirmed vs speculation separation
- No fake facts, invented leaks, or clickbait
- No copyrighted lyrics
- FAQ + internal link suggestions
- Natural GTA 6 / GTA VI keywords
- YouTube-specific angle: "What Rockstar's new GTA 6 video reveals"

---

## SEO Strategy

- Metadata on `/newsroom`, `/videos`, `/videos/[slug]`
- `NewsArticle` JSON-LD on article pages
- `VideoObject` JSON-LD on video pages
- Sitemap includes `/newsroom`, `/videos`, and all published video slugs
- Editorial labels on cards: Official, Analysis, Rumor, Community, Trailer

---

## Homepage Live Sections

`HomeNewsroomSections` loads from Supabase:

- Latest News
- Official Updates (`category: official`)
- Trailer Breakdowns (`category: trailer`)
- Community Rumors (`source_label: unconfirmed`)
- Guides

Falls back to mock data if no articles.

---

## Content Gap Engine

`lib/editorial/content-gaps.ts` checks all 8 entity tables:

- Unpublished entity → gap (`no_entity_page`)
- Published entity with no matching article → gap (`no_article`)

Shown on `/admin/editorial`.

---

## Ambient Mode

`AmbientToggle` component — disabled placeholder, muted by default, no copyrighted audio.

---

## Known Limitations

- Video slug collisions on backfill seed (rare duplicate titles)
- `trailer_breakdown` / `community_analysis` categories require manual admin assignment today
- Reddit rumors need published articles with `source_label` set at publish time
- No inline draft editor yet — edit after publish in Articles admin
- Entity list pages still use mock carousels on homepage (unchanged)

---

## Next Sprint Recommendation

1. Admin UI to publish/edit videos and assign categories
2. Auto-link published articles to `videos` by `source_item_id`
3. Category landing pages (`/news/category/trailer`)
4. RSS feed for newsroom
5. OG images for video and newsroom pages

---

## How to Test on Production

1. Apply migration `010` in Supabase SQL Editor
2. Deploy latest `main`
3. Run `npm run seed:videos` locally (with service role) OR trigger ingest from `/admin/sources`
4. Visit https://www.gtavihub.gg/newsroom
5. Visit https://www.gtavihub.gg/videos
6. Check homepage live news sections
7. `/admin/editorial` — pending drafts, gaps, ideas
8. Approve + publish a draft → verify source label on article
9. Check `/sitemap.xml` for `/newsroom`, `/videos/*`
10. Validate JSON-LD with Google Rich Results Test

---

## Key Files

```
supabase/migrations/010_newsroom_videos.sql
lib/videos/queries.ts
lib/newsroom/labels.ts
lib/editorial/content-gaps.ts
lib/ai/prompts/article-draft.ts
lib/workflows/ingest-and-draft-workflow.ts
lib/workflows/article-publishing-service.ts
components/home/home-newsroom-sections.tsx
components/newsroom/newsroom-article-card.tsx
components/videos/*
app/newsroom/page.tsx
app/videos/page.tsx
app/videos/[slug]/page.tsx
app/admin/editorial/page.tsx
scripts/seed-videos.mjs
```
