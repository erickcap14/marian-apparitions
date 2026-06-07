# Deployment — Cloudflare Pages

How to deploy the **public static build** of marian-apparitions to Cloudflare Pages.

## Overview

This project has two run paths. Only the first is deployed publicly:

- **Public static build** (deployed here): `npm run build:public` produces a fully
  static site in `dist/`. The `VITE_PUBLIC_BUILD=true` flag strips all auth and AI
  (`/api`) features, so the site makes **no backend calls** — safe for public hosting.
- **LAN server path** (not deployed): `npm run start:lan` builds normally and serves
  via Express (auth + AI enabled). This is for local/LAN sharing only and never ships
  to Cloudflare.

Cloudflare Pages is preferred: unlimited bandwidth on the free tier, and the site is
served from the domain root, so no Vite `base` path is needed (unlike GitHub Pages).

## Prerequisites

- A Cloudflare account (free tier is sufficient).
- The GitHub repository for this project.
- Node 18+ (for local builds / Wrangler).

## Option A — Git-connected deploy (recommended)

Auto-deploys on every push to the production branch.

1. In the Cloudflare dashboard go to **Workers & Pages → Create → Pages → Connect to Git**.
2. Select the GitHub repository.
3. Configure the build:
   - **Framework preset:** None (Vite)
   - **Build command:** `npm run build:public`
   - **Build output directory:** `dist`
4. Set the **production branch** to `master` (Settings → Builds & deployments).
5. Save and deploy. Every push to `master` now triggers a production deploy; pushes to
   other branches create preview deployments.

## Option B — Wrangler CLI deploy

For manual / one-off deploys from your machine.

```bash
npm install -g wrangler   # or use npx wrangler below
npm run build:public
npx wrangler pages deploy dist --project-name=<your-project-name>
```

The first run opens a browser to authenticate (`wrangler login`); subsequent deploys
reuse the saved credentials.

## Security headers

Cloudflare Pages does **not** run the Express/Helmet middleware, so security headers
are reproduced in [`public/_headers`](public/_headers). Vite copies `public/*` into
`dist/` on build, and Cloudflare reads `_headers` from the deploy root.

This file mirrors the Helmet `Content-Security-Policy` in
[`server/index.ts`](server/index.ts) and **must be kept in sync** whenever the server
CSP changes.

Allow-listed external origins:

- **Google Fonts:** `fonts.googleapis.com`, `fonts.gstatic.com`
- **Carto dark-matter basemap:** `basemaps.cartocdn.com`, `*.basemaps.cartocdn.com`
- **Esri World Imagery (satellite tiles):** `server.arcgisonline.com`

## Verification checklist

After a deploy, open the live URL and confirm:

- [ ] The public site loads.
- [ ] The world map renders (Carto dark-matter basemap).
- [ ] The satellite toggle works (Esri World Imagery tiles load).
- [ ] The Medjugorje page renders.
- [ ] **No `/api` calls** in the DevTools → Network tab.
- [ ] **No** AI "Regenerate", auth, or login UI is present.
- [ ] Fonts load (Google Fonts).

## Custom domain (optional)

In the Pages project → **Custom domains → Set up a domain**, add your domain and follow
the DNS prompts. Cloudflare provisions TLS automatically.

## Rollback / redeploy

- **Option A:** push a new commit to `master` (or revert and push) to trigger a fresh
  deploy. Previous deployments remain available in the dashboard for instant rollback.
- **Option B:** re-run `npm run build:public && npx wrangler pages deploy dist --project-name=<your-project-name>`.
