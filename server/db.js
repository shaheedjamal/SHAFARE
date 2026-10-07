// Data layer. A JSON file with atomic writes keeps this dependency-free; swap the functions below
// for Postgres/SQLite later without touching the routes.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { DATA_DIR } from './config.js'
import { effectiveRole, permsOf } from './rbac.js'

const file = path.join(DATA_DIR, 'db.json')
const raw = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
export const db = Object.assign({
  users: {}, events: [], broadcasts: [],
  content: { announcements: [], featured: [], disabledTools: [] },
  settings: { registrationOpen: true, maintenanceMode: false },
  stats: { days: {}, tools: {} }
}, raw)

const defaults = () => ({
  role: 'user', disabled: false, name: '', avatar: '', failed: 0, lockUntil: 0, lastLogin: 0, sessions: [], notifications: [], readIds: [],
  settings: { privacy: { analytics: true, personalization: true }, notifications: { email: true, product: true, security: true } }
})
export function normalize(u) {
  const d = defaults()
  for (const k in d) if (u[k] === undefined) u[k] = d[k]
  u.settings.privacy = { ...d.settings.privacy, ...u.settings.privacy }
  u.settings.notifications = { ...d.settings.notifications, ...u.settings.notifications }
  u.created ??= Date.now()
  return u
}
Object.values(db.users).forEach(normalize)
const byId = new Map(Object.values(db.users).map((u) => [u.id, u]))

export const userByEmail = (e) => (typeof e === 'string' ? db.users[e.toLowerCase()] : undefined)
export const userById = (id) => byId.get(id)
export const allUsers = () => Object.values(db.users)
export function createUser(email, extra = {}) {
  const u = normalize({ id: crypto.randomUUID(), email, hash: null, googleId: null, verified: false, tv: 0, created: Date.now(), data: { updatedAt: 0, favorites: [], history: [], notes: [] }, ...extra })
  db.users[email] = u; byId.set(u.id, u); bump('signups'); return u
}
export function removeUser(u) { delete db.users[u.email]; byId.delete(u.id) }

export const publicUser = (u) => ({
  id: u.id, email: u.email, name: u.name, avatar: u.avatar, role: effectiveRole(u), perms: permsOf(u), perms: permsOf(u), verified: !!u.verified,
  hasPassword: !!u.hash, google: !!u.googleId, settings: u.settings, created: u.created
})

export function pushNote(u, title, body, kind = 'system') {
  u.notifications.unshift({ id: crypto.randomUUID(), at: Date.now(), title, body, kind }); u.notifications.length = Math.min(u.notifications.length, 50)
}

const day = () => new Date().toISOString().slice(0, 10)
export function bump(key, n = 1) {
  const d = (db.stats.days[day()] ??= { signups: 0, logins: 0, opens: 0 }); d[key] = (d[key] ?? 0) + n
  const keep = Object.keys(db.stats.days).sort().slice(-120); for (const k of Object.keys(db.stats.days)) if (!keep.includes(k)) delete db.stats.days[k]
}

let chain = Promise.resolve(), timer = null
export const persist = () => {
  clearTimeout(timer); timer = null
  chain = chain.then(async () => { const tmp = file + '.tmp'; await fs.promises.writeFile(tmp, JSON.stringify(db), { mode: 0o600 }); await fs.promises.rename(tmp, file) })
    .catch((e) => console.error('db write failed:', e.message))
  return chain
}
export const persistSoon = () => { if (!timer) timer = setTimeout(persist, 800) }
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, async () => { await persist(); process.exit(0) })
