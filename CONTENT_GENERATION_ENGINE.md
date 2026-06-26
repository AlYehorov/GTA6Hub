# Content Generation Engine (Sprint 6.5)

Turn `source_items`, videos, and Knowledge Graph entities into editorial drafts at scale — with explicit OpenAI calls, cost controls, and human review gates.

## Architecture

```
/admin/content-engine
        │
        ├── Source-to-Content Queue (sources + videos)
        │
        └── /admin/content-engine/source/[id]
                 │
                 ├── Extract entities (deterministic KG)
                 ├── Step 1: Content Plan (1 cheap OpenAI call)
                 └── Step 2: Draft per idea (on admin click)

lib/content-engine/
  loader.ts           — queue + detail page data
  source-entities.ts  — link sources ↔ kg_entities
  plan-generator.ts   — Step 1 OpenAI
  draft-generator.ts  — Step 2 OpenAI → ai_drafts
  workflow-bridge.ts  — improve workspace or create draft path
  queries.ts          — content_plans / content_plan_ideas CRUD
  usage.ts            — ai_usage_events + daily limits
```

### Database (migration `015_content_engine.sql`)

| Table | Purpose |
|-------|---------|
| `ai_usage_events` | Per-call token/cost tracking |
| `source_entities` | Source ↔ KG entity links |
| `content_plans` | One plan per source or video |
| `content_plan_ideas` | 5–10 ideas per plan with SEO metadata |
| `ai_drafts.content_plan_idea_id` | Back-link draft to idea |

## Two-Step AI Flow

### Step 1 — Content Plan (cheap)

- **Trigger:** “Generate Plan” on queue or source detail
- **Model:** `gpt-4o-mini`, ~1200 max output tokens, JSON mode
- **Output:** 5–10 ideas with `target_keyword`, `category`, `entity_slugs`, `internal_link_targets`, `estimated_value`, `priority`
- **No full articles** at this stage

### Step 2 — Draft (on demand)

- **Trigger:** “Generate Draft” on a single idea
- **Model:** `gpt-4o-mini`, ~2500 max output tokens, JSON mode
- **Output:** title, slug, excerpt, markdown body, FAQ, SEO fields, confirmed facts vs speculation, internal link suggestions
- **Saved to:** `ai_drafts` (status `pending`) — never auto-published

## OpenAI Cost Strategy

- **OpenAI only** — no additional paid services
- **gpt-4o-mini** pricing estimates in `lib/content-engine/usage.ts`
- **Hard limits:** 10 content plans/day, 20 drafts/day
- **Budget warning:** estimated monthly cost > $5 blocks new generations
- **No page-load calls** — cron, admin buttons, or manual actions only
- **Heuristic fallback** when `OPENAI_API_KEY` is unset (local dev)

Usage is tracked in:

1. `ai_usage_events` — precise token/cost per action
2. `analytics_events` via `trackOpenAiRequest` (`content_plan`, `content_draft`)

## Knowledge Graph Integration

1. **Extract entities** from source title + body (`lib/knowledge-graph/extractor`)
2. **Persist** links in `source_entities`
3. **Weak entity hints** — orphans and entities missing descriptions are prioritized in plan prompts
4. **Internal links** — ideas include KG paths (`/characters/slug`, etc.)

## Workflow Integration

**Send to Workflow** per idea:

| Scenario | Action |
|----------|--------|
| Matching published article exists | Create or update `article_workspaces` (“Improve Article”) |
| No matching article | Require draft first → review in `/admin/drafts` (“Create Article”) |

No duplicate active workspaces — existing workspace is merged/updated.

## Draft Quality Rules

Prompts enforce:

- Confirmed facts vs speculation sections
- Official source attribution (markdown links)
- No fake leaks, invented facts, or copied source text
- No copyrighted lyrics
- Natural “GTA 6” / “GTA VI” usage
- FAQ block in every draft
- Internal link suggestions from KG

## Admin URLs

| URL | Purpose |
|-----|---------|
| `/admin/content-engine` | Queue + usage stats |
| `/admin/content-engine/source/[id]` | Source detail, plan, ideas, actions |

## How to Test

### 1. Apply migration

```bash
# Run in Supabase SQL editor or CLI
supabase/migrations/015_content_engine.sql
```

Requires migrations 011–014 applied.

### 2. Environment

```env
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...          # optional for heuristic mode
OPENAI_MODEL=gpt-4o-mini    # optional
```

### 3. Manual flow

1. Ingest sources at `/admin/sources`
2. Open `/admin/content-engine` — verify queue shows Rockstar/Reddit items
3. Click **Generate Plan** on a source
4. Open source detail — verify 5–10 ideas with SEO metadata
5. Click **Generate Draft** on one idea — verify `/admin/drafts/[id]`
6. Click **Send to Workflow** — verify workspace or draft redirect
7. Check usage bar — plans/drafts today and monthly cost

### 4. Verify build

```bash
npm run typecheck
npm run lint
npm run build
```

## Safety

- Never auto-publishes
- No public UI or URL changes
- Daily rate limits enforced server-side
- Monthly budget guard before each OpenAI call
- Low-confidence community/rumor sources capped in draft prompts
