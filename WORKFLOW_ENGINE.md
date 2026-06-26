# Editorial Workflow Engine

Task-driven editorial pipeline at `/admin/workflow`. Editors see what to work on today, claim tasks, move them through review stages, and use one-click AI assists — without auto-publishing.

## Task lifecycle

```
Opportunity → Claimed → Drafting → SEO Review → Fact Check → Ready → Scheduled → Published
                                                                              ↓
                                                                        Needs Update → (back to Opportunity)
                                                                              ↓
                                                                         Archived / Cancelled
```

| Status | Meaning |
|--------|---------|
| **Opportunity** | System- or editor-generated work item; unassigned |
| **Claimed** | Editor took ownership |
| **Drafting** | Article draft in progress |
| **SEO Review** | Title, meta, headings, links under review |
| **Fact Check** | Claims verified against sources |
| **Ready** | Approved for scheduling |
| **Scheduled** | Queued for publish date |
| **Published** | Live on site |
| **Needs Update** | Content stale or source changed |
| **Archived** | Done / no longer active |
| **Cancelled** | Discarded |

### Status transitions

- **Claim** — `opportunity` → `claimed` (sets `assigned_to` if empty)
- **Open draft** — navigates to article editor or create flow; often paired with `claimed` → `drafting`
- **Mark ready** — `drafting` / `seo_review` / `fact_check` → `ready`
- **Complete** — `ready` / `scheduled` → `published` (sets `completed_at`)
- **Kanban drag** — moves among active pipeline columns (Opportunity through Published)
- **Archive / Cancel** — terminal states in Task History

Manual moves only; no automatic publish.

## Database

Migration: `supabase/migrations/012_editorial_workflow.sql`

Table `editorial_tasks` — fields: `id`, `title`, `description`, `category`, `priority`, `estimated_minutes`, `status`, `created_from`, `related_source`, `related_article`, `assigned_to`, timestamps, `completed_at`.

Dedupe: active tasks (not published/archived/cancelled) are keyed by `created_from` + `related_source` / `related_article` / normalized title so the generator does not create duplicates.

## Task generator

Sources (rule-based, no OpenAI on generate):

- Rockstar newswire & YouTube
- Reddit signals
- Missing SEO pages (content gaps)
- Outdated articles
- Content opportunities
- Cannibalization pairs
- Low SEO score articles (FAQ / internal links)

**Rules:** If a published article matches → **Update** task. If none → **Create** task.

## Page sections

1. **Today's tasks** — grouped by status; claim, open draft, mark ready, complete
2. **Task generator** — scan & insert new opportunities
3. **Kanban** — Opportunity → Claimed → Drafting → SEO Review → Ready → Published (drag-and-drop)
4. **Task details** — summary, sources, article, FAQ/link suggestions, SEO score
5. **Daily capacity** — count + estimated minutes for active work
6. **Weekly progress** — created, completed, avg time, completion rate
7. **Task history** — completed, archived, cancelled
8. **One-click actions** — links to draft generator, SEO editor, FAQ/links (human publishes)
9. **OpenAI usage** — today's requests, monthly estimate, budget bar (from `analytics_events`)
10. **Dashboard links** — Editorial dashboard, SEO command center, workflow hub

## OpenAI usage

- **Never** called on workflow page load or task generation
- Tracked when user triggers: draft generation, SEO improve, daily/weekly reports, SEO AI editor
- Events: `openai_request`, `openai_draft`, `openai_seo_editor`, etc. in `analytics_events`
- Budget target: ~$5/month; UI shows daily count and projected monthly from recent usage

## Code map

| Path | Role |
|------|------|
| `app/admin/workflow/page.tsx` | Workflow UI |
| `lib/workflow/types.ts` | Status/priority enums, labels |
| `lib/workflow/queries.ts` | CRUD, dedupe, claim |
| `lib/workflow/task-generator.ts` | Candidate generation |
| `lib/workflow/loader.ts` | Page data + enrichments |
| `lib/workflow/metrics.ts` | Capacity, weekly, success metrics |
| `lib/actions/workflow.ts` | Server actions |

## Future automation ideas

- Auto-claim from calendar / shift schedule
- Slack or email digest of Today's tasks
- SLA timers (e.g. Fact Check &gt; 24h)
- Auto `needs_update` when Rockstar source newer than `article.updated_at`
- Batch generator cron (Vercel cron + service role) with daily cap
- Merge cannibalization tasks into single "consolidate" workflow
- Link workflow task ID to article revision history

## Apply migration

Run `012_editorial_workflow.sql` in Supabase SQL editor before using `/admin/workflow`.
