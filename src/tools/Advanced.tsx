import { useMemo, useState } from 'react'
import { Copy, Eraser, RotateCcw, Save, Share2 } from 'lucide-react'
import { Button, Field, Input, Panel, Result, Select, copyText, num, shareText } from '../ui'
import { useStore } from '../store'

export function evaluate(src: string, deg: boolean): number {
  const s = src.toLowerCase().replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/π/g, 'pi').replace(/√/g, 'sqrt').replace(/\s+/g, '')
  let i = 0
  const fail = (): never => { throw new Error('Invalid expression') }
  const fact = (n: number) => { if (n < 0 || n > 170 || n !== Math.floor(n)) fail(); let r = 1; for (let k = 2; k <= n; k++) r *= k; return r }
  const rad = (x: number) => (deg ? (x * Math.PI) / 180 : x)
  const fn: Record<string, (x: number) => number> = { sin: (x) => Math.sin(rad(x)), cos: (x) => Math.cos(rad(x)), tan: (x) => Math.tan(rad(x)), log: Math.log10, ln: Math.log, sqrt: Math.sqrt, abs: Math.abs }
  const expr = (): number => { let v = term(); while (s[i] === '+' || s[i] === '-') { const o = s[i++]; const r = term(); v = o === '+' ? v + r : v - r } return v }
  const term = (): number => {
    let v = unary()
    for (;;) {
      if (s[i] === '*' || s[i] === '/') { const o = s[i++]; const r = unary(); v = o === '*' ? v * r : v / r }
      else if (s[i] === '(' || /[a-z]/.test(s[i] ?? '')) v *= unary() // implicit multiplication: 2π, 3(4)
      else return v
    }
  }
  const unary = (): number => { if (s[i] === '-') { i++; return -unary() } if (s[i] === '+') { i++; return unary() } return power() }
  const power = (): number => { const b = postfix(); if (s[i] === '^') { i++; return Math.pow(b, unary()) } return b }
  const postfix = (): number => { let v = primary(); while (s[i] === '!' || s[i] === '%') v = s[i++] === '!' ? fact(v) : v / 100; return v }
  const primary = (): number => {
    if (s[i] === '(') { i++; const v = expr(); if (s[i++] !== ')') fail(); return v }
    const m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)/); if (m) { i += m[0].length; return parseFloat(m[0]) }
    const w = s.slice(i).match(/^[a-z]+/)
    if (w) {
      i += w[0].length
      if (s[i] === '(') { i++; const a = expr(); if (s[i++] !== ')') fail(); const f = fn[w[0]]; if (!f) fail(); return f(a) }
      if (w[0] === 'pi') return Math.PI; if (w[0] === 'e') return Math.E
    }
    return fail()
  }
  const v = expr(); if (i < s.length || !isFinite(v)) fail(); return v
}
const show = (n: number) => String(+n.toPrecision(12))

type Mode = 'basic' | 'scientific' | 'programmer' | 'statistics'
const MODES: Mode[] = ['basic', 'scientific', 'programmer', 'statistics']

export function Advanced({ initial = 'basic' }: { initial?: Mode }) {
  const [mode, setMode] = useState<Mode>(initial)
  const [expr, setExpr] = useState(''); const [deg, setDeg] = useState(true); const [msg, setMsg] = useState('')
  const { calcHistory, addCalc, clearCalc, upsertNote } = useStore()
  const result = useMemo(() => { if (!expr.trim()) return null; try { return evaluate(expr, deg) } catch { return null } }, [expr, deg])
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 1300) }
  const commit = () => { if (result !== null) { addCalc(expr, show(result)); setExpr(show(result)) } }
  const press = (k: string) => {
    if (k === '=') return commit()
    if (k === '⌫') return setExpr(expr.slice(0, -1))
    setExpr(expr + (({ 'x²': '^2', 'xʸ': '^' } as Record<string, string>)[k] ?? k))
  }
  const keys = ['(', ')', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', '.', '⌫', '=']
  const sci = ['sin(', 'cos(', 'tan(', 'log(', 'ln(', '√(', 'x²', 'xʸ', 'π', 'e', '!', 'DEG']
  const text = result !== null ? `${expr} = ${show(result)}` : expr
  const calcMode = mode === 'basic' || mode === 'scientific'

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <Panel className="space-y-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Calculator mode">
          {MODES.map((m) => <Button key={m} variant={mode === m ? 'primary' : 'ghost'} role="tab" aria-selected={mode === m} className="capitalize" onClick={() => setMode(m)}>{m}</Button>)}
        </div>
        {calcMode && <>
          <div className="rounded-[14px] border border-line bg-surface2 p-4">
            <input aria-label="Expression" value={expr} onChange={(e) => setExpr(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && commit()} placeholder="0" spellCheck={false}
              className="w-full bg-transparent text-right font-mono text-xl text-fg2 outline-none placeholder:text-muted" />
            <div className="mt-1 break-all text-right font-mono text-3xl font-semibold" aria-live="polite">{result !== null ? show(result) : '—'}</div>
          </div>
          {mode === 'scientific' && <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{sci.map((k) => (
            <Button key={k} variant="ghost" className="h-11" aria-label={k === 'DEG' ? `Angle mode: ${deg ? 'degrees' : 'radians'}` : k} onClick={() => (k === 'DEG' ? setDeg(!deg) : press(k))}>{k === 'DEG' ? (deg ? 'Deg' : 'Rad') : k}</Button>))}</div>}
          <div className="grid grid-cols-4 gap-2">{keys.map((k) => (
            <Button key={k} variant={k === '=' ? 'primary' : 'ghost'} className="h-12 text-base" aria-label={k === '⌫' ? 'Backspace' : k} onClick={() => press(k)}>{k}</Button>))}</div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => { copyText(result !== null ? show(result) : ''); flash('Copied') }}><Copy size={16} />Copy</Button>
            <Button variant="ghost" onClick={() => shareText(text)}><Share2 size={16} />Share</Button>
            <Button variant="ghost" disabled={result === null} onClick={() => { upsertNote({ id: crypto.randomUUID(), title: 'Calculation', body: text, pinned: false, updated: Date.now() }); flash('Saved to Notes') }}><Save size={16} />Save</Button>
            <Button variant="ghost" onClick={() => setExpr('')}><Eraser size={16} />Clear</Button>
            <Button variant="ghost" onClick={() => { setExpr(''); clearCalc(); setDeg(true) }}><RotateCcw size={16} />Reset</Button>
            <span className="text-xs text-cyan" role="status">{msg}</span>
          </div>
        </>}
        {mode === 'programmer' && <ProgrammerPane />}
        {mode === 'statistics' && <StatsPane />}
      </Panel>
      <Panel>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-medium">History</h2>{calcHistory.length > 0 && <button className="text-xs text-fg2 hover:text-fg" onClick={clearCalc}>Clear</button>}</div>
        <ul className="max-h-[420px] space-y-1 overflow-auto">
          {calcHistory.map((h) => (
            <li key={h.expr}><button onClick={() => { if (!calcMode) setMode('basic'); setExpr(h.expr) }} className="w-full rounded-[10px] px-3 py-2 text-left font-mono text-sm hover:bg-fg/10"><span className="text-fg2">{h.expr}</span><br />= {h.res}</button></li>))}
          {!calcHistory.length && <li className="px-3 py-6 text-center text-sm text-muted">Your recent calculations appear here. Tap one to reuse it.</li>}
        </ul>
      </Panel>
    </div>
  )
}
export const Scientific = () => <Advanced initial="scientific" />
export const Programmer = () => <Advanced initial="programmer" />

const BASES: Record<string, number> = { DEC: 10, HEX: 16, BIN: 2, OCT: 8 }
function ProgrammerPane() {
  const [base, setBase] = useState('DEC'); const [a, setA] = useState('255'); const [op, setOp] = useState('none'); const [b, setB] = useState('1')
  const parse = (s: string): bigint | null => { const t = s.trim(); if (!t) return null; const p = BASES[base] === 16 ? '0x' : BASES[base] === 8 ? '0o' : BASES[base] === 2 ? '0b' : ''; try { return BigInt(p + t) } catch { return null } }
  const A = parse(a), B = parse(b)
  let r: bigint | null = A
  if (A !== null && op !== 'none') {
    if (op === 'NOT') r = BigInt.asIntN(64, ~A)
    else if (B === null) r = null
    else r = op === 'AND' ? A & B : op === 'OR' ? A | B : op === 'XOR' ? A ^ B : op === 'SHL' ? A << B : A >> B
  }
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Input base"><Select value={base} onChange={(e) => setBase(e.target.value)}>{Object.keys(BASES).map((k) => <option key={k}>{k}</option>)}</Select></Field>
        <Field label="Operation"><Select value={op} onChange={(e) => setOp(e.target.value)}>{['none', 'AND', 'OR', 'XOR', 'NOT', 'SHL', 'SHR'].map((k) => <option key={k}>{k}</option>)}</Select></Field>
        <Field label="Value A"><Input value={a} onChange={(e) => setA(e.target.value)} spellCheck={false} /></Field>
      </div>
      {op !== 'none' && op !== 'NOT' && <Field label={op === 'SHL' || op === 'SHR' ? 'Shift by (same base)' : 'Value B'}><Input value={b} onChange={(e) => setB(e.target.value)} spellCheck={false} /></Field>}
      {r === null ? <p className="text-sm text-fg2" role="alert">Enter a valid {base} value.</p> : (
        <div className="grid gap-2 sm:grid-cols-2">
          <Result label="DEC" value={r.toString(10)} /><Result label="HEX" value={r.toString(16).toUpperCase()} /><Result label="BIN" value={r.toString(2)} /><Result label="OCT" value={r.toString(8)} />
        </div>)}
    </div>
  )
}

export const stats = (xs: number[]) => {
  const n = xs.length, s = [...xs].sort((p, q) => p - q), sum = xs.reduce((p, q) => p + q, 0), mean = sum / n
  const med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2
  const freq = new Map<number, number>(); xs.forEach((x) => freq.set(x, (freq.get(x) ?? 0) + 1)); const top = Math.max(...freq.values())
  const mode = top === 1 ? 'None' : [...freq].filter(([, c]) => c === top).map(([x]) => x).join(', ')
  const ss = xs.reduce((p, q) => p + (q - mean) ** 2, 0), pv = ss / n, sv = n > 1 ? ss / (n - 1) : NaN
  return { n, sum, mean, med, mode, min: s[0], max: s[n - 1], range: s[n - 1] - s[0], pv, sv, psd: Math.sqrt(pv), ssd: Math.sqrt(sv) }
}
export const parseNums = (t: string) => t.split(/[\s,;]+/).filter(Boolean).map(Number)
export function StatsPane() {
  const [t, setT] = useState('4, 8, 15, 16, 23, 42'); const xs = parseNums(t); const ok = xs.length > 0 && xs.every(isFinite)
  const st = ok ? stats(xs) : null; const f = (n: number) => (isFinite(n) ? show(n) : '—')
  return (
    <div className="space-y-3">
      <Field label="Numbers (separated by commas, spaces or new lines)"><textarea value={t} onChange={(e) => setT(e.target.value)} rows={3} className="w-full rounded-[10px] border border-line bg-surface2 p-3 font-mono text-sm" /></Field>
      {st ? <div className="grid gap-2 sm:grid-cols-3">
        {([['Count', st.n], ['Sum', st.sum], ['Mean', st.mean], ['Median', st.med], ['Minimum', st.min], ['Maximum', st.max], ['Range', st.range], ['Variance (population)', st.pv], ['Variance (sample)', st.sv], ['Std dev (population)', st.psd], ['Std dev (sample)', st.ssd]] as [string, number][]).map(([l, v]) => <Result key={l} label={l} value={f(v)} />)}
        <Result label="Mode" value={st.mode} /></div> : <p className="text-sm text-fg2" role="alert">Enter at least one valid number.</p>}
    </div>
  )
}
void num
