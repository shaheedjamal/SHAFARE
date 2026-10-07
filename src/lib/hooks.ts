import { DependencyList, useCallback, useEffect, useRef, useState } from 'react'

export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList = []) {
  const [state, set] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true }); const n = useRef(0)
  const run = useCallback(() => {
    const id = ++n.current; set((s) => ({ ...s, loading: true, error: undefined }))
    fn().then((data) => id === n.current && set({ data, loading: false })).catch((e: Error) => id === n.current && set((s) => ({ ...s, error: e.message, loading: false })))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(run, [run])
  return { ...state, reload: run }
}
export function useOnline() {
  const [on, set] = useState(navigator.onLine)
  useEffect(() => { const a = () => set(true), b = () => set(false); addEventListener('online', a); addEventListener('offline', b); return () => { removeEventListener('online', a); removeEventListener('offline', b) } }, [])
  return on
}
export const ago = (t: number) => { const s = Math.max(1, Math.round((Date.now() - t) / 1000)); return s < 60 ? 'just now' : s < 3600 ? `${Math.floor(s / 60)}m ago` : s < 86400 ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 86400)}d ago` }
export const useDebounced = <T,>(v: T, ms = 300) => { const [d, set] = useState(v); useEffect(() => { const t = setTimeout(() => set(v), ms); return () => clearTimeout(t) }, [v, ms]); return d }
