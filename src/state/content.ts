import { create } from 'zustand'
import { Content, publicApi } from '../api'

interface S extends Content { loaded: boolean; load: () => Promise<void> }
export const useContent = create<S>()((set) => ({
  announcements: [], featured: [], disabledTools: [], loaded: false,
  load: async () => { try { set({ ...(await publicApi.content()), loaded: true }) } catch { set({ loaded: true }) } } // content is optional; the app works without it
}))
