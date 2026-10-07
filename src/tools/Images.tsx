import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { Button, Dropzone, ErrorState, Field, Input, LocalBadge, Panel, Result, Select, Skeleton, downloadBlob, kb } from '../ui'

const load = (f: File) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(f) })
const toBlob = (c: HTMLCanvasElement, type: string, q = 0.9) => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('encode failed'))), type, q))
const canvas = (w: number, h: number, bg?: string) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d')!; if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h) } return { c, x } }
const ext = (t: string) => (t === 'image/jpeg' ? 'jpg' : t.split('/')[1])

function ImgTool({ opts, run, deps, suffix }: { opts?: ReactNode; run: (img: HTMLImageElement, f: File) => Promise<Blob>; deps: unknown[]; suffix: string }) {
  const [file, setFile] = useState<File | null>(null); const [out, setOut] = useState<Blob | null>(null); const [err, setErr] = useState(false); const [tick, setTick] = useState(0)
  const before = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]); const after = useMemo(() => (out ? URL.createObjectURL(out) : ''), [out])
  useEffect(() => {
    if (!file) return; let dead = false; setOut(null); setErr(false)
    load(file).then((i) => run(i, file)).then((b) => !dead && setOut(b)).catch(() => !dead && setErr(true))
    return () => { dead = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, tick, ...deps])
  if (!file) return <Dropzone accept="image/*" onFiles={(f) => setFile(f[0])} label="Drop your image here" />
  const name = file.name.replace(/\.[^.]+$/, '') + `-${suffix}.` + (out ? ext(out.type) : 'png')
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3"><LocalBadge /><span className="text-sm text-fg2">{file.name}</span><Button variant="ghost" className="ml-auto" onClick={() => { setFile(null); setOut(null) }}>Choose another</Button></div>
      {opts && <Panel className="space-y-3">{opts}</Panel>}
      {err ? <ErrorState onRetry={() => setTick(tick + 1)} /> : (
        <div className="grid gap-4 md:grid-cols-2">
          <Panel><div className="mb-2 flex justify-between text-xs text-fg2"><span>Before</span><span>{kb(file.size)}</span></div><img src={before} alt="Original" className="max-h-72 w-full rounded-[12px] object-contain" /></Panel>
          <Panel><div className="mb-2 flex justify-between text-xs text-fg2"><span>After</span><span>{out ? kb(out.size) : 'Processing…'}</span></div>
            {out ? <img src={after} alt="Result preview" className="max-h-72 w-full rounded-[12px] object-contain" /> : <Skeleton className="h-56" />}</Panel>
        </div>)}
      {out && <Button className="w-full sm:w-auto" onClick={() => downloadBlob(name, out)}><Download size={16} />Download</Button>}
    </div>
  )
}
const Slider = ({ label, v, set, min = 0.1, max = 1, step = 0.05, pct = true }: { label: string; v: number; set: (n: number) => void; min?: number; max?: number; step?: number; pct?: boolean }) => (
  <Field label={`${label}: ${pct ? Math.round(v * 100) + '%' : v}`}><input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(+e.target.value)} className="w-full accent-[rgb(var(--accent))]" /></Field>
)

export function Compress() {
  const [q, setQ] = useState(0.7)
  return <ImgTool suffix="compressed" deps={[q]} opts={<Slider label="Quality" v={q} set={setQ} />}
    run={async (i) => { const { c, x } = canvas(i.naturalWidth, i.naturalHeight, '#fff'); x.drawImage(i, 0, 0); return toBlob(c, 'image/jpeg', q) }} />
}
export function Resize() {
  const [w, setW] = useState('800'); const [h, setH] = useState('')
  return <ImgTool suffix="resized" deps={[w, h]} opts={<><div className="grid grid-cols-2 gap-3"><Field label="Width (px)"><Input value={w} onChange={(e) => setW(e.target.value)} inputMode="numeric" /></Field><Field label="Height (px)"><Input value={h} placeholder="Auto" onChange={(e) => setH(e.target.value)} inputMode="numeric" /></Field></div><p className="text-xs text-muted">Leave one field empty to keep the aspect ratio.</p></>}
    run={async (i) => { const W = parseInt(w), H = parseInt(h), r = i.naturalWidth / i.naturalHeight; const cw = W || (H ? Math.round(H * r) : i.naturalWidth), ch = H || Math.round(cw / r); const { c, x } = canvas(cw, ch); x.drawImage(i, 0, 0, cw, ch); return toBlob(c, 'image/png') }} />
}
export function Crop() {
  const [v, setV] = useState({ x: '0', y: '0', w: '', h: '' }); const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value })
  return <ImgTool suffix="cropped" deps={[v]} opts={<><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{(['x', 'y', 'w', 'h'] as const).map((k) => <Field key={k} label={{ x: 'Left (px)', y: 'Top (px)', w: 'Width (px)', h: 'Height (px)' }[k]}><Input value={v[k]} placeholder={k === 'w' || k === 'h' ? 'Rest' : '0'} inputMode="numeric" onChange={set(k)} /></Field>)}</div></>}
    run={async (i) => { const x = Math.max(0, parseInt(v.x) || 0), y = Math.max(0, parseInt(v.y) || 0), w = Math.min(parseInt(v.w) || i.naturalWidth - x, i.naturalWidth - x), h = Math.min(parseInt(v.h) || i.naturalHeight - y, i.naturalHeight - y); if (w <= 0 || h <= 0) throw new Error('bad crop'); const o = canvas(w, h); o.x.drawImage(i, x, y, w, h, 0, 0, w, h); return toBlob(o.c, 'image/png') }} />
}
export function Rotate() {
  const [a, setA] = useState('90')
  return <ImgTool suffix="rotated" deps={[a]} opts={<Field label="Rotate clockwise"><Select value={a} onChange={(e) => setA(e.target.value)}>{['90', '180', '270'].map((d) => <option key={d} value={d}>{d}°</option>)}</Select></Field>}
    run={async (i) => { const d = +a, sw = d % 180 !== 0; const { c, x } = canvas(sw ? i.naturalHeight : i.naturalWidth, sw ? i.naturalWidth : i.naturalHeight); x.translate(c.width / 2, c.height / 2); x.rotate((d * Math.PI) / 180); x.drawImage(i, -i.naturalWidth / 2, -i.naturalHeight / 2); return toBlob(c, 'image/png') }} />
}
function Convert({ type, fixed }: { type: string; fixed: boolean }) {
  const [t, setT] = useState(type); const [q, setQ] = useState(0.92)
  return <ImgTool suffix="converted" deps={[t, q]} opts={<>{!fixed && <Field label="Convert to"><Select value={t} onChange={(e) => setT(e.target.value)}><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></Select></Field>}{t !== 'image/png' && <Slider label="Quality" v={q} set={setQ} />}</>}
    run={async (i) => { const { c, x } = canvas(i.naturalWidth, i.naturalHeight, t === 'image/jpeg' ? '#fff' : undefined); x.drawImage(i, 0, 0); return toBlob(c, t, q) }} />
}
export const FormatConverter = () => <Convert type="image/webp" fixed={false} />
export const JpgToPng = () => <Convert type="image/png" fixed />
export const PngToJpg = () => <Convert type="image/jpeg" fixed />
export const WebpConverter = () => <Convert type="image/webp" fixed />

export function ImageInfo() {
  const [info, setInfo] = useState<{ f: File; w: number; h: number; url: string } | null>(null); const [err, setErr] = useState(false)
  const pick = async (f: File) => { setErr(false); try { const i = await load(f); setInfo({ f, w: i.naturalWidth, h: i.naturalHeight, url: i.src }) } catch { setErr(true) } }
  const g = (a: number, b: number): number => (b ? g(b, a % b) : a)
  if (err) return <ErrorState onRetry={() => setErr(false)} />
  if (!info) return <Dropzone accept="image/*" onFiles={(f) => pick(f[0])} label="Drop an image to inspect" />
  const { f, w, h } = info, d = g(w, h)
  return (
    <div className="grid gap-4 lg:grid-cols-2"><Panel><img src={info.url} alt="Preview" className="max-h-72 w-full rounded-[12px] object-contain" /><Button variant="ghost" className="mt-3" onClick={() => setInfo(null)}>Choose another</Button></Panel>
      <Panel className="space-y-2"><LocalBadge />{([['File name', f.name], ['Dimensions', `${w} × ${h} px`], ['Aspect ratio', `${w / d}:${h / d}`], ['Megapixels', ((w * h) / 1e6).toFixed(2)], ['Type', f.type || 'Unknown'], ['File size', kb(f.size)], ['Last modified', new Date(f.lastModified).toLocaleString()]] as [string, string][]).map(([l, v]) => <Result key={l} label={l} value={v} />)}
        <p className="text-xs text-muted">Shows basic file properties. Camera EXIF data is not read.</p></Panel></div>
  )
}
