// Security primitives: headers, CORS, rate limiting, validation, audit logging.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { cfg, DATA_DIR, PROD } from './config.js'
import { db, persistSoon } from './db.js'

const G = 'https://accounts.google.com/gsi/'
const CSP = ["default-src 'self'", `script-src 'self' ${G}client`, `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com ${G}style`, 'font-src https://fonts.gstatic.com',
  "img-src 'self' data: blob:", `connect-src 'self' ${G}`, `frame-src ${G}`, "worker-src 'self' blob:", "media-src 'self' blob:", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'"].join('; ')

export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=()')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  if (PROD) res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains')
  if (req.path.startsWith('/api')) res.setHeader('Cache-Control', 'no-store'); else res.setHeader('Content-Security-Policy', CSP)
  next()
}

export function cors(req, res, next) {
  const o = req.get('origin')
  if (o && cfg.origins.has(o)) {
    res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Access-Control-Allow-Credentials', 'true'); res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Client')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
}

// Cookie-authenticated endpoints (refresh/logout) must come from our own app: custom header + allowed Origin.
export function checkOrigin(req, res) {
  const o = req.get('origin'), self = `${req.protocol}://${req.get('host')}`
  if (req.get('x-requested-with') !== 'shafare' || (o && o !== self && !cfg.origins.has(o))) {
    audit('csrf_blocked', { req, level: 'warn', detail: `origin=${o || 'none'}` })
    res.status(403).json({ error: 'Request blocked.' }); return false
  }
  return true
}

export function limiter({ name, max, windowMs, by = (req) => req.ip }) {
  const hits = new Map()
  setInterval(() => { const n = Date.now(); for (const [k, h] of hits) if (h.reset < n) hits.delete(k) }, 60e3).unref()
  return (req, res, next) => {
    const k = by(req), now = Date.now(); let h = hits.get(k)
    if (!h || h.reset < now) { h = { n: 0, reset: now + windowMs }; hits.set(k, h) }
    h.n++
    res.setHeader('RateLimit-Limit', max); res.setHeader('RateLimit-Remaining', Math.max(0, max - h.n))
    if (h.n > max) {
      if (h.n === max + 1) audit('rate_limited', { req, level: 'warn', detail: name })
      res.setHeader('Retry-After', Math.ceil((h.reset - now) / 1000))
      return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' })
    }
    next()
  }
}

// ---- Validation ----
export const cleanStr = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) : '')
export const emailOk = (e) => typeof e === 'string' && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
const COMMON = ['password', '123456', 'qwerty', 'abc123', 'iloveyou', 'letmein', 'welcome', 'admin', 'monkey', 'dragon', 'football', 'passw0rd', 'shafare', 'shafare']
export function passwordProblem(pw, email = '') {
  if (typeof pw !== 'string' || pw.length < 10 || pw.length > 128) return 'Password must be 10–128 characters.'
  const l = pw.toLowerCase()
  if (COMMON.some((c) => l.includes(c)) && pw.length < 16) return 'That password is too easy to guess.'
  const local = email.split('@')[0].toLowerCase()
  if (local.length >= 4 && l.includes(local)) return 'Password must not contain your email name.'
  return ''
}
export const bool = (v, fallback) => (typeof v === 'boolean' ? v : fallback)

// ---- Audit log: append-only JSONL on disk + a capped ring buffer for the admin console ----
const logFile = path.join(DATA_DIR, 'security.log')
export function audit(type, { req, user, email, detail = '', level = 'info' } = {}) {
  const ev = {
    id: crypto.randomUUID(), at: Date.now(), type, level, userId: user?.id ?? null, email: user?.email ?? email ?? null,
    ip: req?.ip ?? null, ua: (req?.get?.('user-agent') ?? '').slice(0, 160), detail: String(detail).slice(0, 300)
  }
  db.events.push(ev); if (db.events.length > 5000) db.events.splice(0, db.events.length - 5000)
  fs.appendFile(logFile, JSON.stringify(ev) + '\n', { mode: 0o600 }, () => {})
  if (level !== 'info') console.warn(`[security:${level}] ${type} ${ev.email ?? ''} ${ev.ip ?? ''} ${ev.detail}`)
  persistSoon(); return ev
}
