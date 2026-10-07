import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, Copy, Download, Eraser, Lock, RotateCcw, Save, Share2, UploadCloud } from 'lucide-react'
import { useStore } from './store'

export const copyText = (s: string) => navigator.clipboard?.writeText(s)
export const shareText = async (s: string) => { if (navigator.share) { try { await navigator.share({ text: s }) } catch { /* cancelled */ } } else copyText(s) }
export const isNative = () => !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
export const downloadBlob = async (name: string, blob: Blob) => {
  if (isNative()) { // Android/iOS WebViews can't save blob links, so write a temp file and open the share sheet
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')])
    const data = await new Promise<string>((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.readAsDataURL(blob) })
    const f = await Filesystem.writeFile({ path: name, data, directory: Directory.Cache })
    await Share.share({ title: name, url: f.uri }); return
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click()
}
export const num = (s: string) => parseFloat(s)
export const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(2)} MB` : `${(n / 1024).toFixed(1)} KB`)

export const Button = ({ variant = 'primary', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }) => (
  <button {...p} className={`inline-flex items-center justify-center gap-2 rounded-[10px] px-4 h-10 text-sm font-medium transition active:scale-[.97] disabled:opacity-50 disabled:active:scale-100 ${
    variant === 'primary' ? 'btn-grad text-white' : 'border border-line bg-fg/5 text-fg hover:bg-fg/10'} ${className}`} />
)
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className={`h-10 w-full rounded-[10px] border border-line bg-surface2 px-3 text-sm text-fg placeholder:text-muted ${p.className ?? ''}`} />
)
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className="h-10 w-full rounded-[10px] border border-line bg-surface2 px-3 text-sm text-fg" />
)
export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block"><span className="mb-1.5 block text-xs font-medium text-fg2">{label}</span>{children}</label>
)
export const Panel = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`glass rounded-[20px] p-5 ${className}`}>{children}</div>
)
export const Skeleton = ({ className = 'h-24' }: { className?: string }) => <div className={`skeleton rounded-[14px] ${className}`} aria-hidden />

export const Result = ({ label, value }: { label: string; value: string }) => {
  const [ok, setOk] = useState(false)
  return (
    <div className="flex items-start gap-2 rounded-[12px] border border-line bg-surface2 p-3">
      <div className="min-w-0 flex-1"><div className="text-xs text-muted">{label}</div><div className="mt-0.5 break-all font-mono text-base">{value}</div></div>
      <button aria-label={`Copy ${label}`} onClick={() => { copyText(value); setOk(true); setTimeout(() => setOk(false), 1200) }} className="rounded p-1.5 text-fg2 hover:bg-fg/10">{ok ? <Check size={14} /> : <Copy size={14} />}</button>
    </div>
  )
}

export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const [v, setV] = useState(value); const from = useRef(value)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !isFinite(value)) { setV(value); from.current = value; return }
    const a = from.current, t0 = performance.now(); let raf = 0
    const tick = (t: number) => { const p = Math.min(1, (t - t0) / 450); const cur = a + (value - a) * (1 - Math.pow(1 - p, 3)); setV(cur); from.current = cur; if (p < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{format(v)}</>
}

export interface Part { label: string; value: number; color: string }
export function Donut({ parts }: { parts: Part[] }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1; const R = 42, C = 2 * Math.PI * R; let acc = 0
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0 -rotate-90" role="img" aria-label={parts.map((p) => `${p.label} ${Math.round((p.value / total) * 100)}%`).join(', ')}>
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgb(var(--line))" strokeWidth="12" />
        {parts.map((p) => { const len = Math.max(0, (p.value / total) * C); const el = <circle key={p.label} cx="50" cy="50" r={R} fill="none" stroke={p.color} strokeWidth="12" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} />; acc += len; return el })}
      </svg>
      <ul className="space-y-1.5 text-sm">{parts.map((p) => <li key={p.label} className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} /><span className="text-fg2">{p.label}</span><span className="font-medium">{Math.round((p.value / total) * 100)}%</span></li>)}</ul>
    </div>
  )
}

export function ResultCard({ caption, num: n, format, text, rows = [], parts, onReset }: { caption: string; num?: number; format?: (n: number) => string; text?: string; rows?: [string, string][]; parts?: Part[]; onReset?: () => void }) {
  const upsertNote = useStore((s) => s.upsertNote); const [msg, setMsg] = useState('')
  const main = n !== undefined && format ? format(n) : text ?? ''
  const copy = `${caption}: ${main}` + rows.map(([a, b]) => `\n${a}: ${b}`).join('')
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 1400) }
  return (
    <div className="glass page-in rounded-[20px] p-6" role="region" aria-label="Result" aria-live="polite">
      <div className="text-xs font-medium uppercase tracking-[.18em] text-muted">Result</div>
      <div className="grad-text mt-2 break-all text-4xl font-semibold tracking-tight">{n !== undefined && format ? <CountUp value={n} format={format} /> : main}</div>
      <div className="mt-1 text-sm text-fg2">{caption}</div>
      {rows.length > 0 && <dl className="mt-5 grid gap-4 sm:grid-cols-3">{rows.map(([a, b]) => <div key={a}><dt className="text-xs text-muted">{a}</dt><dd className="mt-0.5 break-all font-medium">{b}</dd></div>)}</dl>}
      {parts && <div className="mt-5"><Donut parts={parts} /></div>}
      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="ghost" onClick={() => { copyText(copy); flash('Copied') }}><Copy size={16} />Copy Result</Button>
        <Button variant="ghost" onClick={() => shareText(copy)}><Share2 size={16} />Share</Button>
        <Button variant="ghost" onClick={() => { upsertNote({ id: crypto.randomUUID(), title: caption, body: copy, pinned: false, updated: Date.now() }); flash('Saved to Notes') }}><Save size={16} />Save</Button>
        {onReset && <Button variant="ghost" onClick={onReset}><RotateCcw size={16} />Reset</Button>}
        <span className="self-center text-xs text-cyan" role="status">{msg}</span>
      </div>
    </div>
  )
}

export function Editor({ label, value, onChange, readOnly, rows = 10, filename, placeholder }: { label: string; value: string; onChange?: (v: string) => void; readOnly?: boolean; rows?: number; filename?: string; placeholder?: string }) {
  const [ok, setOk] = useState(false)
  const btn = 'rounded p-1.5 text-fg2 hover:bg-fg/10'
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-surface2">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
        <span className="text-xs font-medium text-fg2">{label}</span>
        <div className="flex gap-0.5">
          <button aria-label={`Copy ${label}`} className={btn} onClick={() => { copyText(value); setOk(true); setTimeout(() => setOk(false), 1200) }}>{ok ? <Check size={14} /> : <Copy size={14} />}</button>
          {filename && <button aria-label={`Download ${label}`} className={btn} onClick={() => downloadBlob(filename, new Blob([value]))}><Download size={14} /></button>}
          {!readOnly && onChange && <button aria-label={`Clear ${label}`} className={btn} onClick={() => onChange('')}><Eraser size={14} /></button>}
        </div>
      </div>
      <textarea aria-label={label} value={value} readOnly={readOnly} placeholder={placeholder} rows={rows} spellCheck={false}
        onChange={(e) => onChange?.(e.target.value)} className="block w-full resize-y bg-transparent p-3 font-mono text-sm text-fg outline-none placeholder:text-muted" />
    </div>
  )
}

export function Dropzone({ accept, multiple, onFiles, label = 'Drop your file here' }: { accept?: string; multiple?: boolean; onFiles: (f: File[]) => void; label?: string }) {
  const [over, setOver] = useState(false); const ref = useRef<HTMLInputElement>(null)
  return (
    <div onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const f = Array.from(e.dataTransfer.files); if (f.length) onFiles(multiple ? f : f.slice(0, 1)) }}
      className={`rounded-[18px] border border-dashed p-8 text-center transition ${over ? 'border-cyan bg-cyan/10' : 'border-line bg-fg/[.03]'}`}>
      <div className="icon-box mx-auto flex h-12 w-12 items-center justify-center rounded-[14px]"><UploadCloud size={22} /></div>
      <p className="mt-3 font-medium">{label}</p>
      <p className="mt-1 text-xs text-fg2">Drag &amp; drop your file{multiple ? 's' : ''} or browse from your device.</p>
      <Button variant="ghost" className="mt-4" onClick={() => ref.current?.click()}>Browse files</Button>
      <input ref={ref} type="file" hidden accept={accept} multiple={multiple} aria-label="Choose files" onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) onFiles(f); e.target.value = '' }} />
    </div>
  )
}

export const Progress = ({ value, label }: { value: number; label: string }) => (
  <div><div className="mb-1.5 flex justify-between text-xs text-fg2"><span>{label}</span><span>{Math.round(value)}%</span></div>
    <div role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded bg-fg/10"><div className="btn-grad h-full rounded transition-[width] duration-200" style={{ width: `${value}%` }} /></div></div>
)
export const ErrorState = ({ onRetry, title = "We couldn't process this file", text = 'Please check that the file is valid and try again.' }: { onRetry: () => void; title?: string; text?: string }) => (
  <div role="alert" className="rounded-[16px] border border-[#EF4444]/40 bg-[#EF4444]/10 p-5 text-center">
    <AlertTriangle className="mx-auto text-[#EF4444]" size={22} /><p className="mt-2 font-medium">{title}</p><p className="mt-1 text-sm text-fg2">{text}</p>
    <Button variant="ghost" className="mt-3" onClick={onRetry}>Try Again</Button></div>
)
export const LocalBadge = () => <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#22C55E]/30 bg-[#22C55E]/10 px-2 py-1 text-xs text-[#22C55E]"><Lock size={12} />Processed locally</span>
