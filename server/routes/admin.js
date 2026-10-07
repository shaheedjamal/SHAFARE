import { Router } from 'express'
import crypto from 'node:crypto'
import { db, persist, allUsers, userById, removeUser, pushNote } from '../db.js'
import { guard } from '../middleware.js'
import { ALL_PERMS, RANK, ROLES, can, effectiveRole } from '../rbac.js'
import { audit, bool, cleanStr } from '../security.js'

const r = Router()
const rank = (u) => RANK[effectiveRole(u)]
const num = (v, d, lo, hi) => Math.min(hi, Math.max(lo, parseInt(v) || d))
const day = (t) => new Date(t).toISOString().slice(0, 10)
const adminUser = (u) => ({ id: u.id, email: u.email, name: u.name, role: effectiveRole(u), verified: !!u.verified, disabled: !!u.disabled, google: !!u.googleId, created: u.created, lastLogin: u.lastLogin, sessions: u.sessions.length, locked: u.lockUntil > Date.now() })

// ---- Overview and analytics ----
r.get('/overview', guard('analytics.read'), (req, res) => {
  const now = Date.now(), days = [...Array(14)].map((_, i) => day(now - (13 - i) * 864e5))
  const series = days.map((d) => ({ day: d, signups: 0, logins: 0, opens: 0, ...db.stats.days[d] }))
  const users = allUsers(), week = now - 7 * 864e5, dayAgo = now - 864e5
  const ev24 = db.events.filter((e) => e.at > dayAgo)
  res.json({
    totals: { users: users.length, verified: users.filter((u) => u.verified).length, disabled: users.filter((u) => u.disabled).length, staff: users.filter((u) => effectiveRole(u) !== 'user').length, newThisWeek: users.filter((u) => u.created > week).length, activeThisWeek: users.filter((u) => u.lastLogin > week).length },
    series, topTools: Object.entries(db.stats.tools).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, n]) => ({ id, n })),
    security24h: { failedLogins: ev24.filter((e) => e.type === 'login_failed').length, lockouts: ev24.filter((e) => e.type === 'account_locked').length, critical: ev24.filter((e) => e.level === 'critical').length, blocked: ev24.filter((e) => e.type === 'rate_limited' || e.type === 'csrf_blocked').length },
    recentEvents: db.events.slice(-8).reverse()
  })
})

// ---- Users ----
r.get('/users', guard('users.read'), (req, res) => {
  const q = cleanStr(req.query.q, 80).toLowerCase(), role = String(req.query.role || ''), status = String(req.query.status || ''), page = num(req.query.page, 1, 1, 10000), size = 15
  const sort = ['created', 'lastLogin', 'email'].includes(req.query.sort) ? req.query.sort : 'created'
  let items = allUsers().filter((u) => (!q || u.email.includes(q) || u.name.toLowerCase().includes(q)) && (!role || effectiveRole(u) === role)
    && (!status || (status === 'disabled' ? u.disabled : status === 'unverified' ? !u.verified : !u.disabled)))
  items.sort((a, b) => (sort === 'email' ? a.email.localeCompare(b.email) : b[sort] - a[sort]))
  res.json({ total: items.length, page, size, items: items.slice((page - 1) * size, page * size).map(adminUser) })
})
function target(req, res, perm) {
  const t = userById(req.params.id)
  if (!t) { res.status(404).json({ error: 'User not found.' }); return null }
  if (t.id === req.user.id) { res.status(400).json({ error: 'You can’t change your own account here.' }); return null }
  if (rank(t) >= rank(req.user)) { audit('forbidden', { req, user: req.user, level: 'warn', detail: `${perm} on higher/equal role ${t.email}` }); res.status(403).json({ error: 'You can only manage accounts below your own role.' }); return null }
  return t
}
r.patch('/users/:id', guard('users.write'), async (req, res) => {
  const t = target(req, res, 'users.write'); if (!t) return
  const { role } = req.body || {}
  if (role !== undefined) {
    if (!(role in ROLES) || role === 'superadmin') return res.status(400).json({ error: 'Invalid role.' })
    if (!can(req.user, 'roles.assign')) return res.status(403).json({ error: 'Only a superadmin can change roles.' })
    audit('role_changed', { req, user: req.user, level: 'warn', detail: `${t.email}: ${t.role} → ${role}` }); t.role = role; t.tv++
  }
  if (req.body?.disabled !== undefined) {
    t.disabled = bool(req.body.disabled, t.disabled); if (t.disabled) { t.sessions = []; t.tv++ }
    audit(t.disabled ? 'user_disabled' : 'user_enabled', { req, user: req.user, level: 'warn', detail: t.email })
  }
  await persist(); res.json({ user: adminUser(t) })
})
r.post('/users/:id/revoke-sessions', guard('users.write'), async (req, res) => {
  const t = target(req, res, 'users.write'); if (!t) return
  t.sessions = []; t.tv++; audit('sessions_revoked_by_admin', { req, user: req.user, level: 'warn', detail: t.email }); await persist(); res.json({ ok: true })
})
r.delete('/users/:id', guard('users.delete'), async (req, res) => {
  const t = target(req, res, 'users.delete'); if (!t) return
  audit('user_deleted_by_admin', { req, user: req.user, level: 'critical', detail: t.email }); removeUser(t); await persist(); res.json({ ok: true })
})

// ---- Security logs ----
r.get('/events', guard('logs.read'), (req, res) => {
  const q = cleanStr(req.query.q, 80).toLowerCase(), level = String(req.query.level || ''), page = num(req.query.page, 1, 1, 10000), size = 25
  const items = db.events.filter((e) => (!level || e.level === level) && (!q || `${e.type} ${e.email ?? ''} ${e.ip ?? ''} ${e.detail}`.toLowerCase().includes(q))).reverse()
  res.json({ total: items.length, page, size, items: items.slice((page - 1) * size, page * size) })
})

// ---- Content / data management ----
r.get('/content', guard('content.write'), (req, res) => res.json(db.content))
r.put('/content', guard('content.write'), async (req, res) => {
  const b = req.body || {}, id = /^[a-z0-9-]{1,40}$/
  const ann = (Array.isArray(b.announcements) ? b.announcements : []).slice(0, 10).map((a) => ({ id: id.test(a?.id) ? a.id : crypto.randomUUID().slice(0, 8), title: cleanStr(a?.title, 80), body: cleanStr(a?.body, 300), level: ['info', 'success', 'warning'].includes(a?.level) ? a.level : 'info', active: !!a?.active })).filter((a) => a.title)
  const ids = (v, n) => (Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string' && id.test(x)))].slice(0, n) : [])
  db.content = { announcements: ann, featured: ids(b.featured, 12), disabledTools: ids(b.disabledTools, 200) }
  audit('content_updated', { req, user: req.user }); await persist(); res.json(db.content)
})

// ---- Notifications (broadcast) ----
r.get('/notifications', guard('notifications.send'), (req, res) => res.json({ items: [...db.broadcasts].reverse() }))
r.post('/notifications', guard('notifications.send'), async (req, res) => {
  const title = cleanStr(req.body?.title, 80), body = cleanStr(req.body?.body, 300), audience = req.body?.audience === 'staff' ? 'staff' : 'all'
  if (!title || !body) return res.status(400).json({ error: 'Add a title and a message.' })
  db.broadcasts.push({ id: crypto.randomUUID(), at: Date.now(), title, body, audience, by: req.user.email }); if (db.broadcasts.length > 200) db.broadcasts.shift()
  audit('broadcast_sent', { req, user: req.user, detail: `${audience}: ${title}` }); await persist(); res.status(201).json({ ok: true })
})

// ---- Settings and roles ----
r.get('/settings', guard('settings.read'), (req, res) => res.json({ settings: db.settings, limits: { accessToken: '15 minutes', refreshToken: '30 days, rotating', lockout: '5 failed sign-ins', passwordMinLength: 10 } }))
r.put('/settings', guard('settings.write'), async (req, res) => {
  db.settings = { registrationOpen: bool(req.body?.registrationOpen, db.settings.registrationOpen), maintenanceMode: bool(req.body?.maintenanceMode, db.settings.maintenanceMode) }
  audit('settings_changed', { req, user: req.user, level: 'warn', detail: JSON.stringify(db.settings) }); await persist(); res.json({ settings: db.settings })
})
r.get('/roles', guard('settings.read'), (req, res) => res.json({ permissions: ALL_PERMS, roles: Object.fromEntries(Object.entries(ROLES).map(([k, v]) => [k, v.includes('*') ? ALL_PERMS : v])) }))

// ---- Reports (CSV). Cells that could be read as spreadsheet formulas are neutralised. ----
const cell = (v) => { let s = v == null ? '' : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
const csv = (rows, cols) => [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n')
r.get('/reports/:name.csv', guard('reports.read'), (req, res) => {
  const n = req.params.name; let body
  if (n === 'users') body = csv(allUsers().map((u) => ({ ...adminUser(u), created: new Date(u.created).toISOString(), lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString() : '' })), ['email', 'name', 'role', 'verified', 'disabled', 'google', 'created', 'lastLogin'])
  else if (n === 'tools') body = csv(Object.entries(db.stats.tools).sort((a, b) => b[1] - a[1]).map(([tool, opens]) => ({ tool, opens })), ['tool', 'opens'])
  else if (n === 'daily') body = csv(Object.entries(db.stats.days).sort().map(([date, d]) => ({ date, ...d })), ['date', 'signups', 'logins', 'opens'])
  else if (n === 'security' && can(req.user, 'logs.read')) body = csv(db.events.slice(-2000).map((e) => ({ ...e, at: new Date(e.at).toISOString() })), ['at', 'type', 'level', 'email', 'ip', 'detail'])
  else return res.status(404).json({ error: 'Unknown report.' })
  audit('report_exported', { req, user: req.user, detail: n }); res.type('text/csv').send(body)
})
void pushNote
export default r
