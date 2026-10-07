// Who is signed in. Deliberately NOT persisted: the access token lives only in memory (api/client.ts)
// and the refresh token lives in an httpOnly cookie the browser's JavaScript can't read.
import { create } from 'zustand'

export interface Settings { privacy: { analytics: boolean; personalization: boolean }; notifications: { email: boolean; product: boolean; security: boolean } }
export interface User { id: string; email: string; name: string; avatar: string; role: string; perms: string[]; verified: boolean; hasPassword: boolean; google: boolean; settings: Settings; created: number }
const HINT = 'shafare-hint' // non-secret flag: "this browser has signed in before", so we only try to restore a session when it makes sense

interface S { user: User | null; status: 'loading' | 'anon' | 'authed'; setUser: (u: User) => void; clear: () => void; settled: () => void }
export const useSession = create<S>()((set) => ({
  user: null, status: localStorage.getItem(HINT) ? 'loading' : 'anon',
  setUser: (user) => { localStorage.setItem(HINT, '1'); set({ user, status: 'authed' }) },
  clear: () => { localStorage.removeItem(HINT); set({ user: null, status: 'anon' }) },
  settled: () => set((s) => (s.status === 'loading' ? { status: 'anon' } : s))
}))
export const hasHint = () => !!localStorage.getItem(HINT)
export const can = (u: User | null, perm: string) => !!u?.perms.includes(perm)
