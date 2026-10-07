import { useState } from 'react'
import { Field, Input, Panel, Result, ResultCard, num } from '../ui'
import { StatsPane } from './Advanced'

const fmt = (n: number, d = 2) => (isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: d }) : '—')
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a))
const N = ({ label, v, set }: { label: string; v: string; set: (s: string) => void }) => <Field label={label}><Input value={v} onChange={(e) => set(e.target.value)} inputMode="decimal" /></Field>

export function Percentage() {
  const [a, setA] = useState('15'); const [b, setB] = useState('200'); const [c, setC] = useState('50'); const [d, setD] = useState('80'); const [e, setE] = useState('100'); const [f, setF] = useState('125')
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel className="space-y-3"><h2 className="font-medium">What is X% of Y?</h2><div className="grid grid-cols-2 gap-3"><N label="Percent" v={a} set={setA} /><N label="Of" v={b} set={setB} /></div><Result label="Result" value={fmt((num(a) / 100) * num(b), 4)} /></Panel>
      <Panel className="space-y-3"><h2 className="font-medium">X is what % of Y?</h2><div className="grid grid-cols-2 gap-3"><N label="X" v={c} set={setC} /><N label="Y" v={d} set={setD} /></div><Result label="Result" value={`${fmt((num(c) / num(d)) * 100, 4)} %`} /></Panel>
      <Panel className="space-y-3"><h2 className="font-medium">Percentage change</h2><div className="grid grid-cols-2 gap-3"><N label="From" v={e} set={setE} /><N label="To" v={f} set={setF} /></div><Result label="Change" value={`${fmt(((num(f) - num(e)) / Math.abs(num(e))) * 100, 4)} %`} /></Panel>
    </div>
  )
}

export function Bmi() {
  const [h, setH] = useState('175'); const [w, setW] = useState('70')
  const bmi = num(w) / Math.pow(num(h) / 100, 2)
  const cat = !isFinite(bmi) ? '—' : bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy range' : bmi < 30 ? 'Overweight' : 'Obese'
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="space-y-3"><N label="Height (cm)" v={h} set={setH} /><N label="Weight (kg)" v={w} set={setW} /></Panel>
      {isFinite(bmi) ? <ResultCard caption={`Body mass index · ${cat}`} num={bmi} format={(n) => n.toFixed(1)} rows={[['Category', cat], ['Healthy weight range', `${(18.5 * Math.pow(num(h) / 100, 2)).toFixed(1)}–${(24.9 * Math.pow(num(h) / 100, 2)).toFixed(1)} kg`]]} onReset={() => { setH('175'); setW('70') }} /> : <Panel><p className="text-sm text-fg2">Enter your height and weight.</p></Panel>}
    </div>
  )
}

export function Age() {
  const [dob, setDob] = useState(''); let out = '—', next = '—', days = '—'
  if (dob) {
    const b = new Date(dob), t = new Date()
    let y = t.getFullYear() - b.getFullYear(), m = t.getMonth() - b.getMonth(), d = t.getDate() - b.getDate()
    if (d < 0) { m--; d += new Date(t.getFullYear(), t.getMonth(), 0).getDate() }
    if (m < 0) { y--; m += 12 }
    if (y >= 0) { out = `${y} years, ${m} months, ${d} days`; days = fmt(Math.floor((+t - +b) / 864e5), 0) + ' days' }
    const nb = new Date(t.getFullYear(), b.getMonth(), b.getDate()); if (nb < t) nb.setFullYear(t.getFullYear() + 1)
    next = `${Math.ceil((+nb - +t) / 864e5)} days`
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel><Field label="Date of birth"><Input type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDob(e.target.value)} /></Field></Panel>
      <Panel className="space-y-3"><Result label="Age" value={out} /><Result label="Total days lived" value={days} /><Result label="Next birthday in" value={next} /></Panel>
    </div>
  )
}

export function DateDiff() {
  const today = new Date().toISOString().slice(0, 10); const [a, setA] = useState(today); const [b, setB] = useState(today)
  let rows: [string, string][] = [], total = NaN
  if (a && b) {
    let x = new Date(a), y = new Date(b); if (x > y) [x, y] = [y, x]
    total = Math.round((+y - +x) / 864e5)
    let yy = y.getFullYear() - x.getFullYear(), mm = y.getMonth() - x.getMonth(), dd = y.getDate() - x.getDate()
    if (dd < 0) { mm--; dd += new Date(y.getFullYear(), y.getMonth(), 0).getDate() } if (mm < 0) { yy--; mm += 12 }
    rows = [['Years / months / days', `${yy}y ${mm}m ${dd}d`], ['Weeks', fmt(total / 7, 1)], ['Hours', fmt(total * 24, 0)]]
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="space-y-3"><Field label="Start date"><Input type="date" value={a} onChange={(e) => setA(e.target.value)} /></Field><Field label="End date"><Input type="date" value={b} onChange={(e) => setB(e.target.value)} /></Field></Panel>
      {isFinite(total) ? <ResultCard caption="Days between the dates" num={total} format={(n) => fmt(Math.round(n), 0)} rows={rows} /> : <Panel><p className="text-sm text-fg2">Pick two dates.</p></Panel>}
    </div>
  )
}

export function Ratio() {
  const [a, setA] = useState('1920'); const [b, setB] = useState('1080')
  const S = 10000, x = Math.round(num(a) * S), y = Math.round(num(b) * S), g = gcd(x, y)
  const ok = isFinite(x) && isFinite(y) && g > 0
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="space-y-3"><N label="A" v={a} set={setA} /><N label="B" v={b} set={setB} /></Panel>
      {ok ? <ResultCard caption="Simplified ratio" text={`${x / g} : ${y / g}`} rows={[['A ÷ B', fmt(num(a) / num(b), 4)], ['B ÷ A', fmt(num(b) / num(a), 4)], ['A share', `${fmt((num(a) / (num(a) + num(b))) * 100, 2)} %`]]} /> : <Panel><p className="text-sm text-fg2">Enter two numbers.</p></Panel>}
    </div>
  )
}

export const Average = StatsPane

export function Fraction() {
  const [a, setA] = useState('1'); const [b, setB] = useState('2'); const [op, setOp] = useState('+'); const [c, setC] = useState('1'); const [d, setD] = useState('3')
  const [p, q, r, s] = [a, b, c, d].map((v) => parseInt(v))
  let n = NaN, m = NaN
  if ([p, q, r, s].every(Number.isFinite) && q !== 0 && s !== 0) {
    if (op === '+') { n = p * s + r * q; m = q * s } else if (op === '−') { n = p * s - r * q; m = q * s } else if (op === '×') { n = p * r; m = q * s } else if (r !== 0) { n = p * s; m = q * r }
  }
  const g = gcd(n, m) || 1; if (m < 0) { n = -n; m = -m }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="space-y-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3"><div className="space-y-2"><Input aria-label="Numerator 1" value={a} onChange={(e) => setA(e.target.value)} /><Input aria-label="Denominator 1" value={b} onChange={(e) => setB(e.target.value)} /></div>
          <select aria-label="Operation" value={op} onChange={(e) => setOp(e.target.value)} className="h-10 rounded-[10px] border border-line bg-surface2 px-2">{['+', '−', '×', '÷'].map((o) => <option key={o}>{o}</option>)}</select>
          <div className="space-y-2"><Input aria-label="Numerator 2" value={c} onChange={(e) => setC(e.target.value)} /><Input aria-label="Denominator 2" value={d} onChange={(e) => setD(e.target.value)} /></div></div>
      </Panel>
      {isFinite(n) ? <ResultCard caption="Simplified fraction" text={`${n / g}/${m / g}`} rows={[['Decimal', fmt(n / m, 6)], ['Mixed number', Math.abs(n / g) >= m / g ? `${Math.trunc(n / m)} ${Math.abs(n / g) % (m / g)}/${m / g}` : 'n/a']]} /> : <Panel><p className="text-sm text-fg2">Enter whole numbers; denominators cannot be zero.</p></Panel>}
    </div>
  )
}
