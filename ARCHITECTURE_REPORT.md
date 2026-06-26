# Architecture Consolidation Report

**Date:** 2026-06-20  
**Scope:** Production-safe debt reduction — no feature changes, no route renames, no schema changes.

## Executive summary

| Metric | Result |
|--------|--------|
| Dead files removed | **13** (~25 KB source) |
| Duplicate utilities merged | **1** (`missing-seo-pages` → `detectContentGaps`) |
| Duplicate DB round-trips removed | **1** (editorial dashboard) |
| Lint warnings | **0** (was 8 in app + 1 in scripts) |
| `typecheck` | Pass |
| `build` | Pass |
| npm packages removed | **0** (all dependencies in use) |
| Routes changed | **0** |
| Schema changed | **0** |

---

## Removed dead code (provably unused)

Evidence: zero imports from live routes/components.

| File | Reason |
|------|--------|
| `components/map/map-canvas.tsx` | Superseded by `leonida-map-canvas.tsx` |
| `components/map/map-marker.tsx` | Only used by removed `map-canvas` |
| `components/map/map-filters.tsx` | Filters inlined in `map-experience.tsx` |
| `components/home/featured-section.tsx` | Replaced by `home-newsroom-sections.tsx` |
| `components/home/latest-news-section.tsx` | Not imported from `app/page.tsx` |
| `components/home/news-section.tsx` | Not imported |
| `components/home/featured-spotlight.tsx` | Not imported |
| `components/shared/news-card.tsx` | Only used by dead home sections |
| `components/shared/section-header.tsx` | Only used by dead home sections |
| `components/navigation/auth-nav-button.tsx` | Zero imports |
| `components/ui/badge.tsx` | Only used by dead `news-card` |
| `components/ui/card.tsx` | Only used by dead home sections |
| `components/ui/separator.tsx` | Zero imports |

**Kept intentionally:** `lib/data/mock-news.ts`, `lib/data/news-carousel.ts` — still used by live `home-newsroom-sections.tsx`.

---

## Merged (behavior-preserving)

### `lib/editorial/missing-seo-pages.ts`

Previously duplicated the entity-loop in `detectContentGaps`. Now:

- `detectMissingSeoPages()` calls `detectContentGaps()` and filters to `SEO_ENTITY_KINDS`
- `gapsToMissingSeoPages()` used by dashboard to avoid a second full scan

### Editorial dashboard data load

`loadEditorialDashboardData()` no longer runs `detectContentGaps` and `detectMissingSeoPages` in parallel (double scan). Single gap detection, derived missing pages.

---

## MERGE candidates (not done — needs review)

| Area | Files | Notes |
|------|-------|-------|
| OpenAI HTTP client | `lib/ai/providers/openai-provider.ts`, `lib/editorial/daily-report.ts` | Duplicate `fetch` to `/v1/chat/completions`. Extract `lib/ai/openai-client.ts`. |
| Article list mapping | `lib/articles/queries.ts`, `lib/home/queries.ts` | Duplicate `mapListItem` + `ARTICLE_LIST_SELECT`. Share one module. |
| Spoiler toggles | `components/map/spoiler-toggle.tsx`, `components/tracker/tracker-spoiler-toggle.tsx` | ~95% identical; differ on `min-h-11` and optional `spoilerCount`. Unify with props. |
| Article cards | `components/articles/article-card.tsx`, `components/newsroom/newsroom-article-card.tsx` | Similar layout; different labels/metadata. Variant prop possible. |
| Draft from source | `lib/actions/editorial-dashboard.ts`, `lib/workflows/ingest-and-draft-workflow.ts` | Dashboard `generateDraftFromSource` skips YouTube video side effects that workflow applies. Route through workflow for parity. |
| GTA6 filter barrel | `lib/videos/gta6-filter.ts` | Re-exports `lib/gta6/content-filter`. Single consumer (`lib/videos/queries.ts`). |

---

## DEPRECATE candidates (keep running, document sunset)

| Item | Replacement | Action |
|------|-------------|--------|
| `/admin/editorial` | `/admin/dashboard` | Link already updated on admin hub. Remove page after 30-day transition. |
| `lib/videos/gta6-filter.ts` | `@/lib/gta6/content-filter` | Update one import, delete barrel. |
| `components/admin/source-ingest-actions.tsx` patterns | Editorial dashboard one-click | Consolidate admin ingest entry points in docs only. |

---

## Environment variables

### KEEP (production)

| Variable | Used by |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase clients, sitemap |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public/auth clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin writes, cron, editorial |
| `NEXT_PUBLIC_SITE_URL` | Metadata, OG URLs |
| `VERCEL_URL` | Fallback site URL on Vercel |
| `ADMIN_EMAILS` | Admin gate |
| `OPENAI_API_KEY` | Drafts + daily report |
| `OPENAI_MODEL` | Optional model override |
| `CRON_SECRET` | `/api/cron/ingest` |
| `REDDIT_MIN_SCORE` | Reddit connector filter |
| `ROCKSTAR_NEWSWIRE_GRAPHQL_HASH` | Newswire connector fallback |

### KEEP (optional)

| Variable | Used by |
|----------|---------|
| `EDITORIAL_ADMIN_NAME` | Daily report greeting |
| `ADMIN_DISPLAY_NAME` | Fallback greeting |

### No unused env vars found in application code

---

## npm dependencies

All **production** dependencies verified in use:

| Package | Evidence |
|---------|----------|
| `next`, `react`, `react-dom` | Framework |
| `@supabase/ssr`, `@supabase/supabase-js` | Data layer |
| `leaflet`, `leaflet.markercluster`, `@types/*` | Map |
| `lucide-react` | Icons sitewide |
| `react-markdown`, `remark-gfm` | Article + community markdown |
| `@base-ui/react` | `button`, `sheet` |
| `class-variance-authority`, `clsx`, `tailwind-merge` | UI utilities |
| `shadcn`, `tw-animate-css` | `globals.css` imports |

**No packages removed** — none were provably unused.

---

## Server Components review

All **54** `app/**/page.tsx` files are Server Components (no `"use client"` in `app/`).

Client boundaries live in `components/` (59 files with `"use client"`).

### Already optimal (server page + client islands)

Home, news, guides, entity pages, admin dashboard, newsroom, videos, leaderboard, search.

### Could reduce client JS (recommend only — do not migrate automatically)

| Page | Current client deps | Recommendation |
|------|---------------------|----------------|
| `/map` | `MapExperience`, dynamic `LeonidaMapCanvas` | Required — Leaflet is browser-only. Keep dynamic import. |
| `/login`, `/register` | Auth forms, OAuth | Required — form state. |
| `/community/*` | Post cards, like buttons, forms | Required — mutations. |
| `/tracker/*` | Progress toggles, spoiler | Required — interactive state. |
| `/profile`, `/u/[username]` | Save buttons, trackers | Partial — profile **layout** could stay server; buttons must stay client. |
| `/admin/articles/*` | `ArticleForm` | Required — rich form. |

### No page-level `"use client"` migrations needed

The App Router structure already follows the recommended server-first pattern.

---

## Lint / type fixes applied

| File | Fix |
|------|-----|
| `app/videos/[slug]/page.tsx` | Removed unused `Link` import |
| `components/profile/save-article-button.tsx` | Removed unused `Link` import |
| `components/profile/community-profile-section.tsx` | Replaced Lucide `Image` with `Camera` (false alt-text lint) |
| `lib/entities/faq.ts` | Removed unused `kind` param |
| `lib/profile/xp.ts` | `void reason` for reserved audit param |
| `lib/workflows/article-publishing-service.ts` | Removed unused import |
| `components/map/map-experience.tsx` | Extracted `selectedHubPointId` for effect deps |
| `scripts/cleanup-content.mjs` | Removed unused `meetsConfidenceThreshold` |

---

## Verification

```bash
npm run typecheck   # pass
npm run lint        # pass (0 warnings)
npm run build       # pass
```

**Regression risk:** Low. Removals were import-isolated. Merges are filter/wrapper only.

---

## Recommended next sprint (documentation only)

1. Extract shared OpenAI client (MERGE)
2. Unify spoiler toggle component (MERGE)
3. Redirect `/admin/editorial` → `/admin/dashboard` (DEPRECATE)
4. Batch entity queries in `detectContentGaps` (see `DATABASE_REVIEW.md`)
5. Add `@next/bundle-analyzer` to CI for trend tracking (optional)
