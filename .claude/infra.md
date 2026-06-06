# Infrastructure Blueprint

Purpose: This file describes the project's technical foundation, including the method of hosting, the programming languages, the coding standards, and how to run the code.

---

## What We're Building

- **Programming Language:** TypeScript
- **Main Framework/Tool:** Vite + React
- **A Quick Summary:** A locally-hosted, interactive Mercator world map for exploring Church-approved Marian apparitions, with AI-generated summaries via Claude.

---

## How to Run it on Your Computer

There are two ways to run the app:

**1. Development (just you, with hot reload):**
- **Install:** `npm install`
- **Start (two terminals):** `npm run server:dev` (HTTPS backend on 8443) and `npm run dev` (Vite UI on 5173). Vite proxies `/api` to the backend (`secure:false` accepts the self-signed cert).
- **Address:** `http://localhost:5173`

**2. Secure LAN sharing (others on your network):**
- **Start:** `npm run start:lan` (builds, then runs the HTTPS server) — or `./start.sh` (the `maryapps` alias).
- **Address:** `https://<your-LAN-IP>:8443` (printed at startup). Visitors accept the one-time self-signed-cert warning, then sign in with the shared `APP_PASSWORD`.
- **Requires** `.env` with `ANTHROPIC_API_KEY`, `APP_PASSWORD`, `SESSION_SECRET` (see `.env.example`).
- macOS may show a one-time incoming-connection firewall prompt — allow it. Other devices must use the LAN IP, not `localhost`.

---

## Project Architecture & Conventions

- **Framework:** Vite + React + TypeScript
- **Directory Structure:**
  - **Static Assets:** `/public` — images, dataset JSON, map style assets
  - **UI Components:** `/src/components` — reusable React components
  - **Map Logic:** `/src/map` — MapLibre GL JS setup, layer configs, satellite toggle
  - **Data:** `/src/data` — apparition dataset (`apparitions.ts`) and TypeScript types
  - **API (client):** `/src/api` — thin `fetch` wrappers that call the backend AI proxy (`/api/summary`, `/api/sentiments`, `/api/enrich`)
  - **Backend:** `/server` — Node/Express HTTPS server: password auth (`auth.ts`), self-signed cert (`cert.ts`), AI proxy that holds the Anthropic key (`anthropic.ts`), routes (`routes.ts`), login page (`login.html`), entry (`index.ts`)
  - **Styling:** `/src/index.css` — global styles; component styles co-located via CSS Modules or Tailwind classes
  - **Hooks:** `/src/hooks` — custom React hooks (e.g., `useMap`, `useApparitionFilter`)

- **Map Library:** MapLibre GL JS — used for the Mercator vector map, custom glowing gold pin layers, satellite tile toggle, and smooth pan/zoom animations.

- **Satellite Imagery:** Esri World Imagery (free, no billing) as the default satellite provider. Swappable via `config.satelliteProvider = 'esri' | 'mapbox' | 'google'` in `/src/config.ts`.

- **AI Summaries:** Pre-generated summaries stored in the dataset. Live regeneration and Medjugorje analytics call the **backend proxy** (`/api/*`), which invokes `@anthropic-ai/sdk` server-side with `ANTHROPIC_API_KEY` from `.env`. The key never reaches the browser.

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

- **Hosting Provider:** Self-hosted on the owner's machine. Two surfaces: a localhost-only dev server, and a password-gated HTTPS server bound to `0.0.0.0:8443` for **local-network** sharing. **Not** deployed to the public internet.
- **External Services:**
  - **Anthropic Claude API** — for AI summary generation, called **server-side** (`ANTHROPIC_API_KEY` via `.env`)
  - **Esri World Imagery** — free satellite tile layer (no auth required)
- **TLS:** Self-signed certificate auto-generated into `certs/` (gitignored) on first server boot via the `selfsigned` package.

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
