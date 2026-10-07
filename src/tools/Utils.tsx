import { useState } from 'react'
import { Copy } from 'lucide-react'
import { Button, Field, Input, Panel, Result } from '../ui'
import { strength } from '../strength'

const copy = (s: string) => navigator.clipboard?.writeText(s)

export function Password() {
  const [len, setLen] = useState(16)
  const [opts, setOpts] = useState({ upper: true, lower: true, digits: true, symbols: true })
  const [pw, setPw] = useState('')
  const gen = () => {
    const sets: string[] = []
    if (opts.upper) sets.push('ABCDEFGHJKLMNPQRSTUVWXYZ'); if (opts.lower) sets.push('abcdefghijkmnopqrstuvwxyz')
    if (opts.digits) sets.push('23456789'); if (opts.symbols) sets.push('!@#$%^&*()-_=+[]{}')
    if (!sets.length) return
    const all = sets.join('')
    const rand = (n: number) => { const max = Math.floor(0x100000000 / n) * n; let x: number; const b = new Uint32Array(1); do { crypto.getRandomValues(b); x = b[0] } while (x >= max); return x % n }
    const out = sets.map((s) => s[rand(s.length)])
    while (out.length < len) out.push(all[rand(all.length)])
    for (let i = out.length - 1; i > 0; i--) { const j = rand(i + 1); [out[i], out[j]] = [out[j], out[i]] }
    setPw(out.slice(0, len).join(''))
  }
  return (
    <Panel className="mx-auto max-w-md space-y-3">
      <Field label={`Length: ${len}`}><input type="range" min={8} max={64} value={len} onChange={(e) => setLen(+e.target.value)} className="w-full accent-[rgb(var(--accent))]" /></Field>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {(Object.keys(opts) as (keyof typeof opts)[]).map((k) => (
          <label key={k} className="flex items-center gap-2 capitalize"><input type="checkbox" checked={opts[k]} onChange={(e) => setOpts({ ...opts, [k]: e.target.checked })} />{k}</label>))}
      </div>
      <Button className="w-full" onClick={gen}>Generate</Button>
      {pw && <><Result label="Password" value={pw} />{(() => { const s = strength(pw); return <div><div className="mb-1 flex justify-between text-xs"><span style={{ color: s.color }}>{s.label}</span><span className="text-fg2">{s.bits} bits</span></div><div className="h-2 overflow-hidden rounded bg-fg/10" role="meter" aria-label="Password strength" aria-valuenow={s.level + 1} aria-valuemin={1} aria-valuemax={5}><div className="h-full rounded transition-[width]" style={{ width: `${(s.level + 1) * 20}%`, background: s.color }} /></div></div> })()}<Button variant="ghost" className="w-full" onClick={() => copy(pw)}><Copy size={16} />Copy</Button></>}
    </Panel>
  )
}

export function Uuid() {
  const [ids, setIds] = useState<string[]>([])
  return (
    <Panel className="mx-auto max-w-md space-y-3">
      <Button className="w-full" onClick={() => setIds(Array.from({ length: 5 }, () => crypto.randomUUID()))}>Generate 5 UUIDs (v4)</Button>
      {ids.map((i) => <Result key={i} label="UUID" value={i} />)}
      {ids.length > 0 && <Button variant="ghost" className="w-full" onClick={() => copy(ids.join('\n'))}><Copy size={16} />Copy all</Button>}
    </Panel>
  )
}

const hex2rgb = (h: string) => { const m = h.replace('#', '').match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i); if (!m) return null; let s = m[1]; if (s.length === 3) s = [...s].map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)) }
const rgb2hsl = ([r, g, b]: number[]) => {
  r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  const h = d === 0 ? 0 : mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)]
}
export function Color() {
  const [hex, setHex] = useState('#3B82F6'); const rgb = hex2rgb(hex)
  return (
    <Panel className="mx-auto max-w-md space-y-3">
      <Field label="HEX"><div className="flex gap-2"><Input value={hex} onChange={(e) => setHex(e.target.value)} /><input type="color" aria-label="Pick color" value={rgb ? '#' + rgb.map((n) => n.toString(16).padStart(2, '0')).join('') : '#000000'} onChange={(e) => setHex(e.target.value)} className="h-10 w-12 rounded-[10px] border border-line bg-transparent" /></div></Field>
      {rgb ? <><div className="h-16 rounded-[10px] border border-line" style={{ background: `rgb(${rgb.join(',')})` }} />
        <Result label="RGB" value={`rgb(${rgb.join(', ')})`} /><Result label="HSL" value={(([h, s, l]) => `hsl(${h}, ${s}%, ${l}%)`)(rgb2hsl(rgb))} /></> : <p className="text-sm text-fg2">Enter a valid 3 or 6 digit HEX value.</p>}
    </Panel>
  )
}
