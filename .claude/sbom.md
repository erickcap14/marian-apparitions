# Software Bill of Materials (SBOM)

Purpose: This file lists all approved technologies, libraries, and dependencies for the project, with pinned versions.

> The AI developer must adhere to this list. Do not introduce dependencies not listed here. To add a new dependency, update this file first and get it reviewed.

---

## 0. Technology Stack Overview

| Category            | Component                | Pinned Version | Rationale / Usage                                              |
|:--------------------|:-------------------------|:---------------|:---------------------------------------------------------------|
| **Language**        | `TypeScript`             | `5.9.3`        | Primary language for the entire app                            |
| **Runtime**         | `Node.js`                | `≥20 (dev: 26)`| Build tooling + LAN server runtime. Server uses `--env-file` (stable in modern Node). |
| **Framework**       | `React`                  | `18.3.1`       | UI component model                                             |
| **Framework**       | `react-dom`              | `18.3.1`       | React DOM renderer                                             |
| **Build Tool**      | `vite`                   | `5.4.21`       | Local dev server and production bundler                        |
| **Vite Plugin**     | `@vitejs/plugin-react`   | `4.7.0`        | React Fast Refresh and JSX transform for Vite                  |
| **Map Library**     | `maplibre-gl`            | `4.7.1`        | Interactive Mercator map, custom layers, satellite toggle       |
| **AI SDK**          | `@anthropic-ai/sdk`      | `0.27.3`       | Claude API calls — **server-side only** (`server/`, `scripts/`); never bundled into the client |
| **Backend**         | `express`                | `5.2.1`        | HTTPS server: serves built app + AI proxy behind password auth |
| **Backend**         | `express-session`        | `1.19.0`       | Server-side session for the shared-password login (in-memory)  |
| **Backend**         | `express-rate-limit`     | `8.5.2`        | Per-IP brute-force protection on the login endpoint            |
| **Backend**         | `helmet`                 | `8.2.0`        | Security headers (CSP disabled for now — see security.md §5.1) |
| **TLS**             | `selfsigned`             | `5.5.0`        | Generates the self-signed cert for LAN HTTPS on first boot     |
| **Styling**         | `tailwindcss`            | `3.4.19`       | Utility-first CSS for layout and spacing                       |
| **Styling**         | `autoprefixer`           | `10.5.0`       | PostCSS plugin required by Tailwind                            |
| **Styling**         | `postcss`                | `8.5.15`       | CSS transform pipeline                                         |
| **Validation**      | `zod`                    | `3.25.76`      | Runtime validation for dataset entries and API responses       |
| **Types**           | `@types/react`           | `18.3.31`      | TypeScript types for React                                     |
| **Types**           | `@types/react-dom`       | `18.3.7`       | TypeScript types for React DOM                                 |
| **Linting**         | `eslint`                 | `9.39.4`       | Code quality enforcement                                       |
| **Linting**         | `typescript-eslint`      | `8.60.1`       | TypeScript-aware ESLint rules                                  |
| **Dev Runtime**     | `tsx`                    | `4.22.4`       | Runs the TypeScript backend (`server/`) and scripts directly  |
| **Types**           | `@types/express`         | `5.0.6`        | TypeScript types for Express                                   |
| **Types**           | `@types/express-session` | `1.19.0`       | TypeScript types for express-session                          |

### Known Vulnerabilities
| Severity | Package | Issue | Decision |
|:---------|:--------|:------|:---------|
| Moderate | `esbuild ≤0.24.2` (via `vite`) | Dev server accepts cross-origin requests ([GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)) | Accepted: affects the Vite **dev server only**, which stays bound to localhost. The shareable LAN surface is the Node HTTPS server (no Vite). Fix requires Vite 8 (breaking). Revisit at next major version bump. |

---

## 1. Version Management & Updates

- **Update Strategy:** Manual. Major version bumps require testing before adoption.
- **Security Scanning:** Run `npm audit` before committing any dependency change. Fix `high` and `critical` findings before proceeding.
- **Rule for Adding Dependencies:** Update this file first. Only add dependencies with active maintenance and a clear rationale.

---

## 2. Documentation & Resources

- **MapLibre GL JS:** https://maplibre.org/maplibre-gl-js/docs/
- **Vite:** https://vitejs.dev/guide/
- **React:** https://react.dev
- **Anthropic SDK:** https://github.com/anthropics/anthropic-sdk-python (see also JS SDK)
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Zod:** https://zod.dev
- **TypeScript:** https://www.typescriptlang.org/docs/
- **Esri World Imagery tiles:** https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
