# Sprint 6 Handoff — User Profiles & Progress System

Transform GTA6Hub from a content site into a platform with accounts, public profiles, achievements, and leaderboards.

## Schema

Migration: `supabase/migrations/007_profiles_achievements.sql`

### `profiles`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, FK → auth.users |
| username | text | unique (case-insensitive), 3–24 chars, `[a-zA-Z0-9_]` |
| avatar_url | text | optional |
| favorite_category_id | uuid | FK → completion_categories, optional |
| created_at / updated_at | timestamptz | |

### `achievements`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| slug | text | unique, used by unlock rules |
| title | text | |
| description | text | |
| icon | text | lucide key |
| sort_order | integer | |

### `user_achievements`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| achievement_id | uuid | FK → achievements |
| unlocked_at | timestamptz | |
| unique (user_id, achievement_id) | | |

RLS: profiles and achievements public read; users insert/update own profile; users insert own achievements (unlock via service role in app).

## Routes

| Route | Purpose |
|-------|---------|
| `/login` | Email + Google + Apple sign in |
| `/register` | Email signup (+ Google / Apple) |
| `/auth/callback` | OAuth code exchange |
| `/auth/complete` | Post-OAuth localStorage sync |
| `/profile/[username]` | Public player profile |
| `/leaderboard` | Rankings + recent completions |

## Auth Flow

```
User → /login or /register
         │
         ├── Email: signInWithPassword / signUp
         │         └── Create profile row on register (admin client)
         │
         └── Google: signInWithOAuth → /auth/callback
                   └── ensureProfileForUser (auto username)
                   └── /auth/complete (client)
                         └── postLoginSync(localStorage item IDs)
                         └── evaluateAndUnlockAchievements
```

- **Admin separation:** `/admin/*` middleware still requires `ADMIN_EMAILS` allowlist. Public users use the same Supabase project but cannot access admin.
- **Progress sync:** On email login, localStorage tracker progress merges into `user_progress` then clears local key.

## Profile Flow

1. User registers with username → `profiles` row created
2. User completes tracker items → `user_progress` updated (existing Sprint 5 flow)
3. `evaluateAndUnlockAchievements()` runs after each completion + login sync
4. `/profile/[username]` shows:
   - Avatar, username, join date
   - Completion %, achievements count, collectibles found
   - Favorite category (stored or highest-progress category)
   - Recent progress, achievement list, category breakdown

Profiles are **public and shareable** at `/profile/alex`.

## Achievement System

Seed: `npm run seed:achievements`

| Slug | Trigger |
|------|---------|
| first-mission | ≥1 main-missions item complete |
| ten-percent | 10% overall |
| twenty-five-percent | 25% overall |
| fifty-percent | 50% overall |
| hundred-percent | 100% overall |
| collector | 100% collectibles category |
| explorer | Progress in ≥5 categories |
| hunter | 100% weapons category |
| secret-finder | 100% secrets OR easter-eggs |

Logic: `lib/profile/achievements.ts` — rules evaluated server-side; inserts into `user_achievements` via admin client.

## Leaderboard Architecture

`/leaderboard` loads via `getLeaderboardData()` (admin client for cross-user reads):

1. **Top completion** — all profiles ranked by overall tracker %
2. **Most achievements** — count of `user_achievements` per user
3. **Newest completions** — recent `user_progress` rows joined with profiles + items

Homepage **Community Progress** section shows aggregate stats from `getCommunityStats()`.

## SEO

Updated tracker index metadata (`lib/tracker/seo-metadata.ts`) targets:

- gta 6 completion tracker
- gta 6 progress tracker
- gta 6 100 percent checklist

Leaderboard page metadata targets progress tracker keywords.

## OAuth Setup (Google + Apple)

### URL Configuration (Supabase → Authentication → URL Configuration)

Add to **Redirect URLs**:
```
https://www.gtavihub.gg/auth/callback
http://localhost:3000/auth/callback
```

Set **Site URL**: `https://www.gtavihub.gg`

### Google

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client ID (Web)
2. **Authorized redirect URI**: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Supabase → Sign In / Providers → **Google** → Enable → paste Client ID + Secret

### Apple

Requires [Apple Developer](https://developer.apple.com) account ($99/year).

1. **Identifiers** → Services ID (e.g. `com.gta6hub.auth`)
2. Enable **Sign in with Apple** → configure domains + return URL:
   - Domain: `<project-ref>.supabase.co`
   - Return URL: `https://<project-ref>.supabase.co/auth/v1/callback`
3. **Keys** → create key with Sign in with Apple → download `.p8` file
4. Supabase → Sign In / Providers → **Apple** → Enable:
   - Services ID (Client ID)
   - Secret Key (contents of `.p8`)
   - Key ID
   - Team ID (from Apple Developer membership)

OAuth users get an auto-generated username via `ensureProfileForUser()` on first login.

## Setup Checklist

1. Run `007_profiles_achievements.sql` in Supabase SQL Editor
2. Enable **Email**, **Google**, and **Apple** in Authentication → Sign In / Providers
3. Configure OAuth credentials (see above)
4. Add redirect URLs in URL Configuration
5. Set `NEXT_PUBLIC_SITE_URL` on Vercel (for OAuth redirects)
6. `npm run seed:achievements`
7. Verify `/register`, `/login`, `/profile/{user}`, `/leaderboard`

## Key Files

```
supabase/migrations/007_profiles_achievements.sql
lib/types/profile.ts
lib/auth/user.ts
lib/actions/auth.ts
lib/profile/queries.ts
lib/profile/achievements.ts
components/auth/*
app/login/page.tsx
app/register/page.tsx
app/auth/callback/route.ts
app/auth/complete/page.tsx
app/profile/[username]/*
app/leaderboard/page.tsx
components/home/community-section.tsx
components/navigation/auth-nav-button.tsx
scripts/seed-achievements.mjs
```

## Constraints Preserved

- Tracker functionality unchanged (localStorage + Supabase dual mode)
- Homepage hero unchanged — only added Community Progress section
- Map, articles, drafts, source engine untouched

## Next Recommended Sprint

**Sprint 7: Social & Notifications**

- Follow other players
- Activity feed on homepage
- Email notifications for achievement unlocks
- Profile avatar upload (Supabase Storage)
- OG image cards for shared profiles (`/profile/alex/opengraph-image`)

Alternative: **Community submissions** — user-suggested tracker items for admin review.
