import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { auth, publicApi } from '../../api'
import { useSession } from '../../state/session'
import { isNative } from '../../config'
import { strength } from '../../strength'
import { Button, Card, Field, Input, Notice, PageHeader } from '../../ds'
import { useAsync } from '../../lib/hooks'

const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/')
type G = { accounts: { id: { initialize: (o: unknown) => void; renderButton: (el: HTMLElement, o: unknown) => void } } }

function GoogleButton({ onCred, id }: { onCred: (c: string) => void; id: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const init = () => {
      const g = (window as unknown as { google?: G }).google?.accounts?.id; if (!g || !ref.current) return
      g.initialize({ client_id: id, callback: (r: { credential: string }) => onCred(r.credential) })
      g.renderButton(ref.current, { type: 'standard', theme: document.documentElement.dataset.theme === 'dark' ? 'filled_black' : 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', width: 320 })
    }
    if ((window as unknown as { google?: unknown }).google) return init()
    const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = init; document.head.appendChild(s)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])
  return <><div ref={ref} className="flex min-h-[44px] justify-center" /><div className="flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div></>
}

export function AuthPage({ initial }: { initial: 'login' | 'register' }) {
  const [q] = useSearchParams(), status = useSession((s) => s.status), cfg = useAsync(() => publicApi.config(), [])
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initial)
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [pw, setPw] = useState(''), [err, setErr] = useState(''), [ok, setOk] = useState(''), [busy, setBusy] = useState(false)
  if (status === 'authed') return <Navigate to={safeNext(q.get('next'))} replace />
  const run = async (fn: () => Promise<unknown>, done = '') => { setBusy(true); setErr(''); setOk(''); try { await fn(); setOk(done) } catch (e) { setErr((e as Error).message) } setBusy(false) }
  const s = strength(pw)
  const submit = (e: React.FormEvent) => { e.preventDefault(); void (mode === 'forgot' ? run(() => auth.forgot(email), 'If an account exists for that email, a reset link is on its way.') : mode === 'login' ? run(() => auth.login(email, pw)) : run(() => auth.register(name, email, pw))) }
  const closed = !!cfg.data && !cfg.data.registrationOpen
  return (
    <main className="page-in mx-auto max-w-md px-4 py-12">
      <PageHeader title={mode === 'forgot' ? 'Reset password' : mode === 'login' ? 'Welcome back' : 'Create your account'} sub={mode === 'forgot' ? 'We’ll email you a link to choose a new password.' : 'Sign in to sync favorites, notes and history across devices.'} />
      <Card className="space-y-4">
        {mode !== 'forgot' && cfg.data?.googleClientId && !isNative() && <GoogleButton id={cfg.data.googleClientId} onCred={(c) => void run(() => auth.google(c))} />}
        {mode !== 'forgot' && <div className="flex gap-2">{(['login', 'register'] as const).map((m) => <Button key={m} type="button" variant={mode === m ? 'primary' : 'ghost'} onClick={() => { setMode(m); setErr('') }}>{m === 'login' ? 'Sign in' : 'Create account'}</Button>)}</div>}
        {closed && mode === 'register' && <Notice tone="warning">New sign-ups are currently closed.</Notice>}
        <form onSubmit={submit} className="space-y-4" noValidate>
          {mode === 'register' && <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={60} /></Field>}
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field>
          {mode !== 'forgot' && <Field label={mode === 'register' ? 'Password (at least 10 characters)' : 'Password'}><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></Field>}
          {mode === 'register' && pw && <div><div className="h-1.5 overflow-hidden rounded bg-fg/10"><div className="h-full rounded transition-all" style={{ width: `${(s.level + 1) * 20}%`, background: s.color }} /></div><p className="mt-1 text-xs" style={{ color: s.color }}>{s.label}</p></div>}
          <Button className="w-full" disabled={busy || !email || (mode !== 'forgot' && !pw) || (closed && mode === 'register')}>{busy ? 'Please wait…' : mode === 'forgot' ? 'Send reset link' : mode === 'login' ? 'Sign in' : 'Create account'}</Button>
        </form>
        {err && <Notice tone="error">{err}</Notice>}{ok && <Notice tone="success">{ok}</Notice>}
        <button type="button" className="text-xs text-fg2 hover:text-fg" onClick={() => { setMode(mode === 'forgot' ? 'login' : 'forgot'); setErr(''); setOk('') }}>{mode === 'forgot' ? 'Back to sign in' : 'Forgot password?'}</button>
      </Card>
      <p className="mt-4 text-center text-xs text-muted">By continuing you agree to the <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>
    </main>
  )
}

export function VerifyEmail() {
  const [q] = useSearchParams(), r = useAsync(() => auth.verify(q.get('token') ?? ''), [])
  return <main className="page-in mx-auto max-w-md px-4 py-12"><PageHeader title="Email verification" /><Card className="space-y-4">{r.loading ? <p className="text-sm text-fg2">Verifying…</p> : r.error ? <Notice tone="error">{r.error}</Notice> : <Notice tone="success">Your email is verified.</Notice>}<Link to="/account" className="inline-block text-sm text-cyan">Go to your account</Link></Card></main>
}
export function ResetPassword() {
  const [q] = useSearchParams(), [pw, setPw] = useState(''), [err, setErr] = useState(''), [done, setDone] = useState(false)
  return (
    <main className="page-in mx-auto max-w-md px-4 py-12"><PageHeader title="Choose a new password" sub="You’ll be signed out on all devices." />
      <Card className="space-y-4">{done ? <><Notice tone="success">Password updated.</Notice><Link to="/login" className="text-sm text-cyan">Sign in</Link></> : <>
        <Field label="New password (at least 10 characters)"><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></Field>
        <Button className="w-full" disabled={!pw} onClick={() => auth.reset(q.get('token') ?? '', pw).then(() => setDone(true)).catch((e: Error) => setErr(e.message))}>Update password</Button>{err && <Notice tone="error">{err}</Notice>}</>}</Card></main>
  )
}
