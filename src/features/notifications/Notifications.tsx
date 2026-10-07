import { Link } from 'react-router-dom'
import { Bell, ShieldAlert, Megaphone, Info } from 'lucide-react'
import { Popover, Button, EmptyState, PageHeader, Card, LoadingBlock, Notice } from '../../ds'
import { useNotifications } from '../../state/notifications'
import { ago } from '../../lib/hooks'
import { Note } from '../../api'

const Icon = ({ kind }: { kind: string }) => kind === 'security' ? <ShieldAlert size={16} className="text-[#F59E0B]" aria-hidden /> : kind === 'announcement' ? <Megaphone size={16} className="text-cyan" aria-hidden /> : <Info size={16} className="text-cyan" aria-hidden />
const Row = ({ n, onClick }: { n: Note; onClick: () => void }) => (
  <button onClick={onClick} className={`flex w-full gap-3 rounded-[12px] px-3 py-3 text-left hover:bg-fg/10 ${n.read ? 'opacity-70' : ''}`}><span className="mt-0.5"><Icon kind={n.kind} /></span>
    <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-medium">{n.title}{!n.read && <i className="h-2 w-2 rounded-full bg-cyan" aria-label="Unread" />}</span><span className="mt-0.5 block text-xs text-fg2">{n.body}</span><span className="mt-1 block text-[11px] text-muted">{ago(n.at)}</span></span></button>
)

export function NotificationBell() {
  const { items, unread, refresh, markOne, markAll } = useNotifications()
  return (
    <Popover label="Notifications" button={({ open, toggle }) => (
      <button onClick={() => { toggle(); if (!open) void refresh() }} aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} aria-expanded={open} className="press relative flex h-10 w-10 items-center justify-center rounded-[10px] border border-line bg-fg/5 hover:bg-fg/10">
        <Bell size={18} />{unread > 0 && <span className="btn-grad absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}</button>)}>
      {(close) => <div className="w-[min(22rem,calc(100vw-2rem))]">
        <div className="flex items-center justify-between px-3 py-2"><span className="text-sm font-semibold">Notifications</span>{unread > 0 && <button onClick={() => void markAll()} className="text-xs text-cyan">Mark all read</button>}</div>
        <div className="max-h-80 overflow-auto">{items.slice(0, 6).map((n) => <Row key={n.id} n={n} onClick={() => void markOne(n.id)} />)}{!items.length && <p className="px-3 py-8 text-center text-sm text-muted">You’re all caught up.</p>}</div>
        <Link to="/notifications" onClick={close} className="block border-t border-line px-3 py-2.5 text-center text-sm text-cyan">View all</Link></div>}
    </Popover>
  )
}

export function NotificationsPage() {
  const { items, loading, error, unread, refresh, markOne, markAll } = useNotifications()
  return (
    <main className="page-in mx-auto max-w-2xl px-4 py-10"><PageHeader title="Notifications" sub={unread ? `${unread} unread` : 'Everything is read'} action={unread > 0 ? <Button variant="ghost" onClick={() => void markAll()}>Mark all read</Button> : undefined} />
      {error && <Notice tone="error" title="Couldn’t load notifications">{error} <button className="underline" onClick={() => void refresh()}>Try again</button></Notice>}
      {loading && !items.length ? <LoadingBlock /> : items.length ? <Card className="!p-2">{items.map((n) => <Row key={n.id} n={n} onClick={() => void markOne(n.id)} />)}</Card> : !error && <EmptyState icon={<Bell size={22} />} title="No notifications yet" text="Security alerts and announcements will appear here." />}</main>
  )
}
