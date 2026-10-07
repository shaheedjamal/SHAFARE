interface Pt { label: string; value: number }
const nice = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n)))

export function LineChart({ data, height = 180, label }: { data: Pt[]; height?: number; label: string }) {
  const W = 600, H = height, pad = { l: 30, r: 10, t: 10, b: 22 }, max = Math.max(1, ...data.map((d) => d.value))
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, data.length - 1), y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b)
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${label}: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}>
      <defs><linearGradient id="lc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgb(var(--accent))" stopOpacity=".35" /><stop offset="1" stopColor="rgb(var(--accent))" stopOpacity="0" /></linearGradient></defs>
      {[0, 0.5, 1].map((t) => <g key={t}><line x1={pad.l} x2={W - pad.r} y1={y(max * t)} y2={y(max * t)} stroke="rgb(var(--line))" strokeDasharray="3 4" /><text x={pad.l - 6} y={y(max * t) + 4} textAnchor="end" fontSize="10" fill="rgb(var(--muted))">{nice(max * t)}</text></g>)}
      {data.length > 1 && <path d={`${line} L${x(data.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`} fill="url(#lc)" />}
      <path d={line} fill="none" stroke="rgb(var(--cyan))" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => <g key={i}><circle cx={x(i)} cy={y(d.value)} r="3" fill="rgb(var(--cyan))"><title>{`${d.label}: ${d.value}`}</title></circle>{(i % Math.ceil(data.length / 7) === 0 || i === data.length - 1) && <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="rgb(var(--muted))">{d.label}</text>}</g>)}
    </svg>
  )
}

export function BarChart({ data, height = 160, label }: { data: Pt[]; height?: number; label: string }) {
  const W = 600, H = height, pad = { t: 14, b: 22 }, max = Math.max(1, ...data.map((d) => d.value)), bw = W / data.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${label}: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}>
      <defs><linearGradient id="bc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgb(var(--cyan))" /><stop offset="1" stopColor="rgb(var(--accent))" /></linearGradient></defs>
      {data.map((d, i) => { const h = Math.max(d.value ? 3 : 1, (d.value / max) * (H - pad.t - pad.b)); return (
        <g key={i}><rect x={i * bw + bw * 0.2} y={H - pad.b - h} width={bw * 0.6} height={h} rx="5" fill={d.value ? 'url(#bc)' : 'rgb(var(--line))'}><title>{`${d.label}: ${d.value}`}</title></rect>
          {d.value > 0 && <text x={i * bw + bw / 2} y={H - pad.b - h - 4} textAnchor="middle" fontSize="10" fill="rgb(var(--fg2))">{d.value}</text>}
          <text x={i * bw + bw / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="rgb(var(--muted))">{d.label}</text></g>) })}
    </svg>
  )
}

export function HBars({ data, label }: { data: Pt[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return <ul aria-label={label} className="space-y-2.5">{data.map((d) => <li key={d.label}><div className="mb-1 flex justify-between text-xs"><span className="truncate pr-2 text-fg2">{d.label}</span><span className="font-medium">{d.value}</span></div><div className="h-2 overflow-hidden rounded bg-fg/10"><div className="btn-grad h-full rounded" style={{ width: `${(d.value / max) * 100}%` }} /></div></li>)}</ul>
}
