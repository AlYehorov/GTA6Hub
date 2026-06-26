# Database Review

**Date:** 2026-06-20  
**Rule:** Never delete production tables. Classify only.

---

## Schema inventory (migrations 001–011)

### KEEP — core content

| Table | Migration | Purpose |
|-------|-----------|---------|
| `categories` | 001 | Article taxonomy |
| `tags` | 001 | Article tags |
| `articles` | 001 | News + guides |
| `article_tags` | 001 | M2M |

### KEEP — source engine / AI

| Table | Migration | Purpose |
|-------|-----------|---------|
| `source_items` | 002 | Ingested Rockstar, Reddit, etc. |
| `ai_drafts` | 002 | AI drafts pending review |
| `analytics_events` | 002 | Event tracking |

### KEEP — map & tracker

| Table | Migration | Purpose |
|-------|-----------|---------|
| `map_points` | 005 | GTA6Hub map markers |
| `completion_categories` | 006 | Tracker categories |
| `completion_items` | 006 | Tracker items |
| `user_progress` | 006 | Per-user completion |

### KEEP — profiles & gamification

| Table | Migration | Purpose |
|-------|-----------|---------|
| `profiles` | 007, 009, 011 | User profiles, XP, reputation |
| `achievements` | 007 | Achievement definitions |
| `user_achievements` | 007 | Unlocked achievements |
| `saved_articles` | 009 | Bookmarks |
| `saved_locations` | 009 | Saved map points |
| `article_reads` | 009 | Read history |
| `activity_events` | 009 | Profile activity feed |

### KEEP — entities (SEO pages)

| Table | Migration | Purpose |
|-------|-----------|---------|
| `game_locations` | 008 | Location entity pages |
| `game_characters` | 008 | Characters |
| `game_vehicles` | 008 | Vehicles |
| `game_weapons` | 008 | Weapons |
| `game_businesses` | 008 | Businesses |
| `game_animals` | 008 | Animals |
| `game_collectibles` | 008 | Collectibles |
| `game_missions` | 008 | Missions |

### KEEP — newsroom

| Table | Migration | Purpose |
|-------|-----------|---------|
| `videos` | 010 | YouTube newsroom |

### KEEP — community (migration 011)

| Table | Migration | Purpose |
|-------|-----------|---------|
| `community_contests` | 011 | Weekly contests |
| `community_posts` | 011 | Feed posts |
| `community_likes` | 011 | Likes |
| `community_comments` | 011 | Comments |
| `community_polls` | 011 | Polls |
| `community_poll_options` | 011 | Poll options |
| `community_poll_votes` | 011 | Poll votes |
| `community_contest_votes` | 011 | Contest votes |
| `community_notifications` | 011 | Notifications |

**Total: 32 tables — all KEEP.**

---

## MERGE candidates (query patterns, not tables)

| Pattern | Files | Issue | Suggestion |
|---------|-------|-------|------------|
| Article list select + map | `lib/articles/queries.ts`, `lib/home/queries.ts` | Duplicate `ARTICLE_LIST_SELECT` / `mapListItem` | Single `lib/articles/list-mapper.ts` |
| Content gap detection | Was `missing-seo-pages.ts` + `content-gaps.ts` | **Merged** in consolidation sprint | Done |
| Entity fetch by kind | `lib/entities/queries.ts`, `lib/editorial/content-gaps.ts`, `lib/editorial/internal-links.ts` | Each loops entity tables separately | `getAllPublishedEntitiesByKind()` batch helper |
| Public vs admin Supabase | `createClient()`, `createAdminClient()`, `getPublicSupabase()` | Three clients, correct separation | Keep — not duplicate |

---

## DEPRECATE candidates (tables: none)

| Item | Type | Notes |
|------|------|-------|
| `analytics_events` low-value rows | Data hygiene | Optional cleanup script for test events — not schema |
| Legacy `/admin/editorial` queries | App route | Same tables as dashboard; route deprecate only |

**No table deprecations recommended.**

---

## N+1 and duplicate query patterns

### High impact — editorial admin

#### `detectContentGaps()` — `lib/editorial/content-gaps.ts`

```
1× articles (all published text)
+ 8× entity table scans (one per ALL_ENTITY_KINDS)
```

**N+1:** Yes — 8 sequential entity queries in a `for` loop.  
**Fix (future):** Single RPC or `Promise.all` parallel entity fetches (already parallelizable without schema change).

#### `suggestInternalLinks()` — `lib/editorial/internal-links.ts`

```
6× entity tables (sequential loop)
+ 1× articles (40 rows)
+ 1× videos (30 rows)
+ 1× articles again for link targets
```

**N+1:** Yes — entity kinds queried one-by-one.  
**Duplicate:** Articles fetched twice (once for suggestions, once for targets).

#### `loadEditorialDashboardData()` — consolidated

On one dashboard load:

| Query bundle | Calls |
|--------------|-------|
| `buildTodaySummary` | 7 parallel count queries |
| `getAllSourceItemsAdmin` | 1 |
| `detectContentGaps` | 1 + 8 entity |
| `detectOutdatedArticles` | 2 |
| `suggestInternalLinks` | 6 entity + 2 article + 1 video |
| `getArticlesForSeoAnalysis` | 1 full article body scan |

**Duplicate:** `getArticlesForSeoAnalysis` and gap detection both load all published article content/text.  
**Suggestion:** Share one `getPublishedArticlesForEditorial()` result across SEO score, gaps, and internal links.

### Medium impact — homepage

`getHomepageArticleSections()` — cached, single query. **OK.**

`getCachedCommunityStats` + highlights — separate cached queries. **OK.**

### Medium impact — profile

`lib/profile/queries.ts` — many functions each call `createClient()` independently. Normal for server actions; batch when a page loads multiple sections (profile page already uses `Promise.all` at page level).

### Low impact — tracker

`getTrackerPublicTotals` + category pages — appropriate granularity.

---

## Unnecessary client fetching

| Location | Pattern | Verdict |
|----------|---------|---------|
| `components/map/map-experience.tsx` | `getSavedLocationIds()` in `useEffect` on hub selection | **Necessary** — requires auth cookie in browser |
| `components/profile/save-article-button.tsx` | Server action on click | **Correct** — not fetch-on-mount |
| `lib/tracker/use-tracker-progress.ts` | Client hook for tracker UI | **Necessary** — optimistic updates |
| Community like/comment components | Server actions | **Correct** |

**No unnecessary client-side Supabase `from()` calls found.** Client components use server actions, not direct Supabase queries.

---

## Migration status note

| Migration | Status |
|-----------|--------|
| 001–010 | Production |
| 011 (`community_engine`) | Code deployed; confirm applied in Supabase dashboard |

---

## Recommended query optimizations (documentation only)

1. **Parallelize** entity loops in `detectContentGaps` with `Promise.all(ALL_ENTITY_KINDS.map(...))`.
2. **Share** published article payload across editorial dashboard functions (one query, three consumers).
3. **Cache** `detectContentGaps` result with `unstable_cache` + tag `editorial-gaps` (invalidate on article publish).
4. **Add index** (if slow): `articles(status, updated_at)`, `source_items(source, created_at)` — review EXPLAIN in Supabase first; no migration added in this sprint.
