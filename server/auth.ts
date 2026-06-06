/**
 * server/auth.ts
 *
 * Single-shared-password authentication for LAN access.
 *
 * - Password is verified against APP_PASSWORD with a constant-time scrypt comparison
 *   (Node built-in crypto — no bcrypt dependency).
 * - Sessions are server-side (express-session, in-memory). The cookie is httpOnly +
 *   sameSite=lax; `secure` is enabled only in production (so the dev HTTP proxy works).
 * - requireAuth gates every protected route: browsers are redirected to /login, while
 *   /api/* requests get a 401 JSON.
 * - Login is rate-limited per IP to blunt brute-force against the single password.
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { Request, Response, RequestHandler } from 'express'
import rateLimit from 'express-rate-limit'

// Augment the session shape with our auth flag.
declare module 'express-session' {
  interface SessionData {
    authed?: boolean
  }
}

const APP_PASSWORD = process.env.APP_PASSWORD ?? ''

// Derive a fixed verifier for the configured password once at boot. We compare the
// candidate's scrypt hash against this with timingSafeEqual to avoid leaking length/timing.
const PASSWORD_SALT = randomBytes(16)
const PASSWORD_HASH = scryptSync(APP_PASSWORD, PASSWORD_SALT, 64)

function verifyPassword(candidate: string): boolean {
  const candidateHash = scryptSync(candidate, PASSWORD_SALT, 64)
  // Both buffers are 64 bytes, so timingSafeEqual is safe to call directly.
  return timingSafeEqual(candidateHash, PASSWORD_HASH)
}

// Per-IP rate limit on the login endpoint: 10 attempts / 15 min, then 429.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
})

export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.session?.authed) return next()
  if (req.path.startsWith('/api/')) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  res.redirect('/login')
}

export function handleLogin(req: Request, res: Response): void {
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!verifyPassword(password)) {
    // Small fixed delay to further slow brute-force, then a generic failure.
    setTimeout(() => {
      res.status(401).json({ error: 'Incorrect password' })
    }, 400)
    return
  }

  // Regenerate the session on successful login to prevent session fixation.
  req.session.regenerate((err) => {
    if (err) {
      res.status(500).json({ error: 'Could not start session' })
      return
    }
    req.session.authed = true
    req.session.save((saveErr) => {
      if (saveErr) {
        res.status(500).json({ error: 'Could not persist session' })
        return
      }
      res.json({ ok: true })
    })
  })
}

export function handleLogout(req: Request, res: Response): void {
  req.session.destroy(() => {
    res.clearCookie('marian.sid')
    res.json({ ok: true })
  })
}
