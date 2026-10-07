import { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { Button, Field, Input, Panel, ResultCard, Select, num } from '../ui'

type Table = Record<string, number>
export const cats: Record<string, Table> = {
  Length: { Meter: 1, Kilometer: 1000, Centimeter: 0.01, Millimeter: 0.001, Mile: 1609.344, Yard: 0.9144, Foot: 0.3048, Inch: 0.0254 },
  Area: { 'Square meter': 1, 'Square km': 1e6, 'Square foot': 0.09290304, 'Square mile': 2589988.110336, Acre: 4046.8564224, Hectare: 10000 },
  Volume: { Liter: 1, Milliliter: 0.001, 'Cubic meter': 1000, 'Gallon (US)': 3.785411784, Quart: 0.946352946, Cup: 0.2365882365 },
  Weight: { Kilogram: 1, Gram: 0.001, Milligram: 1e-6, Tonne: 1000, Pound: 0.45359237, Ounce: 0.028349523125 },
  Temperature: { Celsius: 1, Fahrenheit: 1, Kelvin: 1 },
  Speed: { 'm/s': 1, 'km/h': 1 / 3.6, mph: 0.44704, Knot: 0.514444 },
  Time: { Second: 1, Minute: 60, Hour: 3600, Day: 86400, Week: 604800 },
  Data: { Byte: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 },
  Energy: { Joule: 1, Kilojoule: 1000, Calorie: 4.184, Kilocalorie: 4184, 'Watt-hour': 3600, 'Kilowatt-hour': 3.6e6, BTU: 1055.06 },
  Pressure: { Pascal: 1, Kilopascal: 1000, Bar: 1e5, PSI: 6894.757, Atmosphere: 101325, mmHg: 133.322 },
  Angle: { Degree: 1, Radian: 180 / Math.PI, Gradian: 0.9, Turn: 360 },
  Frequency: { Hertz: 1, Kilohertz: 1e3, Megahertz: 1e6, Gigahertz: 1e9, RPM: 1 / 60 }
}
const temp = (v: number, f: string, t: string) => {
  const c = f === 'Celsius' ? v : f === 'Fahrenheit' ? ((v - 32) * 5) / 9 : v - 273.15
  return t === 'Celsius' ? c : t === 'Fahrenheit' ? (c * 9) / 5 + 32 : c + 273.15
}
const conv = (cat: string, v: number, f: string, t: string) => (cat === 'Temperature' ? temp(v, f, t) : (v * cats[cat][f]) / cats[cat][t])
const fmt = (n: number) => (isFinite(n) ? String(+n.toPrecision(10)) : '—')

export function ConverterView({ cat }: { cat: string }) {
  const units = Object.keys(cats[cat])
  const [from, setFrom] = useState(units[0]); const [to, setTo] = useState(units[1]); const [v, setV] = useState('1')
  const n = num(v), r = conv(cat, n, from, to)
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="space-y-3">
        <Field label="Value"><Input value={v} onChange={(e) => setV(e.target.value)} inputMode="decimal" /></Field>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <Field label="From"><Select value={from} onChange={(e) => setFrom(e.target.value)}>{units.map((u) => <option key={u}>{u}</option>)}</Select></Field>
          <Button variant="ghost" className="w-10 px-0" aria-label="Swap units" onClick={() => { setFrom(to); setTo(from) }}><ArrowLeftRight size={16} /></Button>
          <Field label="To"><Select value={to} onChange={(e) => setTo(e.target.value)}>{units.map((u) => <option key={u}>{u}</option>)}</Select></Field>
        </div>
      </Panel>
      {isFinite(r) ? <ResultCard caption={`${v} ${from} in ${to}`} num={r} format={fmt} rows={[['Reverse', `1 ${to} = ${fmt(conv(cat, 1, to, from))} ${from}`]]} onReset={() => { setV('1'); setFrom(units[0]); setTo(units[1]) }} /> : <Panel><p className="text-sm text-fg2">Enter a number to convert.</p></Panel>}
    </div>
  )
}
const made: Record<string, () => JSX.Element> = {}
export const conv_ = (cat: string) => (made[cat] ??= () => <ConverterView cat={cat} />)

export function UnitConverter() {
  const [c, setC] = useState('Length')
  return <div className="space-y-4"><Panel><Field label="Category"><Select value={c} onChange={(e) => setC(e.target.value)}>{Object.keys(cats).map((k) => <option key={k}>{k}</option>)}</Select></Field></Panel><ConverterView key={c} cat={c} /></div>
}
