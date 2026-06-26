# Bundle Report

**Date:** 2026-06-20  
**Build:** `next build` (Next.js 15.5.19)  
**Note:** Recommendations only — no optimizations applied in this sprint.

---

## Shared baseline

| Asset | Size |
|-------|------|
| First Load JS shared by all | **102 kB** |
| `chunks/1255-*.js` (React runtime) | 46 kB |
| `chunks/4bd1b696-*.js` (Next framework) | 54.2 kB |
| Middleware | **90.6 kB** |

---

## Largest routes (First Load JS)

| Route | Page JS | First Load JS | Notes |
|-------|---------|---------------|-------|
| `/login` | 2.88 kB | **187 kB** | Supabase auth client |
| `/register` | 2.79 kB | **187 kB** | Supabase auth client |
| `/admin/login` | 2.07 kB | **183 kB** | Admin auth |
| `/community` | 2.96 kB | **162 kB** | Feed + interactions |
| `/community/[id]` | 3.31 kB | **162 kB** | Post detail |
| `/community/contest` | 2.95 kB | **162 kB** | Contest UI |
| `/profile` | 2.6 kB | **161 kB** | Profile + community |
| `/u/[username]` | 2.6 kB | **161 kB** | Public profile |
| `/` (homepage) | 5.01 kB | **129 kB** | Hero + newsroom sections |
| `/map` | 7.74 kB | **119 kB** | Leaflet loaded dynamically |
| `/tracker/[category]` | 5.98 kB | **121 kB** | Interactive checklist |
| `/admin/dashboard` | 2.55 kB | **121 kB** | Editorial OS (server-heavy) |

### Smallest routes (efficient)

Entity pages (`/characters/[slug]`, `/vehicles/[slug]`, etc.): **107 kB** First Load JS — server-rendered templates.

---

## Largest client chunks (post-build)

| Chunk | Size | Likely contents |
|-------|------|-----------------|
| `framework-*.js` | 188 kB | React DOM |
| `5948-*.js` | 184 kB | Supabase auth / SSR client |
| `4bd1b696-*.js` | 172 kB | Next.js shared |
| `1255-*.js` | 172 kB | React |
| `d0deef33.*.js` | **148 kB** | **Leaflet** (dynamic, map only) |
| `1707-*.js` | 144 kB | Community / markdown subtree |
| `main-*.js` | 128 kB | Webpack runtime |
| `app/map/page-*.js` | 20 kB | Map page shell (Leaflet separate) |
| `app/page-*.js` | 16 kB | Homepage client islands |

---

## Largest node_modules (disk)

| Package | Size | Loaded on |
|---------|------|-----------|
| `next` | 153 MB | Build + server |
| `lucide-react` | **39 MB** | Tree-shaken per icon import |
| `@supabase/*` | 9 MB | Auth pages, actions |
| `react-dom` | 7.1 MB | All client pages |
| `leaflet` | 3.8 MB | `/map` only (dynamic) |
| `react-markdown` | 80 KB | Article + community render |

**`lucide-react` is large on disk but tree-shaken** — only imported icons ship to client.

---

## Client component count

| Area | `"use client"` files |
|------|----------------------|
| Total in `components/` | ~46 (after dead code removal) |
| `app/` pages | **0** — all server components |

---

## Dynamic imports (good patterns)

| Module | Loader | Route |
|--------|--------|-------|
| `leonida-map-canvas.tsx` | `next/dynamic`, `ssr: false` | `/map` |

Leaflet does not bloat the global bundle — isolated to ~148 kB chunk loaded on map visit.

---

## Recommendations (do not optimize yet)

### High impact

| # | Recommendation | Expected gain | Risk |
|---|----------------|---------------|------|
| 1 | **Audit Supabase auth chunk on login/register** (184 kB shared chunk) | Hard to reduce without auth redesign | Medium |
| 2 | **Lazy-load community post interactions** below fold | −10–20 kB on `/community` | Low |
| 3 | **Split `react-markdown`** to article/community routes only (already route-scoped) | Verify with `@next/bundle-analyzer` | Low |

### Medium impact

| # | Recommendation | Expected gain | Risk |
|---|----------------|---------------|------|
| 4 | Merge `article-card` + `newsroom-article-card` | −2–4 kB duplicated markup logic | Low |
| 5 | Replace duplicate Lucide imports with icon subpath imports if not already optimized | Marginal | Low |
| 6 | Add `optimizePackageImports: ['lucide-react']` in `next.config` if not present | 5–15 kB global | Low |

### Low impact / monitoring

| # | Recommendation |
|---|----------------|
| 7 | Add `@next/bundle-analyzer` to CI — track regressions per PR |
| 8 | Set `First Load JS` budget alert at 200 kB for public routes |
| 9 | Keep `/map` Leaflet dynamic — never import leaflet in root layout |

---

## Consolidation sprint bundle impact

| Change | Bundle effect |
|--------|---------------|
| Removed 13 dead component files | Slightly smaller compile graph; no route size change (files were unreferenced) |
| Merged `missing-seo-pages` logic | Smaller server bundle only |
| Lint fixes | None |

**No measurable First Load JS change expected** — dead code was not in any import chain.

---

## Measurement commands

```bash
npm run build
# Route table printed at end of build

# Chunk sizes
find .next/static/chunks -name "*.js" -exec du -k {} + | sort -nr | head -15

# Optional: add to next.config for visual report
# const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' })
```

---

## Route tier summary

| Tier | First Load JS | Routes |
|------|---------------|--------|
| **Heavy** (&gt;160 kB) | Auth + community | login, register, admin/login, community/*, profile |
| **Medium** (115–130 kB) | Content + map | /, /map, /news, /guides, /tracker |
| **Light** (~107 kB) | Entity templates | characters, vehicles, locations, etc. |
| **Minimal** (~102 kB) | Static shells | /characters index, /trailers, /checklist |
