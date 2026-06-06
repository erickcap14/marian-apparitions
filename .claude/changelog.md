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
