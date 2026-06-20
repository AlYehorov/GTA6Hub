# GTA6Hub — Handoff Document

Unofficial Grand Theft Auto VI community hub. **Sprint 1** (homepage + foundation) and **Sprint 2** (Supabase CMS for news/guides) are complete.

---

## Architecture

### Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui |
| CMS / DB | Supabase (Postgres + Storage) |
| Markdown | `react-markdown` + `remark-gfm` |
| Rendering | Server Components by default; Client Components only where needed |

### High-level layout

```
app/                    → Routes (Server Components)
components/
  layout/               → SiteLayout, Footer
  navigation/           → Navbar (client — scroll shrink), nav links
  home/                 → Homepage sections (mock data)
  articles/             → Public article UI
  admin/                → Admin form (client)
  shared/               → PageHeader, MediaCard, NewsCard
  ui/                   → shadcn primitives
lib/
  supabase/             → Server, admin, browser clients
  articles/queries.ts   → Read queries (public + admin)
  actions/articles.ts   → Server Actions (CRUD + upload)
  types/                → Article, Category, Tag types
  data/                 → Mock data for homepage (unchanged)
  constants/            → Navigation, image paths
supabase/migrations/    → SQL schema
scripts/seed-supabase.mjs → One-off seed script
public/images/gta6/     → Official Rockstar promo assets (local)
```

### Rendering strategy

- **Public pages** fetch data in Server Components via `lib/articles/queries.ts` + `createClient()` (anon key, RLS).
- **Admin writes** use Server Actions in `lib/actions/articles.ts` with `createAdminClient()` (service role, bypasses RLS).
- **Client Components** are limited to:
  - `components/navigation/navbar.tsx` — scroll behavior
  - `components/home/content-carousel.tsx` — carousel interactivity
  - `components/admin/article-form.tsx` — form state, image upload
- Queries return empty arrays / `null` when Supabase env vars are missing (graceful dev fallback).

### Design system

- Black background, pink/orange accents (`gta-pink`, etc.)
- Floating glass navbar, cinematic hero on homepage
- Article prose styles in `app/globals.css` (`.article-prose`)
- Homepage intentionally **not** wired to Supabase yet (still uses mock data)

---

## Routes

### Public

| Route | Status | Description |
|---|---|---|
| `/` | ✅ Live | Homepage — hero, carousels, featured news (mock data) |
| `/news` | ✅ Live | Published news list from Supabase |
| `/news/[slug]` | ✅ Live | News article detail (dynamic) |
| `/guides` | ✅ Live | Published guides list from Supabase |
| `/guides/[slug]` | ✅ Live | Guide article detail (dynamic) |
| `/trailers` | 🚧 Placeholder | Sprint 1 stub |
| `/characters` | 🚧 Placeholder | Sprint 1 stub |
| `/vehicles` | 🚧 Placeholder | Sprint 1 stub |
| `/weapons` | 🚧 Placeholder | Sprint 1 stub |
| `/map` | 🚧 Placeholder | Sprint 1 stub |
| `/checklist` | 🚧 Placeholder | Sprint 1 stub |

### Admin (no auth — dev only)

| Route | Status | Description |
|---|---|---|
| `/admin` | ✅ Live | Dashboard — article counts, quick links |
| `/admin/articles` | ✅ Live | Table of all articles (draft + published) |
| `/admin/articles/create` | ✅ Live | Create article form |
| `/admin/articles/[id]` | ✅ Live | Edit article form |

### Seeded test content

| Type | Slug | URL |
|---|---|---|
| News | `gta-vi-trailer-2-breakdown` | `/news/gta-vi-trailer-2-breakdown` |
| Guide | `vice-city-starter-guide` | `/guides/vice-city-starter-guide` |

---

## Database Schema

Migration: `supabase/migrations/001_initial_schema.sql`

### Enums

```sql
article_status: 'draft' | 'published'
article_type:   'news' | 'guide'
```

### Tables

#### `categories`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | |
| slug | text | unique |
| description | text | nullable |
| created_at | timestamptz | |

**Seed:** Trailer, Official, Analysis, Walkthrough, Secrets

#### `tags`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | |
| slug | text | unique |
| created_at | timestamptz | |

**Seed:** Lucia, Jason, Vice City, Leonida, Trailer 2, Map, Vehicles

#### `articles`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| title | text | |
| slug | text | unique |
| excerpt | text | nullable |
| content | text | Markdown body |
| hero_image_url | text | nullable — Supabase Storage or external URL |
| status | article_status | default `draft` |
| type | article_type | `news` or `guide` |
| reading_time_minutes | integer | auto-calculated on save |
| category_id | uuid | FK → categories, nullable |
| seo_title | text | nullable |
| seo_description | text | nullable |
| published_at | timestamptz | set on first publish |
| created_at | timestamptz | |
| updated_at | timestamptz | auto-updated via trigger |

#### `article_tags`

| Column | Type | Notes |
|---|---|---|
| article_id | uuid | FK → articles |
| tag_id | uuid | FK → tags |
| | | composite PK (article_id, tag_id) |

### Storage

- **Bucket:** `article-images` (public read)
- **Limit:** 5 MB per file
- **MIME types:** jpeg, png, webp, gif

### Row Level Security

| Table | Public policy |
|---|---|
| categories | SELECT all |
| tags | SELECT all |
| articles | SELECT where `status = 'published'` |
| article_tags | SELECT where linked article is published |
| storage.objects | SELECT where `bucket_id = 'article-images'` |

Admin writes bypass RLS via **service role key** on the server.

### ER diagram

```
categories ──< articles >── article_tags >── tags
```

---

## Supabase Setup

### 1. Create project

1. [supabase.com/dashboard](https://supabase.com/dashboard) → New organization (Free tier is fine for dev)
2. New project → pick region close to users (e.g. Europe)
3. Save database password (not needed for Next.js, only for direct Postgres access)

### 2. Run migration

Supabase → **SQL Editor** → paste contents of `supabase/migrations/001_initial_schema.sql` → **Run**

### 3. Environment variables

Copy `.env.local.example` → `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable or anon key>
SUPABASE_SERVICE_ROLE_KEY=<secret or service_role key>
```

| Variable | Where to find | Usage |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API / Data API (base URL only, no `/rest/v1/`) | Client + server reads |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | API Keys → Publishable / Legacy anon | Public reads (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | API Keys → Secret / Legacy service_role | Admin CRUD only — **never expose to client** |

New Supabase keys (`sb_publishable_*`, `sb_secret_*`) map to the same env var names.

### 4. Seed test data (optional)

```bash
node scripts/seed-supabase.mjs
```

Uploads hero images to Storage and creates/updates two published articles.

### 5. Next.js image config

`next.config.ts` allows Supabase Storage hostnames:

```ts
remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }]
```

### Dev server note

If dev breaks (500, unstyled HTML), clear the cache:

```bash
pkill -f "next dev"
rm -rf .next
npm run dev
```

Production build (`npm run build && npm run start`) is more stable.

---

## Article Flow

### Public read path

```
/news or /guides
  └─ getPublishedArticles(type)          lib/articles/queries.ts
       └─ createClient() [anon + RLS]     lib/supabase/server.ts
            └─ Supabase: articles WHERE type = ? AND status = 'published'

/news/[slug] or /guides/[slug]
  └─ getArticleBySlug(slug, type)
  └─ getRelatedArticles(id, type, category_id, 3)
       └─ ArticlePage component
            ├─ ArticleHero      — hero image, category, date, reading time
            ├─ ArticleContent   — react-markdown + remark-gfm
            ├─ ArticleTags      — tag pills
            └─ RelatedArticles  — same category, same type
  └─ generateMetadata()         — seo_title, seo_description, Open Graph
```

### Admin write path

```
/admin/articles/create or /admin/articles/[id]
  └─ ArticleForm (client)
       ├─ uploadArticleImage(formData)  → Supabase Storage → public URL
       └─ createArticle / updateArticle (Server Actions)
            ├─ buildArticlePayload()
            │    ├─ calculateReadingTime(content)
            │    └─ published_at (set on first publish, preserved on edit)
            ├─ INSERT/UPDATE articles
            ├─ syncArticleTags() — replace article_tags rows
            └─ revalidatePath(/news, /guides, /admin, …)
```

### Draft vs published

| Status | Visible on `/news`, `/guides` | `published_at` |
|---|---|---|
| `draft` | No (RLS blocks) | `null` |
| `published` | Yes | Set on first publish; preserved on subsequent edits |

### Reading time

Calculated in `lib/utils/article.ts` — `Math.ceil(wordCount / 200)`, minimum 1 minute. Stored in DB on create/update.

---

## Admin Pages

### `/admin`

Server Component dashboard:
- Total / published / draft counts via `getAllArticlesAdmin()`
- Links to article list and create form
- Warning banner if `SUPABASE_SERVICE_ROLE_KEY` is missing

### `/admin/articles`

Server Component table:
- All articles ordered by `updated_at`
- Columns: title, type, status badge, published date, edit link

### `/admin/articles/create`

Server page + client `ArticleForm`:
- Fields: title, slug, excerpt, type, status, category, hero URL/upload, SEO title/description, tags, markdown content
- Auto-slug from title on create
- Tag multi-select (toggle pills)

### `/admin/articles/[id]`

Same form pre-filled from `getArticleByIdAdmin(id)`.

### Server Actions (`lib/actions/articles.ts`)

| Action | Description |
|---|---|
| `createArticle(data)` | Insert article + tags |
| `updateArticle(id, data)` | Update article + replace tags |
| `deleteArticle(id)` | Delete article — **action exists, no UI button yet** |
| `uploadArticleImage(formData)` | Upload to `article-images` bucket |

---

## Dependencies

### Runtime

| Package | Purpose |
|---|---|
| `next` ^15.5 | App Router, Server Components, Server Actions |
| `react` / `react-dom` ^19 | UI |
| `@supabase/supabase-js` | Supabase client |
| `@supabase/ssr` | Cookie-aware server client |
| `react-markdown` | Article body rendering |
| `remark-gfm` | GitHub-flavored markdown (tables, strikethrough) |
| `lucide-react` | Icons |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Styling utilities |
| `@base-ui/react`, `shadcn` | UI primitives |
| `tw-animate-css` | Animations |

### Dev

| Package | Purpose |
|---|---|
| `typescript` | Type checking |
| `tailwindcss` ^4 | CSS framework |
| `eslint`, `eslint-config-next` | Linting |

### Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
node scripts/seed-supabase.mjs  # Seed test articles
```

---

## Pending Tasks

### Sprint 3 — recommended

- [ ] **Admin authentication** — protect `/admin/*` (Supabase Auth or NextAuth); service role must stay server-only
- [ ] **Delete article UI** — wire `deleteArticle()` to edit page with confirmation
- [ ] **Homepage live news** — replace mock data in `components/home/news-section.tsx` with `getPublishedArticles('news')` (homepage layout unchanged)
- [ ] **Tag archive pages** — e.g. `/tags/[slug]` filtering articles by tag
- [ ] **Category filtering** — on `/news` and `/guides` list pages
- [ ] **Preview drafts** — admin-only preview URL for draft articles
- [ ] **README** — project setup docs (currently only this handoff + `.env.local.example`)

### Sprint 1 stubs (unchanged)

- [ ] `/trailers`, `/characters`, `/vehicles`, `/weapons`, `/map`, `/checklist` — placeholder pages need real content/features

### Production hardening

- [ ] Remove or gate admin routes before public deploy
- [ ] Add storage upload policies for authenticated admin (currently service role only)
- [ ] Consider `generateStaticParams` for published articles (ISR/SSG)
- [ ] Error boundaries and 404 polish for missing slugs
- [ ] Analytics, sitemap, RSS feed

### Known limitations

- Admin is open to anyone with the URL (no auth)
- Homepage news carousel uses mock data, not Supabase
- Related articles match by category only (no tag-based fallback)
- Re-publishing a draft after unpublishing resets `published_at` to `null` when status is set back to draft

---

## Key Files Reference

```
app/page.tsx                          Homepage (do not redesign without explicit request)
app/news/page.tsx                     News list
app/news/[slug]/page.tsx              News detail + metadata
app/guides/page.tsx                   Guides list
app/guides/[slug]/page.tsx            Guide detail + metadata
app/admin/                            Admin dashboard + CRUD pages
components/articles/article-page.tsx  Shared article detail layout
components/admin/article-form.tsx     Admin form (client)
lib/articles/queries.ts               All read queries
lib/actions/articles.ts               All write actions
lib/types/article.ts                  TypeScript types
lib/supabase/                         Supabase clients + config
supabase/migrations/001_initial_schema.sql
scripts/seed-supabase.mjs
.env.local.example
next.config.ts
```

---

## Contact / Context

- **Project:** GTA6Hub — unofficial, not affiliated with Rockstar Games or Take-Two
- **Design:** Black + pink/orange accents; Rockstar Newswire / Apple News inspired article layout
- **Images:** Official Rockstar promo assets in `public/images/gta6/` for homepage; article heroes in Supabase Storage
