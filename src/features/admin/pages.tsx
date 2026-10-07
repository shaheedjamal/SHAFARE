import { useState } from 'react'
import { Download, MoreHorizontal, Plus, ShieldAlert, Trash2, Users as UsersIcon, UserCheck, Activity as Pulse, Ban } from 'lucide-react'
import { api } from '../../api/client'
import { useSession, can } from '../../state/session'
import { byId, tools } from '../../registry'
import { Avatar, Badge, BarChart, Button, Card, Column, Dropdown, EmptyState, Field, HBars, Input, LineChart, LoadingBlock, Modal, Notice, PageHeader, Pagination, Select, StatCard, Switch, Table, downloadBlob, toast } from '../../ds'
import { ago, useAsync, useDebounced } from '../../lib/hooks'

const fail = (e: unknown) => toast.error((e as Error).message)
const when = (t: number) => (t ? new Date(t).toLocaleString() : '—')
const Err = ({ msg, retry }: { msg: string; retry: () => void }) => <Notice tone="error" title="Couldn’t load this page">{msg} <button className="underline" onClick={retry}>Try again</button></Notice>
const short = (d: string) => d.slice(5)

interface Overview { totals: Record<string, number>; series: { day: string; signups: number; logins: number; opens: number }[]; topTools: { id: string; n: number }[]; security24h: Record<string, number>; recentEvents: Ev[] }
interface Ev { id: string; at: number; type: string; level: 'info' | 'warn' | 'critical'; email: string | null; ip: string | null; detail: string }
const LEVEL = { info: 'neutral', warn: 'amber', critical: 'red' } as const
const evCols: Column<Ev>[] = [
  { key: 'at', header: 'Time', render: (e) => <span className="whitespace-nowrap text-fg2">{when(e.at)}</span> },
  { key: 'level', header: 'Level', render: (e) => <Badge tone={LEVEL[e.level]}>{e.level}</Badge> }, { key: 'type', header: 'Event', render: (e) => <span className="font-mono text-xs">{e.type}</span> },
  { key: 'email', header: 'User', render: (e) => e.email ?? '—' }, { key: 'ip', header: 'IP', render: (e) => <span className="font-mono text-xs">{e.ip ?? '—'}</span> }, { key: 'detail', header: 'Detail', render: (e) => <span className="text-fg2">{e.detail}</span> }
]

export function Overview() {
  const r = useAsync(() => api.get<Overview>('/admin/overview'), [])
  if (r.loading) return <LoadingBlock rows={4} />
  if (r.error || !r.data) return <Err msg={r.error ?? ''} retry={r.reload} />
  const { totals: t, series, security24h: s } = r.data
  return (
    <div className="space-y-6"><PageHeader title="Overview" sub="Platform health at a glance." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><StatCard label="Total users" value={t.users} icon={<UsersIcon size={16} />} /><StatCard label="New this week" value={t.newThisWeek} icon={<UserCheck size={16} />} /><StatCard label="Active this week" value={t.activeThisWeek} icon={<Pulse size={16} />} /><StatCard label="Verified" value={t.users ? (t.verified / t.users) * 100 : 0} format={(n) => `${Math.round(n)}%`} /></div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><StatCard label="Failed sign-ins (24h)" value={s.failedLogins} icon={<ShieldAlert size={16} />} /><StatCard label="Lockouts (24h)" value={s.lockouts} icon={<Ban size={16} />} /><StatCard label="Critical events (24h)" value={s.critical} /><StatCard label="Blocked requests (24h)" value={s.blocked} /></div>
      <Card><h2 className="mb-2 font-semibold">Sign-ups and sign-ins, last 14 days</h2><LineChart label="Sign-ins per day" data={series.map((d) => ({ label: short(d.day), value: d.logins }))} /></Card>
      <div><h2 className="mb-3 font-semibold">Recent security events</h2><Table columns={evCols} rows={r.data.recentEvents} rowKey={(e) => e.id} empty={<EmptyState icon={<ShieldAlert size={22} />} title="No events yet" />} /></div>
    </div>
  )
}

export function Analytics() {
  const r = useAsync(() => api.get<Overview>('/admin/overview'), [])
  if (r.loading) return <LoadingBlock rows={3} />
  if (r.error || !r.data) return <Err msg={r.error ?? ''} retry={r.reload} />
  const { series, topTools } = r.data
  return (
    <div className="space-y-6"><PageHeader title="Analytics" sub="Aggregate, anonymous usage. Users can opt out in Privacy settings." />
      <div className="grid gap-4 lg:grid-cols-2"><Card><h2 className="mb-2 font-semibold">New sign-ups</h2><BarChart label="Sign-ups per day" data={series.map((d) => ({ label: short(d.day), value: d.signups }))} /></Card>
        <Card><h2 className="mb-2 font-semibold">Tool opens</h2><LineChart label="Tool opens per day" data={series.map((d) => ({ label: short(d.day), value: d.opens }))} /></Card></div>
      <Card><h2 className="mb-4 font-semibold">Most used tools</h2>{topTools.length ? <HBars label="Most used tools" data={topTools.map((t) => ({ label: byId(t.id)?.name ?? t.id, value: t.n }))} /> : <p className="text-sm text-fg2">No usage recorded yet.</p>}</Card></div>
  )
}

interface AUser { id: string; email: string; name: string; role: string; verified: boolean; disabled: boolean; google: boolean; created: number; lastLogin: number; locked: boolean }
export function UsersPage() {
  const me = useSession((s) => s.user)!, [q, setQ] = useState(''), [role, setRole] = useState(''), [status, setStatus] = useState(''), [sort, setSort] = useState('created'), [page, setPage] = useState(1), dq = useDebounced(q)
  const r = useAsync(() => api.get<{ items: AUser[]; total: number; size: number }>(`/admin/users?q=${encodeURIComponent(dq)}&role=${role}&status=${status}&sort=${sort}&page=${page}`), [dq, role, status, sort, page])
  const [target, setTarget] = useState<{ u: AUser; kind: 'delete' | 'disable' | 'role' } | null>(null), [newRole, setNewRole] = useState('user')
  const act = async (p: Promise<unknown>, ok: string) => { try { await p; toast.success(ok); setTarget(null); r.reload() } catch (e) { fail(e) } }
  const cols: Column<AUser>[] = [
    { key: 'user', header: 'User', render: (u) => <div className="flex items-center gap-3"><Avatar user={u} size={34} /><div className="min-w-0"><div className="truncate font-medium">{u.name || '—'}</div><div className="truncate text-xs text-fg2">{u.email}</div></div></div> },
    { key: 'role', header: 'Role', render: (u) => <Badge tone={u.role === 'user' ? 'neutral' : 'blue'}>{u.role}</Badge> },
    { key: 'status', header: 'Status', render: (u) => <div className="flex flex-wrap gap-1">{u.disabled ? <Badge tone="red">Disabled</Badge> : <Badge tone="green">Active</Badge>}{!u.verified && <Badge tone="amber">Unverified</Badge>}{u.locked && <Badge tone="red">Locked</Badge>}</div> },
    { key: 'last', header: 'Last sign-in', render: (u) => <span className="text-fg2">{u.lastLogin ? ago(u.lastLogin) : 'Never'}</span> },
    { key: 'created', header: 'Joined', render: (u) => <span className="text-fg2">{new Date(u.created).toLocaleDateString()}</span> },
    { key: 'actions', header: '', className: 'w-12', render: (u) => u.id === me.id ? null : <Dropdown label={`Actions for ${u.email}`} button={({ toggle }) => <button onClick={toggle} aria-label={`Actions for ${u.email}`} className="rounded p-1.5 text-fg2 hover:bg-fg/10"><MoreHorizontal size={18} /></button>}
      items={[{ label: 'Change role', hidden: !can(me, 'roles.assign'), onClick: () => { setNewRole(u.role === 'superadmin' ? 'admin' : u.role); setTarget({ u, kind: 'role' }) } }, { label: u.disabled ? 'Enable account' : 'Disable account', hidden: !can(me, 'users.write'), onClick: () => (u.disabled ? void act(api.patch(`/admin/users/${u.id}`, { disabled: false }), 'Account enabled') : setTarget({ u, kind: 'disable' })) },
        { label: 'Sign out all devices', hidden: !can(me, 'users.write'), onClick: () => void act(api.post(`/admin/users/${u.id}/revoke-sessions`), 'Sessions revoked') }, { label: 'Delete user', danger: true, hidden: !can(me, 'users.delete'), onClick: () => setTarget({ u, kind: 'delete' }) }]} /> }
  ]
  return (
    <div className="space-y-5"><PageHeader title="Users" sub="Search, review and manage accounts." />
      <div className="grid gap-3 sm:grid-cols-4"><Input aria-label="Search users" placeholder="Search name or email" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} className="sm:col-span-1" />
        <Select aria-label="Filter by role" value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }}><option value="">All roles</option>{['user', 'analyst', 'support', 'admin', 'superadmin'].map((x) => <option key={x}>{x}</option>)}</Select>
        <Select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="">Any status</option><option value="active">Active</option><option value="disabled">Disabled</option><option value="unverified">Unverified</option></Select>
        <Select aria-label="Sort users" value={sort} onChange={(e) => setSort(e.target.value)}><option value="created">Newest first</option><option value="lastLogin">Last sign-in</option><option value="email">Email A–Z</option></Select></div>
      {r.error ? <Err msg={r.error} retry={r.reload} /> : <><Table columns={cols} rows={r.data?.items ?? []} rowKey={(u) => u.id} loading={r.loading} empty={<EmptyState icon={<UsersIcon size={22} />} title="No users match" text="Try changing the filters." />} /><Pagination page={page} total={r.data?.total ?? 0} size={r.data?.size ?? 15} onChange={setPage} /></>}
      <Modal open={target?.kind === 'delete'} onClose={() => setTarget(null)} title="Delete this user?" footer={<><Button variant="ghost" onClick={() => setTarget(null)}>Cancel</Button><Button onClick={() => target && void act(api.del(`/admin/users/${target.u.id}`), 'User deleted')}>Delete permanently</Button></>}><p className="text-sm text-fg2">{target?.u.email} and their synced data will be permanently removed. This is recorded in the security log.</p></Modal>
      <Modal open={target?.kind === 'disable'} onClose={() => setTarget(null)} title="Disable this account?" footer={<><Button variant="ghost" onClick={() => setTarget(null)}>Cancel</Button><Button onClick={() => target && void act(api.patch(`/admin/users/${target.u.id}`, { disabled: true }), 'Account disabled')}>Disable</Button></>}><p className="text-sm text-fg2">{target?.u.email} will be signed out everywhere and won’t be able to sign in until re-enabled.</p></Modal>
      <Modal open={target?.kind === 'role'} onClose={() => setTarget(null)} title="Change role" footer={<><Button variant="ghost" onClick={() => setTarget(null)}>Cancel</Button><Button onClick={() => target && void act(api.patch(`/admin/users/${target.u.id}`, { role: newRole }), 'Role updated')}>Save role</Button></>}><Field label={`Role for ${target?.u.email ?? ''}`}><Select value={newRole} onChange={(e) => setNewRole(e.target.value)}>{['user', 'analyst', 'support', 'admin'].map((x) => <option key={x}>{x}</option>)}</Select></Field><p className="mt-3 text-xs text-fg2">Superadmin is granted only through the server’s SUPERADMIN_EMAILS setting.</p></Modal>
    </div>
  )
}

interface Content { announcements: { id: string; title: string; body: string; level: string; active: boolean }[]; featured: string[]; disabledTools: string[] }
function Picker({ value, onChange, label }: { value: string[]; onChange: (v: string[]) => void; label: string }) {
  const [q, setQ] = useState(''), list = tools.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()))
  return <div><Input aria-label={`Filter ${label}`} placeholder={`Filter ${label}`} value={q} onChange={(e) => setQ(e.target.value)} className="mb-2" />
    <ul className="max-h-60 overflow-auto rounded-[12px] border border-line p-1">{list.map((t) => <li key={t.id}><label className="flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2 text-sm hover:bg-fg/5"><input type="checkbox" checked={value.includes(t.id)} onChange={(e) => onChange(e.target.checked ? [...value, t.id] : value.filter((x) => x !== t.id))} />{t.name}<span className="ml-auto text-xs text-muted">{t.category}</span></label></li>)}</ul></div>
}
export function ContentPage() {
  const r = useAsync(() => api.get<Content>('/admin/content'), []), [draft, setDraft] = useState<Content | null>(null), [add, setAdd] = useState(false), [a, setA] = useState({ title: '', body: '', level: 'info' }), [busy, setBusy] = useState(false)
  const c = draft ?? r.data
  if (r.loading && !c) return <LoadingBlock rows={3} />
  if (!c) return <Err msg={r.error ?? ''} retry={r.reload} />
  const save = async () => { setBusy(true); try { await api.put('/admin/content', c); toast.success('Content saved'); setDraft(null); r.reload() } catch (e) { fail(e) } setBusy(false) }
  return (
    <div className="space-y-6"><PageHeader title="Content" sub="Announcements, featured tools and tool availability." action={<Button disabled={!draft || busy} onClick={save}>Save changes</Button>} />
      <Card className="space-y-3"><div className="flex items-center justify-between"><h2 className="font-semibold">Announcements</h2><Button variant="ghost" disabled={c.announcements.length >= 10} onClick={() => setAdd(true)}><Plus size={16} />New</Button></div>
        {c.announcements.length ? <ul className="divide-y divide-line">{c.announcements.map((x) => <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><div className="text-sm font-medium">{x.title} <Badge tone={x.level === 'warning' ? 'amber' : x.level === 'success' ? 'green' : 'blue'}>{x.level}</Badge></div><div className="text-xs text-fg2">{x.body}</div></div>
          <div className="flex items-center gap-2"><Switch checked={x.active} label={`${x.title} active`} onChange={(v) => setDraft({ ...c, announcements: c.announcements.map((y) => (y.id === x.id ? { ...y, active: v } : y)) })} /><Button variant="ghost" aria-label={`Delete ${x.title}`} onClick={() => setDraft({ ...c, announcements: c.announcements.filter((y) => y.id !== x.id) })}><Trash2 size={16} /></Button></div></li>)}</ul> : <p className="text-sm text-fg2">No announcements. They appear as a dismissible banner on the home screen.</p>}</Card>
      <div className="grid gap-4 lg:grid-cols-2"><Card className="space-y-3"><h2 className="font-semibold">Featured tools</h2><p className="text-xs text-fg2">Shown in “Featured” on the home screen (max 12).</p><Picker label="featured tools" value={c.featured} onChange={(v) => setDraft({ ...c, featured: v.slice(0, 12) })} /></Card>
        <Card className="space-y-3"><h2 className="font-semibold">Disabled tools</h2><p className="text-xs text-fg2">Hidden from users and shown as “temporarily unavailable”.</p><Picker label="tools to disable" value={c.disabledTools} onChange={(v) => setDraft({ ...c, disabledTools: v })} /></Card></div>
      <Modal open={add} onClose={() => setAdd(false)} title="New announcement" footer={<><Button variant="ghost" onClick={() => setAdd(false)}>Cancel</Button><Button disabled={!a.title.trim()} onClick={() => { setDraft({ ...c, announcements: [...c.announcements, { id: crypto.randomUUID().slice(0, 8), ...a, active: true }] }); setA({ title: '', body: '', level: 'info' }); setAdd(false) }}>Add</Button></>}>
        <div className="space-y-3"><Field label="Title"><Input maxLength={80} value={a.title} onChange={(e) => setA({ ...a, title: e.target.value })} /></Field><Field label="Message"><Input maxLength={300} value={a.body} onChange={(e) => setA({ ...a, body: e.target.value })} /></Field><Field label="Style"><Select value={a.level} onChange={(e) => setA({ ...a, level: e.target.value })}><option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option></Select></Field></div></Modal>
    </div>
  )
}

export function ReportsPage() {
  const me = useSession((s) => s.user)!, r = useAsync(() => api.get<Overview>('/admin/overview'), []), [busy, setBusy] = useState('')
  const dl = async (name: string) => { setBusy(name); try { const text = await api.get<string>(`/admin/reports/${name}.csv`); await downloadBlob(`shafare-${name}.csv`, new Blob([text as unknown as string], { type: 'text/csv' })) } catch (e) { fail(e) } setBusy('') }
  const R = [['users', 'Users', 'Accounts, roles, status and sign-in dates.'], ['tools', 'Tool usage', 'Total opens per tool.'], ['daily', 'Daily activity', 'Sign-ups, sign-ins and tool opens per day.'], ...(can(me, 'logs.read') ? [['security', 'Security events', 'The latest 2,000 audit events.']] : [])]
  return (
    <div className="space-y-6"><PageHeader title="Reports" sub="Export data as CSV. Exports are recorded in the security log." />
      <div className="grid gap-4 sm:grid-cols-2">{R.map(([k, t, d]) => <Card key={k} className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">{t}</h2><p className="text-sm text-fg2">{d}</p></div><Button variant="ghost" disabled={busy === k} onClick={() => void dl(k)}><Download size={16} />{busy === k ? 'Preparing…' : 'CSV'}</Button></Card>)}</div>
      {can(me, 'analytics.read') && <div><h2 className="mb-3 font-semibold">Last 14 days</h2>{r.data ? <Table rows={[...r.data.series].reverse()} rowKey={(d) => d.day} columns={[{ key: 'day', header: 'Date' }, { key: 'signups', header: 'Sign-ups' }, { key: 'logins', header: 'Sign-ins' }, { key: 'opens', header: 'Tool opens' }]} /> : <LoadingBlock rows={2} />}</div>}</div>
  )
}

interface Broadcast { id: string; at: number; title: string; body: string; audience: string; by: string }
export function NotificationsAdmin() {
  const r = useAsync(() => api.get<{ items: Broadcast[] }>('/admin/notifications'), []), [f, setF] = useState({ title: '', body: '', audience: 'all' }), [busy, setBusy] = useState(false)
  const send = async () => { setBusy(true); try { await api.post('/admin/notifications', f); toast.success('Notification sent'); setF({ title: '', body: '', audience: 'all' }); r.reload() } catch (e) { fail(e) } setBusy(false) }
  return (
    <div className="space-y-6"><PageHeader title="Notifications" sub="Send an announcement to users’ notification inbox." />
      <Card className="max-w-xl space-y-4"><Field label="Title"><Input maxLength={80} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field><Field label="Message"><Input maxLength={300} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
        <Field label="Audience"><Select value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })}><option value="all">Everyone</option><option value="staff">Staff only</option></Select></Field><Button disabled={busy || !f.title.trim() || !f.body.trim()} onClick={send}>Send notification</Button></Card>
      <div><h2 className="mb-3 font-semibold">Sent</h2>{r.loading ? <LoadingBlock rows={2} /> : <Table rows={r.data?.items ?? []} rowKey={(b) => b.id} empty={<EmptyState icon={<Pulse size={22} />} title="Nothing sent yet" />} columns={[{ key: 'at', header: 'Sent', render: (b) => <span className="whitespace-nowrap text-fg2">{when(b.at)}</span> }, { key: 'title', header: 'Title' }, { key: 'body', header: 'Message', render: (b) => <span className="text-fg2">{b.body}</span> }, { key: 'aud', header: 'Audience', render: (b) => <Badge>{b.audience}</Badge> }, { key: 'by', header: 'By' }]} />}</div></div>
  )
}

export function LogsPage() {
  const [level, setLevel] = useState(''), [q, setQ] = useState(''), [page, setPage] = useState(1), dq = useDebounced(q)
  const r = useAsync(() => api.get<{ items: Ev[]; total: number; size: number }>(`/admin/events?level=${level}&q=${encodeURIComponent(dq)}&page=${page}`), [level, dq, page])
  return (
    <div className="space-y-5"><PageHeader title="Security logs" sub="Sign-ins, lockouts, permission failures and administrative actions." />
      <div className="grid gap-3 sm:grid-cols-[1fr_200px]"><Input aria-label="Search events" placeholder="Search by event, email, IP or detail" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        <Select aria-label="Filter by level" value={level} onChange={(e) => { setLevel(e.target.value); setPage(1) }}><option value="">All levels</option><option value="info">Info</option><option value="warn">Warning</option><option value="critical">Critical</option></Select></div>
      {r.error ? <Err msg={r.error} retry={r.reload} /> : <><Table columns={evCols} rows={r.data?.items ?? []} rowKey={(e) => e.id} loading={r.loading} empty={<EmptyState icon={<ShieldAlert size={22} />} title="No events match" />} /><Pagination page={page} total={r.data?.total ?? 0} size={r.data?.size ?? 25} onChange={setPage} /></>}</div>
  )
}

export function SettingsPage() {
  const me = useSession((s) => s.user)!, r = useAsync(() => api.get<{ settings: { registrationOpen: boolean; maintenanceMode: boolean }; limits: Record<string, string> }>('/admin/settings'), []), [s, setS] = useState<{ registrationOpen: boolean; maintenanceMode: boolean } | null>(null), writable = can(me, 'settings.write')
  const cur = s ?? r.data?.settings
  if (r.loading && !cur) return <LoadingBlock rows={2} />
  if (!cur || !r.data) return <Err msg={r.error ?? ''} retry={r.reload} />
  return (
    <div className="max-w-xl space-y-5"><PageHeader title="Application settings" />
      {!writable && <Notice tone="info">You can view settings, but only a superadmin can change them.</Notice>}
      <Card className="divide-y divide-line !py-2"><Switch checked={cur.registrationOpen} label="Allow new sign-ups" hint="Turn off to stop new accounts being created." onChange={(v) => writable && setS({ ...cur, registrationOpen: v })} />
        <Switch checked={cur.maintenanceMode} label="Maintenance mode" hint="Signed-in regular users see a maintenance message. Staff can still sign in." onChange={(v) => writable && setS({ ...cur, maintenanceMode: v })} /></Card>
      <Button disabled={!s || !writable} onClick={() => api.put('/admin/settings', s).then(() => { toast.success('Settings saved'); setS(null); r.reload() }).catch(fail)}>Save settings</Button>
      <Card><h2 className="mb-3 font-semibold">Security configuration</h2><dl className="space-y-2 text-sm">{Object.entries(r.data.limits).map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-fg2">{k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</dt><dd>{v}</dd></div>)}</dl></Card></div>
  )
}

export function RolesPage() {
  const r = useAsync(() => api.get<{ permissions: string[]; roles: Record<string, string[]> }>('/admin/roles'), [])
  if (r.loading) return <LoadingBlock rows={2} />
  if (!r.data) return <Err msg={r.error ?? ''} retry={r.reload} />
  const roles = Object.keys(r.data.roles).filter((x) => x !== 'user')
  return (
    <div className="space-y-5"><PageHeader title="Roles & access" sub="What each role can do. Permissions are enforced on the server for every request." />
      <div className="glass table-wrap rounded-[18px]"><table className="w-full min-w-[560px] text-sm"><caption className="sr-only">Role permissions</caption><thead><tr className="border-b border-line text-left text-xs text-muted"><th scope="col" className="px-4 py-3 font-medium">Permission</th>{roles.map((x) => <th key={x} scope="col" className="px-4 py-3 text-center font-medium capitalize">{x}</th>)}</tr></thead>
        <tbody>{r.data.permissions.map((p) => <tr key={p} className="border-b border-line/60 last:border-0"><th scope="row" className="px-4 py-2.5 text-left font-mono text-xs font-normal">{p}</th>{roles.map((x) => <td key={x} className="px-4 py-2.5 text-center">{r.data!.roles[x].includes(p) ? <span className="text-[#22C55E]" aria-label="Allowed">✓</span> : <span className="text-muted" aria-label="Not allowed">–</span>}</td>)}</tr>)}</tbody></table></div></div>
  )
}
