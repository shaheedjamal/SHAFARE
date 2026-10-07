import { useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Camera, LogOut, Trash2 } from 'lucide-react'
import { auth, me } from '../../api'
import { useSession } from '../../state/session'
import { useStore } from '../../store'
import { Avatar, Badge, Button, Card, Field, Input, Modal, Notice, PageHeader, Switch, Tabs, LoadingBlock, toast, Skeleton, EmptyState } from '../../ds'
import { toAvatar } from '../../lib/image'
import { ago, useAsync } from '../../lib/hooks'

type Tab = 'profile' | 'security' | 'privacy' | 'notifications'
const TABS: { id: Tab; label: string }[] = [{ id: 'profile', label: 'Profile' }, { id: 'security', label: 'Security' }, { id: 'privacy', label: 'Privacy' }, { id: 'notifications', label: 'Notifications' }]
const fail = (e: unknown) => toast.error((e as Error).message)

function Profile() {
  const user = useSession((s) => s.user)!, [name, setName] = useState(user.name), [busy, setBusy] = useState(false), file = useRef<HTMLInputElement>(null)
  const pick = async (f?: File) => { if (!f) return; setBusy(true); try { await me.avatar(await toAvatar(f)); toast.success('Profile photo updated') } catch (e) { fail(e) } setBusy(false) }
  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-5">
        <div className="relative"><Avatar user={user} size={84} /><button onClick={() => file.current?.click()} aria-label="Change profile photo" className="btn-grad absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full text-white"><Camera size={15} /></button></div>
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden aria-label="Choose profile photo" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = '' }} />
        <div className="min-w-0 flex-1"><div className="font-display text-lg font-semibold">{user.name || 'Add your name'}</div><div className="truncate text-sm text-fg2">{user.email}</div>
          <div className="mt-2 flex flex-wrap gap-2">{user.verified ? <Badge tone="green">Email verified</Badge> : <Badge tone="amber">Email not verified</Badge>}{user.role !== 'user' && <Badge tone="blue">{user.role}</Badge>}{user.google && <Badge>Google linked</Badge>}</div></div>
        {user.avatar && <Button variant="ghost" disabled={busy} onClick={() => me.avatar(null).then(() => toast.info('Photo removed')).catch(fail)}>Remove photo</Button>}
      </Card>
      <Card className="space-y-4"><h2 className="font-semibold">Edit profile</h2>
        <Field label="Display name"><Input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} autoComplete="name" /></Field>
        <Field label="Email"><Input value={user.email} readOnly aria-readonly /></Field>
        <div className="flex flex-wrap gap-2"><Button disabled={!name.trim() || name.trim() === user.name} onClick={() => me.update(name).then(() => toast.success('Profile saved')).catch(fail)}>Save changes</Button>
          {!user.verified && <Button variant="ghost" onClick={() => auth.resend().then(() => toast.success('Verification email sent')).catch(fail)}>Resend verification email</Button>}</div></Card>
    </div>
  )
}

function Security() {
  const user = useSession((s) => s.user)!, sess = useAsync(() => me.sessions(), []), [cur, setCur] = useState(''), [next, setNext] = useState(''), [del, setDel] = useState(false), [pw, setPw] = useState(''), [err, setErr] = useState('')
  return (
    <div className="space-y-4">
      <Card className="space-y-4"><h2 className="font-semibold">{user.hasPassword ? 'Change password' : 'Add a password'}</h2>
        {user.hasPassword && <Field label="Current password"><Input type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} /></Field>}
        <Field label="New password (at least 10 characters)"><Input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} /></Field>
        <p className="text-xs text-fg2">Changing your password signs out your other devices.</p>
        <Button disabled={!next || (user.hasPassword && !cur)} onClick={() => auth.changePassword(cur, next).then(() => { setCur(''); setNext(''); toast.success('Password updated'); void sess.reload() }).catch(fail)}>Update password</Button></Card>
      <Card className="space-y-3"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Signed-in devices</h2><Button variant="ghost" onClick={() => auth.logoutAll().catch(fail)}><LogOut size={16} />Sign out everywhere</Button></div>
        {sess.loading ? <Skeleton className="h-16" /> : sess.error ? <Notice tone="error">{sess.error}</Notice> : <ul className="divide-y divide-line">{sess.data?.items.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><div className="truncate text-sm">{s.ua || 'Unknown device'} {s.current && <Badge tone="green">This device</Badge>}</div><div className="text-xs text-muted">{s.ip} · active {ago(s.used)}</div></div>
            {!s.current && <Button variant="ghost" onClick={() => me.revoke(s.id).then(() => { toast.info('Device signed out'); void sess.reload() }).catch(fail)}>Sign out</Button>}</li>))}</ul>}</Card>
      <Card className="space-y-3 !border-[#EF4444]/30"><h2 className="font-semibold text-[#EF4444]">Delete account</h2><p className="text-sm text-fg2">Permanently deletes your account and synced data from our servers. Data on this device stays.</p><Button variant="ghost" onClick={() => setDel(true)}><Trash2 size={16} />Delete my account</Button></Card>
      <Modal open={del} onClose={() => setDel(false)} title="Delete your account?" footer={<><Button variant="ghost" onClick={() => setDel(false)}>Cancel</Button><Button onClick={() => me.deleteAccount(pw).catch((e: Error) => setErr(e.message))}>Delete permanently</Button></>}>
        <p className="mb-4 text-sm text-fg2">This can’t be undone.{user.hasPassword && ' Enter your password to confirm.'}</p>{user.hasPassword && <Field label="Password"><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" /></Field>}{err && <div className="mt-3"><Notice tone="error">{err}</Notice></div>}</Modal>
    </div>
  )
}

function Privacy() {
  const user = useSession((s) => s.user)!, p = user.settings.privacy, { resetAll } = useStore()
  const set = (k: 'analytics' | 'personalization', v: boolean) => me.settings({ privacy: { ...p, [k]: v } }).catch(fail)
  return (
    <div className="space-y-4"><Card className="divide-y divide-line !py-2">
      <Switch checked={p.analytics} onChange={(v) => void set('analytics', v)} label="Anonymous usage statistics" hint="Counts which tools are opened so we can improve them. Never includes your files or text." />
      <Switch checked={p.personalization} onChange={(v) => void set('personalization', v)} label="Personalized recommendations" hint="Suggest tools based on what you use. Computed on your device." /></Card>
      <Card className="space-y-3"><h2 className="font-semibold">Your data</h2><p className="text-sm text-fg2">Files and text you process in tools never leave your browser. Favorites, history and notes sync only while you’re signed in.</p>
        <Button variant="ghost" onClick={() => confirm('Delete favorites, history, notes and tasks from this device?') && (resetAll(), toast.info('Local data deleted'))}>Delete data on this device</Button></Card></div>
  )
}

function Notifs() {
  const user = useSession((s) => s.user)!, n = user.settings.notifications
  const set = (k: 'email' | 'product' | 'security', v: boolean) => me.settings({ notifications: { ...n, [k]: v } }).catch(fail)
  return <Card className="divide-y divide-line !py-2">
    <Switch checked={n.security} onChange={(v) => void set('security', v)} label="Security alerts" hint="New sign-ins and password changes." />
    <Switch checked={n.product} onChange={(v) => void set('product', v)} label="Product updates" hint="New tools and improvements." />
    <Switch checked={n.email} onChange={(v) => void set('email', v)} label="Email notifications" hint="Receive important notices by email as well as in the app." /></Card>
}

export default function Account() {
  const status = useSession((s) => s.status), [q, setQ] = useSearchParams(), tab = (TABS.find((t) => t.id === q.get('tab'))?.id ?? 'profile') as Tab
  if (status === 'loading') return <main className="mx-auto max-w-2xl px-4 py-10"><LoadingBlock /></main>
  if (status === 'anon') return <Navigate to="/login?next=/account" replace />
  return (
    <main className="page-in mx-auto max-w-2xl px-4 py-10"><PageHeader title="Account" sub="Manage your profile, security and preferences." />
      <div className="mb-5"><Tabs tabs={TABS} value={tab} onChange={(t) => setQ({ tab: t })} label="Account sections" /></div>
      {tab === 'profile' && <Profile />}{tab === 'security' && <Security />}{tab === 'privacy' && <Privacy />}{tab === 'notifications' && <Notifs />}
      <p className="mt-6 text-center text-xs text-muted">Need help? <Link to="/contact" className="underline">Contact us</Link></p>
    </main>
  )
}
void EmptyState
