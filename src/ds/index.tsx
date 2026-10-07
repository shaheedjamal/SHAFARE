// SHAFARE design system. Every screen composes these; nothing is styled ad hoc twice.
import { ReactNode, useCallback, useEffect, useId, useRef, useState, KeyboardEvent } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { create } from 'zustand'
import { Button, CountUp, Panel, Skeleton } from '../ui'

export * from '../ui'
export { Particles } from './Particles'
export * from './charts'
export const Card = Panel

// ---- Toasts ----
interface T { id: number; kind: 'success' | 'error' | 'info'; text: string }
const useToasts = create<{ items: T[]; push: (k: T['kind'], t: string) => void; dismiss: (id: number) => void }>()((set) => ({
  items: [], dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
  push: (kind, text) => { const id = Date.now() + Math.random(); set((s) => ({ items: [...s.items.slice(-3), { id, kind, text }] })); setTimeout(() => useToasts.getState().dismiss(id), 4500) }
}))
export const toast = { success: (t: string) => useToasts.getState().push('success', t), error: (t: string) => useToasts.getState().push('error', t), info: (t: string) => useToasts.getState().push('info', t) }
export function ToastHost() {
  const { items, dismiss } = useToasts()
  const I = { success: CheckCircle2, error: AlertTriangle, info: Info }, C = { success: 'text-[#22C55E]', error: 'text-[#EF4444]', info: 'text-cyan' }
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-20 z-[90] flex flex-col items-end gap-2 md:bottom-6 md:right-6" role="status" aria-live="polite">
      {items.map((t) => { const Ic = I[t.kind]; return (
        <div key={t.id} className="glass toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[14px] p-3.5 text-sm"><Ic size={18} className={`mt-0.5 shrink-0 ${C[t.kind]}`} aria-hidden /><span className="flex-1">{t.text}</span>
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="text-muted hover:text-fg"><X size={16} /></button></div>) })}
    </div>
  )
}

// ---- Modal (focus-trapped, Esc to close, restores focus) ----
export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null), id = useId()
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null, o = document.body.style.overflow; document.body.style.overflow = 'hidden'
    const f = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])') ?? []).filter((e) => !e.hasAttribute('disabled'))
    setTimeout(() => (f()[0] ?? ref.current)?.focus(), 30)
    const k = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') { const l = f(); if (!l.length) return; const a = l[0], z = l[l.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() } }
    }
    addEventListener('keydown', k); return () => { removeEventListener('keydown', k); document.body.style.overflow = o; prev?.focus() }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} className="glass page-in max-h-[90vh] w-full max-w-md overflow-auto rounded-t-[22px] p-6 sm:rounded-[22px]">
        <div className="mb-4 flex items-start justify-between gap-3"><h2 id={id} className="text-lg font-semibold">{title}</h2><button onClick={onClose} aria-label="Close" className="rounded p-1 text-muted hover:text-fg"><X size={18} /></button></div>
        {children}{footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

// ---- Tabs ----
export function Tabs<T extends string>({ tabs, value, onChange, label = 'Sections' }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label?: string }) {
  const key = (e: KeyboardEvent, i: number) => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { e.preventDefault(); onChange(tabs[(i + d + tabs.length) % tabs.length].id) } }
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto rounded-[14px] border border-line bg-fg/5 p-1">
      {tabs.map((t, i) => <button key={t.id} role="tab" aria-selected={value === t.id} tabIndex={value === t.id ? 0 : -1} onKeyDown={(e) => key(e, i)} onClick={() => onChange(t.id)}
        className={`press shrink-0 rounded-[10px] px-4 py-2 text-sm font-medium transition ${value === t.id ? 'btn-grad text-white' : 'text-fg2 hover:text-fg'}`}>{t.label}</button>)}
    </div>
  )
}

// ---- Popover / Dropdown ----
export function Popover({ button, children, align = 'right', label }: { button: (p: { open: boolean; toggle: () => void }) => ReactNode; children: (close: () => void) => ReactNode; align?: 'left' | 'right'; label: string }) {
  const [open, setOpen] = useState(false), ref = useRef<HTMLDivElement>(null), close = useCallback(() => setOpen(false), [])
  useEffect(() => {
    if (!open) return
    const d = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && close(), k = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && close()
    addEventListener('mousedown', d); addEventListener('keydown', k); return () => { removeEventListener('mousedown', d); removeEventListener('keydown', k) }
  }, [open, close])
  return <div ref={ref} className="relative">{button({ open, toggle: () => setOpen(!open) })}{open && <div role="dialog" aria-label={label} className={`glass page-in absolute top-full z-50 mt-2 min-w-[14rem] rounded-[16px] p-1.5 ${align === 'right' ? 'right-0' : 'left-0'}`}>{children(close)}</div>}</div>
}
export interface MenuItem { label: string; onClick: () => void; icon?: ReactNode; danger?: boolean; hidden?: boolean }
export function Dropdown({ button, items, label, align }: { button: (p: { open: boolean; toggle: () => void }) => ReactNode; items: MenuItem[]; label: string; align?: 'left' | 'right' }) {
  return <Popover button={button} label={label} align={align}>{(close) => (
    <ul role="menu" onKeyDown={(e) => { const b = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button')), i = b.indexOf(document.activeElement as HTMLElement); if (e.key === 'ArrowDown') { e.preventDefault(); b[(i + 1) % b.length]?.focus() } if (e.key === 'ArrowUp') { e.preventDefault(); b[(i - 1 + b.length) % b.length]?.focus() } }}>
      {items.filter((i) => !i.hidden).map((i) => <li key={i.label} role="none"><button role="menuitem" onClick={() => { close(); i.onClick() }} className={`flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-sm hover:bg-fg/10 ${i.danger ? 'text-[#EF4444]' : ''}`}>{i.icon}{i.label}</button></li>)}
    </ul>)}</Popover>
}

// ---- Small parts ----
export const Switch = ({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) => (
  <div className="flex items-center justify-between gap-4 py-3"><div><div className="text-sm font-medium">{label}</div>{hint && <div className="mt-0.5 text-xs text-fg2">{hint}</div>}</div>
    <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`press relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-fg/20'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} /></button></div>
)
const TONES = { neutral: 'bg-fg/10 text-fg2', blue: 'bg-accent/15 text-cyan', green: 'bg-[#22C55E]/15 text-[#22C55E]', amber: 'bg-[#F59E0B]/15 text-[#F59E0B]', red: 'bg-[#EF4444]/15 text-[#EF4444]' }
export const Badge = ({ tone = 'neutral', children }: { tone?: keyof typeof TONES; children: ReactNode }) => <span className={`inline-flex items-center rounded-[8px] px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>
export function Avatar({ user, size = 36 }: { user: { name?: string; email?: string; avatar?: string } | null; size?: number }) {
  const initials = ((user?.name || user?.email || '?').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('') || '?').toUpperCase()
  return user?.avatar ? <img src={user.avatar} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
    : <span aria-hidden className="btn-grad inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials}</span>
}
export const EmptyState = ({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) => (
  <div className="glass rounded-[20px] px-6 py-12 text-center"><div className="icon-box mx-auto flex h-12 w-12 items-center justify-center rounded-[14px]">{icon}</div><p className="mt-4 font-semibold">{title}</p>{text && <p className="mx-auto mt-1 max-w-sm text-sm text-fg2">{text}</p>}{action && <div className="mt-5">{action}</div>}</div>
)
export const PageHeader = ({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>{sub && <p className="mt-1 text-sm text-fg2">{sub}</p>}</div>{action}</div>
)
export function StatCard({ label, value, format = (n) => String(Math.round(n)), hint, icon }: { label: string; value: number; format?: (n: number) => string; hint?: string; icon?: ReactNode }) {
  return <Panel className="!p-4"><div className="flex items-center justify-between text-xs text-fg2"><span>{label}</span>{icon && <span className="text-cyan">{icon}</span>}</div>
    <div className="font-display mt-2 text-3xl font-bold tracking-tight"><CountUp value={value} format={format} /></div>{hint && <div className="mt-1 text-xs text-muted">{hint}</div>}</Panel>
}
export const Notice = ({ tone = 'info', title, children }: { tone?: 'info' | 'success' | 'warning' | 'error'; title?: string; children?: ReactNode }) => {
  const c = { info: 'border-accent/40 bg-accent/10', success: 'border-[#22C55E]/40 bg-[#22C55E]/10', warning: 'border-[#F59E0B]/40 bg-[#F59E0B]/10', error: 'border-[#EF4444]/40 bg-[#EF4444]/10' }[tone]
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-[14px] border p-3.5 text-sm ${c}`}>{title && <div className="font-medium">{title}</div>}{children && <div className="text-fg2">{children}</div>}</div>
}

// ---- Table ----
export interface Column<R> { key: string; header: string; render?: (r: R) => ReactNode; className?: string }
export function Table<R>({ columns, rows, rowKey, loading, empty }: { columns: Column<R>[]; rows: R[]; rowKey: (r: R) => string; loading?: boolean; empty?: ReactNode }) {
  if (!loading && !rows.length) return <>{empty}</>
  return (
    <div className="glass table-wrap rounded-[18px]"><table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b border-line text-left text-xs text-muted">{columns.map((c) => <th key={c.key} scope="col" className={`px-4 py-3 font-medium ${c.className ?? ''}`}>{c.header}</th>)}</tr></thead>
      <tbody>{loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={columns.length} className="px-4 py-2"><Skeleton className="h-8" /></td></tr>)
        : rows.map((r) => <tr key={rowKey(r)} className="border-b border-line/60 last:border-0 hover:bg-fg/[.03]">{columns.map((c) => <td key={c.key} className={`px-4 py-3 align-middle ${c.className ?? ''}`}>{c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? '')}</td>)}</tr>)}</tbody></table></div>
  )
}
export const Pagination = ({ page, total, size, onChange }: { page: number; total: number; size: number; onChange: (p: number) => void }) => {
  const pages = Math.max(1, Math.ceil(total / size)); if (pages <= 1) return null
  return <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm text-fg2"><span>Page {page} of {pages} · {total} total</span><div className="flex gap-2"><Button variant="ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</Button><Button variant="ghost" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</Button></div></nav>
}
export const LoadingBlock = ({ rows = 3 }: { rows?: number }) => <div className="space-y-3" aria-busy="true" aria-label="Loading">{[...Array(rows)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
