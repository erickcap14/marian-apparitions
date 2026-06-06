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
