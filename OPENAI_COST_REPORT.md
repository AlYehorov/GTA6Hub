# OpenAI Cost Report

**Date:** 2026-06-20  
**Model default:** `gpt-4o-mini` (overridable via `OPENAI_MODEL`)  
**Pricing reference (OpenAI, approximate):** $0.15 / 1M input tokens, $0.60 / 1M output tokens

---

## Every prompt

| ID | File | System prompt | User prompt builder | Output format |
|----|------|---------------|---------------------|---------------|
| **article-draft** | `lib/ai/prompts/article-draft.ts` | `ARTICLE_DRAFT_SYSTEM_PROMPT` — editorial rules, GTA 6 only, FAQ + internal links | `buildArticleDraftUserPrompt(source)` — full source item JSON fields | `response_format: json_object` |
| **editorial-daily-report** | `lib/ai/prompts/editorial-daily-report.ts` | `EDITORIAL_DAILY_REPORT_SYSTEM` — morning briefing, &lt;350 words | `buildEditorialDailyReportUserPrompt(snapshot)` — precomputed dashboard JSON | Markdown text |

### Mock fallback (no API cost)

| Provider | File | When used |
|----------|------|-----------|
| Mock | `lib/ai/providers/mock-provider.ts` | `OPENAI_API_KEY` unset, or OpenAI request fails |

---

## Every call site

| Call site | Prompt | Trigger | Model | Cached? |
|-----------|--------|---------|-------|---------|
| `lib/ai/providers/openai-provider.ts` → `generateOpenAiDraft()` | article-draft | Cron ingest, manual source processing, dashboard "Generate Draft" | gpt-4o-mini | No |
| `lib/editorial/daily-report.ts` → `callOpenAiForReport()` | editorial-daily-report | First `/admin/dashboard` load per UTC day | gpt-4o-mini, `max_tokens: 600` | Yes (`unstable_cache`, 24h) |

### Not OpenAI (zero cost)

| Feature | Method |
|---------|--------|
| Content opportunities (top 10) | TypeScript heuristics — `lib/editorial/opportunities.ts` |
| SEO health scores | Rule-based — `lib/editorial/seo-score.ts` |
| Internal link suggestions | String matching — `lib/editorial/internal-links.ts` |
| Content / SEO gaps | Supabase queries — `lib/editorial/content-gaps.ts` |

---

## Estimated daily cost

Assumptions for a typical production day:

| Scenario | Calls | In tokens | Out tokens | Est. cost |
|----------|-------|-----------|------------|-----------|
| **Daily report** | 1 | ~800 | ~400 | **~$0.0004** |
| **Cron ingest** (1×/day, 3 new sources) | 3 | ~4,500 (1.5k×3) | ~4,500 | **~$0.003** |
| **Manual draft** (2 admin clicks) | 2 | ~3,000 | ~3,000 | **~$0.002** |
| **Typical day total** | 6 | ~8,300 | ~7,900 | **~$0.006** |

### Worst-case day (heavy news day)

| Scenario | Calls | Est. cost |
|----------|-------|-----------|
| Daily report | 1 | $0.0004 |
| Cron: 15 sources processed | 15 | ~$0.015 |
| Admin: 10 manual drafts | 10 | ~$0.010 |
| Dashboard report refresh (bypass cache) | 1 | $0.0004 |
| **Heavy day total** | 27 | **~$0.026** |

Well under the **$0.50/day** editorial OS target.

### Article draft token profile (per call)

| Component | Est. tokens |
|-----------|-------------|
| System prompt | ~350 |
| User prompt (source title + content) | 500–2,000 |
| JSON output (title, excerpt, body, SEO) | 800–2,500 |
| **Typical total** | **~2,500–4,500** |

---

## Duplicated AI patterns

| Duplication | Location | Risk | Suggested reduction |
|-------------|----------|------|---------------------|
| **Duplicate HTTP client** | `openai-provider.ts` + `daily-report.ts` | Maintenance drift | Extract `lib/ai/openai-client.ts` with shared `chatCompletion()` |
| **Duplicate model/env parsing** | Both files read `OPENAI_API_KEY`, `OPENAI_MODEL` | Low | Centralize in client module |
| **Dashboard + report snapshot** | `loadEditorialDashboardData()` and `loadEditorialReportSnapshot()` both query DB | Not duplicate OpenAI, but duplicate **data** work on dashboard load | Pass snapshot from page to report loader (future) |

### No duplicate OpenAI calls on dashboard load

Opportunities, SEO, and gaps are heuristic — confirmed intentional for cost control (`CONTENT_OS_HANDOFF.md`).

---

## Cost reduction suggestions (do not implement yet)

| Priority | Suggestion | Savings |
|----------|------------|---------|
| 1 | Keep daily report cache; avoid "Refresh Report" unless needed | Prevents extra ~$0.0004/call |
| 2 | Cron already runs 1×/day (`vercel.json`: `0 12 * * *`) | Bounded ingest cost |
| 3 | `MIN_CONTENT_CONFIDENCE = 0.9` drops low-confidence drafts before save | Saves review time, not API cost |
| 4 | Batch multiple sources into one prompt (multi-article JSON array) | Could cut ingest cost 50%+ on busy days — **behavior change**, needs review |
| 5 | Cache draft for unprocessed source ID in DB | Avoid re-generation on retry — needs schema (`DEPRECATE` old draft row) |
| 6 | Use mock provider in preview/staging without `OPENAI_API_KEY` | Zero cost non-prod |

---

## Model usage summary

| Model | Call sites | Purpose |
|-------|------------|---------|
| `gpt-4o-mini` (default) | Draft generation, daily report | All production OpenAI usage |
| `OPENAI_MODEL` env | Override for both call sites | Optional A/B or upgrade path |
| Mock (local) | `mock-provider.ts` | Dev without API key |

**No other models or providers in codebase.**

---

## Monitoring recommendations

1. Log `usage.prompt_tokens` / `usage.completion_tokens` from OpenAI responses (not implemented today).
2. Add `analytics_events` row type `openai_usage` on each call (table exists, event type new).
3. Alert if daily cron `draftsCreated` &gt; 20.
