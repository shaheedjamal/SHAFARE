import { useEffect, useRef } from 'react'
import { lowEnd } from '../config'

// Sparse drifting dots. Skipped entirely on low-end / reduced-motion devices; pauses when the tab is hidden.
export function Particles({ count = 26 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c || lowEnd()) return
    const ctx = c.getContext('2d')!, dpr = Math.min(devicePixelRatio || 1, 1.5), n = innerWidth < 640 ? Math.round(count / 2) : count
    let w = 0, h = 0, raf = 0
    const fit = () => { w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    fit(); const ro = new ResizeObserver(fit); ro.observe(c)
    const ps = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 0.6 + Math.random() * 1.4, vx: (Math.random() - 0.5) * 0.18, vy: -0.05 - Math.random() * 0.2, a: 0.15 + Math.random() * 0.4 }))
    const tick = () => {
      if (!document.hidden) {
        ctx.clearRect(0, 0, w, h)
        for (const p of ps) { p.x += p.vx; p.y += p.vy; if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w } if (p.x < -4) p.x = w + 4; if (p.x > w + 4) p.x = -4; ctx.fillStyle = `rgba(0,198,255,${p.a})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill() }
      }
      raf = requestAnimationFrame(tick)
    }
    tick(); return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [count])
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
}
