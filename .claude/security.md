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

---

## 7. Audit Results (2026-06-05)

### 7.1 `npm audit` Output

Total vulnerabilities found: **2 moderate, 0 high, 0 critical**.

| Package | Severity | Affected Range | Advisory |
|---------|----------|---------------|---------|
| `esbuild` | Moderate | `<=0.24.2` | [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) — esbuild dev server allows cross-origin requests |
| `vite` | Moderate | `<=6.4.1` | [GHSA-4w7w-66w2-5vf9](https://github.com/advisories/GHSA-4w7w-66w2-5vf9) — Vite path traversal in optimized deps `.map` handling; also depends on vulnerable esbuild |

**Fix available:** `npm audit fix --force` would upgrade Vite to v8 (breaking change). Not applied at this time — see acceptance rationale below.

**Acceptance rationale (local-only app):**

Both vulnerabilities affect the **Vite development server only** (not the production build). The attack vectors require:
- A malicious website open in the same browser while the dev server is running, OR
- Network-adjacent access to the local dev server port (default: `localhost:5173`).

Since this app is never deployed publicly and is only run locally by the machine owner, the risk surface is effectively zero in normal operation. These findings are **accepted as-is** for the current version. They should be re-evaluated if Vite is upgraded or the app is ever deployed.

### 7.2 `.env` / Secrets Audit

| Check | Result |
|-------|--------|
| `.env` committed to git? | **No** — confirmed via `git ls-files \| grep .env`. Only `.env.example` (no secrets) is tracked. |
| `.gitignore` covers `.env*`? | **Yes** — `.env`, `.env.local`, `.env.*.local` are all listed in `.gitignore`. |
| `VITE_ANTHROPIC_API_KEY` accessed only via `import.meta.env`? | **Yes** — grep of `src/` confirms all references use `import.meta.env.VITE_ANTHROPIC_API_KEY`. No other access pattern found. |
| Hardcoded API keys in source files? | **No** — grep of `src/` and `scripts/` found no literal `sk-ant-...` keys. `scripts/generate-summaries.ts` shows `sk-ant-...` only in a comment/usage example string (not a real key). |

### 7.3 Data Integrity Check

- All 14 apparitions in `src/data/apparitions.ts` are Church-approved (Nihil Obstat) and sourced from `miraclehunter.com`.
- No runtime scraping occurs. The dataset is static and bundled with the app.
- Zod validation (`src/data/validate.ts`) confirms all 14 entries pass the `Apparition` schema.

### 7.4 Overall Assessment

**Status: PASS (with accepted findings)**

The app meets its security requirements for a local-only tool. No action required before continuing development. The two moderate-severity `npm audit` findings are documented and accepted per the rationale in §7.1.
