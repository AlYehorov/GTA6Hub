# Editorial Opportunity Engine

The Content Engine philosophy: **do not write from every source**. The Editor-in-Chief scans hundreds of signals and surfaces only the best publishing opportunities.

## Home

**`/admin/editor`** — morning briefing (deterministic, no OpenAI on load)

Legacy `/admin/content-engine` redirects here. Source detail routes remain for backward compatibility.

## Architecture

```
Ingested sources + videos
        ↓
Topic clustering (deterministic)
        ↓
Editorial scoring (+/- points)
        ↓
Deduplication & ranking
        ↓
Top opportunities on /admin/editor
        ↓
[Admin clicks Generate Article]
        ↓
Single OpenAI call → ai_drafts
```

### Scoring (deterministic)

| Signal | Points |
|--------|--------|
| Rockstar official | +100 |
| Multiple sources, same topic | +40 |
| Trending keyword | +30 |
| YouTube 50k+ views | +25 |
| Reddit discussion volume | +20 |
| Knowledge Graph entities | +20 |
| Updates existing article | +15 |
| Evergreen guide | +10 |
| Old rumor | -40 |
| Duplicate article | -100 |
| Spam | -100 |

### Clustering

Sources about the same topic (pricing, trailer 2, Lucia, etc.) merge into **one** opportunity — not one article per Reddit post.

## OpenAI usage

- **Never** on dashboard load, ranking, or clustering
- **One** call when **Generate Article** is clicked
- Tracked in `ai_usage_events` as `opportunity_article`
- Same budget limits as Content Engine (20 drafts/day, $5/month)

## Database

- `editorial_opportunities` (migration `016`) — persist dismissed/generated status per `cluster_key`
- `content_plans` / `content_plan_ideas` — legacy two-step flow still available on source detail pages

## Modules

| Path | Role |
|------|------|
| `lib/opportunity-engine/loader.ts` | Briefing data |
| `lib/opportunity-engine/clustering.ts` | Topic clusters |
| `lib/opportunity-engine/scoring.ts` | Point rules |
| `lib/opportunity-engine/ranker.ts` | Final ranked list |
| `lib/opportunity-engine/article-generator.ts` | OpenAI article generation |
| `lib/actions/editor.ts` | Server actions |

## Migrations

Apply `015_content_engine.sql` and `016_editorial_opportunities.sql`.

## Test

1. Open `/admin/editor` — verify intake stats and opportunities (no OpenAI)
2. Click **Generate Article** on one opportunity — verify `/admin/drafts/[id]`
3. Confirm usage bar increments drafts today
4. Dismiss an opportunity — it should not reappear after refresh
