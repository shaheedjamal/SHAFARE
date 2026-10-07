// Local-first app data (persisted on this device). Session/auth state lives in state/session.ts and is never persisted.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

try { if (!localStorage.getItem('shafare-store') && localStorage.getItem('shahone-store')) localStorage.setItem('shafare-store', localStorage.getItem('shahone-store')!) } catch { /* storage unavailable */ }

export type Theme = 'dark' | 'light' | 'system'
export interface Note { id: string; title: string; body: string; pinned: boolean; updated: number }
export interface HistoryItem { id: string; at: number }
export interface CalcItem { expr: string; res: string }
export interface Todo { id: string; text: string; done: boolean }
export interface SyncData { favorites: string[]; history: HistoryItem[]; notes: Note[]; updatedAt: number }

interface State extends SyncData {
  theme: Theme; lastSynced: number; calcHistory: CalcItem[]; todos: Todo[]; usage: Record<string, number>; dismissed: string[]
  setTheme: (t: Theme) => void
  toggleFav: (id: string) => void
  logUse: (id: string) => void
  clearHistory: () => void
  upsertNote: (n: Note) => void
  deleteNote: (id: string) => void
  resetAll: () => void
  applyRemote: (d: SyncData) => void
  markSynced: () => void
  addCalc: (expr: string, res: string) => void
  clearCalc: () => void
  addTodo: (text: string) => void
  toggleTodo: (id: string) => void
  removeTodo: (id: string) => void
  dismiss: (id: string) => void
}

const now = () => Date.now()
export const today = () => new Date().toISOString().slice(0, 10)
export const useStore = create<State>()(persist((set) => ({
  theme: 'dark', favorites: [], history: [], notes: [], updatedAt: 0, lastSynced: 0, calcHistory: [], todos: [], usage: {}, dismissed: [],
  setTheme: (theme) => set({ theme }),
  toggleFav: (id) => set((s) => ({ updatedAt: now(), favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id] })),
  logUse: (id) => set((s) => {
    const usage = { ...s.usage, [today()]: (s.usage[today()] ?? 0) + 1 }
    for (const k of Object.keys(usage).sort().slice(0, -45)) delete usage[k]
    return { updatedAt: now(), usage, history: [{ id, at: now() }, ...s.history.filter((h) => h.id !== id)].slice(0, 30) }
  }),
  clearHistory: () => set({ updatedAt: now(), history: [] }),
  upsertNote: (n) => set((s) => ({ updatedAt: now(), notes: s.notes.some((x) => x.id === n.id) ? s.notes.map((x) => (x.id === n.id ? n : x)) : [n, ...s.notes] })),
  deleteNote: (id) => set((s) => ({ updatedAt: now(), notes: s.notes.filter((n) => n.id !== id) })),
  resetAll: () => set({ favorites: [], history: [], notes: [], calcHistory: [], todos: [], usage: {}, theme: 'dark', updatedAt: now() }),
  applyRemote: (d) => set({ favorites: d.favorites, history: d.history, notes: d.notes, updatedAt: d.updatedAt }),
  markSynced: () => set({ lastSynced: now() }),
  addCalc: (expr, res) => set((st) => ({ calcHistory: [{ expr, res }, ...st.calcHistory.filter((c) => c.expr !== expr)].slice(0, 30) })),
  clearCalc: () => set({ calcHistory: [] }),
  addTodo: (text) => set((st) => ({ todos: [{ id: crypto.randomUUID(), text, done: false }, ...st.todos] })),
  toggleTodo: (id) => set((st) => ({ todos: st.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
  removeTodo: (id) => set((st) => ({ todos: st.todos.filter((t) => t.id !== id) })),
  dismiss: (id) => set((s) => ({ dismissed: [...s.dismissed, id].slice(-50) }))
}), { name: 'shafare-store' }))
