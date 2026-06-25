# Sprint 4 Handoff — Real Source Ingestion & Scheduled Drafts

Sprint 4 adds live connectors, a secured cron endpoint, OpenAI-backed draft generation, admin filtering, and source reliability labels.

## Implemented Connectors

| Connector | Source | Method | Label |
|-----------|--------|--------|-------|
| `RockstarNewswireConnector` | `rockstar_newswire` | Rockstar GraphQL (if hash set) → Google News RSS fallback | `official` |
| `RockstarYoutubeConnector` | `rockstar_youtube` | YouTube RSS (`UC6VcWc1rAoWdBCM0JxrRQ3A`) | `official` |
| `RedditConnector` | `reddit` | Reddit JSON → PullPush API → Reddit RSS fallback | `unconfirmed` / `community` |
| `TwitterConnector` | `x` | Mock only (manual admin ingest) | — |

### Deduplication

New items are skipped when a matching `source + external_id` or `source_url` already exists in `source_items`.

### Safety labels

`source_items.source_label` enum: `official`, `community`, `rumor`, `unconfirmed`.

- Reddit content is **never** stored as `official` (enforced in `enforceSourceLabel()`).
- AI prompts cap confidence for unconfirmed/community sources.

## Required Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Ingestion + drafts (server only) |
| `ADMIN_EMAILS` | Recommended | Admin login whitelist |
| `CRON_SECRET` | Yes (prod cron) | Auth for `/api/cron/ingest` |
| `OPENAI_API_KEY` | Optional | Real AI drafts; mock fallback if unset |
| `OPENAI_MODEL` | Optional | Default: `gpt-4o-mini` |
| `ROCKSTAR_NEWSWIRE_GRAPHQL_HASH` | Optional | Direct Rockstar GraphQL access |
| `REDDIT_MIN_SCORE` | Optional | Default: `100` |

## Database Migration

Run in Supabase SQL Editor:

```
supabase/migrations/004_source_labels.sql
```

Adds `source_label` column and indexes on `source_items`.

## Cron Setup

### Vercel

`vercel.json` schedules ingestion every 6 hours:

```json
{
  "crons": [{ "path": "/api/cron/ingest", "schedule": "0 */6 * * *" }]
}
```

In Vercel project settings, add:

- `CRON_SECRET` — long random string
- Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` to cron routes when configured

### Manual trigger

```bash
curl -X POST "http://localhost:3000/api/cron/ingest" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Response example:

```json
{
  "ok": true,
  "durationMs": 12400,
  "ingested": 3,
  "skipped": 12,
  "draftsCreated": 2,
  "errors": [],
  "aiProvider": "openai"
}
```

## How to Test Locally

1. Apply migration `004_source_labels.sql` in Supabase.
2. Copy `.env.local.example` → `.env.local` and set keys.
3. Generate a cron secret: `openssl rand -hex 32`
4. Start dev server: `npm run dev`
5. Trigger cron manually (see curl above) **or** use `/admin/sources` ingest buttons.
6. Review drafts at `/admin/drafts` — pending drafts sort first.
7. Approve/reject/publish from draft detail (never auto-publishes).

### Rockstar Newswire GraphQL hash (optional)

Rockstar's newswire uses a rotating Apollo persisted query hash:

1. Open https://www.rockstargames.com/newswire in Chrome DevTools → Network
2. Filter for `graph.rockstargames.com` and `NewswireList`
3. Copy `extensions.persistedQuery.sha256Hash` from the request
4. Set `ROCKSTAR_NEWSWIRE_GRAPHQL_HASH` in env

Without the hash, the connector falls back to Google News RSS filtered to `site:rockstargames.com/newswire`.

## Admin Changes

- **`/admin/sources`**: filter by platform and processed/unprocessed; shows source labels
- **`/admin/drafts`**: pending first, source link, confidence, label badges

## Architecture

```
/api/cron/ingest
  → IngestAndDraftWorkflow.runFullCycle()
    → ingestProductionConnectors() (Newswire, YouTube, Reddit)
    → create AI drafts for new + backlog unprocessed items
    → mark source_items.processed = true
```

AI provider selection:

- `OPENAI_API_KEY` set → OpenAI JSON mode
- Otherwise → mock provider (local dev friendly)

## Known Risks

1. **Rockstar GraphQL hash rotation** — persisted query hash expires; set `ROCKSTAR_NEWSWIRE_GRAPHQL_HASH` or rely on Google News RSS fallback (indirect links).
2. **Reddit rate limits** — public JSON may block server IPs; PullPush and RSS fallbacks mitigate this.
3. **PullPush latency** — archive API can take 10–30s; cron `maxDuration` is 300s on Vercel.
4. **Google News RSS** — links pass through Google redirect, not direct Rockstar URLs.
5. **OpenAI costs** — each unprocessed source item triggers one completion; monitor usage.
6. **No auto-publish** — drafts stay `pending` until a human approves and publishes in admin.
7. **Migration required** — ingestion fails if `source_label` column is missing.

## Files Added/Changed

- `lib/sources/connectors/` — real connector implementations
- `lib/sources/fetch-utils.ts` — HTTP + RSS helpers
- `lib/ai/providers/openai-provider.ts` — OpenAI integration
- `app/api/cron/ingest/route.ts` — secured cron endpoint
- `vercel.json` — 6-hour schedule
- `supabase/migrations/004_source_labels.sql`
- Admin pages + `components/admin/source-filters.tsx`
