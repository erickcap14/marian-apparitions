# Security Blueprint

Purpose: This file establishes the security rules and best practices for the Marian Apparitions app.

---

## 0. Baseline Best Practices (Always Enforced)

- **Never Hardcode Secrets:** Never write `ANTHROPIC_API_KEY`, `APP_PASSWORD`, `SESSION_SECRET`, or any other secret directly in source code.
- **`.gitignore` is mandatory:** `.env`, `.env.local`, `*.pem`, and `certs/` must always be in `.gitignore` before the first commit.
- **Use Environment Variables:** Load all secrets from `.env` at runtime. Secrets are read **server-side only** (`process.env.*` in `server/`); they are never prefixed with `VITE_` and never reach the browser bundle. Never log them.
- **Principle of Least Privilege:** The Anthropic API key needs only inference access — do not use an org-admin key.

---

## 1. Data Sensitivity Level

**Public.** The app only displays publicly available information about Church-approved Marian apparitions sourced from the Vatican and MiracleHunter.com. No PII is collected, stored, or transmitted. No user accounts, no analytics, no telemetry.

---

## 2. Authentication & Authorization

The app can be run in two modes:

- **Local dev (`npm run dev`):** Vite dev server on `localhost:5173`, no public exposure. Used only by the owner during development.
- **Secure LAN sharing (`npm run server` / `start.sh`):** A Node HTTPS server (`server/`) serves the built app and AI proxy on `0.0.0.0:8443` so others on the **same local network** can access it.

**Authentication Method (LAN mode):** A single **shared password** (`APP_PASSWORD`). Every visitor must sign in before any app asset or `/api/*` route is served.

- Password is verified with a constant-time comparison (`crypto.scrypt` + `timingSafeEqual`) — no plaintext compare, no bcrypt dependency.
- Authenticated state is held in a server-side session (`express-session`, in-memory store). The session cookie is `httpOnly`, `sameSite=lax`, `secure` in production, with an 8-hour rolling expiry. The session is regenerated on successful login to prevent session fixation.
- Login is rate-limited per IP (`express-rate-limit`, 10 attempts / 15 min → HTTP 429) plus a fixed delay on each failed attempt, to blunt brute-force against the single password.

**Authorization Rules:** Binary — authenticated or not. There are no per-user roles. To revoke access for everyone, rotate `APP_PASSWORD` and restart the server.

**Threat model (LAN exposure):** The server binds to all interfaces, so anyone who can reach the host on port 8443 sees only the login page until they supply the password. Traffic is encrypted via HTTPS (self-signed cert) so the password cannot be sniffed on the LAN. The Anthropic API key is never sent to the browser, so a logged-in visitor cannot extract it. CSRF on the state-changing `/api` POSTs is mitigated by the `sameSite=lax` cookie (cross-site POSTs don't carry the session). Out of scope: a malicious *authenticated* user abusing the AI endpoints (cost is bounded by the owner's Anthropic limits), and attackers with host-level access.

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
  ANTHROPIC_API_KEY=sk-ant-...          # server-side only, no VITE_ prefix
  APP_PASSWORD=<strong shared passphrase>
  SESSION_SECRET=<long random string>
  # PORT=8443                            # optional, HTTPS port
  ```
- **`.gitignore` must include:**
  ```
  .env
  .env.local
  *.pem
  certs/
  ```

---

## 5. API Key Exposure (Browser Context)

**The Anthropic API key is server-side only.** All Claude calls go through the backend proxy
(`server/anthropic.ts`, exposed via `/api/summary`, `/api/sentiments`, `/api/enrich`). The browser never
receives the key: there is no `VITE_ANTHROPIC_API_KEY` and no `dangerouslyAllowBrowser` usage in `src/`.

This is enforced/verified at build time:
```
grep -r "sk-ant" dist/            # must return nothing
grep -r "VITE_ANTHROPIC" dist/    # must return nothing
grep -ri "dangerouslyAllowBrowser" dist/   # must return nothing
```
(The string `console.anthropic.com` may appear in UI copy — that is a harmless link, not the SDK or a key.)

### 5.1 Content Security Policy

`helmet` sets security headers but `contentSecurityPolicy` is intentionally **disabled** for now: the map
(MapLibre) loads Esri tiles from `server.arcgisonline.com` and fonts from Google, and a strict default CSP
silently breaks the map. Tightening CSP to an explicit allow-list of those origins is a tracked follow-up.

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

**Acceptance rationale:**

Both vulnerabilities affect the **Vite development server only** (not the production build, and not the Node
HTTPS server that serves the built `dist/` for LAN sharing). The attack vectors require network-adjacent access
to the dev server port.

The LAN-sharing path (`npm run server`) does **not** run Vite — it serves the static production build behind the
password gate, so these findings do not apply to it. The dev server (`npm run dev`) must remain bound to
`localhost` and must **not** be used as the shareable surface. Accepted as-is on that basis; re-evaluate if Vite
is upgraded.

### 7.2 `.env` / Secrets Audit

| Check | Result |
|-------|--------|
| `.env` committed to git? | **No** — confirmed via `git ls-files \| grep .env`. Only `.env.example` (no secrets) is tracked. |
| `.gitignore` covers `.env*`? | **Yes** — `.env`, `.env.local`, `.env.*.local` are all listed in `.gitignore`. |
| API key kept server-side only? | **Yes** — `ANTHROPIC_API_KEY` is read via `process.env` in `server/` and `scripts/` only. No `VITE_ANTHROPIC_API_KEY` and no `dangerouslyAllowBrowser` remain in `src/`. Bundle grep (`dist/`) confirms no `sk-ant`, no `VITE_ANTHROPIC`, no SDK. |
| Hardcoded API keys in source files? | **No** — grep of `src/`, `server/`, and `scripts/` found no literal `sk-ant-...` keys outside comments/examples. |

### 7.3 Data Integrity Check

- All 14 apparitions in `src/data/apparitions.ts` are Church-approved (Nihil Obstat) and sourced from `miraclehunter.com`.
- No runtime scraping occurs. The dataset is static and bundled with the app.
- Zod validation (`src/data/validate.ts`) confirms all 14 entries pass the `Apparition` schema.

### 7.4 Overall Assessment

**Status: PASS (with accepted findings)**

The app meets its security requirements for a local-only tool. No action required before continuing development. The two moderate-severity `npm audit` findings are documented and accepted per the rationale in §7.1.
