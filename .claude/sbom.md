# Software Bill of Materials (SBOM)

Purpose: This file lists all approved technologies, libraries, and dependencies for the project, with pinned versions.

> The AI developer must adhere to this list. Do not introduce dependencies not listed here. To add a new dependency, update this file first and get it reviewed.

---

## 0. Technology Stack Overview

| Category            | Component                | Version     | Rationale / Usage                                              |
|:--------------------|:-------------------------|:------------|:---------------------------------------------------------------|
| **Language**        | `TypeScript`             | `^5.4`      | Primary language for the entire app                            |
| **Runtime**         | `Node.js`                | `20.x`      | Build tooling environment (Vite runs on Node)                  |
| **Framework**       | `React`                  | `^18.3`     | UI component model                                             |
| **Framework**       | `react-dom`              | `^18.3`     | React DOM renderer                                             |
| **Build Tool**      | `vite`                   | `^5.3`      | Local dev server and production bundler                        |
| **Vite Plugin**     | `@vitejs/plugin-react`   | `^4.3`      | React Fast Refresh and JSX transform for Vite                  |
| **Map Library**     | `maplibre-gl`            | `^4.5`      | Interactive Mercator map, custom layers, satellite toggle       |
| **AI SDK**          | `@anthropic-ai/sdk`      | `^0.27`     | Claude API calls for live summary regeneration                 |
| **Styling**         | `tailwindcss`            | `^3.4`      | Utility-first CSS for layout and spacing                       |
| **Styling**         | `autoprefixer`           | `^10.4`     | PostCSS plugin required by Tailwind                            |
| **Styling**         | `postcss`                | `^8.4`      | CSS transform pipeline                                         |
| **Validation**      | `zod`                    | `^3.23`     | Runtime validation for dataset entries and API responses       |
| **Types**           | `@types/react`           | `^18.3`     | TypeScript types for React                                     |
| **Types**           | `@types/react-dom`       | `^18.3`     | TypeScript types for React DOM                                 |
| **Linting**         | `eslint`                 | `^9.x`      | Code quality enforcement                                       |
| **Linting**         | `typescript-eslint`      | `^8.x`      | TypeScript-aware ESLint rules                                  |

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
