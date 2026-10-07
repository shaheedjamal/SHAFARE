// Central, server-only configuration. Nothing in this file is ever sent to the browser.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const env = process.env
export const ROOT = path.dirname(fileURLToPath(import.meta.url))
export const PROD = env.NODE_ENV === 'production'
export const DATA_DIR = env.DATA_DIR || path.join(ROOT, 'data')
fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 })

const secretFile = path.join(DATA_DIR, '.jwt-secret')
const fromEnv = env.JWT_SECRET
if (fromEnv && fromEnv.length < 32) throw new Error('JWT_SECRET must be at least 32 characters.')
export const SECRET = fromEnv || (fs.existsSync(secretFile) ? fs.readFileSync(secretFile, 'utf8')
  : (() => { const s = crypto.randomBytes(48).toString('hex'); fs.writeFileSync(secretFile, s, { mode: 0o600 }); return s })())

const list = (v) => (v || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
const appUrl = (env.APP_URL || 'http://localhost:5173').replace(/\/$/, '')
export const cfg = {
  port: +(env.PORT || 8787),
  appUrl,
  trustProxy: env.TRUST_PROXY ? (isNaN(+env.TRUST_PROXY) ? env.TRUST_PROXY : +env.TRUST_PROXY) : false,
  googleId: env.GOOGLE_CLIENT_ID || '',
  superAdmins: new Set(list(env.SUPERADMIN_EMAILS)),
  origins: new Set([new URL(appUrl).origin, 'capacitor://localhost', 'https://localhost', 'http://localhost', ...list(env.CORS_ORIGINS).map((o) => o.replace(/\/$/, ''))]),
  accessTtl: '15m',
  refreshMs: 30 * 24 * 3600e3,
  smtp: env.SMTP_HOST ? { host: env.SMTP_HOST, port: +(env.SMTP_PORT || 587), secure: env.SMTP_SECURE === 'true', auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined } : null,
  mailFrom: env.MAIL_FROM || 'SHAFARE <no-reply@localhost>'
}
