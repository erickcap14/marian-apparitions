/**
 * server/index.ts
 *
 * HTTPS server for LAN sharing. Serves the built SPA (dist/) and the AI proxy endpoints,
 * all behind a single-shared-password login. The Anthropic API key lives only on this
 * server and is never sent to the browser.
 *
 * Run:  npm run server   (expects `npm run build` to have produced dist/)
 * Dev:  npm run server:dev  alongside `npm run dev` (Vite proxies /api here)
 */
import https from 'node:https'
import { createServer } from 'node:http'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { networkInterfaces } from 'node:os'
import express from 'express'
import session from 'express-session'
import helmet from 'helmet'
import { loadOrCreateCert } from './cert.js'
import { apiRouter } from './routes.js'
import {
  requireAuth,
  handleLogin,
  handleLogout,
  loginRateLimiter,
} from './auth.js'

// ── Boot-time env validation (fail closed) ──────────────────────────────────
const required = ['ANTHROPIC_API_KEY', 'APP_PASSWORD', 'SESSION_SECRET'] as const
const missing = required.filter((k) => !process.env[k])
if (missing.length > 0) {
  console.error(
    `Error: missing required env var(s): ${missing.join(', ')}\n` +
      'Copy .env.example to .env and fill them in, then run again.',
  )
  process.exit(1)
}

const here = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(here, '../dist')
const PORT = Number(process.env.PORT ?? 8443)
const isProd = process.env.NODE_ENV !== 'development'

if (!existsSync(distDir)) {
  console.error('Error: dist/ not found. Run `npm run build` first.')
  process.exit(1)
}

const app = express()
app.set('trust proxy', 1)

// Security headers. CSP is disabled here on purpose: the app loads MapLibre tiles from
// Esri (server.arcgisonline.com) and fonts from Google, and a strict default CSP would
// silently break the map. Tightening CSP is a tracked follow-up.
app.use(helmet({ contentSecurityPolicy: false }))
app.use(express.json({ limit: '1mb' }))

app.use(
  session({
    name: 'marian.sid',
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd, // HTTPS-only in prod; off in dev so the http Vite proxy works
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  }),
)

// ── Public routes (no auth) ─────────────────────────────────────────────────
app.get('/login', (_req, res) => {
  res.sendFile(resolve(here, 'login.html'))
})
app.post('/api/login', loginRateLimiter, handleLogin)
app.post('/api/logout', handleLogout)

// ── Everything below requires authentication ────────────────────────────────
app.use(requireAuth)

app.use('/api', apiRouter)

// Serve the built SPA, then fall back to index.html for client-side routing.
// (Express 5 dropped the bare '*' route pattern, so use a final catch-all middleware.)
app.use(express.static(distDir))
app.use((_req, res) => {
  res.sendFile(resolve(distDir, 'index.html'))
})

// ── Start HTTPS server bound to all interfaces (LAN-accessible) ──────────────
const { key, cert } = await loadOrCreateCert()
https.createServer({ key, cert }, app).listen(PORT, '0.0.0.0', () => {
  const lanIp = getLanIp()
  console.log('\n  Marian Apparitions — secure LAN server running')
  console.log(`  Local:   https://localhost:${PORT}`)
  if (lanIp) console.log(`  Network: https://${lanIp}:${PORT}   (share this on your LAN)`)
  console.log('\n  Visitors must enter the shared password. (Self-signed cert: click past the')
  console.log('  one-time browser warning.)\n')
})

// Optional: redirect plain HTTP on PORT+1 → HTTPS, so a forgotten http:// still lands right.
const httpRedirectPort = PORT + 1
createServer((req, res) => {
  const host = (req.headers.host ?? `localhost:${httpRedirectPort}`).replace(
    `:${httpRedirectPort}`,
    `:${PORT}`,
  )
  res.writeHead(301, { Location: `https://${host}${req.url ?? '/'}` })
  res.end()
}).listen(httpRedirectPort, '0.0.0.0')

function getLanIp(): string | null {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal) return net.address
    }
  }
  return null
}
