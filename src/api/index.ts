// Data layer: typed functions the UI calls. No component knows URLs or token handling.
import { api, clearTokens, setAccess, storeRefresh, refresh } from './client'
import { SyncData, useStore } from '../store'
import { Settings, User, hasHint, useSession } from '../state/session'

export { ApiError } from './client'
export type { User, Settings } from '../state/session'

interface AuthResult { accessToken: string; refreshToken?: string; user: User }
async function finish(d: AuthResult) {
  setAccess(d.accessToken); storeRefresh(d.refreshToken); useSession.getState().setUser(d.user)
  await mergeAfterLogin().catch(() => {})
}
export const auth = {
  login: async (email: string, password: string) => finish(await api.post('/auth/login', { email, password })),
  register: async (name: string, email: string, password: string) => finish(await api.post('/auth/register', { name, email, password })),
  google: async (credential: string) => finish(await api.post('/auth/google', { credential })),
  logout: async () => { try { await api.post('/auth/logout', { refreshToken: localStorage.getItem('shafare-rt') }) } catch { /* already gone */ } clearTokens(); useSession.getState().clear() },
  logoutAll: async () => { await api.post('/auth/logout-all'); clearTokens(); useSession.getState().clear() },
  forgot: (email: string) => api.post('/auth/forgot', { email }),
  reset: (token: string, password: string) => api.post('/auth/reset', { token, password }),
  verify: (token: string) => api.post('/auth/verify', { token }),
  resend: () => api.post('/auth/resend'),
  changePassword: async (current: string, next: string) => { const d = await api.post<AuthResult>('/auth/change-password', { current, next }); setAccess(d.accessToken); storeRefresh(d.refreshToken); useSession.getState().setUser(d.user) },
  restore: async () => { if (hasHint()) { const ok = await refresh(); if (!ok) useSession.getState().settled() } else useSession.getState().settled() }
}
export interface Sess { id: string; ua: string; ip: string; created: number; used: number; current: boolean }
export interface Note { id: string; at: number; title: string; body: string; kind: string; read: boolean }
export const me = {
  get: () => api.get<{ user: User; unread: number }>('/me'),
  update: async (name: string) => useSession.getState().setUser((await api.patch<{ user: User }>('/me', { name })).user),
  avatar: async (dataUrl: string | null) => useSession.getState().setUser((dataUrl ? await api.put<{ user: User }>('/me/avatar', { dataUrl }) : await api.del<{ user: User }>('/me/avatar')).user),
  settings: async (s: Partial<Settings>) => useSession.getState().setUser((await api.patch<{ user: User }>('/me/settings', s)).user),
  sessions: () => api.get<{ items: Sess[] }>('/sessions'),
  revoke: (id: string) => api.del('/sessions/' + id),
  activity: () => api.get<{ items: { id: string; at: number; type: string; ip: string; ua: string }[] }>('/activity'),
  notifications: () => api.get<{ items: Note[]; unread: number }>('/notifications'),
  markRead: (ids?: string[]) => api.post('/notifications/read', ids ? { ids } : { all: true }),
  deleteAccount: async (password: string) => { await api.del('/account', { password }); clearTokens(); useSession.getState().clear() },
  track: (id: string) => { if (useSession.getState().status === 'authed') api.post('/events', { type: 'tool_open', id }).catch(() => {}) }
}
export interface Content { announcements: { id: string; title: string; body: string; level: 'info' | 'success' | 'warning' }[]; featured: string[]; disabledTools: string[] }
export const publicApi = { content: () => api.get<Content>('/content'), config: () => api.get<{ googleClientId: string; registrationOpen: boolean; maintenance: boolean }>('/config') }

// ---- Sync (last-write-wins by timestamp; union-merge once at sign-in so nothing is lost) ----
const snapshot = (): SyncData => { const { favorites, history, notes, updatedAt } = useStore.getState(); return { favorites, history, notes, updatedAt } }
function merge(local: SyncData, remote: SyncData): SyncData {
  const notes = new Map(remote.notes.map((n) => [n.id, n])); local.notes.forEach((n) => { const o = notes.get(n.id); if (!o || n.updated > o.updated) notes.set(n.id, n) })
  const hist = new Map(remote.history.map((h) => [h.id, h])); local.history.forEach((h) => { const o = hist.get(h.id); if (!o || h.at > o.at) hist.set(h.id, h) })
  return { favorites: [...new Set([...remote.favorites, ...local.favorites])], history: [...hist.values()].sort((a, b) => b.at - a.at).slice(0, 30), notes: [...notes.values()], updatedAt: Date.now() }
}
async function push() { await api.put('/sync', snapshot()); useStore.getState().markSynced() }
async function mergeAfterLogin() { useStore.getState().applyRemote(merge(snapshot(), await api.get<SyncData>('/sync'))); await push() }
export async function syncNow() {
  if (useSession.getState().status !== 'authed') return
  const s = useStore.getState(), remote = await api.get<SyncData>('/sync')
  if (remote.updatedAt > s.updatedAt) { s.applyRemote(remote); s.markSynced() } else if (remote.updatedAt < s.updatedAt) await push(); else s.markSynced()
}
