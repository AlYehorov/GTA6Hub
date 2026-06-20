# GTA6Hub — Deployment Guide

Deploy to **Vercel** + **Supabase**.

---

## Required Environment Variables

Set these in Vercel → Project → Settings → Environment Variables:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase publishable / anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only secret key |
| `ADMIN_EMAILS` | Yes | Comma-separated admin emails |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Production URL, e.g. `https://gta6hub.com` |
| `OPENAI_API_KEY` | Optional | Real AI drafts; mock provider used if unset |

Validate locally:

```bash
npm run validate:env
```

---

## Supabase Setup

### 1. Create project

[supabase.com/dashboard](https://supabase.com/dashboard) → New project (Free tier OK for launch).

### 2. Run migrations (in order)

Supabase → **SQL Editor** → run each file:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_sprint3_source_engine.sql`
3. `supabase/migrations/003_production_rls.sql`

### 3. Create admin user

Authentication → Users → **Add user**

- Email must match `ADMIN_EMAILS`
- Set password
- ✅ Auto Confirm User

### 4. Copy API keys

Project Settings → API:

- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- Publishable / anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Secret / service_role key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Seed Demo Content

From your local machine (with `.env.local` configured):

```bash
npm run seed
```

This creates 4 published news articles:

- GTA VI Trailer 2 Breakdown
- Lucia and Jason: What We Know
- Vice City Map Size
- Neon Nights: Vice City Districts

Re-running is safe — articles are upserted by slug.

---

## Vercel Deployment

### Option A — Git integration (recommended)

1. Push repo to GitHub
2. [vercel.com](https://vercel.com) → Import project
3. Framework: **Next.js** (auto-detected)
4. Add all environment variables
5. Deploy

### Option B — CLI

```bash
npm i -g vercel
vercel
vercel --prod
```

### Build settings

| Setting | Value |
|---|---|
| Build Command | `npm run build` |
| Output Directory | `.next` (default) |
| Install Command | `npm install` |
| Node.js Version | 20.x |

---

## Post-Deploy Checklist

- [ ] Homepage shows live news from Supabase
- [ ] `/news` lists seeded articles
- [ ] `/admin/login` requires auth
- [ ] `/sitemap.xml` loads
- [ ] `/robots.txt` blocks `/admin`
- [ ] Sign in with admin email works

---

## Common Errors

### 500 on all pages after dev

Corrupted `.next` cache:

```bash
rm -rf .next && npm run dev
```

### Admin redirects to login but sign-in fails

- User not created in Supabase Auth
- Email not in `ADMIN_EMAILS`
- Wrong password

### Articles empty on homepage

- Migrations not run
- Seed not executed: `npm run seed`
- Articles not `published` status

### `Environment validation failed` on production start

Missing required env vars. Run `npm run validate:env` locally and mirror vars in Vercel.

### Images not loading

- Hero images from Supabase Storage need `*.supabase.co` in `next.config.ts` (already configured)
- Storage bucket `article-images` must exist (created in migration 001)

### Build fails on Vercel

```bash
npm run lint
npm run typecheck
npm run build
```

Fix errors locally before redeploying.

---

## Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` — **never** prefix with `NEXT_PUBLIC_`
- Service role only used in Server Actions and admin queries
- Browser client uses anon key only (RLS enforced)
- `/admin` protected by middleware + Supabase Auth
- Public users can only read **published** articles (RLS)
