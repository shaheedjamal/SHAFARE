import { create } from 'zustand'
import { Note, me } from '../api'

interface S { items: Note[]; unread: number; loading: boolean; error: string; refresh: () => Promise<void>; markAll: () => Promise<void>; markOne: (id: string) => Promise<void> }
export const useNotifications = create<S>()((set, get) => ({
  items: [], unread: 0, loading: false, error: '',
  refresh: async () => { set({ loading: true }); try { const d = await me.notifications(); set({ items: d.items, unread: d.unread, error: '', loading: false }) } catch (e) { set({ error: (e as Error).message, loading: false }) } },
  markAll: async () => { set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })), unread: 0 })); await me.markRead().catch(() => {}) },
  markOne: async (id) => { set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)), unread: Math.max(0, s.unread - (s.items.find((n) => n.id === id && !n.read) ? 1 : 0)) })); await me.markRead([id]).catch(() => {}); void get }
}))
