# Sprint 3.9 Follow-up

Safe optimizations from the architecture consolidation audit. No UI changes, no route renames, no schema changes, no file deletions.

---

## What changed

### 1. Shared OpenAI client

**New file:** `lib/ai/openai-client.ts`

- `createChatCompletion()` — single HTTP client for Chat Completions
- `isOpenAiConfigured()`, `getOpenAiModel()`, `OPENAI_DEFAULT_MODEL`

**Updated call sites:**

| File | Change |
|------|--------|
| `lib/ai/providers/openai-provider.ts` | Uses `createChatCompletion`; re-exports `isOpenAiConfigured` |
| `lib/editorial/daily-report.ts` | Uses `createChatCompletion`; documents cache + cost target |

Behavior unchanged: same model, temperature, `max_tokens`, JSON vs text output, error message prefixes.

### 2. Editorial dashboard query optimization

**Updated:** `lib/editorial/dashboard-data.ts` — single loader with documented strategy.

**Supporting changes:**

| File | Change |
|------|--------|
| `lib/editorial/content-gaps.ts` | `fetchEntityRowsForGaps()` (parallel), `computeContentGaps()` (pure), `buildArticleTextCorpus()` |
| `lib/editorial/internal-links.ts` | `suggestInternalLinksFromArticles()` + `buildLinkTargetsFromEditorialData()`; standalone path parallelized |
| `lib/editorial/types.ts` | `EditorialReportSnapshot` type |
| `app/admin/dashboard/page.tsx` | Sequential load: data → snapshot → cached report (no duplicate DB work on report cache miss) |

### 3. `/admin/editorial` redirect

**Updated:** `app/admin/editorial/page.tsx`

- Route preserved (bookmarks, links still valid)
- `redirect("/admin/dashboard")` — no legacy UI rendered

### 4. Documentation comments

- `lib/editorial/dashboard-data.ts` — loading strategy (single article fetch, parallel entities, in-memory compute)
- `lib/editorial/daily-report.ts` — why report is cached, `$0.50/day` cost target, snapshot reuse

---

## Before / after: query improvements

### `/admin/dashboard` — published articles

| | Before | After |
|---|--------|-------|
| Full published article queries | **3** (gaps, SEO analysis, internal links ×2) | **1** (`fetchPublishedArticlesBundle`) |

### `/admin/dashboard` — entity tables

| | Before | After |
|---|--------|-------|
| Entity fetches | **14 sequential** (8 in gaps + 6 in link targets) | **8 parallel** (one `fetchEntityRowsForGaps`, shared) |
| Round-trips | Up to 14 await chains | 1 `Promise.all` batch |

### `/admin/dashboard` — content gaps

| | Before | After |
|---|--------|-------|
| Gap detection runs | 1 DB scan + compute | Same data, `computeContentGaps()` in memory |
| Duplicate gap + missing pages | Already merged in 3.8 | `gapsToMissingSeoPages(gaps)` — no second scan |

### `/admin/dashboard` — daily report on cache miss

| | Before | After |
|---|--------|-------|
| Dashboard data loads | 1× `loadEditorialDashboardData` | 1× |
| Report snapshot | `loadEditorialReportSnapshot()` → **2nd** full dashboard load | `buildEditorialReportSnapshot(data)` — **0** extra queries |
| OpenAI calls | ≤1/day (cached) | ≤1/day (unchanged) |

### `detectContentGaps()` (standalone, e.g. cron/editorial redirect path)

| | Before | After |
|---|--------|-------|
| Entity queries | 8 sequential | 8 parallel |

---

## OpenAI client consolidation

```
Before:
  openai-provider.ts     ── fetch(OPENAI_API_URL) ──┐
  daily-report.ts        ── fetch(OPENAI_API_URL) ──┘  (duplicate)

After:
  openai-client.ts       ── createChatCompletion()
         ▲                        ▲
         │                        │
  openai-provider.ts      daily-report.ts
```

---

## Verification results

```bash
npm run typecheck   # ✅ pass
npm run lint        # ✅ pass (0 warnings)
npm run build       # ✅ pass
```

`/admin/editorial` build output: **171 B** (redirect-only page).

---

## Not changed (by design)

- Dashboard UI components
- Database schema
- Routes (except `/admin/editorial` now redirects in-place)
- OpenAI prompts, temperatures, token limits
- Daily report cache TTL (24h)
- File deletions

---

## Related docs

- `ARCHITECTURE_REPORT.md` — full audit
- `OPENAI_COST_REPORT.md` — cost model
- `DATABASE_REVIEW.md` — N+1 notes
- `CONTENT_OS_HANDOFF.md` — editorial OS overview
