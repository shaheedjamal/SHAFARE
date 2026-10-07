import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { OAuth2Client } from 'google-auth-library'
import { cfg, SECRET, PROD } from '../config.js'
import { db, persist, userByEmail, userById, createUser, publicUser, pushNote, bump } from '../db.js'
import { audit, checkOrigin, cleanStr, emailOk, limiter, passwordProblem } from '../security.js'
import { authenticate } from '../middleware.js'
import { sendMail } from '../mail.js'

const r = Router()
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex')
const rand = () => crypto.randomBytes(32).toString('base64url')
const randOtp = () => crypto.randomInt(100000, 999999).toString()
const DUMMY = bcrypt.hashSync('shafare-timing-dummy', 12) // compared when the account doesn't exist, so timing doesn't reveal it
const gClient = cfg.googleId ? new OAuth2Client(cfg.googleId) : null
const isNative = (req) => req.get('x-client') === 'native'
const COOKIE = 'shafare_rt'
const cookieOpts = { httpOnly: true, secure: PROD, sameSite: 'strict', path: '/api/auth', maxAge: cfg.refreshMs }
const getCookie = (req, n) => (req.headers.cookie || '').split(';').map((s) => s.trim()).find((s) => s.startsWith(n + '='))?.slice(n.length + 1)
const signAccess = (u, sid) => jwt.sign({ sub: u.id, tv: u.tv || 0, sid }, SECRET, { algorithm: 'HS256', expiresIn: cfg.accessTtl })
const strip = (u) => ({ ...publicUser(u) })

// Sessions: a rotating, hashed refresh token per device. Reuse of an old token revokes that session.
function startSession(u, req, res) {
  const now = Date.now(), sid = crypto.randomUUID(), secret = rand(), ua = (req.get('user-agent') || '').slice(0, 160)
  const known = u.sessions.some((s) => s.ua === ua), first = !u.lastLogin
  u.sessions = u.sessions.filter((s) => s.exp > now).slice(-9)
  u.sessions.push({ id: sid, hash: sha(secret), prev: null, created: now, used: now, exp: now + cfg.refreshMs, ua, ip: req.ip })
  u.lastLogin = now; bump('logins')
  if (!known && !first && u.settings.notifications.security) pushNote(u, 'New sign-in', `Your account was signed in from a new device: ${ua.slice(0, 80) || 'unknown device'}.`, 'security')
  const token = `${u.id}.${sid}.${secret}`, out = { accessToken: signAccess(u, sid), user: strip(u) }
  if (isNative(req)) out.refreshToken = token; else res.cookie(COOKIE, token, cookieOpts)
  return out
}
const expired = (res) => { res.clearCookie(COOKIE, { path: '/api/auth' }); return res.status(401).json({ error: 'Your session has expired. Please sign in again.', code: 'unauthenticated' }) }

r.post('/register', limiter({ name: 'register', max: 8, windowMs: 15 * 60e3 }), async (req, res) => {
  if (!db.settings.registrationOpen) return res.status(403).json({ error: 'Sign-ups are currently closed.' })
  const { email, password } = req.body || {}, name = cleanStr(req.body?.name, 60)
  if (!emailOk(email)) return res.status(400).json({ error: 'Enter a valid email address.' })
  const key = email.toLowerCase(), bad = passwordProblem(password, key)
  if (bad) return res.status(400).json({ error: bad })
  if (userByEmail(key)) return res.status(409).json({ error: 'An account with this email already exists.' })
  const u = createUser(key, { name, hash: await bcrypt.hash(password, 12) })
  audit('register', { req, user: u }); await sendVerification(u)
  res.status(201).json(startSession(u, req, res)); persist()
})

r.post('/login', limiter({ name: 'login', max: 15, windowMs: 15 * 60e3 }), async (req, res) => {
  const { email, password } = req.body || {}
  const u = userByEmail(typeof email === 'string' ? email : '')
  if (u && u.lockUntil > Date.now()) {
    audit('login_locked', { req, user: u, level: 'warn' })
    return res.status(429).json({ error: `Too many failed attempts. Try again in ${Math.ceil((u.lockUntil - Date.now()) / 60e3)} minutes.` })
  }
  const ok = await bcrypt.compare(typeof password === 'string' ? password.slice(0, 128) : '', u?.hash || DUMMY) && !!u?.hash
  if (!ok) {
    if (u) { u.failed++; if (u.failed % 5 === 0) { u.lockUntil = Date.now() + Math.min(15 * 60e3 * 2 ** (u.failed / 5 - 1), 24 * 3600e3); audit('account_locked', { req, user: u, level: 'critical', detail: `${u.failed} failures` }) } }
    audit('login_failed', { req, email: u?.email ?? cleanStr(email, 120), user: u, level: 'warn' })
    if (u && !u.hash) return res.status(401).json({ error: 'This account uses Google sign-in. Continue with Google, or use “Forgot password” to add a password.' })
    return res.status(401).json({ error: 'Incorrect email or password.' })
  }
  if (u.disabled) { audit('login_disabled', { req, user: u, level: 'warn' }); return res.status(403).json({ error: 'This account has been disabled. Contact support.' }) }
  u.failed = 0; u.lockUntil = 0; audit('login_success', { req, user: u })
  res.json(startSession(u, req, res)); persist()
})

r.post('/google', limiter({ name: 'google', max: 30, windowMs: 15 * 60e3 }), async (req, res) => {
  if (!gClient) return res.status(503).json({ error: 'Google sign-in is not configured on this server.' })
  try {
    const p = (await gClient.verifyIdToken({ idToken: String(req.body?.credential || ''), audience: cfg.googleId })).getPayload()
    if (!p?.email || !p.email_verified) throw new Error('unverified')
    const key = p.email.toLowerCase(); let u = userByEmail(key)
    if (!u) { if (!db.settings.registrationOpen) return res.status(403).json({ error: 'Sign-ups are currently closed.' }); u = createUser(key, { googleId: p.sub, verified: true, name: cleanStr(p.name, 60) }); audit('register', { req, user: u, detail: 'google' }) }
    else {
      if (!u.verified && u.hash) { u.hash = null; u.tv = (u.tv || 0) + 1; u.sessions = [] } // an unverified password may have been set by someone else
      u.googleId ||= p.sub; u.verified = true
    }
    if (u.disabled) return res.status(403).json({ error: 'This account has been disabled. Contact support.' })
    audit('login_success', { req, user: u, detail: 'google' })
    res.json(startSession(u, req, res)); persist()
  } catch { audit('login_failed', { req, level: 'warn', detail: 'google token rejected' }); res.status(401).json({ error: 'Google sign-in failed.' }) }
})

r.post('/github', limiter({ name: 'github', max: 30, windowMs: 15 * 60e3 }), async (req, res) => {
  const token = req.body?.token
  if (!token) return res.status(400).json({ error: 'GitHub token is required.' })
  try {
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${token}`, Accept: 'application/json' }
    })
    if (!userRes.ok) throw new Error('github_api_error')
    const p = await userRes.json()
    if (!p.email) throw new Error('email_private')
    const key = p.email.toLowerCase(); let u = userByEmail(key)
    if (!u) { if (!db.settings.registrationOpen) return res.status(403).json({ error: 'Sign-ups are currently closed.' }); u = createUser(key, { githubId: p.id, verified: true, name: cleanStr(p.name || p.login, 60) }); audit('register', { req, user: u, detail: 'github' }) }
    else {
      if (!u.verified && u.hash) { u.hash = null; u.tv = (u.tv || 0) + 1; u.sessions = [] }
      u.githubId ||= p.id; u.verified = true
    }
    if (u.disabled) return res.status(403).json({ error: 'This account has been disabled. Contact support.' })
    audit('login_success', { req, user: u, detail: 'github' })
    res.json(startSession(u, req, res)); persist()
  } catch (e) { audit('login_failed', { req, level: 'warn', detail: `github token rejected: ${e.message}` }); res.status(401).json({ error: 'GitHub sign-in failed. Please ensure your email is public.' }) }
})

r.post('/refresh', limiter({ name: 'refresh', max: 60, windowMs: 60e3 }), (req, res) => {
  if (!checkOrigin(req, res)) return
  const [uid, sid, secret] = String((isNative(req) ? req.body?.refreshToken : getCookie(req, COOKIE)) || '').split('.')
  const u = uid && userById(uid), s = u && u.sessions.find((x) => x.id === sid)
  if (!u || !s || !secret) return expired(res)
  const h = sha(secret), now = Date.now()
  if (s.hash !== h) {
    if (s.prev === h) { u.sessions = u.sessions.filter((x) => x.id !== sid); audit('refresh_token_reuse', { req, user: u, level: 'critical', detail: 'old refresh token replayed; session revoked' }); persist() }
    return expired(res)
  }
  if (s.exp < now || u.disabled) { u.sessions = u.sessions.filter((x) => x.id !== sid); persist(); return expired(res) }
  const next = rand(); s.prev = s.hash; s.hash = sha(next); s.used = now; s.exp = now + cfg.refreshMs
  const token = `${u.id}.${sid}.${next}`, out = { accessToken: signAccess(u, sid), user: strip(u) }
  if (isNative(req)) out.refreshToken = token; else res.cookie(COOKIE, token, cookieOpts)
  persist(); res.json(out)
})

r.post('/logout', (req, res) => {
  if (!checkOrigin(req, res)) return
  const [uid, sid] = String((isNative(req) ? req.body?.refreshToken : getCookie(req, COOKIE)) || '').split('.')
  const u = uid && userById(uid); if (u) { u.sessions = u.sessions.filter((x) => x.id !== sid); audit('logout', { req, user: u }); persist() }
  res.clearCookie(COOKIE, { path: '/api/auth' }); res.json({ ok: true })
})
r.post('/logout-all', authenticate, async (req, res) => {
  req.user.sessions = []; req.user.tv++; audit('logout_all', { req, user: req.user }); await persist(); res.clearCookie(COOKIE, { path: '/api/auth' }); res.json({ ok: true })
})

// ---- Email verification and password reset (single-use, hashed, expiring tokens) ----
async function sendVerification(u) {
  const t = rand(); u.verifyHash = sha(t); u.verifyExp = Date.now() + 24 * 3600e3
  await sendMail(u.email, 'Verify your email for SHAFARE', 'Confirm your email address to finish setting up your SHAFARE account.', `${cfg.appUrl}/verify?token=${t}`, 'Verify email')
}
const byToken = (field, exp, token) => { const h = sha(token); return Object.values(db.users).find((u) => u[field] && u[field] === h && u[exp] > Date.now()) }

r.post('/verify', limiter({ name: 'verify', max: 20, windowMs: 15 * 60e3 }), async (req, res) => {
  const u = byToken('verifyHash', 'verifyExp', req.body?.token)
  if (!u) return res.status(400).json({ error: 'This verification link is invalid or has expired.' })
  u.verifyHash = null; u.verified = true; audit('email_verified', { req, user: u }); await persist(); res.json({ ok: true })
})
r.post('/resend', authenticate, limiter({ name: 'resend', max: 3, windowMs: 15 * 60e3, by: (q) => q.user?.id ?? q.ip }), async (req, res) => {
  if (!req.user.verified) { await sendVerification(req.user); await persist() } res.json({ ok: true })
})
r.post('/forgot', limiter({ name: 'forgot', max: 5, windowMs: 15 * 60e3 }), async (req, res) => {
  const u = userByEmail(typeof req.body?.email === 'string' ? req.body.email : '')
  if (u && !u.disabled) {
    const t = rand(); u.resetHash = sha(t); u.resetExp = Date.now() + 3600e3; audit('password_reset_requested', { req, user: u }); await persist()
    await sendMail(u.email, 'Reset your SHAFARE password', 'We received a request to reset your password. This link expires in 1 hour.', `${cfg.appUrl}/reset?token=${t}`, 'Reset password')
  }
  res.json({ ok: true }) // identical response whether or not the account exists
})
r.post('/reset', limiter({ name: 'reset', max: 10, windowMs: 15 * 60e3 }), async (req, res) => {
  const u = byToken('resetHash', 'resetExp', req.body?.token)
  if (!u) return res.status(400).json({ error: 'This reset link is invalid or has expired.' })
  const bad = passwordProblem(req.body?.password, u.email); if (bad) return res.status(400).json({ error: bad })
  u.hash = await bcrypt.hash(req.body.password, 12); u.resetHash = null; u.verified = true; u.failed = 0; u.lockUntil = 0; u.tv++; u.sessions = []
  pushNote(u, 'Password changed', 'Your password was reset and all devices were signed out.', 'security'); audit('password_reset_completed', { req, user: u }); await persist(); res.json({ ok: true })
})
r.post('/change-password', authenticate, limiter({ name: 'change-password', max: 10, windowMs: 15 * 60e3 }), async (req, res) => {
  const { current, next } = req.body || {}, u = req.user
  if (u.hash && !(typeof current === 'string' && (await bcrypt.compare(current.slice(0, 128), u.hash)))) { audit('password_change_failed', { req, user: u, level: 'warn' }); return res.status(401).json({ error: 'Current password is incorrect.' }) }
  const bad = passwordProblem(next, u.email); if (bad) return res.status(400).json({ error: bad })
  u.hash = await bcrypt.hash(next, 12); u.tv++; u.sessions = []
  pushNote(u, 'Password changed', 'Your password was changed and other devices were signed out.', 'security'); audit('password_changed', { req, user: u })
  const out = startSession(u, req, res); await persist(); res.json(out)
})

r.post('/send-otp', limiter({ name: 'send-otp', max: 5, windowMs: 15 * 60e3 }), async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : ''
  if (!emailOk(email)) return res.status(400).json({ error: 'Enter a valid email address.' })
  const u = userByEmail(email)
  if (!u) return res.status(404).json({ error: 'No account found with this email.' })
  const otp = randOtp()
  u.otpHash = sha(otp); u.otpExp = Date.now() + 10 * 60e3
  await sendMail(u.email, 'Your SHAFARE Verification Code', `Your verification code is: ${otp}. It will expire in 10 minutes.`, `Your code is ${otp}`, 'Verify account')
  audit('otp_sent', { req, user: u })
  await persist(); res.json({ ok: true })
})

r.post('/verify-otp', limiter({ name: 'verify-otp', max: 10, windowMs: 15 * 60e3 }), async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : ''
  const otp = typeof req.body?.otp === 'string' ? req.body.otp : ''
  const u = userByEmail(email)
  if (!u || !u.otpHash || u.otpExp < Date.now() || u.otpHash !== sha(otp)) {
    audit('otp_failed', { req, email, user: u, level: 'warn' })
    return res.status(400).json({ error: 'Invalid or expired verification code.' })
  }
  u.otpHash = null; u.otpExp = 0; u.verified = true
  audit('otp_verified', { req, user: u })
  res.json(startSession(u, req, res)); await persist()
})

export default r
