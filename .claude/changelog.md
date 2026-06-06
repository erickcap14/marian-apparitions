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
