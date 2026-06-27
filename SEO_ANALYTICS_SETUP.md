# SEO & Analytics Setup — GTA6Hub Sprint 8.0

This guide connects **Google Search Console**, **Google Analytics 4**, and **Microsoft Clarity** to the GTA6Hub admin dashboard.

## Environment variables

Add these in `.env.local` (development) and **Vercel → Project → Settings → Environment Variables** (production).

| Variable | Required | Purpose |
|----------|----------|---------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | For GSC + GA4 API | Service account credentials (JSON string or base64) |
| `GOOGLE_SEARCH_CONSOLE_PROPERTY` | For GSC | e.g. `sc-domain:gtavihub.gg` or `https://www.gtavihub.gg/` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | For GA4 tracking | e.g. `G-XXXXXXXXXX` |
| `GA4_PROPERTY_ID` | For GA4 API reports | Numeric property ID from GA4 Admin |
| `NEXT_PUBLIC_CLARITY_ID` | For Clarity embed | Clarity project ID |
| `CLARITY_API_TOKEN` | Optional | Clarity Data Export API for admin metrics |
| `CRON_SECRET` | For auto-sync | Protects `/api/cron/analytics-sync` |

See `.env.local.example` for the full list.

---

## 1. Google Cloud service account

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Enable APIs:
   - **Google Search Console API**
   - **Google Analytics Data API**
4. **IAM & Admin → Service Accounts** → Create service account.
5. Create a JSON key and download it.
6. Copy the entire JSON into `GOOGLE_SERVICE_ACCOUNT_JSON` (single line in Vercel, or multiline in `.env.local`).

---

## 2. Google Search Console

### Verify the site

1. Open [Google Search Console](https://search.google.com/search-console).
2. Add property: **Domain** `gtavihub.gg` (recommended) or **URL prefix** `https://www.gtavihub.gg/`.
3. Verify via DNS TXT record (domain) or HTML tag (URL prefix).

### Grant API access

1. Search Console → **Settings → Users and permissions**.
2. Add the **service account email** (from JSON `client_email`) as **Full** user.

### Configure GTA6Hub

```env
GOOGLE_SEARCH_CONSOLE_PROPERTY=sc-domain:gtavihub.gg
```

Admin UI: `/admin/integrations/search-console`

### Submit sitemap

1. Search Console → **Sitemaps**.
2. Submit: `https://www.gtavihub.gg/sitemap.xml`

GTA6Hub generates this dynamically from `app/sitemap.ts`.

---

## 3. Google Analytics 4

### Create property

1. [Google Analytics](https://analytics.google.com/) → Admin → Create property.
2. Add a **Web** data stream for `https://www.gtavihub.gg`.
3. Copy the **Measurement ID** (`G-XXXXXXXX`).

### Data API access

1. GA4 Admin → **Property access management**.
2. Add the service account email as **Viewer**.
3. Note the numeric **Property ID** (not the measurement ID) for `GA4_PROPERTY_ID`.

### Configure GTA6Hub

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_PROPERTY_ID=123456789
```

Admin UI: `/admin/integrations/analytics`

Client-side tracking loads automatically via `components/analytics/analytics-scripts.tsx` when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.

---

## 4. Microsoft Clarity

1. Create a project at [clarity.microsoft.com](https://clarity.microsoft.com).
2. Add site URL: `https://www.gtavihub.gg`.
3. Copy the **Project ID**.

```env
NEXT_PUBLIC_CLARITY_ID=your_project_id
```

### Optional API token

For dead clicks, rage clicks, and scroll depth in admin:

1. Clarity → Project → **Settings → API**.
2. Generate token → `CLARITY_API_TOKEN`.

Admin UI: `/admin/integrations/clarity`

Heatmaps and recordings open in the Clarity dashboard (official links, not scraped).

---

## 5. robots.txt verification

Production `robots.txt` is served at `/robots.txt` from `app/robots.ts`:

- Allows crawling of public pages
- Disallows `/admin`
- Points to sitemap URL

Verify in Search Console → **Settings → robots.txt** after deploy.

---

## 6. Sync data

### Manual sync

- `/admin/insights` → **Sync all integrations**
- Or per-integration pages → **Sync now**

### Automated sync (Vercel Cron)

Add a cron job hitting:

```
GET /api/cron/analytics-sync
Authorization: Bearer YOUR_CRON_SECRET
```

Example `vercel.json` cron (if not already configured):

```json
{
  "crons": [
    {
      "path": "/api/cron/analytics-sync",
      "schedule": "0 6 * * *"
    }
  ]
}
```

---

## 7. Admin pages

| Page | URL |
|------|-----|
| SEO Insights (control center) | `/admin/insights` |
| Search Console | `/admin/integrations/search-console` |
| Google Analytics 4 | `/admin/integrations/analytics` |
| Microsoft Clarity | `/admin/integrations/clarity` |
| SEO Command Center (internal scoring) | `/admin/seo` |

### Insights features

- Google Health (indexed estimate, sitemap, errors)
- Traffic breakdown (organic, direct, referral)
- Search performance (impressions, clicks, CTR, position)
- Top pages, rising/losing traffic
- Low CTR and striking-distance opportunities
- Crawl issues + broken internal links
- Per-article metrics on `/admin/articles/[id]`
- One-click workspace creation from insights
- Weekly SEO summary (copy to clipboard)

---

## 8. Database migration

Apply migration `019_seo_analytics.sql` in Supabase:

- `integration_settings` — property URL, verification status, last sync
- `analytics_snapshots` — cached API responses
- `analytics_sync_runs` — sync history

---

## 9. Production checklist

- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON` set in Vercel (production)
- [ ] Service account added to Search Console (Full) and GA4 (Viewer)
- [ ] `GOOGLE_SEARCH_CONSOLE_PROPERTY` matches verified property
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` and `GA4_PROPERTY_ID` set
- [ ] `NEXT_PUBLIC_CLARITY_ID` set (and optional `CLARITY_API_TOKEN`)
- [ ] Migration `019` applied in Supabase
- [ ] Sitemap submitted in Search Console
- [ ] robots.txt accessible at `/robots.txt`
- [ ] Cron job configured for `/api/cron/analytics-sync`
- [ ] Manual sync from `/admin/insights` succeeds
- [ ] GA4 Realtime shows traffic after visiting the site
- [ ] Clarity dashboard shows sessions after 24–48h

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| GSC `403` / permission denied | Add service account to Search Console users |
| GA4 `403` | Grant Viewer on GA4 property |
| Empty insights after sync | Check Vercel function logs; verify env vars in production |
| Clarity metrics empty | Set `CLARITY_API_TOKEN` or use dashboard links only |
| `integration_settings` errors | Run migration `019` |

For internal SEO scoring (no Google APIs), continue using `/admin/seo`.
