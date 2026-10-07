import { useEffect, useState } from 'react'

interface InstallEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<unknown> }
let deferred: InstallEvent | null = null
const subs = new Set<() => void>(); const notify = () => subs.forEach((f) => f())
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as InstallEvent; notify() })
addEventListener('appinstalled', () => { deferred = null; notify() })

export function useInstall() {
  const [, force] = useState(0)
  useEffect(() => { const f = () => force((x) => x + 1); subs.add(f); return () => { subs.delete(f) } }, [])
  const native = !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
  const installed = native || matchMedia('(display-mode: standalone)').matches || !!(navigator as unknown as { standalone?: boolean }).standalone
  return {
    canInstall: !!deferred && !installed, installed, ios: /iphone|ipad|ipod/i.test(navigator.userAgent),
    install: async () => { if (!deferred) return; await deferred.prompt(); await deferred.userChoice; deferred = null; notify() }
  }
}
