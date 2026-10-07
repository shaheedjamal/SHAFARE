import jwt from 'jsonwebtoken'
import { SECRET } from './config.js'
import { db, userById } from './db.js'
import { can, effectiveRole } from './rbac.js'
import { audit } from './security.js'

// Access tokens are short-lived bearer tokens (never cookies, so they are not CSRF-able).
export function authenticate(req, res, next) {
  try {
    const p = jwt.verify((req.get('authorization') || '').replace(/^Bearer /, ''), SECRET, { algorithms: ['HS256'] })
    const u = userById(p.sub)
    if (!u || u.disabled || (u.tv || 0) !== p.tv) throw new Error('invalid')
    if (db.settings.maintenanceMode && effectiveRole(u) === 'user') return res.status(503).json({ error: 'SHAFARE is under maintenance. Please try again soon.', code: 'maintenance' })
    req.user = u; req.sid = p.sid; next()
  } catch { res.status(401).json({ error: 'Please sign in again.', code: 'unauthenticated' }) }
}
export const guard = (perm) => (req, res, next) => {
  if (can(req.user, perm)) return next()
  audit('forbidden', { req, user: req.user, level: 'warn', detail: `${req.method} ${req.originalUrl} requires ${perm}` })
  res.status(403).json({ error: 'You don’t have permission to do that.', code: 'forbidden' })
}
