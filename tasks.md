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
| T009 | Render interactive Mercator map with glowing pins (Story 1 `map_globe`) | [ ] | T010,T012,T014,T016,T017 | T007,T008,T011 | Default stylized vector Mercator; glowing gold markers; gentle animations.                                                          |
| T010 | Add satellite/graphic toggle (Story 6 `satellite_toggle`)        | [ ]    | —                             | T002,T003,T004,T005,T009 | Free provider default (Esri World Imagery or Mapbox) — NO Google billing. Swappable via config.satelliteProvider = esri\|mapbox\|google (prd §4). |
| T012 | Pin hover tooltip: name + year (Story 2 `apparition_hover`)      | [ ]    | —                             | T007,T009               | Quick mini tooltip for fast scanning.                                                                                                        |

---

## Phase 3: Detail Panel & AI Summaries
> Objective: Let users open a pin to read a cached AI summary, view an image/source, and regenerate live via Claude.

| ID   | Task                                                              | Status | Blocks  | Blocked By  | Notes                                                                                                                                                  |
|------|------------------------------------------------------------------|--------|---------|-------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| T013 | Build pre-generated AI summary cache pipeline (Story 4 `ai_summary_cache`) | [ ] | T014 | T005,T008 | Summaries pre-generated once via Claude API, stored in local dataset for instant display. Requires ANTHROPIC_API_KEY via env (security.md gate).        |
| T014 | Apparition detail panel: summary, image, source link, badge (Story 3 `apparition_panel`) | [ ] | T015 | T009,T013 | Slide-in panel; title+location+year; "Nihil Obstat / Approved" badge; "View source" link; close button.                                                |
| T015 | "Regenerate with AI" live Claude call (Story 5 `ai_regenerate`)  | [ ]    | —       | T007,T014   | Live call to latest Claude model (e.g. claude-sonnet-4-6). Requires ANTHROPIC_API_KEY; never hardcode (security.md Pri-1).                              |

---

## Phase 4: Discovery — Search, Filters, Timeline
> Objective: Help users find specific apparitions and explore them across geography and history.

| ID   | Task                                                              | Status | Blocks | Blocked By | Notes                                                                                                  |
|------|------------------------------------------------------------------|--------|--------|------------|--------------------------------------------------------------------------------------------------------|
| T016 | Searchable sidebar that flies map to location (Story 7 `search_sidebar`) | [ ] | — | T009 | Collapsible left sidebar; list name/country/year; click flies map to pin.                              |
| T017 | Century + country filters with reset (Story 8 `filters`)        | [ ]    | T018   | T009       | Top-bar filter controls; narrow visible pins by century and country.                                   |
| T018 | Chronological timeline slider (Story 9 `timeline`)              | [ ]    | —      | T017       | Bottom slider reveals pins chronologically across history.                                             |

---

## Phase 5: Quality, Testing & Polish
> Objective: Lock in correctness, security hygiene, and the reverent/vibrant final feel before V1.

| ID   | Task                                                              | Status | Blocks | Blocked By                          | Notes                                                                                                              |
|------|------------------------------------------------------------------|--------|--------|-------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| T019 | Fill tests.md + set up test framework                            | [ ]    | T020   | T003                                | tests.md is an unfilled stub. Define philosophy, tools, run command per chosen stack (sbom.md).                    |
| T020 | Write tests for critical journeys (map load, pin click, search, regenerate) | [ ] | — | T009,T014,T015,T016,T018,T019 | Cover core user journeys from prd stories.                                                                        |
| T021 | Security & supply-chain audit pass                              | [ ]    | T022   | T004,T005,T015                      | Pri-1 gate. Run npm audit / equivalent; verify no secrets committed; confirm only Nihil-Obstat data shown.        |
| T022 | Final UX polish: starfield ambiance, animations, accessibility   | [ ]    | —      | T007,T012,T015,T016,T018            | Elegant, not cluttered; smooth gentle animations; luminous gold markers (prd §3).                                 |

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
| Done         | 2     |
| In Progress  | 0     |
| Remaining    | 20    |
| Blocked      | 17    |
