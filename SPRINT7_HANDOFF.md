# Sprint 7 Handoff — Community Engine

GTAVIHub.gg community layer: user-generated posts, likes, threaded comments, polls, weekly screenshot contests, moderation, reputation, and notifications.

## What shipped

| Area | Routes / files |
|------|----------------|
| Community feed | `/community` |
| Create post | `/community/new` |
| Post detail + comments | `/community/[id]` |
| Weekly contest | `/community/contest` |
| Notifications | `/notifications` |
| Admin moderation | `/admin/community` |
| Homepage section | `CommunityHighlightsSection` on `/` |
| Profile community stats | `/profile`, `/u/[username]` |

**Not modified:** homepage hero layout, AI ingestion, completion tracker logic.

---

## Database (`011_community_engine.sql`)

### Core tables

| Table | Purpose |
|-------|---------|
| `community_posts` | Screenshots, theories, discussions, discoveries, collections |
| `community_likes` | One like per user per post (unique constraint) |
| `community_comments` | Threaded comments, `depth` 0–2 |
| `community_polls` | Admin-created polls |
| `community_poll_options` | Poll choices + `vote_count` |
| `community_poll_votes` | One vote per user per poll |
| `community_contests` | Screenshot of the Week |
| `community_contest_votes` | One vote per user per contest |
| `community_notifications` | In-app notification center |

### Post types (`community_post_type`)

- `screenshot` — requires `image_url`
- `theory`
- `discussion`
- `discovery` — optional links to map point, article, tracker item
- `collection`

### Moderation status

- `pending` — default on create; hidden from public feed
- `approved` — visible in feed
- `rejected` — author-only visibility

Admin can **feature** approved posts (`featured`, `featured_at`).

### Profile extension

- `profiles.community_reputation` — separate from XP/level

### Triggers

- `like_count` / `comment_count` on posts
- `vote_count` on poll options

---

## Storage

**Bucket:** `community-images` (public read)

**Upload path:** `{user_id}/{timestamp}.{ext}`

**Allowed types:** PNG, JPEG, WEBP (max 5MB)

**Server action:** `uploadCommunityImage()` in `lib/actions/community.ts`

**RLS:** authenticated users upload only into their own folder.

---

## Architecture

```
app/community/*          → pages (RSC + client forms)
components/community/*   → feed, cards, comments, spoilers, polls
lib/community/
  queries.ts             → public feed, post, contest, highlights
  reputation.ts          → awardCommunityReputation()
  notifications.ts       → createCommunityNotification() (admin client)
lib/actions/community.ts → mutations + upload
lib/types/community.ts   → types + labels
```

### Feed composition

`getCommunityFeed()` merges:

1. Approved `community_posts` (newest first)
2. Active `community_polls`

Sorted by `created_at` descending.

### Comments

- Max depth **2** (root → reply → reply)
- Markdown via `react-markdown` + `remark-gfm`
- Inline spoilers: `[spoiler]hidden text[/spoiler]`
- Post/comment-level **Contains spoilers** blurs entire block until tap

### Reputation rewards (`lib/community/constants.ts`)

| Event | Points |
|-------|--------|
| Like received | +2 |
| Contest win | +50 |
| Featured post | +25 |
| Approved discovery | +15 |

Awarded via `awardCommunityReputation()` on admin actions / like handler.

### Notifications

Created server-side (service role) for:

- `post_liked`
- `comment_reply`
- `contest_won`
- `post_approved`
- `post_featured`

User reads/marks read at `/notifications`.

---

## Admin workflow (`/admin/community`)

1. **Moderation queue** — approve / reject / delete / feature posts
2. **Create poll** — title + newline-separated options
3. **Open contest** — week start/end dates
4. **Select winner** — contest UUID + winning post UUID

Posts linked to an active contest via `contest_id` on create (screenshot type).

---

## Homepage

`CommunityHighlightsSection` (after tracker, before carousels):

- Latest screenshot
- Most liked post
- Current poll
- Current contest

Cached via `unstable_cache` — tag `community`, revalidate 180s.

Existing `CommunitySection` (tracker stats) unchanged.

---

## Apply migration

```bash
# Supabase SQL editor or CLI
supabase db push
# or run supabase/migrations/011_community_engine.sql manually
```

Ensure `community-images` bucket exists if storage insert fails on hosted Supabase.

---

## Future scalability

- **Full-text search** on `community_posts.title/body`
- **Report post** flow + auto-hide thresholds
- **Email/push** notifications (table is in-app only today)
- **Collections** as multi-image galleries (currently single cover image)
- **Realtime feed** via Supabase Realtime on `community_posts`
- **Reputation leaderboard** separate from XP leaderboard
- **Auto-approve** trusted users after reputation threshold
- **Contest automation** — cron to open/close weekly contests

---

## Key files

```
supabase/migrations/011_community_engine.sql
lib/types/community.ts
lib/community/queries.ts
lib/community/reputation.ts
lib/community/notifications.ts
lib/actions/community.ts
components/community/*
components/home/community-highlights-section.tsx
components/profile/community-profile-section.tsx
app/community/*
app/notifications/page.tsx
app/admin/community/page.tsx
```
