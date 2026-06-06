---
description: Start a new Claude Code session - load context, check git status, and prepare for work
---

## Session Startup Checklist

Please perform the following startup tasks to begin this session:

### 0. Status Line Check (First Time Only)

Check if the context status line is configured by checking if `~/.claude/statusline.sh` exists.

**If the file does NOT exist**, offer to set it up:

"I noticed you don't have the context status line configured yet. This shows you real-time token usage at the bottom of your terminal, helping you stay aware of context limits before autocompact triggers.

Would you like me to set it up now? (This is a one-time setup that works across all projects.)"

- **If yes:** Follow the setup process from `/setup-statusline` (check for jq, create script, update settings.json)
- **If no:** Continue with the session startup

**If the file already exists**, skip this step silently and continue.

---

### 1. Environment Setup

This project has **two run paths** — pick based on the task:

- **Local development (hot reload):** requires **two** processes —
  1. `npm run server:dev` — HTTPS backend (auth + AI proxy) on `https://localhost:8443`
  2. `npm run dev` — Vite UI on `http://localhost:5173` (proxies `/api` to the backend)
  - ⚠️ The AI features (summary regenerate, Medjugorje analytics) call `/api/*`, so **the backend must be running** — `npm run dev` alone will leave the AI buttons broken (401s).
- **Secure LAN sharing (others on your network):** `npm run start:lan` or `./start.sh` (the `maryapps` alias) — builds, then serves the app over HTTPS on `0.0.0.0:8443` behind the shared password. This is a single process; do **not** also run Vite for this.

**Before starting:** check for orphaned dev servers from previous sessions and clean them up:
```bash
lsof -nP -iTCP -sTCP:LISTEN | grep -E ":51[0-9][0-9]|:8443"   # find strays
```
Kill any leftover `vite` processes on 5173–51xx before starting fresh — they serve stale builds and pile up across sessions.

### 2. Git Status Check
- Run `git status` to show current branch and any uncommitted changes
- Run `git log -5 --oneline` to show recent commits
- **If there are uncommitted changes:** Ask the user what to do:
  - Commit them now (with a message)
  - Stash them for later
  - Continue without committing
- If there are remote changes (behind origin), pull them with `git pull`

### 3. Load Project Context
Read and internalize the full project context:

**Core Context Files (read but don't summarize verbosely):**
- `.claude/claude.md` - Master context and conflict resolution rules
- `.claude/prd.md` - Product requirements and user stories
- `.claude/workflow.md` - Development workflow and plan execution rules
- `.claude/infra.md` - Infrastructure and coding conventions

**Status Files (summarize for user):**
- `.claude/changelog.md` - Summarize the most recent entries (what was completed recently)

**Beads Issue Tracking:**
- Run `bd list` to see all tracked issues
- Run `bd ready` to identify available work
- Note any issues with status "in_progress" that may need continuation

### 4. Environment Check
- Verify `.env` exists (gitignored). Required server-side vars (see `.env.example`):
  - `ANTHROPIC_API_KEY` — server-side only, **no** `VITE_` prefix (key must never reach the browser)
  - `APP_PASSWORD` — the shared LAN sign-in password
  - `SESSION_SECRET` — long random string for signing session cookies
  - `PORT` (optional, default 8443)
- The server fails closed at boot if any of the three required vars are missing.

### 5. Present Options
After gathering context, ask the user:

"Session ready! Here's what I found:
- **Recent work:** [Summary from changelog]
- **In progress:** [Any in-progress issues from `bd list`]
- **Ready to start:** [Available issues from `bd ready`]

What would you like to work on?
1. Continue: [in-progress issue if any]
2. Next up: [top issue from `bd ready`]
3. Something else - describe what you'd like to do"
