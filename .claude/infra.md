# Infrastructure Blueprint

Purpose: This file describes the project's technical foundation, including the method of hosting, the programming languages, the coding standards, and how to run the code.

---

## What We're Building

- **Programming Language:** TypeScript
- **Main Framework/Tool:** Vite + React
- **A Quick Summary:** A locally-hosted, interactive Mercator world map for exploring Church-approved Marian apparitions, with AI-generated summaries via Claude.

---

## How to Run it on Your Computer

- **Installation Command:** `npm install`
- **Startup Command:** `npm run dev`
- **Local Address:** `http://localhost:5173`

---

## Project Architecture & Conventions

- **Framework:** Vite + React + TypeScript
- **Directory Structure:**
  - **Static Assets:** `/public` — images, dataset JSON, map style assets
  - **UI Components:** `/src/components` — reusable React components
  - **Map Logic:** `/src/map` — MapLibre GL JS setup, layer configs, satellite toggle
  - **Data:** `/src/data` — apparition dataset (`apparitions.ts`) and TypeScript types
  - **API:** `/src/api` — Claude API calls (summary cache generation, live regenerate)
  - **Styling:** `/src/index.css` — global styles; component styles co-located via CSS Modules or Tailwind classes
  - **Hooks:** `/src/hooks` — custom React hooks (e.g., `useMap`, `useApparitionFilter`)

- **Map Library:** MapLibre GL JS — used for the Mercator vector map, custom glowing gold pin layers, satellite tile toggle, and smooth pan/zoom animations.

- **Satellite Imagery:** Esri World Imagery (free, no billing) as the default satellite provider. Swappable via `config.satelliteProvider = 'esri' | 'mapbox' | 'google'` in `/src/config.ts`.

- **AI Summaries:** Pre-generated summaries stored in the dataset. Live regeneration calls `@anthropic-ai/sdk` with `ANTHROPIC_API_KEY` loaded from `.env`.

---

## Code Generation Style Guide

- **Variable Naming:** `camelCase` for variables and functions.
- **File Naming:** `PascalCase` for components (`MapPin.tsx`), `camelCase` for utilities (`formatYear.ts`).
- **Comments:** Only where the *why* is non-obvious (hidden constraint, workaround, subtle invariant). No narration of what the code does.
- **Linting:** Run `npm run lint` before committing.
- **Constants:** `UPPER_SNAKE_CASE` in `/src/constants.ts`.
- **Types:** Define shared types in `/src/data/types.ts`. Use `interface` for data shapes, `type` for unions.

---

## Where it Lives on the Internet & Who its Friends Are

- **Hosting Provider:** Local only — runs on the user's machine. No public deployment in V1.
- **External Services:**
  - **Anthropic Claude API** — for AI summary generation (`ANTHROPIC_API_KEY` via `.env`)
  - **Esri World Imagery** — free satellite tile layer (no auth required)

---

## Where Your Data is Stored

- **Data Storage Method:** Local JSON/TypeScript dataset bundled with the app at `/src/data/apparitions.ts`. No database, no server.
- **Important Notes:** Pre-generated AI summaries are stored inline in the dataset (the `summary` field). No runtime database writes.
- **Schema:**
  ```ts
  interface Apparition {
    id: string;          // slugified name, e.g. "our-lady-of-lourdes"
    name: string;        // display name
    location: string;    // city/shrine name
    country: string;
    lat: number;
    lng: number;
    year: number;        // year of the apparition
    status: 'approved';  // only Nihil Obstat entries
    sourceUrl: string;   // Vatican / MiracleHunter citation
    imageUrl: string;    // path to /public/images/<id>.jpg
    summary: string;     // pre-generated AI summary
  }
  ```
