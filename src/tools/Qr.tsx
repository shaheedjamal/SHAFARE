import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { Download } from 'lucide-react'
import { Button, Field, Panel, Result, downloadBlob } from '../ui'

export function QrGenerator() {
  const [text, setText] = useState('https://')
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (!text.trim()) return setUrl('')
    QRCode.toDataURL(text, { width: 512, margin: 2 }).then(setUrl).catch(() => setUrl(''))
  }, [text])
  return (
    <Panel className="mx-auto max-w-md space-y-3">
      <Field label="Text or URL"><textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="w-full rounded-[10px] border border-line bg-surface2 p-3 text-sm" /></Field>
      {url && <img src={url} alt="Generated QR code" width={256} height={256} className="mx-auto rounded-[10px] bg-white" />}
      {url && <Button className="w-full" onClick={async () => downloadBlob('qr-code.png', await (await fetch(url)).blob())}><Download size={16} />Download PNG</Button>}
    </Panel>
  )
}

export function QrScanner() {
  const video = useRef<HTMLVideoElement>(null); const [result, setResult] = useState(''); const [err, setErr] = useState(''); const [on, setOn] = useState(false)
  useEffect(() => {
    if (!on) return
    let raf = 0, stream: MediaStream | undefined, stop = false
    const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then((s) => {
      stream = s; const v = video.current!; v.srcObject = s; v.play()
      const tick = () => {
        if (stop) return
        if (v.readyState === v.HAVE_ENOUGH_DATA) {
          canvas.width = v.videoWidth; canvas.height = v.videoHeight; ctx.drawImage(v, 0, 0)
          const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)
          if (code) { setResult(code.data); setOn(false); return }
        }
        raf = requestAnimationFrame(tick)
      }
      tick()
    }).catch(() => { setErr('Camera access was denied or is unavailable.'); setOn(false) })
    return () => { stop = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()) }
  }, [on])
  return (
    <Panel className="mx-auto max-w-md space-y-3">
      {on && <video ref={video} playsInline muted className="aspect-square w-full rounded-[10px] bg-surface2 object-cover" />}
      <Button className="w-full" onClick={() => { setErr(''); setResult(''); setOn(!on) }}>{on ? 'Stop camera' : 'Start scanning'}</Button>
      {err && <p className="text-sm text-fg2" role="alert">{err}</p>}
      {result && <Result label="Decoded" value={result} />}
    </Panel>
  )
}
