# Domain: gtavihub.gg

Canonical URL: **https://www.gtavihub.gg**

## 1. DNS (at your domain registrar)

Point the domain to Vercel:

| Type | Name | Value |
|------|------|-------|
| **A** | `@` (apex) | `76.76.21.21` |
| **A** or **CNAME** | `www` | `76.76.21.21` or `cname.vercel-dns.com` |

**Alternative:** set nameservers to Vercel:
- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

Domains are already added to the **gta6hub** Vercel project.

## 2. Vercel (done)

- `gtavihub.gg` → project gta6hub
- `www.gtavihub.gg` → project gta6hub
- `NEXT_PUBLIC_SITE_URL` = `https://www.gtavihub.gg`
- Redirect: `gtavihub.gg` → `https://www.gtavihub.gg` (in `vercel.json`)

## 3. Supabase → Authentication → URL Configuration

| Field | Value |
|-------|-------|
| **Site URL** | `https://www.gtavihub.gg` |
| **Redirect URLs** | `https://www.gtavihub.gg/auth/callback` |
| | `http://localhost:3000/auth/callback` |

## 4. Google Cloud Console → OAuth client

**Authorized JavaScript origins:**
```
https://www.gtavihub.gg
http://localhost:3000
```

**Authorized redirect URIs** (unchanged — Supabase callback):
```
https://ocrrehcydcqkpakpftxg.supabase.co/auth/v1/callback
```

## 5. Verify

After DNS propagates (5 min – 48 h):

- https://www.gtavihub.gg
- https://gtavihub.gg → redirects to www
- https://www.gtavihub.gg/login → Google OAuth
- https://www.gtavihub.gg/sitemap.xml

Old URL `gta6hub-five.vercel.app` continues to work until you remove it from Vercel domains.
