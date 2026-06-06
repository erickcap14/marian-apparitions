# Product Requirements Document

Purpose: This file defines what we are building and for whom, focusing on the project's features, goals, and user experience.

> Use this file to outline what you're building and why. This guide helps you and your AI assistant understand the project goals, features, and user experience.

---

## 1. The Big Picture (What are we making?)

- **Project Name:** Marian-Apparitions
- **One-Sentence Summary:** A locally-hosted, interactive world map that lets you explore Church‑approved (Nihil Obstat) Marian apparitions and read AI‑generated summaries with links to trusted sources.
- **Who is this for?** Catholics, pilgrims, students of Church history, and the curious who want an engaging, visual way to discover where and when the Blessed Virgin Mary is believed to have appeared.
- **What this app will NOT do:**
  - It will NOT include apparitions that lack a Nihil Obstat / formal Church approval.
  - It will NOT be a public/internet-hosted service — it runs on the owner's machine and may be shared on the owner's **local network only**, behind a password.
  - It will NOT provide theological rulings or claim to replace official Church documents; it links out to authoritative sources.
  - It will NOT require Google Maps billing (satellite imagery uses a free provider by default).
  - It will NOT support individual user accounts, comments, or social features in V1 (LAN access uses a single shared password, not per-user logins).

---

## 2. The Features (What can it do?)

- **Story 1 — `map_globe`:** As a visitor, I want to see an interactive world map (Mercator projection) with a pin at each approved apparition location so that I can explore them geographically.
- **Story 2 — `apparition_hover`:** As a visitor, I want a quick tooltip (name + year) when I hover over a pin so that I can scan locations fast.
- **Story 3 — `apparition_panel`:** As a visitor, I want a side panel to open when I click a pin, showing an AI‑generated summary, an image, and a link to the source, so that I can learn about the apparition and verify it.
- **Story 4 — `ai_summary_cache`:** As a visitor, I want summaries to appear instantly so that the experience feels smooth (summaries are pre-generated and cached locally).
- **Story 5 — `ai_regenerate`:** As a visitor, I want a "Regenerate with AI" button so that I can get a fresh Claude‑generated take on the apparition when I choose.
- **Story 6 — `satellite_toggle`:** As a visitor, I want to switch between the stylized graphic map and real satellite imagery so that I can view the locations in either an artistic or realistic way.
- **Story 7 — `search_sidebar`:** As a visitor, I want a searchable list of all apparitions that flies the map to a location when I click an entry so that I can find a specific one quickly.
- **Story 8 — `filters`:** As a visitor, I want to filter pins by century and country so that I can narrow the map to what interests me.
- **Story 9 — `timeline`:** As a visitor, I want a timeline slider that reveals apparitions chronologically so that I can see how they unfold across history.
- **Story 10 — `data_seed`:** As the maintainer, I want a curated, source‑cited dataset of Nihil Obstat apparitions so that the map only shows Church‑approved events.

---

## 3. The Look and Feel (How should it vibe?)

- **Overall Style:** Reverent yet vibrant and modern. A "celestial" feel — a dark globe set against a starlit sky, with glowing markers and smooth, gentle animations. Elegant, not cluttered.
- **Main Colors:** Deep indigo / navy background (night sky), luminous gold accents, soft starlight white, with a Marian‑blue secondary. Markers glow gold; subtle starfield/particle ambiance.
- **Key Screens:**
  - **Screen 1: The Map (home)**
    - Full-screen interactive Mercator world map with glowing gold apparition pins.
    - Top bar: app title, search box, satellite/graphic toggle, filter controls (Century, Country, Reset).
    - Left/collapsible sidebar: searchable list of apparitions (name, country, year).
    - Bottom: timeline slider that reveals pins chronologically.
    - Hover a pin → mini tooltip (name + year).
  - **Screen 2: Apparition Detail Panel (slides in on pin click)**
    - Title (name + location + year) and approval badge ("Nihil Obstat / Approved").
    - AI‑generated summary text.
    - Representative image.
    - "View source" link (Vatican / MiracleHunter / shrine).
    - "Regenerate with AI" button.
    - Close button.

---

## 4. Technical Notes (non-UI build facts from discovery)

> Captured for the AI builder. Final tech choices (framework, exact libraries) are defined during bootstrap, but these constraints are fixed by product decisions.

- **Data source of truth:** Holy See / Vatican decrees + MiracleHunter.com "Approved Apparitions." Only Nihil Obstat / formally approved apparitions are included. Each dataset entry cites its `sourceUrl`. Coordinates (lat/long) are looked up per shrine.
- **Dataset shape (local seed):** `name, location, country, lat, lng, year, status, sourceUrl, imageUrl, summary` — bundled with the app (no live scraping at runtime).
- **AI summaries (hybrid):** Summaries pre-generated once via the Claude (Anthropic) API and stored in the local dataset for instant display. A "Regenerate with AI" action calls Claude live **through the backend proxy** — `ANTHROPIC_API_KEY` lives only on the server, never in the browser. Use the latest capable Claude model (e.g. `claude-opus-4-8` / `claude-sonnet-4-6`).
- **Map / projection:** Default stylized Mercator (vector). Satellite toggle uses a **free** provider (Esri World Imagery or Mapbox) — no Google billing. Provider is swappable via config: `config.satelliteProvider = 'esri' | 'mapbox' | 'google'`.
- **Hosting / sharing:** Runs on the owner's machine. Optional **secure LAN sharing**: a password-gated HTTPS server (single shared password, self-signed cert) lets others on the same local network access it. No public internet deployment in V1.
