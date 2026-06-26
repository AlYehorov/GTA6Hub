# SEO Intelligence Engine — Milestone 4 Handoff

**Route:** `/admin/seo`  
**Type:** Product intelligence (not a user-facing feature)  
**Budget:** OpenAI only, on-demand — **$5/month cap** target

---

## Goal

Every article is measurable. Every day the system answers: **“What should we improve today?”**

All intelligence is **deterministic** except:
- **AI Editor** — one OpenAI request per button click
- **Weekly SEO Report** — one OpenAI request per Generate click

Nothing calls OpenAI on page load.

---

## Architecture

```
app/admin/seo/page.tsx
  └── loadSeoIntelligenceData()          # lib/seo/loader.ts — single fetch cycle

lib/seo/
  ├── types.ts           # All SEO intelligence types
  ├── scoring.ts         # Rule-based 0–100 score + improve reasons
  ├── queries.ts         # Supabase reads for articles, sources, videos
  ├── loader.ts          # Orchestrates all sections from one data pass
  ├── cannibalization.ts # Title similarity pairs
  ├── keywords.ts        # Keyword opportunities (no external APIs)
  ├── coverage.ts        # Entity coverage %
  ├── broken-links.ts    # Invalid internal href detection
  └── ai-services.ts     # AI Editor + Weekly Report (OpenAI on demand)

lib/ai/
  ├── openai-client.ts   # Shared HTTP client (reused from Sprint 3.9)
  └── prompts/
      ├── seo-ai-editor.ts
      └── seo-weekly-report.ts

lib/actions/seo-intelligence.ts   # Server actions (auth-gated)
lib/editorial/seo-score.ts        # Thin wrapper for editorial dashboard compat
```

### Data loading strategy

One parallel batch per page visit:

1. `fetchArticlesForSeoIntelligence()` — all articles + category (single query)
2. `fetchEntityRowsForGaps()` — 8 entity tables in parallel
3. `detectOutdatedArticles()` — freshness flags
4. Source + video title fetches for keywords
5. In-memory: scoring, inventory, improve queue, cannibalization, coverage, broken links

No duplicate full article-body queries within the SEO page.

---

## Sections (10)

| # | Section | Engine | OpenAI |
|---|---------|--------|--------|
| 1 | Content Inventory | `scoring.ts` + table UI | No |
| 2 | SEO Score | `scoring.ts` (0–100) | No |
| 3 | Improve Queue | `getImproveReasons()` | No (AI Editor optional per row) |
| 4 | Freshness Monitor | `detectOutdatedArticles()` | No |
| 5 | Content Cannibalization | `cannibalization.ts` | No |
| 6 | Keyword Opportunities | `keywords.ts` | No |
| 7 | Content Coverage | `coverage.ts` | No |
| 8 | Broken Internal Links | `broken-links.ts` | No |
| 9 | AI Editor | `ai-services.runSeoAiEditor()` | **Button only** |
| 10 | Weekly SEO Report | `ai-services.generateWeeklySeoReport()` | **Button only** |

---

## Scoring rules (0–100)

Implemented in `lib/seo/scoring.ts`. **No OpenAI.**

| Signal | Max points | Full credit when |
|--------|------------|------------------|
| Title | 10 | SEO title or title ≥ 10 chars |
| Description | 10 | Meta description or excerpt ≥ 50 chars |
| FAQ | 10 | `## FAQ` section or 3+ questions |
| Internal links | 15 | 3+ unique internal paths |
| External sources | 10 | `source_url` or http link in body |
| Hero image | 10 | `hero_image_url` set |
| Video | 10 | `video_id` or YouTube embed in content |
| Word count | 15 | 800+ words (partial at 500/250) |
| Schema | 10 | Published articles (JSON-LD on render) |
| Freshness | 10 | Updated within 14 days (partial decay) |

**Status bands:** Excellent ≥85 · Good ≥70 · Needs work ≥50 · Critical &lt;50

### Improve reasons (human-readable)

Generated when a breakdown factor is below threshold: Missing FAQ, No video, Only 1 internal link, Missing meta description, No hero image, No external source link, Thin content, Old article.

---

## Coverage logic

For each entity kind (characters, locations, vehicles, businesses, animals, missions, collectibles):

```
percent = (published entities mentioned in any article) / (published entities) × 100
```

“Mentioned” = slug, title, or hyphenated slug appears in published article corpus.

---

## Cannibalization logic

- Jaccard similarity on title tokens (stop words removed)
- Topic clusters (vehicles, characters, locations, trailers, release) lower the similarity threshold
- Suggests merge when overlap ≥ 50% or same-topic overlap ≥ 25%

---

## Broken links logic

1. Build valid path set from published articles, entities, videos + static routes
2. Parse markdown links and internal path patterns from article content
3. Flag hrefs not in valid set

---

## Keyword opportunities logic

Seeds from:
- Curated high-intent patterns (release date, map size, etc.)
- Published entity titles
- Recent source headlines not in article titles
- Video titles + “breakdown” angle

Filtered against existing article + source title corpus. **No external keyword APIs.**

---

## Improvement workflow

1. Open `/admin/seo` each morning
2. Scan **Improve Queue** and **Freshness Monitor**
3. Click **Improve** → article edit with `?focus=seo`
4. Optional: **Run AI Editor** on a row (one OpenAI call) — copy suggestions into article manually
5. Review **Cannibalization** — merge or differentiate overlapping guides
6. Use **Keyword Opportunities** → Create article (prefilled title)
7. Fix **Broken Internal Links** in article editor
8. Weekly: click **Generate Report** (one OpenAI call)

**Never auto-publish.** AI output is advisory only.

---

## OpenAI usage & cost

| Action | Trigger | Model | Est. tokens/call | Max frequency |
|--------|---------|-------|------------------|---------------|
| AI Editor | Button per article | gpt-4o-mini | ~2,000–4,000 | Manual |
| Weekly Report | Generate button | gpt-4o-mini | ~1,500–2,500 | Manual (~4/month) |

### Monthly budget estimate

| Usage | Calls/month | Est. cost |
|-------|-------------|-----------|
| Weekly reports | 4 | ~$0.02 |
| AI Editor (10 edits/month) | 10 | ~$0.05 |
| Editorial daily report (separate) | 30 | ~$0.02 |
| Cron drafts (separate) | ~30 | ~$0.10 |
| **Total** | | **~$0.20/month** |

Well under **$5/month** cap. OpenAI is never invoked on `/admin/seo` page load.

---

## Future integration points

| Integration | How |
|-------------|-----|
| Editorial Dashboard | Already shares `lib/editorial/seo-score.ts` wrapper |
| Auto-apply AI Editor suggestions | Server action → `updateArticle` with human confirm |
| Weekly report email | Cron + Resend (would need new service — out of budget) |
| `analytics_events` | Log `seo_ai_editor_run`, `seo_weekly_report` events |
| Entity pages | Coverage % drives entity article templates |
| Sitemap priority | Boost URLs with score &lt; 70 in `sitemap.ts` |
| CI guard | Fail build if broken internal links &gt; N |

---

## Files added

```
app/admin/seo/page.tsx
components/admin/seo-intelligence/*.tsx
lib/seo/*.ts
lib/ai/prompts/seo-ai-editor.ts
lib/ai/prompts/seo-weekly-report.ts
lib/actions/seo-intelligence.ts
```

## Verification

```bash
npm run typecheck   # ✅
npm run lint        # ✅
npm run build       # ✅
```

`/admin/seo` — 3.24 kB page JS, 122 kB First Load JS.

---

## Unchanged

- Public routes and pages
- Database schema
- Homepage hero
- Tracker / community / ingestion pipelines
- Auto-publish gates (`MIN_CONTENT_CONFIDENCE = 0.9`)
