export const BRAND = { name: 'SHAFARE', short: 'SF', tagline: 'ALL TOOLS. ONE PLACE.', supporting: 'Calculate • Convert • Create • Optimize • Manage' }
export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
export const isNative = () => !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
// Low-end / reduced-motion devices skip decorative animation.
export const lowEnd = () => matchMedia('(prefers-reduced-motion: reduce)').matches || (navigator.hardwareConcurrency ?? 8) <= 2 || ((navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8) <= 2
