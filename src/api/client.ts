// HTTP layer: one place that talks to the server. Attaches the in-memory access token, refreshes it once
// on expiry (single-flight), and turns every failure into a readable ApiError.
import { API_BASE, isNative } from '../config'
import { useSession } from '../state/session'

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) { super(message) }
}
let access = '' // memory only
const RT = 'shafare-rt' // native app only (no cookies cross-origin); the browser build never stores a refresh token in JS
export const setAccess = (t: string) => { access = t }
export const storeRefresh = (t?: string) => { if (t) localStorage.setItem(RT, t) }
export const clearTokens = () => { access = ''; localStorage.removeItem(RT) }

const headers = (): Record<string, string> => ({
  'Content-Type': 'application/json', 'X-Requested-With': 'shafare', ...(isNative() ? { 'X-Client': 'native' } : {}), ...(access ? { Authorization: `Bearer ${access}` } : {})
})

let inflight: Promise<boolean> | null = null
export function refresh(): Promise<boolean> {
  inflight ??= (async () => {
    try {
      const r = await fetch(API_BASE + '/api/auth/refresh', { method: 'POST', headers: headers(), body: JSON.stringify(isNative() ? { refreshToken: localStorage.getItem(RT) } : {}) })
      if (!r.ok) return false
      const d = await r.json(); access = d.accessToken; storeRefresh(d.refreshToken); useSession.getState().setUser(d.user); return true
    } catch { return false } finally { setTimeout(() => { inflight = null }) }
  })()
  return inflight
}

async function request<T>(path: string, method = 'GET', body?: unknown, retried = false): Promise<T> {
  let r: Response
  try { r = await fetch(API_BASE + '/api' + path, { method, headers: headers(), body: body === undefined ? undefined : JSON.stringify(body) }) }
  catch { throw new ApiError('You appear to be offline, or the server can’t be reached.', 0, 'network') }
  const ctype = r.headers.get('content-type') || ''
  const data = ctype.includes('json') ? await r.json().catch(() => ({})) : ctype.includes('csv') ? await r.text() : {}
  if (r.status === 401 && data.code === 'unauthenticated' && !retried && path !== '/auth/refresh') {
    if (await refresh()) return request<T>(path, method, body, true)
    clearTokens(); useSession.getState().clear()
  }
  if (!r.ok) throw new ApiError(data.error || 'Something went wrong. Please try again.', r.status, data.code)
  return data as T
}
export const api = {
  get: <T = any>(p: string) => request<T>(p),
  post: <T = any>(p: string, b: unknown = {}) => request<T>(p, 'POST', b),
  put: <T = any>(p: string, b: unknown) => request<T>(p, 'PUT', b),
  patch: <T = any>(p: string, b: unknown) => request<T>(p, 'PATCH', b),
  del: <T = any>(p: string, b?: unknown) => request<T>(p, 'DELETE', b)
}
