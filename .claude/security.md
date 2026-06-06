# Security Blueprint

Purpose: This file establishes the security rules and best practices for the Marian Apparitions app.

---

## 0. Baseline Best Practices (Always Enforced)

- **Never Hardcode Secrets:** Never write `ANTHROPIC_API_KEY` or any other secret directly in source code.
- **`.gitignore` is mandatory:** `.env`, `.env.local`, and `*.pem` must always be in `.gitignore` before the first commit.
- **Use Environment Variables:** Load `ANTHROPIC_API_KEY` from `.env` at runtime via `import.meta.env.VITE_ANTHROPIC_API_KEY`. Never log it.
- **Principle of Least Privilege:** The Anthropic API key needs only inference access — do not use an org-admin key.

---

## 1. Data Sensitivity Level

**Public.** The app only displays publicly available information about Church-approved Marian apparitions sourced from the Vatican and MiracleHunter.com. No PII is collected, stored, or transmitted. No user accounts, no analytics, no telemetry.

---

## 2. Authentication & Authorization

- **Authentication Method:** None. This is a local-only application run manually by the owner. There are no users to authenticate.
- **Authorization Rules:** N/A — single-user local app.

---

## 3. Dependency & Supply Chain Security

- **How We Check Dependencies:** Run `npm audit` before every commit that changes `package.json` or `package-lock.json`. Fix `high` and `critical` severity findings before proceeding.
- **Rule for Adding New Dependencies:** Update `sbom.md` first. Only add libraries with active maintenance. Review the package on npm for download count, last publish date, and known vulnerabilities.
- **Approved dependency list:** See `sbom.md`. Do not install anything outside that list without updating `sbom.md` first.

---

## 4. Secrets Management

- **Where Secrets are Stored:** Local `.env` file in the project root. This file is git-ignored and never committed.
- **Who Has Access:** Only the machine owner.
- **Required `.env` variables:**
  ```
  VITE_ANTHROPIC_API_KEY=sk-ant-...
  ```
- **`.gitignore` must include:**
  ```
  .env
  .env.local
  *.pem
  ```

---

## 5. API Key Exposure (Browser Context)

**Important:** Vite exposes `VITE_*` env vars to the browser bundle. Because this app is local-only and never deployed publicly, this is acceptable. If the app is ever deployed publicly, the Claude API calls must be moved to a server-side proxy so the key is never sent to the browser.

---

## 6. Data Integrity

- Only Nihil Obstat / formally approved apparitions are included in the dataset. No runtime scraping. The dataset is bundled with the app and reviewed by the maintainer.
- Source URLs must point to trusted domains only: `vatican.va`, `miraclehunter.com`, or official shrine sites.
- Dataset entries are validated at build time with Zod against the `Apparition` schema defined in `infra.md`.
