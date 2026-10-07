import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity as Pulse, ShieldCheck } from 'lucide-react'
import { me } from '../../api'
import { useSession } from '../../state/session'
import { today, useStore } from '../../store'
import { byId } from '../../registry'
import { BarChart, Card, EmptyState, LoadingBlock, Notice, PageHeader, Tabs, Button } from '../../ds'
import { ago, useAsync } from '../../lib/hooks'

const LABEL: Record<string, string> = { login_success: 'Signed in', login_failed: 'Failed sign-in attempt', register: 'Account created', password_changed: 'Password changed', password_reset_completed: 'Password reset', profile_updated: 'Profile updated', avatar_updated: 'Profile photo updated', session_revoked: 'Device signed out', logout_all: 'Signed out of all devices', email_verified: 'Email verified' }
export const lastDays = (usage: Record<string, number>, n: number) => [...Array(n)].map((_, i) => { const d = new Date(Date.now() - (n - 1 - i) * 864e5); return { label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3), value: usage[d.toISOString().slice(0, 10)] ?? 0 } })

function Account_() {
  const r = useAsync(() => me.activity(), [])
  if (r.loading) return <LoadingBlock rows={4} />
  if (r.error) return <Notice tone="error" title="Couldn’t load activity">{r.error} <button className="underline" onClick={r.reload}>Try again</button></Notice>
  if (!r.data?.items.length) return <EmptyState icon={<ShieldCheck size={22} />} title="No account activity yet" text="Sign-ins and security changes will be listed here." />
  return <Card className="divide-y divide-line !py-1">{r.data.items.map((e) => <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><div className="text-sm font-medium">{LABEL[e.type] ?? e.type}</div><div className="max-w-md truncate text-xs text-muted">{e.ua || 'Unknown device'} · {e.ip}</div></div><span className="text-xs text-fg2">{ago(e.at)}</span></div>)}</Card>
}
function Tools_() {
  const { history, usage, clearHistory } = useStore(); void today
  return history.length ? <div className="space-y-4"><Card><h2 className="mb-2 text-sm font-medium">Tool opens, last 14 days</h2><BarChart data={lastDays(usage, 14)} label="Tool opens per day" /></Card>
    <Card className="divide-y divide-line !py-1">{history.map((h) => { const t = byId(h.id); return t ? <Link key={h.id} to={`/tools/${t.id}`} className="flex items-center gap-3 py-3 text-sm hover:text-cyan"><t.icon size={16} className="text-cyan" aria-hidden />{t.name}<span className="ml-auto text-xs text-muted">{ago(h.at)}</span></Link> : null })}</Card>
    <Button variant="ghost" onClick={clearHistory}>Clear tool history</Button></div>
    : <EmptyState icon={<Pulse size={22} />} title="Nothing here yet" text="Tools you open will show up here." action={<Link to="/tools"><Button>Browse tools</Button></Link>} />
}
export default function Activity() {
  const authed = useSession((s) => s.status) === 'authed', [tab, setTab] = useState<'tools' | 'account'>('tools')
  return (
    <main className="page-in mx-auto max-w-2xl px-4 py-10"><PageHeader title="Activity" sub="Your recent tool usage and account events." />
      {authed ? <div className="mb-5"><Tabs tabs={[{ id: 'tools', label: 'Tool usage' }, { id: 'account', label: 'Account security' }]} value={tab} onChange={setTab} /></div> : <div className="mb-5"><Notice tone="info">Sign in to also see account security events. <Link to="/login?next=/activity" className="text-cyan underline">Sign in</Link></Notice></div>}
      {tab === 'tools' || !authed ? <Tools_ /> : <Account_ />}</main>
  )
}
