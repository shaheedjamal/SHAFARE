import { ReactNode, useState } from 'react'
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib'
import { Download } from 'lucide-react'
import { Button, Dropzone, ErrorState, Field, Input, LocalBadge, Panel, Progress, Select, Skeleton, downloadBlob, kb } from '../ui'

const bytesOf = (f: File) => f.arrayBuffer()
const loadPdf = async (f: File) => PDFDocument.load(await bytesOf(f), { ignoreEncryption: false })

function PdfOp({ multi, accept = 'application/pdf', opts, run, name, cta, label }: { multi?: boolean; accept?: string; opts?: ReactNode; run: (files: File[]) => Promise<Uint8Array>; name: string; cta: string; label?: string }) {
  const [files, setFiles] = useState<File[]>([]); const [out, setOut] = useState<Blob | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState(false)
  const go = async () => { setBusy(true); setErr(false); setOut(null); try { setOut(new Blob([(await run(files)) as unknown as BlobPart], { type: 'application/pdf' })) } catch { setErr(true) } setBusy(false) }
  if (!files.length) return <Dropzone accept={accept} multiple={multi} onFiles={setFiles} label={label ?? (multi ? 'Drop your files here' : 'Drop your PDF here')} />
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3"><LocalBadge /><Button variant="ghost" className="ml-auto" onClick={() => { setFiles([]); setOut(null) }}>Choose different files</Button></div>
      <Panel><ul className="divide-y divide-line text-sm">{files.map((f, i) => <li key={i} className="flex justify-between gap-3 py-2"><span className="truncate">{f.name}</span><span className="shrink-0 text-fg2">{kb(f.size)}</span></li>)}</ul></Panel>
      {opts && <Panel className="space-y-3">{opts}</Panel>}
      <Button disabled={busy} onClick={go}>{busy ? 'Working…' : cta}</Button>
      {busy && <Skeleton className="h-12" />}
      {err && <ErrorState onRetry={go} />}
      {out && <Panel className="page-in flex flex-wrap items-center justify-between gap-3"><div><div className="font-medium">Your file is ready</div><div className="text-xs text-fg2">{kb(out.size)}</div></div><Button onClick={() => downloadBlob(name, out)}><Download size={16} />Download PDF</Button></Panel>}
    </div>
  )
}

export const ImageToPdf = () => <PdfOp multi accept="image/*" label="Drop your images here" name="images.pdf" cta="Create PDF" run={async (files) => {
  const doc = await PDFDocument.create()
  for (const f of files) {
    let img
    if (f.type === 'image/png') img = await doc.embedPng(await bytesOf(f)); else if (f.type === 'image/jpeg') img = await doc.embedJpg(await bytesOf(f))
    else { const bmp = await createImageBitmap(f); const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height; c.getContext('2d')!.drawImage(bmp, 0, 0); const b = await new Promise<Blob>((r) => c.toBlob((x) => r(x!), 'image/png')); img = await doc.embedPng(await b.arrayBuffer()) }
    doc.addPage([img.width, img.height]).drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
  }
  return doc.save()
}} />

export const Merge = () => <PdfOp multi name="merged.pdf" cta="Merge PDFs" label="Drop two or more PDFs here" run={async (files) => {
  if (files.length < 2) throw new Error('need two')
  const out = await PDFDocument.create()
  for (const f of files) { const s = await loadPdf(f); (await out.copyPages(s, s.getPageIndices())).forEach((p) => out.addPage(p)) }
  return out.save()
}} />

export function Split() {
  const [range, setRange] = useState('1-2')
  return <PdfOp name="extracted.pdf" cta="Extract pages" opts={<Field label="Pages to keep (e.g. 1-3, 5)"><Input value={range} onChange={(e) => setRange(e.target.value)} /></Field>} run={async ([f]) => {
    const src = await loadPdf(f), idx = new Set<number>()
    for (const part of range.split(',')) { const [a, b] = part.split('-').map((x) => parseInt(x.trim())); for (let i = a; i <= (b || a); i++) if (i >= 1 && i <= src.getPageCount()) idx.add(i - 1) }
    if (!idx.size) throw new Error('empty range')
    const out = await PDFDocument.create(); (await out.copyPages(src, [...idx].sort((x, y) => x - y))).forEach((p) => out.addPage(p)); return out.save()
  }} />
}

export function RotatePdf() {
  const [a, setA] = useState('90')
  return <PdfOp name="rotated.pdf" cta="Rotate pages" opts={<Field label="Rotate all pages clockwise"><Select value={a} onChange={(e) => setA(e.target.value)}>{['90', '180', '270'].map((d) => <option key={d} value={d}>{d}°</option>)}</Select></Field>} run={async ([f]) => {
    const d = await loadPdf(f); d.getPages().forEach((p) => p.setRotation(degrees((p.getRotation().angle + +a) % 360))); return d.save()
  }} />
}

export const PageNumbers = () => <PdfOp name="numbered.pdf" cta="Add page numbers" run={async ([f]) => {
  const d = await loadPdf(f), font = await d.embedFont(StandardFonts.Helvetica), pages = d.getPages()
  pages.forEach((p, i) => { const t = `${i + 1} / ${pages.length}`, w = font.widthOfTextAtSize(t, 10); p.drawText(t, { x: (p.getWidth() - w) / 2, y: 20, size: 10, font, color: rgb(0.3, 0.3, 0.3) }) })
  return d.save()
}} />

export function Watermark() {
  const [t, setT] = useState('CONFIDENTIAL')
  return <PdfOp name="watermarked.pdf" cta="Add watermark" opts={<Field label="Watermark text"><Input value={t} onChange={(e) => setT(e.target.value)} /></Field>} run={async ([f]) => {
    const d = await loadPdf(f), font = await d.embedFont(StandardFonts.HelveticaBold)
    d.getPages().forEach((p) => { const { width: w, height: h } = p.getSize(), s = Math.min(w, h) / 9, tw = font.widthOfTextAtSize(t, s); p.drawText(t, { x: w / 2 - (tw / 2) * Math.SQRT1_2, y: h / 2 - (tw / 2) * Math.SQRT1_2, size: s, font, color: rgb(0.5, 0.5, 0.5), opacity: 0.25, rotate: degrees(45) }) })
    return d.save()
  }} />
}

export function Metadata() {
  const [m, setM] = useState({ title: '', author: '', subject: '', keywords: '' }); const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setM({ ...m, [k]: e.target.value })
  return <PdfOp name="metadata.pdf" cta="Save metadata" opts={<div className="grid gap-3 sm:grid-cols-2">{(['title', 'author', 'subject', 'keywords'] as const).map((k) => <Field key={k} label={k[0].toUpperCase() + k.slice(1)}><Input value={m[k]} onChange={set(k)} /></Field>)}</div>} run={async ([f]) => {
    const d = await loadPdf(f); if (m.title) d.setTitle(m.title); if (m.author) d.setAuthor(m.author); if (m.subject) d.setSubject(m.subject); if (m.keywords) d.setKeywords(m.keywords.split(',').map((k) => k.trim())); return d.save()
  }} />
}

export function PdfToImage() {
  const [pages, setPages] = useState<{ url: string; blob: Blob }[]>([]); const [pct, setPct] = useState(0); const [busy, setBusy] = useState(false); const [err, setErr] = useState(false); const [name, setName] = useState('')
  const run = async (f: File) => {
    setBusy(true); setErr(false); setPages([]); setPct(0); setName(f.name.replace(/\.pdf$/i, ''))
    try {
      const pdfjs = await import('pdfjs-dist'); pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
      const doc = await pdfjs.getDocument({ data: await bytesOf(f) }).promise
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i), vp = page.getViewport({ scale: 2 }), c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height
        await page.render({ canvasContext: c.getContext('2d')!, viewport: vp }).promise
        const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/png')); setPages((p) => [...p, { url: URL.createObjectURL(blob), blob }]); setPct((i / doc.numPages) * 100)
      }
    } catch { setErr(true) }
    setBusy(false)
  }
  if (!pages.length && !busy && !err) return <Dropzone accept="application/pdf" onFiles={(f) => run(f[0])} label="Drop your PDF here" />
  return (
    <div className="space-y-4"><div className="flex items-center gap-3"><LocalBadge /><Button variant="ghost" className="ml-auto" disabled={busy} onClick={() => { setPages([]); setErr(false) }}>Choose another PDF</Button></div>
      {busy && <Progress value={pct} label="Converting pages…" />}
      {err && <ErrorState onRetry={() => { setErr(false); setPages([]) }} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{pages.map((p, i) => <Panel key={p.url} className="space-y-3"><img src={p.url} alt={`Page ${i + 1}`} className="w-full rounded-[10px] bg-white" /><Button variant="ghost" className="w-full" onClick={() => downloadBlob(`${name}-page-${i + 1}.png`, p.blob)}><Download size={16} />Page {i + 1} (PNG)</Button></Panel>)}</div></div>
  )
}
