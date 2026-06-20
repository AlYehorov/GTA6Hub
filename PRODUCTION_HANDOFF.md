# GTA6Hub — Production Handoff

Prepared for first production deployment on **Vercel + Supabase**.

---

## What Was Checked

| Area | Status |
|---|---|
| Environment validation (`lib/env.ts`) | ✅ |
| Supabase client separation (anon vs service role) | ✅ |
| RLS policies (published articles public; drafts/sources admin-only) | ✅ |
| ESLint | ✅ |
| TypeScript (`tsc --noEmit`) | ✅ |
| Production build (`npm run build`) | ✅ |
| Admin auth middleware | ✅ |
| Homepage live news from Supabase | ✅ |
| SEO (sitemap, robots, OG metadata) | ✅ |
| Seed script (4 demo articles) | ✅ |
| Deployment documentation | ✅ |

---

## What Was Fixed / Added

### Environment
- `lib/env.ts` — central validation with clear error messages
- `instrumentation.ts` — production startup validation
- `scripts/validate-env.mjs` — CLI check
- `.env.local.example` updated with all vars

### Supabase
- Comments on `client.ts`, `server.ts`, `admin.ts` clarifying key usage
- `config.ts` re-exports from `lib/env.ts`
- Migration `003_production_rls.sql` — RLS policy reassertion

### Content
- Homepage `NewsSection` fetches published articles from Supabase
- Mock fallback only when Supabase unavailable or empty
- `articlesToCarouselItems()` with correct `/news/[slug]` links
- Seed script: 4 demo articles matching original mock titles

### SEO
- `app/sitemap.ts` — static routes + published articles
- `app/robots.ts` — blocks `/admin`
- `lib/metadata.ts` — shared OG/Twitter metadata
- OG image fallback: `/images/gta6/trailer-2-header.webp`
- Enhanced article page metadata (OG + Twitter)

### Scripts
- `npm run seed` — seed demo articles
- `npm run validate:env` — check env vars
- `npm run typecheck` — TypeScript check

---

## Required Env Variables (Production)

| Variable | Required |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes |
| `ADMIN_EMAILS` | Yes |
| `NEXT_PUBLIC_SITE_URL` | Recommended |
| `OPENAI_API_KEY` | Optional |

---

## Is It Safe to Deploy?

**Yes**, with these conditions:

1. All required env vars set in Vercel
2. All 3 SQL migrations run in Supabase
3. Admin user created with email in `ADMIN_EMAILS`
4. `npm run seed` executed once for demo content
5. `SUPABASE_SERVICE_ROLE_KEY` never exposed client-side ✅ (verified)

### Remaining Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Mock AI provider in production | Low | Set `OPENAI_API_KEY` when ready |
| No rate limiting on admin actions | Medium | Add before high traffic |
| Mock homepage carousels (characters, vehicles) | Low | Sprint 4 scope |
| Single admin email | Low | Add more emails to `ADMIN_EMAILS` |
| Supabase Free tier limits | Low | Monitor usage dashboard |

---

## Next Recommended Sprint (Sprint 4)

- Real source connectors (RSS/API)
- OpenAI provider for AI drafts
- Analytics dashboard
- Scheduled ingestion (cron)
- Characters/vehicles from database
- Rate limiting on admin endpoints

---

## Quick Deploy Commands

```bash
# Local verification
npm run validate:env
npm run lint
npm run typecheck
npm run build

# Seed content
npm run seed

# Deploy (if using Vercel CLI)
vercel --prod
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full instructions.
