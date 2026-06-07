# Changelog

Purpose: This file is a running log that tracks all notable changes, new features, and workflow updates for the project over time.
It also serves as a record of **completed beads issues** and significant workflow milestones.

> The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
> and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## Version Numbering Rules

We follow **Semantic Versioning (SemVer)** for all projects:

- **MAJOR (X.0.0):** Incompatible or breaking workflow or API changes.
- **MINOR (0.X.0):** New features, plan types, or template enhancements added in a backwards-compatible way.
- **PATCH (0.0.X):** Bug fixes, template corrections, or workflow refinements that don’t break existing functionality.

> For student or prototype projects:
>
> - Use **0.x.x** versions while iterating (pre-1.0).
> - Bump to **1.0.0** only when the core features are stable and production-ready.

---

## Issue Completion Logging

Significant beads issues should be recorded in the changelog when completed. Use this format:

---

### Issue Completion Entry Example

**Issue:** `AES-42`
**Type:** `feature`
**Status:** `closed`
**Summary:** Implemented secure login and registration flow with Firebase Auth.
**Commit Reference:** `feat: add login flow (Closes: AES-42)`
**Date:** 2025-10-24

---

This ensures transparency and traceability for all AI-executed workflows.

---

## [Unreleased]

### Added (2026-06-07) — Session 17: Cloudflare Pages deploy prep (headers + docs)

**Type:** `task`
**Status:** `in_progress` (host deploy is the maintainer's click-to-deploy step)
**Commit Reference:** `chore: add Cloudflare Pages headers + deploy docs for public static site`
**Date:** 2026-06-07
**Issue:** `marian-apparitions-3lh`

**What:** Prepared the public static site for Cloudflare Pages hosting.
- Added `public/_headers` — reproduces the Express/Helmet CSP (server doesn't run on the
  static host) plus `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy`. Must be kept in sync with the Helmet config in `server/index.ts`.
- Added `DEPLOY.md` — Cloudflare Pages deploy guide (Git-connected + Wrangler CLI),
  security-headers explanation, and a post-deploy verification checklist.

**Verified locally:** `npm run build:public` → `preview:public` → headless browser. World map
(Carto) and Medjugorje analytics page render; `_headers` lands in `dist/` root; **zero `/api`
calls**; no auth/AI UI; no Anthropic key in the bundle.

**Remaining (maintainer):** connect the repo in the Cloudflare Pages dashboard (build command
`npm run build:public`, output dir `dist`) or run `npx wrangler pages deploy dist`, then verify
the live site against the DEPLOY.md checklist and close `marian-apparitions-3lh`.

### Added (2026-06-06) — Session 16: Server-side persistence for Medjugorje analytics

**Type:** `feature`
**Status:** `closed`
**Commit Reference:** `feat: persist Medjugorje analytics (sentiments + enrichments) server-side`
**Date:** 2026-06-06
**Issue:** `marian-apparitions-gqi`

**Problem:** Medjugorje live sentiment analysis and per-window enrichment narratives were
saved only in browser localStorage, which is scoped per-origin. Opening the app from a
different URL/IP/browser showed none of the previously generated analysis (it appeared "lost").

**Fix: disk-backed analytics store** (`server/analytics.ts`, `server/routes.ts`, `.gitignore`)
- New `server/analytics.ts` mirrors `server/summaries.ts`: reads/writes `server/analytics.json`
  (gitignored) holding `{ sentiments: SentimentResult[] | null, enrichments: Record<windowLabel,text> }`.
- `POST /api/sentiments` now calls `saveSentiments(result.sentiments)`; `POST /api/enrich` calls
  `saveEnrichment(windowLabel, result.text)` — every generation auto-persists.
- New `GET /api/analytics` returns the full store (behind the existing auth middleware).

**Client hydration** (`src/api/medjugorjeAnalytics.ts`, `src/pages/MedjugorjePage.tsx`)
- `fetchSavedAnalytics()` GETs `/api/analytics` (returns empty in the public build or on error).
- MedjugorjePage hydrates on mount (private build only): server sentiments/enrichments win over
  the localStorage-seeded initial state and are mirrored back into localStorage as a cache.
- Result: analytics generated on any LAN device are shared across all devices/origins and
  survive rebuilds. Public build is unaffected (no server, GET returns empty).

**Verified:** private + public builds compile; eslint clean; live server (alt port) boots with
the new module, authenticates, and `GET /api/analytics` returns `{sentiments,enrichments}`.

---

### Added (2026-06-06) — Session 16: Public static build mode (no auth/AI) alongside private LAN build

**Type:** `feature`
**Status:** `closed`
**Commit Reference:** `feat: add public static build mode (no auth/AI) via VITE_PUBLIC_BUILD flag`
**Date:** 2026-06-06
**Issue:** `marian-apparitions-l2u`

**Feature: dual-mode build from one codebase** (`src/config.ts`, `src/vite-env.d.ts`, `package.json`)
- New build-time constant `isPublicBuild = import.meta.env.VITE_PUBLIC_BUILD === 'true'`. Vite inlines it, so dead auth/AI branches are tree-shaken from the public bundle.
- Added scripts: `build:public` (`VITE_PUBLIC_BUILD=true vite build`) and `preview:public`. `build` stays unchanged for the private LAN app.
- Private build behavior is fully preserved (auth, AI buttons, server proxy).

**Public build strips all auth + AI + cost UI** (`src/App.tsx`, `src/components/DetailPanel.tsx`, `src/pages/MedjugorjePage.tsx`)
- `App.tsx`: Sign Out button hidden; `handleLogout` body guarded so the `/api/logout` fetch is dead-code-eliminated.
- `DetailPanel.tsx`: public shows the curated static `apparition.summary` (no network, no localStorage); "Generate with AI" button hidden.
- `MedjugorjePage.tsx`: "Run Claude Analytics" button, usage/budget cost panel, and the entire "AI Window Analysis" section hidden; sentiments come from `precomputedSentiments` (ignores visitor localStorage); budget-seeding localStorage writes suppressed.

**Defensive API guards** (`src/api/claudeApi.ts`, `src/api/medjugorjeAnalytics.ts`)
- `fetchAllSummaries` returns `{}` in public; `generateSummary`/`analyzeSentiments`/`enrichTimeWindow` throw if called. Ensures `fetch('/api/...')` strings never ship in the public bundle.

**Verification**
- Private and public builds both compile; `eslint` clean.
- Public bundle grep: **no** `/api/`, `/login`, or `anthropic` strings.
- Live `preview:public` driven via Playwright: no auth/AI UI, all static content (map, summaries, sentiment chart, keywords, themes, timeline, messages) renders, **zero** `/api/*` network requests.

**Note:** Public artifact is the static `dist/` from `npm run build:public` — hostable free on Cloudflare Pages / Netlify / Vercel / GitHub Pages (build cmd `npm run build:public`, output `dist`). See plan for hosting/cost comparison.

---

### Fixed (2026-06-06) — Session 15: Satellite/map toggle dot persistence bug

**Type:** `bug`
**Status:** `closed`
**Commit Reference:** `fix: pass diff:false to setStyle so style.load fires on satellite toggle`
**Date:** 2026-06-06

**Bug: Apparition dots disappeared on satellite/map toggle** (`src/map/MapView.tsx`)
- Root cause: MapLibre GL JS v4's `setStyle` defaults to diff mode (`diff: true`), which calls `style.setState()` internally and **never fires** the `style.load` event
- The `addLayers` callback was registered on `style.load`, so it silently no-ops on every toggle; dots only reappeared after a full map remount (navigating to Medjugorje page and back)
- Fix: pass `{ diff: false }` to `setStyle`, forcing a full style replacement that always fires `style.load` → `addLayers` re-adds source and pin layers correctly

---

### Added (2026-06-06) — Session 14: Helmet CSP + login page fix

**Type:** `security`
**Status:** `closed`
**Commit Reference:** `feat: enable helmet CSP with explicit origin allow-list` / `fix: move login inline script to external file to satisfy CSP script-src`
**Date:** 2026-06-06

**Security: Content Security Policy enabled** (`server/index.ts`)
- Replaced `contentSecurityPolicy: false` with an explicit allow-list covering all real external origins the app uses
- `script-src 'self'` — all JS is bundled locally; MapLibre 4.x doesn't need `'unsafe-eval'`
- `style-src 'self' 'unsafe-inline' fonts.googleapis.com` — `unsafe-inline` required for MapLibre's runtime canvas/popup styles
- `font-src 'self' fonts.gstatic.com` — Cinzel + Inter font files
- `connect-src 'self' basemaps.cartocdn.com *.basemaps.cartocdn.com server.arcgisonline.com` — Carto base map + Esri satellite tiles
- `worker-src blob:` — MapLibre GL 4.x creates Web Workers from blob URLs
- `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`
- Closes: `marian-apparitions-275`

**Fix: Login page broken by CSP** (`server/login.html`, `server/login.js`, `server/index.ts`)
- The login page's inline `<script>` block was blocked by the new `script-src 'self'` policy
- Extracted the form handler to `server/login.js`; added a public `GET /login.js` route (before `requireAuth`); replaced inline `<script>` with `<script src="/login.js">`

---

### Added (2026-06-06) — Session 13: Server-side AI summary persistence + latest message feature

**Type:** `feature`
**Status:** `closed`
**Commit Reference:** `feat: server-side AI summary persistence + latest message feature`
**Date:** 2026-06-06

**Feature: Server-side AI summary store** (`server/summaries.ts`, `server/routes.ts`)
- `server/summaries.ts`: read/write helper for `server/summaries.json` (gitignored); `getAllSummaries()` and `saveSummary(id, summary)` exports
- `GET /api/summaries` — returns the full saved-summary map to any authenticated device on the LAN
- `POST /api/summary` — now auto-saves each generated summary server-side after the Anthropic call succeeds
- Any device that loads the app immediately sees summaries already generated by any other user — no re-generation required

**Feature: Client summary resolution** (`src/api/claudeApi.ts`, `src/components/DetailPanel.tsx`)
- `fetchAllSummaries()`: fetches `/api/summaries` once per page session (module-level cache); returns empty map on error for graceful degradation
- `updateSummaryCache(id, summary)`: keeps the module cache in sync after a user regenerates
- `DetailPanel` now prefers server summary → localStorage → default static summary (in that order) when an apparition panel is opened

**Feature: Latest Message featured card** (`src/pages/MedjugorjePage.tsx`)
- The most recent message in the dataset (computed at render time, not affected by year/theme filters) is displayed as a highlighted card right below the page header, before the stats grid
- Styled with a thicker gold border and shows date, recipient badge, full message text, and source link

---

### Added (2026-06-06) — Session 12: Secure LAN access (password gate, HTTPS, server-side API key)

**Issue:** `marian-apparitions-yid`
**Type:** `feature`
**Status:** `closed`
**Summary:** Added a Node/Express HTTPS backend so the app can be shared on the local network behind a single shared password, and moved the Anthropic API key server-side so it is never exposed in the browser.
**Commit Reference:** `feat: secure LAN access — password gate, HTTPS, server-side API proxy (Closes: marian-apparitions-yid)`
**Date:** 2026-06-06

**Feature: Backend AI proxy** (`server/`)
- New Express HTTPS server (`server/index.ts`) serves the built `dist/` and the AI endpoints on `0.0.0.0:8443` for LAN access
- `server/anthropic.ts` holds the Anthropic client (`process.env.ANTHROPIC_API_KEY`); the three former client-side functions (`generateSummary`, `analyzeSentiments`, `enrichTimeWindow`) moved here verbatim (same models/prompts/chunking/usage shapes)
- `server/routes.ts` exposes `POST /api/summary|sentiments|enrich`, validating bodies with Zod (reuses `ApparitionSchema`)

**Feature: Single-shared-password auth** (`server/auth.ts`, `server/login.html`)
- Password verified with constant-time `crypto.scrypt` + `timingSafeEqual` (no bcrypt dep)
- `express-session` (in-memory, httpOnly + sameSite=lax cookie, 8h rolling, regenerate-on-login)
- `express-rate-limit` (10/15min per IP) + fixed delay on failed login
- `requireAuth` gates all assets + `/api/*`; unauthenticated browsers redirect to a styled `/login` page; `/api/*` returns 401
- Sign Out control added to the app header (`src/App.tsx`)

**Feature: HTTPS via self-signed cert** (`server/cert.ts`)
- `selfsigned` generates `certs/key.pem` + `certs/cert.pem` (gitignored) on first boot

**Security: API key removed from the browser**
- `src/api/claudeApi.ts` + `src/api/medjugorjeAnalytics.ts` rewritten as `fetch('/api/...')` wrappers (identical return shapes incl. token `usage`); `@anthropic-ai/sdk` + `dangerouslyAllowBrowser` + `VITE_ANTHROPIC_API_KEY` removed from `src/`
- `hasApiKey` gating dropped in `DetailPanel.tsx` / `MedjugorjePage.tsx` (server owns the key); AI buttons always enabled, errors surfaced via existing error states
- Verified: `grep` of `dist/` finds no `sk-ant`, no `VITE_ANTHROPIC`, no SDK

**Tooling**
- New scripts: `server`, `server:dev`, `start:lan`; `start.sh` (the `maryapps` alias) now builds + runs the secure server
- New deps: `express` 5.2.1, `express-session` 1.19.0, `express-rate-limit` 8.5.2, `helmet` 8.2.0, `selfsigned` 5.5.0, `tsx` 4.22.4, `@types/express`, `@types/express-session`
- Vite dev proxy forwards `/api` → `https://localhost:8443` (`secure:false`)
- `.env.example` updated: `ANTHROPIC_API_KEY` (no VITE_ prefix), `APP_PASSWORD`, `SESSION_SECRET`, optional `PORT`
- Docs updated per precedence: `sbom.md`, `security.md`, `infra.md`, `prd.md`

**Follow-up:** Tighten helmet CSP to an explicit allow-list (Esri tiles + Google fonts) — currently disabled to avoid breaking the map.

**Performance: bundle code-splitting** (same session)
- `MedjugorjePage` now loaded via `React.lazy` + `Suspense` (`src/App.tsx`) — recharts + analytics deferred to a separate chunk until the page is opened
- `vite.config.ts` `manualChunks` splits `maplibre-gl` into its own cacheable chunk
- Initial-load JS dropped from ~461 KB to ~314 KB gzip

---

### Added (2026-06-06) — Session 11: Medjugorje page — analytics UX, persistence, cost tracking

**Feature: API cost tracker** (`src/pages/MedjugorjePage.tsx`)
- Usage panel below "Run Claude Analytics" button tracks cumulative input/output tokens and estimated cost
- Pricing constants: claude-sonnet-4-6 at $3.00/MTok input, $15.00/MTok output
- Balance field (default $99.84) stored in localStorage with ISO timestamp of last update
- "Updated [date/time]" shown below balance input so user knows when they last set it
- Red warning banner appears when remaining balance hits $0, prompting update at console.anthropic.com
- "Reset usage" button clears token/call counters; balance and timestamp persist independently
- `medjugorjeAnalytics.ts`: both `analyzeSentiments()` and `enrichTimeWindow()` now return `{ ..., usage: ApiUsage }` with `input_tokens`/`output_tokens` captured from `response.usage`

**Feature: AI output persistence** (`src/pages/MedjugorjePage.tsx`)
- Live sentiments from "Run Claude Analytics" saved to `localStorage['medjugorje-live-sentiments']`; restored on next page load in place of pre-computed data; "Live analytics active" badge shown
- AI Window Analysis narratives saved per time-window key (`medjugorje-enrichments`); switching year ranges restores previously generated text automatically
- Button label changes to "Re-analyze Window" when a saved result exists for the current window
- Panel subtitle updates to "Saved analysis for…" vs. fresh prompt copy

**Feature: Hover tooltips on AI buttons** (`ButtonTooltip` component)
- `ButtonTooltip` wrapper uses Tailwind `group-hover` to show styled tooltip below each button
- "Run Claude Analytics" tip: explains sentiment scoring, keyword extraction, theme clustering, estimated cost
- "Analyze Window with AI" tip: explains narrative generation, per-window persistence, estimated cost

**Feature: Recipient filter** (Messages section)
- Three toggle pills — Marija, Mirjana, Group — with live counts from year+theme-filtered set
- Stacks alongside existing year-range and theme filters; "No messages found" lists all active filters
- `filteredMessages` split into `baseFilteredMessages` (year+theme) and `filteredMessages` (+ recipient) to keep counts accurate

**Fix: Stats strip "TOP WORDS"** (`src/components/MedjugorjeStats.tsx`)
- Increased from top-5 to top-10 words displayed in the stats card

**UX: Section reorder + sentiment primer**
- AI Window Analysis moved above Sentiment Trend (Stats → AI Window → Sentiment → Timeline → Keywords → Themes → Messages)
- Sentiment primer added below "Sentiment Trend" heading explaining –1/+1 scale and chart interaction

**UX: Keyword chart**
- Chart restored to 20 bars at 360px height after brief reduction to 10

---

### Added (2026-06-06) — Session 10b: Medjugorje messages dataset — 2024–2026 expansion, newest-first order

**Data: Full 2024–2026 message set** (`src/data/medjugorjeMessages.ts`)
- Dataset: 90 → 151 messages (+61); spans 1981–2026 (46 years)
- All 2024 monthly messages added (was only Jan + Jun, both with incorrect texts — corrected from medjugorje.ws)
- All 2025 monthly messages added (Jan–Dec, authentic scraped texts)
- 2026 messages added: Jan–May (latest available)
- 3 Mirjana annual apparition messages added (Mar 18, 2024/2025/2026); Mirjana recipient count: 0 → 3
- Pre-computed sentiments extended: 90 → 152 entries (`src/data/medjugorjeSentiments.ts`)

**UI: Message list order and year range**
- Messages sorted newest-first (2026-05-25 at top); `filteredMessages` memo now `.sort((a, b) => b.year - a.year || b.month - a.month)`
- Year range selector and sentiment chart X-axis domain extended to 2026
- Page subtitle updated to "1981–2026"

---

### Added (2026-06-06) — Session 10: Medjugorje page — pre-computed sentiments, timeline, stats strip

**Multi-agent build (3 parallel agents):**

**Feature: Pre-computed sentiments** (`src/data/medjugorjeSentiments.ts`)
- 90 hand-crafted `SentimentResult` entries covering all messages `msg-1981-06` through `msg-2024-06`
- Scores range −0.35 (explicit Satan/war warnings) to 0.85 (joyful Christmas messages)
- Labels: `joyful`, `peaceful`, `consoling`, `urgent`, `warning` applied contextually
- Sentiment trend chart now loads instantly on mount — no API key required
- `MedjugorjePage.tsx`: analytics state initialized via `buildAnalyticsFromSentiments()` helper at startup
- "Showing pre-computed data" badge shown until user runs live Claude analytics

**Feature: GeopoliticalTimeline component** (`src/components/GeopoliticalTimeline.tsx`)
- Horizontal scrollable strip (min-width 1200px) spanning 1981–2024
- 55 events plotted as colored 8px dots on a gold timeline line, positioned by year %
- Decade markers at 1981, 1990, 2000, 2010, 2020, 2024
- Per-event hover/focus tooltip: full title, ISO date, category badge, 2-line description
- Category filter pills row (War/Collapse/Disaster/Papal/Terrorism/Diplomacy) with toggle-active state
- Legend strip with live opacity feedback when categories are filtered
- WebKit + Firefox thin scrollbar styles

**Feature: MedjugorjeStats component** (`src/components/MedjugorjeStats.tsx`)
- Compact 4-card stats strip above the sentiment chart: Total messages, Year Span, By Recipient, Top Words
- Decade bars spanning the full grid width as a 5-bar CSS sparkline
- All computed from `messages` prop via `useMemo` — no API calls

---

### Added (2026-06-06) — Session 9: Medjugorje page — messages, analytics, geopolitical timeline

**Issue:** `marian-apparitions-5mo` | **Type:** `feature` | **Status:** `closed`
**Commit Reference:** `feat: build out Medjugorje messages page with Claude analytics`

**Feature: Medjugorje messages dataset** (`src/data/medjugorjeMessages.ts`)
- 90 authentic monthly messages spanning 1981–2024, covering all major thematic periods
- Recipients: Marija (post-1987 public monthly messages), group (early 1981–1986)
- `src/data/medjugorjeTypes.ts`: shared types — `MedjugorjeMessage`, `GeopoliticalEvent`, `SentimentResult`, `ThemeCluster`, `AnalyticsResult`

**Feature: Geopolitical events dataset** (`src/data/geopoliticalEvents.ts`)
- 55 curated world events 1981–2024: wars, collapses, disasters, papal events, terrorism, diplomacy
- Categories color-coded on charts: war (red), papal (gold), disaster (purple), collapse (orange), terrorism (pink), diplomacy (cyan)
- Includes key Medjugorje-adjacent papal events (JPII assassination attempt 1981, death 2005, Francis election 2013, Vatican recognition 2024)

**Feature: Claude NLP analytics pipeline** (`src/api/medjugorjeAnalytics.ts`)
- `analyzeSentiments()` — batches messages in chunks of 20, returns structured JSON per message (score −1..1, label, keywords, themes)
- `enrichTimeWindow()` — sends filtered messages + events to Claude for theological/historical narrative
- `computeKeywordFrequency()` — local JS tokenizer, no API key required; top keywords: pray, peace, heart, way, joy, life

**Feature: Full MedjugorjePage** (`src/pages/MedjugorjePage.tsx`) — full rewrite from 24-line stub
- Recharts `LineChart` sentiment trend with geopolitical event `ReferenceLine` markers
- Recharts horizontal `BarChart` keyword frequency (works without API key, instant on mount)
- Theme cluster pill buttons — click to filter message list
- Message list with year-range dropdowns, expand/collapse cards, 50-per-page "Load more"
- AI Window Analysis panel — Claude enrichment on demand for any selected year range
- API key banner when `VITE_ANTHROPIC_API_KEY` is not set

**Dependency added:** `recharts@3.8.1`

---

### Added (2026-06-06) — Session 8: Miracle Hunter expansion, multi-status color coding

**Feature: Miracle Hunter non-approved apparitions database expansion** (`marian-apparitions-1pa`)
- Database: 26 → 72 apparitions across 24 countries and 17 centuries
- 46 new sites added from Miracle Hunter's unapproved/non-approved listings, sourced via automated browser research
- New regions now covered: South Korea, Nigeria, South Africa, India, Bolivia, Slovakia, Ukraine, Australia, Ecuador
- Historical range extended: Good Success (1594, Ecuador), Querrien (1652, France), Montagnaga (1729, Italy)
- `types.ts`: added `'unapproved'` to the Zod status enum (5 values total)

**Feature: 5-status color-coded map pins**
- `constants.ts`: `PIN_COLORS`, `PIN_GLOW_COLORS`, `STATUS_LABELS` records for all 5 statuses
  - Gold → Approved | Sky blue → Approved for Devotion | Amber → Under Investigation | Rose → Not Approved | Violet → Not Formally Evaluated
- `MapView.tsx`: data-driven MapLibre GL `match` expression colors pins and glow layers by status
- Hover now enlarges pin radius (7→10px) rather than overriding status color

**Feature: Map legend** (`MapLegend.tsx` — new component)
- Compact translucent panel anchored bottom-left of the map
- Displays all 5 statuses with colored dots and human-readable labels

**Feature: Status filter dropdown**
- `FilterControls.tsx`: new "All Statuses" select with all 5 options
- `App.tsx`: `statusFilter` state threaded to `MapView`, `FilterControls`, and `visibleCount`
- Reset button now clears status filter in addition to century and country

---

### Added / Fixed (2026-06-06) — Session 7: Sidebar sync, feast day banner, Medjugorje foundation

**QA pass** — Full browser-driven QA via Playwright. Confirmed: map load, sidebar fly-to, detail panel, satellite toggle, search filter, century filter, timeline slider. Found and fixed one bug (sidebar sync).

**Bug fix: Sidebar filter sync** (`marian-apparitions-h88`)
- `SearchSidebar.tsx` now receives `century`, `country`, and `timelineYear` as props
- Sidebar's `filtered` memo applies all three filters in addition to the search query
- Count header shows `filtered / total` ratio whenever any filter is active
- Previously: sidebar always showed all 26 apparitions regardless of active filters

**Feature: This Day in History — feast day banner** (`marian-apparitions-dh0`)
- Added optional `feastDay: string` (MM-DD format) field to `ApparitionSchema` in `types.ts`
- Added `feastDay` for all 26 apparitions (liturgical feast days or anniversary of first apparition)
- `TodayFeastBanner.tsx`: dismissable gold banner that appears when today's date matches a feast day; clicking an apparition name in the banner flies the map to it and opens its detail panel
- Sidebar list items show a gold "Feast Day" badge on matching days

**Feature: Medjugorje page foundation** (`marian-apparitions-5mo` — in progress)
- "Medjugorje" button added to the header; toggles between map view and Medjugorje page
- Button highlights gold when active; map state (filters, timeline, selection) is preserved across the toggle
- `src/pages/MedjugorjePage.tsx` skeleton created with celestial theming and feature description
- Full feature (messages archive, Claude NLP pipeline, geopolitical events timeline) continues next session

### Fixed (2026-06-06) — Session 6: Map pin rendering fix + startup script

**Map pin rendering bug** (`src/map/MapView.tsx`)
- Root cause: React StrictMode double-invokes the `isSatellite` useEffect on mount, calling `map.setStyle(GRAPHIC_STYLE)` before the map's rendering pipeline is initialized. This caused `style.load` to fire prematurely — layers were added to the style object but the WebGL renderer wasn't ready, so circles never appeared.
- Fix part 1: Guard `isSatellite` effect with `prevIsSatelliteRef` — only calls `setStyle` when the value genuinely changes (not on mount or StrictMode re-invocations). Eliminates the MapLibre "Unable to perform style diff" warning entirely.
- Fix part 2: `style.load` now always calls `addLayers` (it only fires for legitimate style loads: initial load or satellite toggle). Both graphic and satellite modes confirmed working.
- Also: `DetailPanel` backdrop-blur-sm is now only applied when panel is open (prevents GPU compositing layer from forming when panel is off-screen).

### Added (2026-06-05) — Session 5: Test framework, security audit, UX polish

**Startup script**
- `start.sh`: one-command launch — checks for node, auto-installs deps if missing, notes missing `.env`, runs `npm run dev`

**T019 — Test framework** (Vitest + Testing Library)
- Installed `vitest@4.1.8`, `@testing-library/react@16.3.2`, `@testing-library/user-event@14.6.1`, `jsdom@29.1.1`, `@vitest/coverage-v8@4.1.8`
- `vite.config.ts`: imports `defineConfig` from `vitest/config`; `test` block with `environment: 'jsdom'`, `globals: true`, `setupFiles`
- `src/test/setup.ts`: stubs `import.meta.env` for test environment
- `package.json`: added `test` and `test:watch` scripts
- `.claude/tests.md`: philosophy, tool versions, run commands, 6 key test scenarios with MapLibre + Claude API mocking conventions

**T021 — Security & supply-chain audit**
- `npm audit`: 2 moderate vulns (`esbuild`, `vite` dev-server) — both accepted (local-only app; fix requires breaking Vite 8 upgrade)
- Secrets audit: no `.env` committed, `.gitignore` covers `.env*`, `VITE_ANTHROPIC_API_KEY` only via `import.meta.env`, no hardcoded keys found
- Findings appended to `.claude/security.md` §7

**T022 — Final UX polish**
- `DetailPanel.tsx`: slide-in/out via `transition-transform translateX` (300ms ease-in-out); mobile backdrop overlay; `aria-label` on Close + Regenerate; gold focus rings
- `SearchSidebar.tsx`: sr-only label + `aria-label` on search input; gold focus ring; list items keyboard-accessible (`role="button"`, `tabIndex`, `onKeyDown`, `aria-pressed`)
- `FilterControls.tsx`: gold focus rings on century/country selects and Reset button
- `TimelineSlider.tsx`: `aria-label="Filter by year"`; gold focus ring on range input
- `SatelliteToggle.tsx`: gold focus rings on both toggle buttons
- `src/index.css`: MapLibre popup fade-in animation (150ms opacity + translateY)

### Added (2026-06-05) — Session 4: Dataset expansion + all PRD features

**Dataset expansion — 14 → 23 apparitions** (`marian-apparitions-5su`)
- Parallel research agents audited Church-approved (Nihil Obstat) apparitions against MiracleHunter.com
- Added 9 missing formally approved apparitions: Our Lady of the Pillar (Spain, 40 AD), Our Lady of Cotignac (France, 1519), Our Lady of Siluva (Lithuania, 1608), Our Lady of Laus (France, 1664 / Vatican 2008), Our Lady of the Tears (Italy, 1953), Our Lady of Betania (Venezuela, 1976), Our Lady Rosa Mystica (Italy, 1947 / Vatican 2024), Our Lady of Cuapa (Nicaragua, 1980), Our Lady of the Rosary of San Nicolás (Argentina, 1983)
- Each entry includes GPS coordinates, source URL, and 3-sentence narrative summary

**T010 — Satellite / graphic toggle** (`marian-apparitions-d7y`)
- `src/components/SatelliteToggle.tsx`: two-segment pill toggle, accessible aria-pressed
- `src/map/MapView.tsx` refactored: `map.setStyle()` switches between CARTO Dark Matter and Esri World Imagery raster tiles; `style.load` handler rebuilds GeoJSON source and layers after every style change so gold pins survive tile-layer swaps

**T014 — Apparition detail panel** (`marian-apparitions-1da`)
- `src/components/DetailPanel.tsx`: fixed right panel (w-96, h-full-minus-header), `animate-slide-in`, `panel-celestial` utility class
- Displays: name (Cinzel/gold), location + year subtitle, `badge-approved`, summary, "View Source →" link
- Managed `displayedSummary` local state resets on `apparition.id` change via `useEffect`

**T015 — "Regenerate with AI" live Claude call** (`marian-apparitions-1da`)
- `src/api/claudeApi.ts`: `generateSummary(apparition)` calls `claude-sonnet-4-6` with scholarly system prompt; `dangerouslyAllowBrowser: true` for local-only use; guards on missing `VITE_ANTHROPIC_API_KEY`
- DetailPanel regenerate button: disabled + tooltip when no key; loading state while in flight

**T016 — Searchable sidebar** (`marian-apparitions-zf2`)
- `src/components/SearchSidebar.tsx`: collapsible left sidebar with smooth CSS `translateX` transition
- Search filters name/location/country/year case-insensitively via `useMemo`; list sorted chronologically
- Toggle tab tracks sidebar edge; selected row gets gold left border; click flies map to pin + closes sidebar

**T017 — Century + country filters** (`marian-apparitions-d7y`)
- `src/components/FilterControls.tsx`: century and country `<select>` dropdowns; options derived via `useMemo`
- Ordinal suffix helper handles 11th/12th/13th edge cases; conditional Reset button; sr-only labels for a11y
- MapView reactive: `filtered` memo re-derives apparitions on prop change; `source.setData()` updates pins without map remount

**T018 — Chronological timeline slider** (`marian-apparitions-d7y`)
- `src/components/TimelineSlider.tsx`: fixed bottom bar, `h-14`, gold `accentColor` range input
- 40 AD–1983 range; `formatYear` helper shows "40 AD" vs "1983"; ARIA value attributes for screen readers
- Shows live visible count; "All years / Showing all" state when at maximum

**App.tsx integration**
- Manages: `selectedApparition`, `century`, `country`, `timelineYear`, `isSatellite`, `flyToId`
- `handleSidebarSelect` sets both `selectedApparition` and `flyToId` for coordinated sidebar → map fly
- All 6 new components wired; `visibleCount` derived for timeline counter

### Added (2026-06-05) — Session 3: Map + AI pipeline

**T009 — Interactive MapLibre map with glowing gold pins**
- `src/map/MapView.tsx`: MapLibre GL JS on CARTO Dark Matter base style (free, no API key)
- GeoJSON source with all 14 apparition points; double-layer gold effect: blurred glow circle + crisp pin circle
- Hover → dark-themed popup (name + year); click → `onSelect(Apparition)` callback
- Navigation controls; attribution compact bottom-right
- Bug fix: MapLibre's CSS sets `position: relative` on its container, breaking `absolute inset-0`; fixed with wrapper div pattern
- `src/App.tsx` updated: `useState<Apparition | null>` for `selectedApparition`; map replaces placeholder

**T013 — Pre-generated AI summary cache pipeline**
- `scripts/generate-summaries.ts`: sequential Claude API calls (`claude-sonnet-4-6`) for all 14 apparitions
- Scholarly 3-sentence system prompt; `max_tokens: 300`; writes updated `src/data/apparitions.ts` in place
- Guards on missing `ANTHROPIC_API_KEY` (exit 1 with clear instructions)
- `npm run generate-summaries` via `npx tsx`; no new runtime dependencies

### Added (2026-06-05) — Session 2: Foundation complete

**T003 — Project scaffold** (`marian-apparitions-3vg`)
- Vite 5 + React 18 + TypeScript project initialized with all approved deps installed
- Directory structure per `infra.md`: `src/{components,map,api,hooks,data}`, `public/images`
- Dev server confirmed working at `http://localhost:5173`

**T004 — SBOM pinned** (`marian-apparitions-8vk`)
- `sbom.md` updated with exact installed versions (e.g. `maplibre-gl@4.7.1`, `@anthropic-ai/sdk@0.27.3`)
- Known esbuild moderate vulnerability documented and accepted (local-only app, fix requires Vite 8)

**T005 — Security hygiene** (`marian-apparitions-7sf`)
- `.gitignore` extended: `node_modules/`, `dist/`, `.env*`, `*.pem`, `*.tsbuildinfo`
- `.env.example` created with `VITE_ANTHROPIC_API_KEY` placeholder

**T006 — Dataset schema** (`marian-apparitions-m6q`)
- `src/data/types.ts`: Zod `ApparitionSchema`, `Apparition` type, `ApparitionFilter` interface, `getCentury()` helper

**T007 — Celestial theme** (`marian-apparitions-zgv`)
- Fonts: Cinzel (headings) + Inter (body) via Google Fonts
- Full `celestial.*` Tailwind palette (navy, indigo, gold, Marian-blue, star)
- Canvas `StarField` component with per-star twinkling animation
- Tailwind component utilities: `.btn-gold`, `.badge-approved`, `.panel-celestial`
- Keyframe animations: `twinkle`, `pulse-gold`, `fade-in`, `slide-in`

**T008 — Nihil Obstat dataset** (`marian-apparitions-23x`)
- 14 Church-approved Marian apparitions (1531–1981): Guadalupe, Miraculous Medal, La Salette, Lourdes, Good Help, Pontmain, Pellevoisin, Knock, Fatima, Beauraing, Banneux, Zeitoun, Akita, Kibeho
- Each entry: precise lat/lng, 3-sentence summary, verified `miraclehunter.com` source URL

**T011 — Geocode + validation** (`marian-apparitions-4zu`)
- `src/data/validate.ts`: Zod schema check, coordinate range, year bounds, source URL domain — 14/14 pass

### Added (2026-06-05) — Session 1

- Generated `tasks.md` — 22 tasks across 6 phases using `/skill-creator:create-tasklist`.
- Decided tech stack: **Vite + React + TypeScript**, **MapLibre GL JS**, Tailwind CSS, `@anthropic-ai/sdk`.
- Filled `infra.md` — architecture, directory structure, data schema, run commands (`npm install` / `npm run dev` / `http://localhost:5173`).
- Filled `sbom.md` — pinned approved dependencies with versions and rationale.
- Filled `security.md` — data classified Public (no PII), secrets via `.env` / `VITE_ANTHROPIC_API_KEY`, `.gitignore` rules, browser-context API key caveat.
- Marked T001 and T002 done in `tasks.md`; 20 tasks remaining, 17 now unblocked.

### Changed

- Migrated from `.claude/implementation/` and `features.json` to beads (`bd`) for issue tracking.
- Updated `workflow.md` to use beads CLI commands for planning, execution, and status management.
- Clarified changelog role in tracking **issue completions** and **workflow milestones**.

### Added

- Introduced beads (`bd`) for centralized issue tracking with priorities, dependencies, and labels.
- Added branching strategy and PR workflow documentation to `workflow.md`.
- Enhanced multi-agent coordination with `--actor` and `--assignee` flags.

### Deprecated

- Removed `.claude/implementation/` directory structure — now handled by beads.

---

## [0.1.1] - 2025-09-15

### Added

- Introduced initial autonomous workflow logic:
  - Beads (`bd`) CLI for issue tracking
  - Issue types: bug, feature, task, epic, chore
  - Status management: open, in_progress, blocked, deferred, closed
- Updated `workflow.md` and `claude.md` to define issue-based planning and execution.

### Changed

- Revised `tests.md` to support automatic test execution after each feature step.
- Added changelog integration rules for issue completions.

---

## [0.1.0] - 2025-08-31

### Added

- Created initial set of Markdown context files (`claude.md`, `prd.md`, `infra.md`, `workflow.md`, `security.md`, `sbom.md`, `tests.md`).
- Added `changelog.md` to track project history.
- Added `first_prompt.md` as interactive setup guide for template population.
- Defined examples for both local Python applications and Next.js + Supabase applications to guide new students.

### Notes

- This is the first structured version of the project templates.
- Future releases will focus on workflow automation, changelog integration, and feature-based plan versioning.
