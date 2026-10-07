import { useState } from 'react'
import { Button, Editor, Field, Panel, Result, Select } from '../ui'

export function Counter() {
  const [t, setT] = useState('')
  const words = t.trim() ? t.trim().split(/\s+/).length : 0
  const sentences = (t.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).filter((s) => s.trim()).length
  const paragraphs = t.split(/\n\s*\n/).filter((p) => p.trim()).length
  const mins = words / 220
  return (
    <div className="space-y-4"><Editor label="Text" value={t} onChange={setT} rows={9} placeholder="Type or paste your text here…" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Result label="Words" value={String(words)} /><Result label="Characters" value={String(t.length)} /><Result label="Characters without spaces" value={String(t.replace(/\s/g, '').length)} />
        <Result label="Sentences" value={String(sentences)} /><Result label="Paragraphs" value={String(paragraphs)} /><Result label="Reading time" value={words ? (mins < 1 ? '< 1 min' : `${Math.ceil(mins)} min`) : '0 min'} />
      </div></div>
  )
}

export function CaseConverter() {
  const [t, setT] = useState('')
  const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  const modes: Record<string, (s: string) => string> = {
    UPPERCASE: (s) => s.toUpperCase(), lowercase: (s) => s.toLowerCase(), 'Title Case': (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    'Sentence case': (s) => s.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, a, b) => a + b.toUpperCase()),
    camelCase: (s) => words(s).map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w)).join(''), snake_case: (s) => words(s).join('_'), 'kebab-case': (s) => words(s).join('-')
  }
  return <div className="space-y-4"><Editor label="Text" value={t} onChange={setT} rows={9} />
    <div className="flex flex-wrap gap-2">{Object.entries(modes).map(([k, f]) => <Button key={k} variant="ghost" onClick={() => setT(f(t))}>{k}</Button>)}</div></div>
}

function Live({ fn, extra, input = '', hint }: { fn: (t: string) => string; extra?: React.ReactNode; input?: string; hint?: string }) {
  const [t, setT] = useState(input)
  return <div className="space-y-3">{extra}{hint && <p className="text-xs text-muted">{hint}</p>}
    <div className="grid gap-4 md:grid-cols-2"><Editor label="Input" value={t} onChange={setT} rows={10} /><Editor label="Output" value={fn(t)} readOnly rows={10} filename="output.txt" /></div></div>
}
const lines = (t: string) => t.split(/\r?\n/)
export const DedupeLines = () => <Live fn={(t) => [...new Set(lines(t))].join('\n')} hint="Removes repeated lines and keeps the first occurrence." />
export const TextCleaner = () => <Live fn={(t) => lines(t).map((l) => l.trim().replace(/[ \t]+/g, ' ')).filter(Boolean).join('\n')} hint="Trims each line, collapses repeated spaces and removes empty lines." />
export const WhitespaceRemover = () => <Live fn={(t) => t.replace(/\s+/g, '')} hint="Removes every space, tab and line break." />
export const Reverser = () => <Live fn={(t) => Array.from(t).reverse().join('')} />
export const Slug = () => <Live input="Hello World! A Clean URL Slug" fn={(t) => t.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')} />
export function SortLines() {
  const [m, setM] = useState('A → Z')
  const sort = (t: string) => { const l = lines(t).filter((x) => x.length); const s = m === 'Length' ? l.sort((a, b) => a.length - b.length) : m === 'Numeric' ? l.sort((a, b) => parseFloat(a) - parseFloat(b)) : l.sort((a, b) => a.localeCompare(b)); return (m === 'Z → A' ? s.reverse() : s).join('\n') }
  return <Live fn={sort} extra={<div className="max-w-xs"><Field label="Sort by"><Select value={m} onChange={(e) => setM(e.target.value)}>{['A → Z', 'Z → A', 'Numeric', 'Length'].map((o) => <option key={o}>{o}</option>)}</Select></Field></div>} />
}
const LOREM = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ')
export function Lorem() {
  const [n, setN] = useState(3); let k = 0
  const para = () => { const len = 40 + ((k * 7) % 25); const w = Array.from({ length: len }, (_, i) => LOREM[(k * 13 + i * 5) % LOREM.length]); k++; const s = w.join(' '); return s[0].toUpperCase() + s.slice(1) + '.' }
  const out = n === 1 ? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + para() : Array.from({ length: n }, para).join('\n\n')
  return <div className="space-y-3"><Panel><Field label={`Paragraphs: ${n}`}><input type="range" min={1} max={10} value={n} onChange={(e) => setN(+e.target.value)} className="w-full accent-[rgb(var(--accent))]" /></Field></Panel><Editor label="Lorem ipsum" value={out} readOnly rows={12} filename="lorem.txt" /></div>
}
