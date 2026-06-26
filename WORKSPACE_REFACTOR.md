# Article Workspace Refactor (Milestone 5.1)

## Why article-centric workflow scales better

The task-based model generated hundreds of micro-tasks per article:

- Add FAQ
- Add internal links
- Add video
- Update SEO

Each signal became a separate row. Over time this created duplicate work, noisy kanban boards, and unclear priorities.

**Article workspaces** flip the model:

- Editors work on **articles**, not fragments
- Each published article has **at most one active workspace**
- Improvements are a **checklist inside the workspace**, not separate tasks
- Scanning **merges** all signals (SEO gaps, Rockstar updates, outdated content, legacy tasks) into one record

## New entities

### `article_workspaces`

One improvement record per article while status is not `completed` or `archived`.

| Field | Purpose |
|-------|---------|
| `article_id` | Published article (unique while active) |
| `seo_score` / `potential_score` | Current vs estimated after checklist |
| `checklist` | JSON array of improvement items |
| `reason` | Human-readable trigger (e.g. Rockstar update) |
| `related_source_ids` | Merged Rockstar/Reddit sources |
| `assigned_to` / `locked_at` | Claim locking |

### `article_workspace_activity`

Audit log: created, seo_recalculated, checklist_regenerated, claimed, checklist_completed, completed, archived.

## Workspace lifecycle

```
needs_improvement → claimed → in_progress → review → completed
                                              ↓
                                          archived
```

| Status | Meaning |
|--------|---------|
| `needs_improvement` | Scan found gaps — unassigned |
| `claimed` | Editor claimed — workspace locked |
| `in_progress` | Checklist work underway |
| `review` | Ready for final review |
| `completed` | Improvement done |
| `archived` | Dismissed / no longer active |

### Locking

**Claim** sets `assigned_to` and `locked_at`. Only the assigned editor can toggle checklist items or complete while status is `claimed` or `in_progress`.

## Deduplication logic

1. **Unique active workspace per article** — partial unique index on `article_id` where status ∉ (`completed`, `archived`)
2. **Scan never creates a second workspace** — refreshes checklist on existing row
3. **Auto-merge** — FAQ + links + video + outdated signals for the same `article_id` become one checklist
4. **Legacy `editorial_tasks`** — active tasks with `related_article` are merged into scan signals (backward compatible; table kept)

## Checklist generation

Deterministic from SEO scoring (`lib/workspace/checklist.ts`). No OpenAI on scan or page load.

Example items:

- Expand article
- Add FAQ
- Add internal links
- Add YouTube embed
- Refresh screenshots
- Improve meta description
- Add related articles
- Refresh outdated content

When article content changes (`article_content_hash`), checklist is **regenerated** and merged with completed states preserved.

## Migration strategy

1. Apply `supabase/migrations/013_article_workspaces.sql`
2. Deploy code (uses `article_workspaces` for `/admin/workflow`)
3. Run **Scan Articles** on `/admin/workflow` — creates workspaces from published articles + merges legacy tasks
4. `editorial_tasks` table remains for backward compatibility; new UI does not create task rows

## OpenAI usage

Unchanged policy:

- No automatic OpenAI on scan, checklist, or page load
- OpenAI only via explicit buttons: Improve with AI, Generate FAQ, Rewrite article
- Usage tracked in `analytics_events`

## UI

| Route | Purpose |
|-------|---------|
| `/admin/workflow` | Home — articles needing attention, scan, metrics |
| `/admin/workflow/[id]` | Detail — checklist, preview, sources, suggestions, activity |
| `/admin/dashboard` | Shows article attention count + link to workflow |

## Code map

| Path | Role |
|------|------|
| `lib/workspace/types.ts` | Workspace + checklist types |
| `lib/workspace/checklist.ts` | Deterministic checklist builder |
| `lib/workspace/generator.ts` | Scan, merge, upsert |
| `lib/workspace/queries.ts` | CRUD + activity log |
| `lib/workspace/loader.ts` | Page data |
| `lib/workspace/metrics.ts` | Success metrics |
| `lib/actions/workspace.ts` | Server actions |

## Success metrics

- Articles needing attention
- Average SEO gain (completed workspaces)
- Average improvement time
- Completed improvements today
- Open workspaces
