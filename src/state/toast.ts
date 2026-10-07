import { create } from 'zustand'

export interface Toast { id: number; kind: 'success' | 'error' | 'info'; text: string }
export const useToasts = create<{ items: Toast[]; dismiss: (id: number) => void }>((set) => ({ items: [], dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })) }))
let n = 0
const push = (kind: Toast['kind'], text: string) => { const id = ++n; useToasts.setState((s) => ({ items: [...s.items.slice(-3), { id, kind, text }] })); setTimeout(() => useToasts.getState().dismiss(id), 4500) }
export const toast = { success: (t: string) => push('success', t), error: (t: string) => push('error', t), info: (t: string) => push('info', t) }
