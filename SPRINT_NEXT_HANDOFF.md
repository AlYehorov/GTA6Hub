# Sprint: Profiles, XP, Achievements & Saved Content

## Overview

Extends Sprint 6 auth and profiles with XP, levels, saved content, activity feed, and `/profile` private dashboard + `/u/[username]` public profiles.

**Apply migration first:** `supabase/migrations/009_profiles_xp_saved_content.sql`

Then seed achievements:

```bash
npm run seed:achievements
```

---

## Schema Changes (009)

### `profiles` (extended)

| Column | Type | Notes |
|--------|------|-------|
| `display_name` | text | Optional display name |
| `bio` | text | Optional bio |
| `xp` | integer | Default 0 |
| `level` | integer | Default 1, derived from XP |

### `achievements` (extended)

| Column | Type | Notes |
|--------|------|-------|
| `xp_reward` | integer | XP granted on unlock |

`slug` is the stable achievement key (e.g. `first_login`).

### New tables

- **`saved_articles`** — user_id + article_id (unique)
- **`saved_locations`** — user_id + map_point_id (unique)
- **`article_reads`** — one row per user/article for read tracking
- **`activity_events`** — feed entries (type, title, metadata jsonb)

### RLS

- Public read: profiles, achievements, user_achievements, activity_events
- Own write: saved_articles, saved_locations, article_reads, activity_events, profiles update
- Own read: saved_articles, saved_locations, article_reads, user_progress (existing)

---

## Routes

| Route | Purpose |
|-------|---------|
| `/profile` | Private dashboard (auth required) |
| `/u/[username]` | Public profile |
| `/profile/[username]` | Redirects → `/u/[username]` |

---

## Profile Flow

1. **Email signup** — profile created in `signUpWithEmail` + 50 XP + activity event
2. **Google OAuth** — `ensureProfileForUser` on callback if missing + 50 XP
3. **`postLoginSync`** — merges localStorage tracker → Supabase, unlocks `first_login`, evaluates achievements
4. **`/profile`** — loads current user stats, saved content, activity
5. **`/u/[username]`** — public view (same layout, no “private dashboard” label)

---

## XP Flow

**Utility:** `lib/profile/xp.ts` → `awardXP(userId, amount, reason)`

| Action | XP |
|--------|-----|
| Create profile | +50 |
| Complete tracker item | +20 |
| Save article | +5 |
| Save location | +5 |
| Read article (once per article) | +2 |
| Achievement unlock | +`xp_reward` from DB |

**Level formula:** `floor(xp / 250) + 1`

**Labels:**

| Level | Label |
|-------|-------|
| 1–2 | New Arrival |
| 3–5 | Vice Tourist |
| 6–10 | Leonida Explorer |
| 11–20 | Trailer Detective |
| 21–35 | Secret Hunter |
| 36+ | Legend |

---

## Achievements Flow

**Seed:** `npm run seed:achievements`

**Engine:** `lib/profile/achievements.ts`

- `evaluateAndUnlockAchievements(userId)` — checks all rules after tracker/save/read actions
- `unlockAchievementBySlug(userId, slug)` — used for `first_login` on auth
- On unlock: inserts `user_achievements`, awards `xp_reward`, logs activity

**New achievement slugs:**

`first_login`, `first_tracker_item`, `complete_10_tracker_items`, `complete_50_tracker_items`, `reach_10_percent`, `reach_25_percent`, `reach_50_percent`, `save_first_article`, `save_10_articles`, `read_10_articles`, `read_50_articles`, `trailer_detective`, `guide_reader`, `map_explorer`

Legacy Sprint 6 slugs (`ten-percent`, `collector`, etc.) remain supported.

---

## Tracker Sync Flow

**Unchanged client hook:** `lib/tracker/use-tracker-progress.ts`

| State | Behavior |
|-------|----------|
| Logged out | localStorage only |
| Logged in | Load from `user_progress`, write via `setItemProgress` |
| After login | `postLoginSync` / `signInWithEmail` merges localStorage → server |

On each server-side completion: +20 XP, activity event, achievement evaluation.

---

## Saved Content

- **Articles:** `SaveArticleButton` on news/guide pages → `toggleSaveArticle`
- **Locations:** `SaveLocationButton` in map point drawer → `toggleSaveLocation`
- **Read tracking:** `ArticleReadTracker` fires after 3s on article page (logged-in only)

Logged-out save → redirect to `/login?next=...`

---

## Header Integration

**`UserMenu`** (desktop + mobile):

- Avatar / initial
- Profile → `/profile`
- Saved Articles → `/profile#saved-articles`
- Tracker → `/tracker`
- Logout

Logged out → **Login** button.

---

## Key Files

```
supabase/migrations/009_profiles_xp_saved_content.sql
lib/profile/xp.ts
lib/profile/activity.ts
lib/profile/achievements.ts
lib/profile/queries.ts
lib/actions/saved-content.ts
lib/actions/tracker-progress.ts
lib/actions/auth.ts
components/profile/profile-view.tsx
components/profile/save-article-button.tsx
components/profile/save-location-button.tsx
components/profile/article-read-tracker.tsx
components/navigation/user-menu.tsx
app/profile/page.tsx
app/u/[username]/page.tsx
scripts/seed-achievements.mjs
```

---

## How to Test

1. Apply migration `009` in Supabase SQL Editor
2. `npm run seed:achievements`
3. Register or log in with Google
4. Visit `/profile` — verify XP, level, empty saved sections
5. Complete a tracker item — +20 XP, activity, `first_tracker_item` achievement
6. Open a news article 3+ seconds — +2 XP, read tracking
7. Save article / map location — saved lists on `/profile`
8. Visit `/u/{username}` — public profile loads
9. Old `/profile/{username}` redirects to `/u/{username}`
10. Leaderboard / community links use `/u/{username}`

---

## Known Issues / Follow-ups

- **Profile edit UI** — no form yet for `display_name`, `bio`, `avatar_url` (schema ready)
- **Bulk login sync XP** — migrating many localStorage items awards XP per item (intentional)
- **Saved locations on public profile** — visible to all (by design for community sharing)
- **Comments** — not implemented; no XP for comments
- **Migration required** — app degrades gracefully if `009` not applied (saved/XP queries may fail until migrated)

---

## Env Vars

Unchanged from prior sprints. Requires `SUPABASE_SERVICE_ROLE_KEY` for XP/activity/achievement writes from server actions.
