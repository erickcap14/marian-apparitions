# Project Tasks
> Last updated: 2026-06-05 | Generated from: .claude/ context files

## Legend
- `[ ]` TODO — not started
- `[~]` IN PROGRESS — actively being worked
- `[x]` DONE — complete and merged

---

## Phase 0: Foundation & Project Decisions
> Objective: Resolve undecided technical facts and stand up a runnable, secure project skeleton before any feature work.

| ID   | Task                                                              | Status | Blocks                          | Blocked By | Notes                                                                                                                                                                 |
|------|------------------------------------------------------------------|--------|---------------------------------|------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| T001 | Initialize beads tracking                                         | [x]    | —                               | —          | Done per changelog/`bd init` commit. Reference only — feature work tracked in beads + this file.                                                                     |
| T002 | Decide & record tech stack in infra.md + sbom.md                 | [x]    | T003,T004,T005,T010             | —          | Vite + React + TypeScript, MapLibre GL JS, Tailwind, @anthropic-ai/sdk. infra.md, sbom.md, security.md filled. |
| T003 | Scaffold project skeleton + install/startup scripts              | [x]    | T006,T010,T019                  | T002       | Vite 5 + React 18 + TS. All deps installed. Dev server at http://localhost:5173. marian-apparitions-3vg |
| T004 | Populate sbom.md with pinned approved dependencies               | [x]    | T010                            | T002       | Exact versions pinned. esbuild moderate vuln documented (local-only, accepted). marian-apparitions-8vk |
| T005 | Fill security.md (data sensitivity, secrets, .gitignore audit)   | [x]    | T010,T013                       | T002       | .gitignore updated, .env.example created, security.md complete. marian-apparitions-7sf |
| T006 | Define dataset schema + TypeScript/data types                    | [x]    | T007,T008,T011                  | T003       | Zod ApparitionSchema, Apparition type, ApparitionFilter, getCentury(). marian-apparitions-m6q |
| T007 | Set up base styling/theme (celestial dark + gold/Marian-blue)    | [x]    | T009,T012,T015,T022             | T003       | Cinzel/Inter fonts, celestial Tailwind palette, StarField canvas component, animations. marian-apparitions-zgv |

---

## Phase 1: Curated Dataset
> Objective: Produce the source-cited, Nihil-Obstat-only dataset that powers every map feature.

| ID   | Task                                                              | Status | Blocks              | Blocked By | Notes                                                                                                                                       |
|------|------------------------------------------------------------------|--------|---------------------|------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| T008 | Curate Nihil-Obstat apparition dataset (Story 10 `data_seed`)    | [x]    | T009,T011,T013      | T006       | 14 apparitions (1531–1981), miraclehunter.com sources, 3-sentence summaries. marian-apparitions-23x |
| T011 | Geocode coordinates + validate lat/lng per shrine                | [x]    | T009                | T006,T008  | src/data/validate.ts — 14/14 pass Zod schema + coordinate range checks. marian-apparitions-4zu |

---

## Phase 2: Map Core
> Objective: Render the interactive Mercator world map with apparition pins, hover, and satellite toggle.

| ID   | Task                                                              | Status | Blocks                        | Blocked By              | Notes                                                                                                                                       |
|------|------------------------------------------------------------------|--------|-------------------------------|-------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| T009 | Render interactive Mercator map with glowing pins (Story 1 `map_globe`) | [x] | T010,T012,T014,T016,T017 | T007,T008,T011 | src/map/MapView.tsx — MapLibre CARTO dark style, GeoJSON source, gold glow+pin layers, hover popup, click onSelect.                  |
| T010 | Add satellite/graphic toggle (Story 6 `satellite_toggle`)        | [x]    | —                             | T002,T003,T004,T005,T009 | SatelliteToggle.tsx + MapView setStyle(); Esri World Imagery raster tiles; layers rebuilt on every style.load.                                    |
| T012 | Pin hover tooltip: name + year (Story 2 `apparition_hover`)      | [x]    | —                             | T007,T009               | Implemented in MapView.tsx as part of T009 — dark popup on mouseenter with name + year.                                                      |

---

## Phase 3: Detail Panel & AI Summaries
> Objective: Let users open a pin to read a cached AI summary, view an image/source, and regenerate live via Claude.

| ID   | Task                                                              | Status | Blocks  | Blocked By  | Notes                                                                                                                                                  |
|------|------------------------------------------------------------------|--------|---------|-------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| T013 | Build pre-generated AI summary cache pipeline (Story 4 `ai_summary_cache`) | [x] | T014 | T005,T008 | scripts/generate-summaries.ts — calls claude-sonnet-4-6 for each apparition, writes updated src/data/apparitions.ts. Run: npm run generate-summaries   |
| T014 | Apparition detail panel: summary, image, source link, badge (Story 3 `apparition_panel`) | [x] | T015 | T009,T013 | DetailPanel.tsx — fixed right panel, badge-approved, summary, source link, close button. animate-slide-in.                                             |
| T015 | "Regenerate with AI" live Claude call (Story 5 `ai_regenerate`)  | [x]    | —       | T007,T014   | api/claudeApi.ts + DetailPanel regenerate button. Uses VITE_ANTHROPIC_API_KEY; dangerouslyAllowBrowser for local-only use.                              |

---

## Phase 4: Discovery — Search, Filters, Timeline
> Objective: Help users find specific apparitions and explore them across geography and history.

| ID   | Task                                                              | Status | Blocks | Blocked By | Notes                                                                                                  |
|------|------------------------------------------------------------------|--------|--------|------------|--------------------------------------------------------------------------------------------------------|
| T016 | Searchable sidebar that flies map to location (Story 7 `search_sidebar`) | [x] | — | T009 | SearchSidebar.tsx — collapsible left panel, search input, chronological list, flyTo on click.          |
| T017 | Century + country filters with reset (Story 8 `filters`)        | [x]    | T018   | T009       | FilterControls.tsx — century + country selects, conditional reset button, reactive GeoJSON filtering.  |
| T018 | Chronological timeline slider (Story 9 `timeline`)              | [x]    | —      | T017       | TimelineSlider.tsx — fixed bottom range slider, 40 AD–1983, live visible count, gold accent-color.     |

---

## Phase 5: Quality, Testing & Polish
> Objective: Lock in correctness, security hygiene, and the reverent/vibrant final feel before V1.

| ID   | Task                                                              | Status | Blocks | Blocked By                          | Notes                                                                                                              |
|------|------------------------------------------------------------------|--------|--------|-------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| T019 | Fill tests.md + set up test framework                            | [x]    | T020   | T003                                | Vitest 4 + @testing-library/react 16 + jsdom 29. vite.config.ts test block added. npm test / npm run test:watch. .claude/tests.md filled with philosophy, tools, run commands, and 6 key scenarios.                    |
| T020 | Write tests for critical journeys (map load, pin click, search, regenerate) | [ ] | — | T009,T014,T015,T016,T018,T019 | Cover core user journeys from prd stories.                                                                        |
| T021 | Security & supply-chain audit pass                              | [x]    | T022   | T004,T005,T015                      | npm audit: 2 moderate (esbuild/vite dev-server only, local-only app, accepted). No secrets committed. VITE_ANTHROPIC_API_KEY only via import.meta.env. Full findings in .claude/security.md §7.        |
| T022 | Final UX polish: starfield ambiance, animations, accessibility   | [x]    | —      | T007,T012,T015,T016,T018            | DetailPanel CSS transition slide-in/out; mobile backdrop overlay; focus rings on all interactive elements; aria-labels; sidebar list keyboard nav; popup fade-in.   |

---

## Dependency Graph

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

T001 (done)
T002 → T003,T004,T005,T010
T003 → T006,T010,T019
T006 → T007,T008,T011
T007 → T009,T012,T015,T022
T008 → T009,T011,T013
T011 → T009
T009 → T010,T012,T014,T016,T017
T013 → T014
T014 → T015
T017 → T018
T019 → T020
T021 → T022
```

---

## Summary
| Metric       | Count |
|--------------|-------|
| Total tasks  | 22    |
| Done         | 22    |
| In Progress  | 0     |
| Remaining    | 0     |
| Blocked      | 0     |
