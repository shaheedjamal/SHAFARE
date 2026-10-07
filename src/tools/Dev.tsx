import { useEffect, useState } from 'react'
import { Button, Editor, Field, Input, Panel, Result, Select } from '../ui'

export function JsonTool({ primary }: { primary: 'format' | 'validate' | 'minify' }) {
  const [t, setT] = useState('{"name":"SHAFARE","tools":[1,2,3]}'); const [o, setO] = useState(''); const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const run = (indent?: number, label = 'Valid JSON') => { try { const v = JSON.parse(t); setO(JSON.stringify(v, null, indent)); setMsg({ ok: true, text: label }) } catch (e) { setO(''); setMsg({ ok: false, text: (e as Error).message }) } }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2"><Button variant={primary === 'format' ? 'primary' : 'ghost'} onClick={() => run(2, 'Formatted')}>Format</Button><Button variant={primary === 'minify' ? 'primary' : 'ghost'} onClick={() => run(undefined, 'Minified')}>Minify</Button><Button variant={primary === 'validate' ? 'primary' : 'ghost'} onClick={() => run(2)}>Validate</Button></div>
      {msg && <p role="status" className={`text-sm ${msg.ok ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{msg.ok ? msg.text : `Invalid JSON: ${msg.text}`}</p>}
      <div className="grid gap-4 md:grid-cols-2"><Editor label="JSON input" value={t} onChange={setT} rows={14} /><Editor label="Output" value={o} readOnly rows={14} filename="output.json" /></div>
    </div>
  )
}

export const JsonFormat = () => <JsonTool primary="format" />
export const JsonValidate = () => <JsonTool primary="validate" />
export const JsonMinify = () => <JsonTool primary="minify" />

const b64e = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)))
const b64d = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.trim()), (c) => c.charCodeAt(0)))
function Codec({ kind, enc }: { kind: 'base64' | 'url'; enc: boolean }) {
  const [t, setT] = useState('')
  let out = '', bad = false
  try { out = kind === 'base64' ? (enc ? b64e(t) : b64d(t)) : enc ? encodeURIComponent(t) : decodeURIComponent(t) } catch { bad = true }
  return <div className="space-y-3">{bad && t && <p role="alert" className="text-sm text-[#EF4444]">This input can’t be {enc ? 'encoded' : 'decoded'}. Check that it’s valid {kind === 'base64' ? 'Base64' : 'URL-encoded text'}.</p>}
    <div className="grid gap-4 md:grid-cols-2"><Editor label="Input" value={t} onChange={setT} rows={10} /><Editor label="Output" value={bad ? '' : out} readOnly rows={10} filename="output.txt" /></div></div>
}
export const Base64Encode = () => <Codec kind="base64" enc />
export const Base64Decode = () => <Codec kind="base64" enc={false} />
export const UrlEncode = () => <Codec kind="url" enc />
export const UrlDecode = () => <Codec kind="url" enc={false} />

export function Hash() {
  const [t, setT] = useState(''); const [h, setH] = useState<Record<string, string>>({})
  useEffect(() => {
    let dead = false; const d = new TextEncoder().encode(t)
    Promise.all(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].map(async (a) => [a, [...new Uint8Array(await crypto.subtle.digest(a, d))].map((b) => b.toString(16).padStart(2, '0')).join('')] as const)).then((r) => !dead && setH(Object.fromEntries(r) as Record<string, string>))
    return () => { dead = true }
  }, [t])
  return <div className="space-y-4"><Editor label="Text to hash" value={t} onChange={setT} rows={5} /><div className="grid gap-3">{Object.entries(h).map(([a, v]) => <Result key={a} label={a} value={String(v)} />)}</div></div>
}

export function Timestamp() {
  const [v, setV] = useState(String(Math.floor(Date.now() / 1000))); const [d, setD] = useState('')
  const n = Number(v), ms = Math.abs(n) > 1e11 ? n : n * 1000, dt = new Date(ms), ok = v.trim() !== '' && isFinite(n) && !isNaN(dt.getTime())
  const fromDate = d ? new Date(d).getTime() : NaN
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="space-y-3"><Field label="Unix timestamp (seconds or milliseconds)"><Input value={v} onChange={(e) => setV(e.target.value)} inputMode="numeric" /></Field><Button variant="ghost" onClick={() => setV(String(Math.floor(Date.now() / 1000)))}>Use current time</Button>
        {ok ? <div className="space-y-2"><Result label="ISO 8601 (UTC)" value={dt.toISOString()} /><Result label="Local time" value={dt.toLocaleString()} /></div> : <p className="text-sm text-fg2" role="alert">Enter a valid timestamp.</p>}</Panel>
      <Panel className="space-y-3"><Field label="Date and time to timestamp"><Input type="datetime-local" value={d} onChange={(e) => setD(e.target.value)} /></Field>
        {isFinite(fromDate) && <div className="space-y-2"><Result label="Seconds" value={String(Math.floor(fromDate / 1000))} /><Result label="Milliseconds" value={String(fromDate)} /></div>}</Panel>
    </div>
  )
}

export function Regex() {
  const [p, setP] = useState('\\b(\\w+)@(\\w+\\.com)\\b'); const [f, setF] = useState('g'); const [t, setT] = useState('Contact: sam@example.com, lee@shah.com')
  let matches: RegExpMatchArray[] = [], err = ''
  try { const flags = f.includes('g') ? f : f + 'g'; matches = p ? [...t.matchAll(new RegExp(p, flags))].slice(0, 200) : [] } catch (e) { err = (e as Error).message }
  return (
    <div className="space-y-3"><div className="grid gap-3 sm:grid-cols-[1fr_120px]"><Field label="Pattern"><Input className="font-mono" value={p} onChange={(e) => setP(e.target.value)} spellCheck={false} /></Field><Field label="Flags"><Input className="font-mono" value={f} onChange={(e) => setF(e.target.value)} spellCheck={false} /></Field></div>
      {err && <p role="alert" className="text-sm text-[#EF4444]">Invalid pattern: {err}</p>}
      <Editor label="Test text" value={t} onChange={setT} rows={7} />
      <Panel><h2 className="mb-2 text-sm font-medium">{matches.length} match{matches.length === 1 ? '' : 'es'}</h2><ul className="space-y-1 font-mono text-sm">{matches.map((m, i) => <li key={i} className="rounded-[8px] bg-fg/5 px-3 py-1.5"><span className="text-cyan">{m[0]}</span> <span className="text-muted">at {m.index}</span>{m.length > 1 && <span className="text-fg2"> · groups: {m.slice(1).join(', ')}</span>}</li>)}</ul></Panel></div>
  )
}

const b64url = (s: string) => { const t = s.replace(/-/g, '+').replace(/_/g, '/'); return new TextDecoder().decode(Uint8Array.from(atob(t + '='.repeat((4 - (t.length % 4)) % 4)), (c) => c.charCodeAt(0))) }
export function Jwt() {
  const [t, setT] = useState('')
  let head = '', body = '', exp = '', bad = false
  if (t.trim()) try { const [h, b] = t.trim().split('.'); const hj = JSON.parse(b64url(h)), bj = JSON.parse(b64url(b)); head = JSON.stringify(hj, null, 2); body = JSON.stringify(bj, null, 2); if (typeof bj.exp === 'number') exp = `${new Date(bj.exp * 1000).toLocaleString()} (${bj.exp * 1000 < Date.now() ? 'expired' : 'valid'})` } catch { bad = true }
  return <div className="space-y-3"><Editor label="JWT" value={t} onChange={setT} rows={5} placeholder="Paste a token here" />
    <p className="text-xs text-muted">Decoded locally. The signature is not verified, so don’t treat the contents as trusted.</p>
    {bad && <p role="alert" className="text-sm text-[#EF4444]">This doesn’t look like a valid JWT.</p>}
    {head && <div className="grid gap-4 md:grid-cols-2"><Editor label="Header" value={head} readOnly rows={8} /><Editor label="Payload" value={body} readOnly rows={8} /></div>}{exp && <Result label="Expires" value={exp} />}</div>
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const inline = (s: string) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
function md(src: string) {
  let html = '', list = false, code = false
  const close = () => { if (list) { html += '</ul>'; list = false } }
  for (const l of src.split('\n')) {
    if (l.startsWith('```')) { close(); html += code ? '</pre>' : '<pre>'; code = !code; continue }
    if (code) { html += esc(l) + '\n'; continue }
    const h = l.match(/^(#{1,6})\s+(.*)/), li = l.match(/^[-*]\s+(.*)/)
    if (h) { close(); html += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>` } else if (li) { if (!list) { html += '<ul>'; list = true } html += `<li>${inline(li[1])}</li>` } else if (l.trim()) { close(); html += `<p>${inline(l)}</p>` } else close()
  }
  close(); return html + (code ? '</pre>' : '')
}
export function Markdown() {
  const [t, setT] = useState('# Hello SHAFARE\n\nWrite **Markdown** on the left.\n\n- Fast\n- Private\n\n`inline code` and [a link](https://example.com)')
  return <div className="grid gap-4 md:grid-cols-2"><Editor label="Markdown" value={t} onChange={setT} rows={16} filename="note.md" /><Panel><div className="mb-2 text-xs font-medium text-fg2">Preview</div><div className="md" dangerouslySetInnerHTML={{ __html: md(t) }} /></Panel></div>
}
void Select
