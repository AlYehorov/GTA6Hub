# GTA6Hub — Sprint 3 Handoff

**Sprint 3: Source Engine + AI Draft System**

Collects content from external sources, generates AI drafts for human review, and publishes only after explicit admin approval. **Never auto-publishes.**

---

## Architecture

### Design principles

- **Server Components first** — admin list/detail pages are Server Components; client components only for forms/actions
- **Clean service layer** — business logic in `lib/sources/`, `lib/ai/`, `lib/workflows/`
- **Connector pattern** — each source implements `SourceConnector`; swap mock → real without changing workflows
- **Human-in-the-loop** — AI drafts stay `pending` until approved; publish requires `approved` status + button click
- **No homepage/article changes** — Sprint 2 article pages untouched; homepage still uses mock data

### Layer diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Admin UI (/admin/sources, /admin/drafts)                   │
│  Client: SourceIngestActions, DraftReviewActions            │
└──────────────────────────┬──────────────────────────────────┘
                           │ Server Actions
┌──────────────────────────▼──────────────────────────────────┐
│  lib/actions/sources.ts    lib/actions/drafts.ts            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  lib/workflows/                                             │
│  ├── ingest-and-draft-workflow.ts                           │
│  └── article-publishing-service.ts                          │
└───────┬──────────────────────────────┬──────────────────────┘
        │                              │
┌───────▼──────────┐          ┌────────▼─────────┐
│ lib/sources/     │          │ lib/ai/          │
│ IngestionService │          │ AIDraftService   │
│ Connectors       │          │ Prompt templates │
└───────┬──────────┘          └────────┬─────────┘
        │                              │
        └──────────────┬───────────────┘
                       ▼
              Supabase (Postgres)
         source_items | ai_drafts | articles
```

### New directories

```
lib/
  sources/
    types.ts                      Connector interface
    mock-data.ts                    Mock source payloads
    registry.ts                     Connector registry
    source-ingestion-service.ts     SourceIngestionService
    queries.ts                      Admin read queries
    connectors/
      index.ts                      RockstarNewswire, Youtube, Reddit, Twitter
  ai/
    ai-draft-service.ts             AIDraftService
    prompts/article-draft.ts        LLM prompt templates
    providers/mock-provider.ts      Mock AI (no API key required)
  workflows/
    ingest-and-draft-workflow.ts    Ingest → generate drafts
    article-publishing-service.ts   Approved draft → live article
  drafts/queries.ts                 Draft admin queries
  search/search-service.ts          Global search
  analytics/
    events.ts                       Event type definitions
    track.ts                        trackEvent() → analytics_events table
  actions/
    sources.ts                      Ingestion server actions
    drafts.ts                       Approve / reject / publish actions
  types/
    source.ts
    ai-draft.ts

components/
  admin/source-ingest-actions.tsx
  admin/draft-review-actions.tsx
  search/search-bar.tsx

app/
  admin/sources/page.tsx
  admin/drafts/page.tsx
  admin/drafts/[id]/page.tsx
  search/page.tsx

supabase/migrations/002_sprint3_source_engine.sql
scripts/seed-sprint3.mjs
```

---

## Database Schema

Migration: `supabase/migrations/002_sprint3_source_engine.sql`

Run in Supabase SQL Editor **after** `001_initial_schema.sql`.

### Enums

```sql
source_platform: rockstar_newswire | rockstar_youtube | reddit | x
ai_draft_status: pending | approved | rejected | published
```

### `source_items`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| source | source_platform | Connector identifier |
| source_type | text | e.g. `newswire_post`, `youtube_video`, `reddit_post`, `tweet` |
| source_url | text | Original URL |
| external_id | text | Unique per source (dedup key) |
| title | text | |
| content | text | Raw ingested body |
| published_at | timestamptz | nullable |
| processed | boolean | true after AI draft generated |
| created_at | timestamptz | |

**Unique:** `(source, external_id)`

### `ai_drafts`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| source_item_id | uuid | FK → source_items |
| title | text | AI-generated headline |
| excerpt | text | |
| content | text | Markdown body |
| category | text | Suggested category name |
| suggested_tags | text[] | AI-suggested tags |
| seo_title | text | |
| seo_description | text | |
| confidence | numeric(3,2) | 0.00–1.00 |
| status | ai_draft_status | default `pending` |
| published_article_id | uuid | FK → articles (set on publish) |
| created_at | timestamptz | |

### `analytics_events`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| event_name | text | See Analytics section |
| payload | jsonb | Event-specific data |
| created_at | timestamptz | |

### RLS

- `source_items`, `ai_drafts`, `analytics_events` — **no public policies**
- Admin access via service role only

---

## Workflows

### 1. Ingestion + AI draft generation

```
Admin clicks "Run full ingestion"
  → IngestAndDraftWorkflow.runAll()
    → SourceIngestionService.ingestAllConnectors()
      → Each connector.fetchItems() [mock data today]
      → Insert new source_items (skip duplicates)
    → For each new source_item:
      → AIDraftService.createDraft()
        → generateFromSource() [mock provider]
        → INSERT ai_drafts (status: pending)
      → Mark source_item.processed = true
```

**Never publishes.** Drafts await human review at `/admin/drafts`.

### 2. Human review

| Action | Status transition | Analytics event |
|---|---|---|
| Approve | pending → approved | `draft_approved` |
| Reject | pending/approved → rejected | `draft_rejected` |
| Publish | approved → published + creates article | `draft_published` |

### 3. Publishing (explicit only)

```
Admin clicks "Publish as News" on approved draft
  → ArticlePublishingService.publishDraft()
    → Validates status === 'approved'
    → INSERT articles (status: published)
    → Resolve category + tags
    → UPDATE ai_drafts (status: published, published_article_id)
    → revalidatePath(/news, /guides, …)
```

---

## Admin Pages

| Route | Component type | Purpose |
|---|---|---|
| `/admin/sources` | Server | Source item list, ingestion controls |
| `/admin/drafts` | Server | Draft list (title, source, confidence, status, date) |
| `/admin/drafts/[id]` | Server + client actions | Draft review, Approve/Reject/Publish |

### Updated `/admin` dashboard

- Stats: AI drafts pending, sources pending
- Links to Sources and AI Drafts

### Ingestion controls (`/admin/sources`)

- **Run full ingestion** — all connectors
- **Per-platform buttons** — single connector
- **Process pending** — generate drafts for unprocessed source_items

---

## Services

### `SourceIngestionService`

```typescript
ingestFromConnector(connector)  // Single platform
ingestAllConnectors()         // All platforms
ingestItems(inputs)           // Raw items
getUnprocessedItems()         // For batch processing
markProcessed(id)
```

### `AIDraftService`

```typescript
generateFromSource(source)    // Returns AiGeneratedArticle
createDraft(source)           // Saves to ai_drafts
updateStatus(id, status)      // Approve/reject/publish state
```

Uses prompt templates in `lib/ai/prompts/article-draft.ts`. Currently uses **mock provider** — ready for OpenAI/Anthropic swap.

### `ArticlePublishingService`

```typescript
publishDraft(draft, type)     // approved → live article
```

Only callable on `approved` drafts. Creates category/tags if missing.

### `IngestAndDraftWorkflow`

Orchestrates ingestion + draft creation. Entry point for admin actions.

---

## Supported Sources (Connectors)

| Connector | Platform ID | Mock | Real scraping |
|---|---|---|---|
| `RockstarNewswireConnector` | `rockstar_newswire` | ✅ | ❌ Not implemented |
| `RockstarYoutubeConnector` | `rockstar_youtube` | ✅ | ❌ Not implemented |
| `RedditConnector` | `reddit` | ✅ | ❌ Not implemented |
| `TwitterConnector` | `x` | ✅ | ❌ Not implemented |

All connectors implement:

```typescript
interface SourceConnector {
  readonly platform: SourcePlatform;
  fetchItems(): Promise<SourceItemInput[]>;
}
```

Mock data: `lib/sources/mock-data.ts`

---

## Search

### Route

`/search?q=query`

### `SearchBar` component

- `components/search/search-bar.tsx`
- Used on `/search` page
- Search icon in navbar → `/search`

### Search scope

| Type | Source |
|---|---|
| News | Supabase `articles` (published, type=news) |
| Guides | Supabase `articles` (published, type=guide) |
| Characters | `MOCK_CHARACTERS` |
| Vehicles | `MOCK_VEHICLES` |

Tracks `search` analytics event with query + result count.

---

## Analytics

### Event types (`lib/analytics/events.ts`)

| Event | Payload | Triggered by |
|---|---|---|
| `article_view` | article_id, slug, type | Ready for article pages (not wired yet) |
| `search` | query, result_count | `/search` page |
| `draft_approved` | draft_id, source | Approve action |
| `draft_rejected` | draft_id, source | Reject action |
| `draft_published` | draft_id, source, article_id, slug | Publish action |

### Tracking

```typescript
import { trackEvent, trackSearch, trackDraftApproved } from "@/lib/analytics/track";
```

- Persists to `analytics_events` table (service role)
- Logs to console in development

---

## Setup

### 1. Run Sprint 3 migration

Supabase SQL Editor → run `supabase/migrations/002_sprint3_source_engine.sql`

### 2. Seed test data (optional)

```bash
node scripts/seed-sprint3.mjs
```

Or use `/admin/sources` → **Run full ingestion**

### 3. Review workflow

1. `/admin/sources` — run ingestion
2. `/admin/drafts` — review pending drafts
3. `/admin/drafts/[id]` — Approve → Publish as News/Guide
4. Verify at `/news/[slug]`

---

## Dependencies

No new npm packages in Sprint 3. Uses existing:

- `@supabase/supabase-js` — DB + storage
- `@supabase/ssr` — server client
- `react-markdown` / `remark-gfm` — unchanged (Sprint 2)

Optional future:

- `openai` or `@anthropic-ai/sdk` — real AI generation

---

## Pending Tasks

### Sprint 4 — recommended

- [ ] **Real connectors** — RSS/API/scraping for Rockstar Newswire, YouTube, Reddit, X
- [ ] **OpenAI/Anthropic provider** — swap mock provider when `OPENAI_API_KEY` set
- [ ] **Admin authentication** — protect `/admin/*`
- [ ] **Scheduled ingestion** — cron job or Supabase Edge Function
- [ ] **Wire `article_view`** — track on article detail pages (without modifying layout)
- [ ] **Draft preview** — render markdown like live article before publish
- [ ] **Homepage live news** — pull from Supabase (layout unchanged)
- [ ] **Delete draft UI**
- [ ] **Analytics dashboard** — query `analytics_events`
- [ ] **Duplicate detection** — semantic similarity before draft creation
- [ ] **Hero image extraction** — from source URLs during ingestion

### Production hardening

- [ ] Storage upload policies for connector-fetched images
- [ ] Rate limiting on ingestion actions
- [ ] Webhook endpoints for push-based sources
- [ ] Audit log for publish actions

---

## Key Files

```
supabase/migrations/002_sprint3_source_engine.sql
lib/workflows/ingest-and-draft-workflow.ts
lib/workflows/article-publishing-service.ts
lib/sources/source-ingestion-service.ts
lib/ai/ai-draft-service.ts
lib/actions/drafts.ts
lib/actions/sources.ts
app/admin/drafts/[id]/page.tsx
components/admin/draft-review-actions.tsx
app/search/page.tsx
components/search/search-bar.tsx
scripts/seed-sprint3.mjs
```

---

## Constraints preserved

- ✅ Homepage not redesigned
- ✅ Existing article pages not modified
- ✅ Current design system preserved
- ✅ Server Components default
- ✅ Never auto-publish content
