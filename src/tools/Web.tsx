import { useState } from 'react'
import { Editor, Field, Input, Panel, Result } from '../ui'

export function UrlParser() {
  const [t, setT] = useState('https://example.com:8080/path/page?utm_source=news&id=42#section')
  let u: URL | null = null; try { u = new URL(t.trim()) } catch { /* invalid */ }
  return <div className="space-y-4"><Panel><Field label="URL"><Input value={t} onChange={(e) => setT(e.target.value)} spellCheck={false} /></Field></Panel>
    {u ? <div className="grid gap-3 sm:grid-cols-2">{([['Protocol', u.protocol], ['Host', u.hostname], ['Port', u.port || '(default)'], ['Path', u.pathname], ['Query', u.search || '—'], ['Hash', u.hash || '—']] as [string, string][]).map(([l, v]) => <Result key={l} label={l} value={v} />)}
      {[...u.searchParams].map(([k, v]) => <Result key={k + v} label={`Param: ${k}`} value={v} />)}</div> : <p className="text-sm text-fg2" role="alert">Enter a full URL including https://</p>}</div>
}

export function Utm() {
  const [v, setV] = useState({ url: 'https://example.com', source: 'newsletter', medium: 'email', campaign: 'spring_launch', term: '', content: '' })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value })
  let out = ''; try { const u = new URL(v.url); ([['source', v.source], ['medium', v.medium], ['campaign', v.campaign], ['term', v.term], ['content', v.content]] as [string, string][]).forEach(([k, x]) => x && u.searchParams.set('utm_' + k, x)); out = u.toString() } catch { /* invalid */ }
  return <div className="grid gap-4 lg:grid-cols-2"><Panel className="space-y-3">{(['url', 'source', 'medium', 'campaign', 'term', 'content'] as const).map((k) => <Field key={k} label={k === 'url' ? 'Website URL' : `Campaign ${k}${['term', 'content'].includes(k) ? ' (optional)' : ''}`}><Input value={v[k]} onChange={set(k)} /></Field>)}</Panel>
    <div className="space-y-3">{out ? <Editor label="Tagged URL" value={out} readOnly rows={5} /> : <p className="text-sm text-fg2" role="alert">Enter a full website URL including https://</p>}</div></div>
}

export function MetaTags() {
  const [v, setV] = useState({ title: 'SHAFARE — All tools. One place.', desc: 'Calculators, converters, PDF, image and developer tools in your browser.', url: 'https://example.com', image: '' })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value })
  const q = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  const out = [`<title>${q(v.title)}</title>`, `<meta name="description" content="${q(v.desc)}">`, v.url && `<link rel="canonical" href="${q(v.url)}">`, `<meta property="og:title" content="${q(v.title)}">`, `<meta property="og:description" content="${q(v.desc)}">`, v.url && `<meta property="og:url" content="${q(v.url)}">`, v.image && `<meta property="og:image" content="${q(v.image)}">`, `<meta name="twitter:card" content="${v.image ? 'summary_large_image' : 'summary'}">`].filter(Boolean).join('\n')
  return <div className="grid gap-4 lg:grid-cols-2"><Panel className="space-y-3">{(['title', 'desc', 'url', 'image'] as const).map((k) => <Field key={k} label={{ title: 'Page title', desc: 'Description', url: 'Page URL', image: 'Image URL (optional)' }[k]}><Input value={v[k]} onChange={set(k)} />{k === 'title' && <span className="text-xs text-muted">{v.title.length} characters (aim for 60 or fewer)</span>}{k === 'desc' && <span className="text-xs text-muted">{v.desc.length} characters (aim for 160 or fewer)</span>}</Field>)}</Panel><Editor label="HTML" value={out} readOnly rows={12} filename="meta-tags.html" /></div>
}

const STOP = new Set('the a an and or but of to in on for with is are was were be been it this that as at by from not have has had you your we our they their i he she his her its can will would should about into than then so if'.split(' '))
export function Keywords() {
  const [t, setT] = useState('')
  const freq = new Map<string, number>(); (t.toLowerCase().match(/[a-z0-9']{3,}/g) ?? []).filter((w) => !STOP.has(w)).forEach((w) => freq.set(w, (freq.get(w) ?? 0) + 1))
  const top = [...freq].sort((a, b) => b[1] - a[1]).slice(0, 15)
  return <div className="space-y-4"><Editor label="Page text or article" value={t} onChange={setT} rows={9} placeholder="Paste your content to find its most-used keywords…" />
    {top.length > 0 && <><Result label="Keywords (comma separated)" value={top.map(([w]) => w).join(', ')} /><Panel><ul className="grid gap-1 text-sm sm:grid-cols-2">{top.map(([w, c]) => <li key={w} className="flex justify-between rounded-[8px] bg-fg/5 px-3 py-1.5"><span>{w}</span><span className="text-fg2">{c}×</span></li>)}</ul></Panel></>}</div>
}
