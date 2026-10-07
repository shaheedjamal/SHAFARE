import { useState } from 'react'
import { Button, Field, Input, Panel, Result, Select } from '../ui'
import { strength } from '../strength'

export function PasswordStrength() {
  const [p, setP] = useState(''); const [show, setShow] = useState(false); const s = strength(p)
  return (
    <Panel className="mx-auto max-w-lg space-y-4">
      <Field label="Password"><div className="flex gap-2"><Input type={show ? 'text' : 'password'} value={p} onChange={(e) => setP(e.target.value)} autoComplete="off" spellCheck={false} /><Button variant="ghost" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</Button></div></Field>
      <div><div className="mb-1.5 flex justify-between text-sm"><span style={{ color: p ? s.color : undefined }}>{p ? s.label : 'Enter a password'}</span><span className="text-fg2">{s.bits} bits</span></div>
        <div className="h-2 overflow-hidden rounded bg-fg/10" role="meter" aria-valuenow={s.level + 1} aria-valuemin={1} aria-valuemax={5} aria-label="Password strength"><div className="h-full rounded transition-[width] duration-300" style={{ width: p ? `${(s.level + 1) * 20}%` : 0, background: s.color }} /></div></div>
      <p className="text-xs text-muted">Checked entirely in your browser. Nothing you type is sent or stored. The estimate uses length and character variety only, so avoid common words even if the score is high.</p>
    </Panel>
  )
}

const rand = (n: number) => { const max = Math.floor(0x100000000 / n) * n; const b = new Uint32Array(1); let x: number; do { crypto.getRandomValues(b); x = b[0] } while (x >= max); return x % n }
export function Token() {
  const [len, setLen] = useState('32'); const [fmt, setFmt] = useState('Hex'); const [tok, setTok] = useState('')
  const gen = () => { const n = Math.min(256, Math.max(8, parseInt(len) || 32)); const b = crypto.getRandomValues(new Uint8Array(n)); setTok(fmt === 'Hex' ? [...b].map((x) => x.toString(16).padStart(2, '0')).join('') : btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')) }
  return <Panel className="mx-auto max-w-lg space-y-3"><div className="grid grid-cols-2 gap-3"><Field label="Bytes (8–256)"><Input value={len} onChange={(e) => setLen(e.target.value)} inputMode="numeric" /></Field><Field label="Format"><Select value={fmt} onChange={(e) => setFmt(e.target.value)}><option>Hex</option><option>Base64URL</option></Select></Field></div><Button className="w-full" onClick={gen}>Generate token</Button>{tok && <Result label="Token" value={tok} />}</Panel>
}
export function SecureRandom() {
  const [lo, setLo] = useState('1'); const [hi, setHi] = useState('100'); const [n, setN] = useState('5'); const [out, setOut] = useState<number[]>([])
  const L = parseInt(lo), H = parseInt(hi), C = Math.min(50, parseInt(n) || 1), ok = Number.isInteger(L) && Number.isInteger(H) && H >= L && H - L < 2 ** 32 - 1
  return <Panel className="mx-auto max-w-lg space-y-3"><div className="grid grid-cols-3 gap-3"><Field label="Minimum"><Input value={lo} onChange={(e) => setLo(e.target.value)} inputMode="numeric" /></Field><Field label="Maximum"><Input value={hi} onChange={(e) => setHi(e.target.value)} inputMode="numeric" /></Field><Field label="How many"><Input value={n} onChange={(e) => setN(e.target.value)} inputMode="numeric" /></Field></div>
    <Button className="w-full" disabled={!ok} onClick={() => setOut(Array.from({ length: C }, () => L + rand(H - L + 1)))}>Generate</Button>{!ok && <p className="text-sm text-fg2" role="alert">Enter whole numbers where maximum is at least the minimum.</p>}{out.length > 0 && <Result label="Cryptographically secure numbers" value={out.join(', ')} />}</Panel>
}
