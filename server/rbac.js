// Role-based access control. Roles map to permissions; routes check permissions, never role names.
import { cfg } from './config.js'

export const ALL_PERMS = ['users.read', 'users.write', 'users.delete', 'roles.assign', 'content.write', 'reports.read', 'analytics.read', 'logs.read', 'notifications.send', 'settings.read', 'settings.write']
export const ROLES = {
  user: [],
  analyst: ['analytics.read', 'reports.read'],
  support: ['users.read', 'logs.read', 'analytics.read'],
  admin: ['users.read', 'users.write', 'content.write', 'reports.read', 'analytics.read', 'logs.read', 'notifications.send', 'settings.read'],
  superadmin: ['*']
}
export const RANK = { user: 0, analyst: 1, support: 2, admin: 3, superadmin: 4 }

// SUPERADMIN_EMAILS (server env) grants superadmin, but only to a verified address.
export const effectiveRole = (u) => (cfg.superAdmins.has(u.email) && u.verified ? 'superadmin' : u.role in ROLES ? u.role : 'user')
export const permsOf = (u) => { const p = ROLES[effectiveRole(u)]; return p.includes('*') ? ALL_PERMS : p }
export const can = (u, perm) => permsOf(u).includes(perm)
export const isStaff = (u) => effectiveRole(u) !== 'user'
