import { useEffect, useState } from 'react'
import { Particles } from '../../ds'
import { lowEnd } from '../../config'

// Animated SF emblem splash. Shown once per browser session; skipped on reduced-motion devices.
export const shouldSplash = () => { try { if (sessionStorage.getItem('shafare-splash') || matchMedia('(prefers-reduced-motion: reduce)').matches) return false; sessionStorage.setItem('shafare-splash', '1') } catch { return false } return true }
export default function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false)
  useEffect(() => { const a = setTimeout(() => setLeaving(true), lowEnd() ? 700 : 1700), b = setTimeout(onDone, lowEnd() ? 1000 : 2100); return () => { clearTimeout(a); clearTimeout(b) } }, [onDone])
  return (
    <div className={`splash fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg ${leaving ? 'leaving' : ''}`} role="status" aria-label="Loading SHAFARE">
      <Particles count={30} />
      <div className="relative h-40 w-40">
        <div className="absolute inset-0 rounded-full bg-accent/30 blur-3xl" aria-hidden />
        <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden><defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2F80FF" /><stop offset="1" stopColor="#00C6FF" /></linearGradient></defs><circle cx="60" cy="60" r="56" fill="none" stroke="url(#sg)" strokeWidth="1.6" strokeLinecap="round" className="splash-ring" /></svg>
        <img src="/logo-mark.png" alt="" width={136} height={136} className="splash-logo absolute inset-3 rounded-full" />
      </div>
      <div className="splash-word font-display relative mt-9 pl-[.5em] text-2xl font-bold tracking-[.5em]">SHAFARE</div>
      <div className="splash-tag relative mt-2 text-[11px] tracking-[.3em] text-fg2">ALL TOOLS. ONE PLACE.</div>
    </div>
  )
}
