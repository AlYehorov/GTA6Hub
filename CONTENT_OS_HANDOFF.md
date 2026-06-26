# Content OS Handoff

Editorial operating system for GTAVIHub — **not** a user-facing feature. Gives admins a single morning view of what happened, what to write, what to update, and what can drive traffic.

## Route

**`/admin/dashboard`** — editorial home (replaces `/admin/editorial` as the primary entry; legacy calendar still available).

Requires admin auth + `SUPABASE_SERVICE_ROLE_KEY`.

## Sections

| # | Section | Data source | OpenAI? |
|---|---------|-------------|---------|
| 1 | Today's Summary | Supabase counts (UTC day) | No |
| 2 | Content Opportunities | Heuristic ranking of sources, gaps, playbook | No |
| 3 | Missing SEO Pages | Entity tables vs articles | No |
| 4 | Outdated Articles | Article age + Rockstar sources | No |
| 5 | Internal Link Suggestions | Entity/article title matching | No |
| 6 | SEO Health | Rule-based 0–100 score | No |
| 7 | One-Click Actions | Server actions + navigation | Only on explicit draft-from-source |
| 8 | Daily Report | **One** cached `gpt-4o-mini` call/day | Yes (≤1/day) |

## Cost model

- **Daily report:** single OpenAI request per UTC day via `unstable_cache` (`lib/editorial/daily-report.ts`). Target **< $0.50/day** with `gpt-4o-mini`, `max_tokens: 600`.
- **Opportunities, SEO, links, gaps:** computed in TypeScript from existing DB data — **zero** extra OpenAI calls.
- **Generate Draft** on a source opportunity triggers the existing draft pipeline (same as `/admin/sources`) — only when an admin clicks; never auto-runs on page load.

## Environment

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Daily report + on-demand draft generation |
| `OPENAI_MODEL` | Optional override (default `gpt-4o-mini`) |
| `EDITORIAL_ADMIN_NAME` or `ADMIN_DISPLAY_NAME` | Greeting in daily report (e.g. "Alex") |
| `SUPABASE_SERVICE_ROLE_KEY` | All dashboard queries |

Without `OPENAI_API_KEY`, the daily report uses a deterministic template fallback.

## Key files

```
app/admin/dashboard/page.tsx          # Main UI
lib/editorial/dashboard-data.ts       # Aggregates all sections
lib/editorial/opportunities.ts        # Top 10 heuristic opportunities
lib/editorial/missing-seo-pages.ts    # Entity coverage gaps
lib/editorial/outdated.ts             # Stale articles vs Rockstar
lib/editorial/internal-links.ts       # Link suggestions
lib/editorial/seo-score.ts            # 0–100 SEO scoring
lib/editorial/daily-report.ts         # Cached OpenAI morning briefing
lib/actions/editorial-dashboard.ts    # Refresh report, process sources, generate draft
components/admin/editorial-dashboard/ # Section components
```

## Constants

- `OUTDATED_ARTICLE_DAYS = 30` — `lib/editorial/constants.ts`
- Missing SEO entity kinds: characters, locations, vehicles, businesses, animals, missions, collectibles (weapons excluded)
- `MIN_CONTENT_CONFIDENCE = 0.9` still applies to AI drafts

## One-click actions

| Button | Behavior |
|--------|----------|
| Process Pending Sources | Runs `ingestAndDraftWorkflow.processUnprocessedSources()` |
| Generate Draft | Links to sources or creates draft from source ID |
| Update Draft | `/admin/drafts` or article edit with `?focus=content` |
| Improve SEO | Article edit with `?focus=seo` |
| Suggest FAQ | Article list / content focus |
| Suggest Internal Links | Scrolls to internal links section |

**Never auto-publishes.** All AI output stays in draft/review.

## Daily workflow

1. Open `/admin/dashboard` each morning.
2. Read **Daily Report** (auto-cached for the day).
3. Scan **Today's Summary** counts.
4. Pick from **Content Opportunities** (top 10) or **Missing SEO Pages**.
5. **Update** flagged outdated articles.
6. Fix **SEO Health** weakest pages and add **internal links**.
7. Use **Refresh Report** only if major changes happened after the first load.

## Revalidation

Dashboard paths revalidate on draft/source actions:

- `/admin/dashboard`
- `/admin/editorial`
- `/admin/drafts`
- `/admin/articles`

Daily report cache tag: `editorial-daily-report-YYYY-MM-DD`

## Article create/edit integration

- Create: `/admin/articles/create?title=...&type=guide` (prefills title from dashboard)
- Edit: `/admin/articles/[id]?focus=seo|content|links` (scrolls to section)

## What we did not change

- Tracker ingestion
- Community engine
- Homepage hero
- Auto-publish gates
- Existing cron / ingest connectors (reused, not modified)

## Legacy

`/admin/editorial` — original read-only calendar; kept for reference. Prefer `/admin/dashboard`.

## Verify locally

```bash
npm run build
```

Visit `/admin/dashboard` with admin session and Supabase configured.
