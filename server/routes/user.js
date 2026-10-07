import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { db, persist, persistSoon, publicUser, removeUser, bump } from '../db.js'
import { audit, bool, cleanStr, limiter } from '../security.js'
import { isStaff } from '../rbac.js'

const r = Router()

const clean = (b) => {
  const s = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '')
  const num = (v) => (Number.isFinite(v) ? v : 0)
  return {
    updatedAt: num(b.updatedAt),
    favorites: Array.isArray(b.favorites) ? b.favorites.filter((x) => typeof x === 'string').slice(0, 200).map((x) => s(x, 64)) : [],
    history: Array.isArray(b.history) ? b.history.slice(0, 50).map((h) => ({ id: s(h?.id, 64), at: num(h?.at) })) : [],
    notes: Array.isArray(b.notes) ? b.notes.slice(0, 1000).map((n) => ({ id: s(n?.id, 64), title: s(n?.title, 300), body: s(n?.body, 100000), pinned: !!n?.pinned, updated: num(n?.updated) })).filter((n) => n.id) : []
  }
}

// ---- Profile ----
r.get('/me', (req, res) => res.json({ user: publicUser(req.user), unread: unreadCount(req.user) }))
r.patch('/me', async (req, res) => {
  const name = cleanStr(req.body?.name, 60)
  if (name.length < 1) return res.status(400).json({ error: 'Please enter your name.' })
  req.user.name = name; audit('profile_updated', { req, user: req.user }); await persist(); res.json({ user: publicUser(req.user) })
})
const MAGIC = { 'image/jpeg': [0xff, 0xd8, 0xff], 'image/png': [0x89, 0x50, 0x4e, 0x47], 'image/webp': [0x52, 0x49, 0x46, 0x46] }
r.put('/me/avatar', async (req, res) => {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '')
  if (!m) return res.status(400).json({ error: 'Please choose a JPG, PNG or WebP image.' })
  const buf = Buffer.from(m[2], 'base64')
  if (buf.length > 150 * 1024) return res.status(413).json({ error: 'That image is too large. Please choose a smaller one.' })
  if (!MAGIC[m[1]].every((b, i) => buf[i] === b)) return res.status(400).json({ error: 'That file doesn’t look like a valid image.' })
  req.user.avatar = req.body.dataUrl; audit('avatar_updated', { req, user: req.user }); await persist(); res.json({ user: publicUser(req.user) })
})
r.delete('/me/avatar', async (req, res) => { req.user.avatar = ''; await persist(); res.json({ user: publicUser(req.user) }) })
r.patch('/me/settings', async (req, res) => {
  const s = req.user.settings, p = req.body?.privacy || {}, n = req.body?.notifications || {}
  s.privacy = { analytics: bool(p.analytics, s.privacy.analytics), personalization: bool(p.personalization, s.privacy.personalization) }
  s.notifications = { email: bool(n.email, s.notifications.email), product: bool(n.product, s.notifications.product), security: bool(n.security, s.notifications.security) }
  await persist(); res.json({ user: publicUser(req.user) })
})

// ---- Sessions and activity ----
r.get('/sessions', (req, res) => res.json({ items: req.user.sessions.filter((s) => s.exp > Date.now()).map((s) => ({ id: s.id, ua: s.ua, ip: s.ip, created: s.created, used: s.used, current: s.id === req.sid })).sort((a, b) => b.used - a.used) }))
r.delete('/sessions/:id', async (req, res) => { req.user.sessions = req.user.sessions.filter((s) => s.id !== req.params.id); audit('session_revoked', { req, user: req.user }); await persist(); res.json({ ok: true }) })
const MINE = new Set(['login_success', 'login_failed', 'register', 'password_changed', 'password_reset_completed', 'profile_updated', 'avatar_updated', 'session_revoked', 'logout_all', 'email_verified'])
r.get('/activity', (req, res) => res.json({ items: db.events.filter((e) => e.userId === req.user.id && MINE.has(e.type)).slice(-50).reverse().map(({ id, at, type, ip, ua }) => ({ id, at, type, ip, ua })) }))

// ---- Notifications (personal + broadcasts) ----
const visible = (u) => db.broadcasts.filter((b) => b.audience === 'all' || (b.audience === 'staff' && isStaff(u)))
const unreadCount = (u) => u.notifications.filter((n) => !u.readIds.includes(n.id)).length + visible(u).filter((b) => !u.readIds.includes(b.id)).length
r.get('/notifications', (req, res) => {
  const u = req.user, items = [...u.notifications.map((n) => ({ ...n })), ...visible(u).map((b) => ({ id: b.id, at: b.at, title: b.title, body: b.body, kind: 'announcement' }))]
    .sort((a, b) => b.at - a.at).slice(0, 60).map((n) => ({ ...n, read: u.readIds.includes(n.id) }))
  res.json({ items, unread: items.filter((n) => !n.read).length })
})
r.post('/notifications/read', async (req, res) => {
  const u = req.user, ids = req.body?.all ? [...u.notifications.map((n) => n.id), ...visible(u).map((b) => b.id)] : (Array.isArray(req.body?.ids) ? req.body.ids.filter((x) => typeof x === 'string').slice(0, 100) : [])
  u.readIds = [...new Set([...u.readIds, ...ids])].slice(-300); persistSoon(); res.json({ ok: true })
})

// ---- Sync, usage analytics (aggregate only, opt-out), account deletion ----
r.get('/sync', (req, res) => res.json(req.user.data))
r.put('/sync', async (req, res) => {
  const incoming = clean(req.body || {})
  if (incoming.updatedAt < req.user.data.updatedAt) return res.status(409).json({ error: 'Server has newer data.', data: req.user.data })
  req.user.data = incoming; await persist(); res.json({ updatedAt: incoming.updatedAt })
})
r.post('/events', limiter({ name: 'events', max: 120, windowMs: 60e3, by: (q) => q.user.id }), (req, res) => {
  const id = req.body?.id
  if (req.user.settings.privacy.analytics && req.body?.type === 'tool_open' && typeof id === 'string' && /^[a-z0-9-]{1,40}$/.test(id)) {
    db.stats.tools[id] = (db.stats.tools[id] || 0) + 1; bump('opens'); persistSoon()
  }
  res.json({ ok: true })
})
r.delete('/account', limiter({ name: 'delete-account', max: 5, windowMs: 15 * 60e3 }), async (req, res) => {
  const u = req.user
  if (u.hash && !(typeof req.body?.password === 'string' && (await bcrypt.compare(req.body.password.slice(0, 128), u.hash)))) return res.status(401).json({ error: 'Password is incorrect.' })
  audit('account_deleted', { req, user: u, level: 'warn' }); removeUser(u); await persist(); res.clearCookie('shafare_rt', { path: '/api/auth' }); res.json({ ok: true })
})
export default r
