import { useState } from 'react'
import { Field, Input, Panel, ResultCard, Select, Part, num } from '../ui'

const m0 = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
const m2 = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
interface F { k: string; label: string; def: string; opts?: string[] }
interface Out { caption: string; main: number; fmt: (n: number) => string; rows: [string, string][]; parts?: Part[] }
const BLUE = '#2F80FF', CYAN = '#00C6FF', VIOLET = '#8B5CF6'

function FormCalc({ fields, compute }: { fields: F[]; compute: (v: Record<string, string>) => Out | null }) {
  const init = Object.fromEntries(fields.map((f) => [f.k, f.def])); const [v, setV] = useState(init)
  const out = compute(v)
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="space-y-3">
        {fields.map((f) => <Field key={f.k} label={f.label}>{f.opts
          ? <Select value={v[f.k]} onChange={(e) => setV({ ...v, [f.k]: e.target.value })}>{f.opts.map((o) => <option key={o}>{o}</option>)}</Select>
          : <Input value={v[f.k]} inputMode="decimal" onChange={(e) => setV({ ...v, [f.k]: e.target.value })} />}</Field>)}
      </Panel>
      {out ? <ResultCard caption={out.caption} num={out.main} format={out.fmt} rows={out.rows} parts={out.parts} onReset={() => setV(init)} /> : <Panel><p className="text-sm text-fg2">Enter valid numbers to see your result.</p></Panel>}
    </div>
  )
}
const ok = (...xs: number[]) => xs.every((x) => isFinite(x))

export const Emi = () => <FormCalc fields={[{ k: 'p', label: 'Loan amount (₹)', def: '500000' }, { k: 'r', label: 'Interest rate (% per year)', def: '8.5' }, { k: 'y', label: 'Loan tenure (years)', def: '5' }]}
  compute={(v) => { const P = num(v.p), i = num(v.r) / 1200, n = num(v.y) * 12; if (!ok(P, i, n) || n <= 0 || P <= 0) return null
    const emi = i === 0 ? P / n : (P * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1)
    return { caption: 'Monthly EMI', main: emi, fmt: m0, rows: [['Principal', m0(P)], ['Total interest', m0(emi * n - P)], ['Total payment', m0(emi * n)]], parts: [{ label: 'Principal', value: P, color: BLUE }, { label: 'Interest', value: Math.max(emi * n - P, 0), color: VIOLET }] } }} />

export const SimpleInterest = () => <FormCalc fields={[{ k: 'p', label: 'Principal (₹)', def: '100000' }, { k: 'r', label: 'Rate (% per year)', def: '7' }, { k: 't', label: 'Time (years)', def: '3' }]}
  compute={(v) => { const P = num(v.p), r = num(v.r), t = num(v.t); if (!ok(P, r, t)) return null; const I = (P * r * t) / 100
    return { caption: 'Simple interest', main: I, fmt: m0, rows: [['Principal', m0(P)], ['Interest', m0(I)], ['Total amount', m0(P + I)]], parts: [{ label: 'Principal', value: P, color: BLUE }, { label: 'Interest', value: I, color: CYAN }] } }} />

export const CompoundInterest = () => <FormCalc fields={[{ k: 'p', label: 'Principal (₹)', def: '100000' }, { k: 'r', label: 'Rate (% per year)', def: '7' }, { k: 't', label: 'Time (years)', def: '5' }, { k: 'n', label: 'Compounds per year', def: '12', opts: ['1', '2', '4', '12', '365'] }]}
  compute={(v) => { const P = num(v.p), r = num(v.r) / 100, t = num(v.t), n = num(v.n); if (!ok(P, r, t)) return null; const A = P * Math.pow(1 + r / n, n * t)
    return { caption: 'Maturity amount', main: A, fmt: m0, rows: [['Principal', m0(P)], ['Interest earned', m0(A - P)], ['Growth', `${(((A - P) / P) * 100).toFixed(1)} %`]], parts: [{ label: 'Principal', value: P, color: BLUE }, { label: 'Interest', value: Math.max(A - P, 0), color: CYAN }] } }} />

export const Sip = () => <FormCalc fields={[{ k: 'm', label: 'Monthly investment (₹)', def: '10000' }, { k: 'r', label: 'Expected return (% per year)', def: '12' }, { k: 'y', label: 'Time (years)', def: '10' }]}
  compute={(v) => { const M = num(v.m), i = num(v.r) / 1200, n = num(v.y) * 12; if (!ok(M, i, n) || n <= 0) return null
    const FV = i === 0 ? M * n : M * ((Math.pow(1 + i, n) - 1) / i) * (1 + i)
    return { caption: 'Future value', main: FV, fmt: m0, rows: [['Invested', m0(M * n)], ['Estimated gain', m0(FV - M * n)], ['Total value', m0(FV)]], parts: [{ label: 'Invested', value: M * n, color: BLUE }, { label: 'Gain', value: Math.max(FV - M * n, 0), color: CYAN }] } }} />

export const Gst = () => <FormCalc fields={[{ k: 'a', label: 'Amount (₹)', def: '1000' }, { k: 'r', label: 'GST rate (%)', def: '18', opts: ['0', '3', '5', '12', '18', '28'] }, { k: 'm', label: 'Mode', def: 'Add GST', opts: ['Add GST', 'Remove GST'] }]}
  compute={(v) => { const A = num(v.a), r = num(v.r) / 100; if (!ok(A, r)) return null; const add = v.m === 'Add GST'
    const base = add ? A : A / (1 + r), gst = base * r, total = base + gst
    return { caption: add ? 'Total including GST' : 'Amount before GST', main: add ? total : base, fmt: m2, rows: [['Base amount', m2(base)], ['GST', m2(gst)], ['CGST + SGST', `${m2(gst / 2)} + ${m2(gst / 2)}`]], parts: [{ label: 'Base', value: base, color: BLUE }, { label: 'GST', value: gst, color: VIOLET }] } }} />

export const Discount = () => <FormCalc fields={[{ k: 'p', label: 'Original price (₹)', def: '2500' }, { k: 'd', label: 'Discount (%)', def: '20' }]}
  compute={(v) => { const P = num(v.p), d = num(v.d); if (!ok(P, d)) return null; const s = (P * d) / 100
    return { caption: 'Final price', main: P - s, fmt: m2, rows: [['Original price', m2(P)], ['You save', m2(s)], ['Discount', `${d} %`]], parts: [{ label: 'You pay', value: P - s, color: BLUE }, { label: 'Saved', value: s, color: CYAN }] } }} />

export const ProfitLoss = () => <FormCalc fields={[{ k: 'c', label: 'Cost price (₹)', def: '800' }, { k: 's', label: 'Selling price (₹)', def: '1000' }]}
  compute={(v) => { const C = num(v.c), S = num(v.s); if (!ok(C, S) || C === 0) return null; const d = S - C
    return { caption: d >= 0 ? 'Profit' : 'Loss', main: Math.abs(d), fmt: m2, rows: [['Percentage', `${((Math.abs(d) / C) * 100).toFixed(2)} %`], ['Cost price', m2(C)], ['Selling price', m2(S)]] } }} />

export const Tip = () => <FormCalc fields={[{ k: 'b', label: 'Bill amount (₹)', def: '2000' }, { k: 't', label: 'Tip (%)', def: '10' }, { k: 'n', label: 'People', def: '2' }]}
  compute={(v) => { const B = num(v.b), t = num(v.t), n = Math.max(1, Math.floor(num(v.n))); if (!ok(B, t, n)) return null; const tip = (B * t) / 100
    return { caption: 'Per person', main: (B + tip) / n, fmt: m2, rows: [['Tip', m2(tip)], ['Total', m2(B + tip)], ['People', String(n)]] } }} />
