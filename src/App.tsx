import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Activity as Pulse, Bell, Clock, Download, Home as HomeIcon, LayoutGrid, LogOut, Menu, Moon, Search as SearchIcon, Settings as SettingsIcon, ShieldCheck, Star, Sun, User, WifiOff, X } from 'lucide-react'
import { byId, catOf, cats, inCat, search, tools, Tool } from './registry'
import { useStore } from './store'
import { useSession } from './state/session'
import { useContent } from './state/content'
import { useNotifications } from './state/notifications'
import { auth, me, syncNow } from './api'
import { useInstall } from './install'
import { useOnline } from './lib/hooks'
import { Avatar, Button, Card, Dropdown, EmptyState, Input, LocalBadge, PageHeader, Select, Skeleton, ToastHost, downloadBlob } from './ds'
import { Grid, StarBtn } from './components/ToolCard'
import Dashboard from './features/dashboard/Dashboard'
import Splash, { shouldSplash } from './features/splash/Splash'
import { AuthPage, ResetPassword, VerifyEmail } from './features/auth/AuthPages'
import Account from './features/account/Account'
import Activity from './features/activity/Activity'
import { NotificationBell, NotificationsPage } from './features/notifications/Notifications'
import { About, Contact, Privacy, Terms } from './Legal'

const AdminApp = lazy(() => import('./features/admin/AdminApp'))
const Logo = () => <Link to="/" className="flex items-center gap-2.5" aria-label="SHAFARE home"><img src="/logo-mark.png" alt="" width={32} height={32} className="rounded-full" /><span className="font-display text-sm font-bold tracking-[.24em]">SHAFARE</span></Link>

// ---------- Command palette (Ctrl K) ----------
const SUGGESTED = ['advanced-calculator', 'pdf-to-image', 'password', 'json-formatter', 'unit-converter', 'notes', 'qr-generator']
function Palette({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState(''), [i, setI] = useState(0), nav = useNavigate()
  const list = q.trim() ? search(q).slice(0, 8) : (SUGGESTED.map(byId).filter(Boolean) as Tool[])
  const go = (t: Tool) => { nav(`/tools/${t.id}`); onClose() }
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 p-4 pt-[12vh]" onClick={onClose} role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="glass page-in w-full max-w-xl rounded-[20px] p-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-2"><SearchIcon size={18} className="text-muted" aria-hidden />
          <input autoFocus aria-label="Search SHAFARE" placeholder="Search SHAFARE…" value={q} onChange={(e) => { setQ(e.target.value); setI(0) }}
            onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setI(Math.min(i + 1, list.length - 1)) } else if (e.key === 'ArrowUp') { e.preventDefault(); setI(Math.max(i - 1, 0)) } else if (e.key === 'Enter' && list[i]) go(list[i]); else if (e.key === 'Escape') onClose() }}
            className="h-11 w-full bg-transparent text-base text-fg outline-none placeholder:text-muted" /><kbd className="text-xs text-muted">Esc</kbd></div>
        <div className="my-2 h-px bg-line" />{!q.trim() && <div className="px-3 pb-1 text-xs text-muted">Suggested</div>}
        <ul role="listbox" aria-label="Tools" className="max-h-80 overflow-auto">{list.map((t, n) => <li key={t.id} role="option" aria-selected={n === i}><button onClick={() => go(t)} className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm ${n === i ? 'bg-accent/15' : 'hover:bg-fg/5'}`}><t.icon size={16} className="text-cyan" aria-hidden />{t.name}<span className="ml-auto text-xs text-muted">{t.category}</span></button></li>)}
          {!list.length && <li className="px-3 py-6 text-center text-sm text-muted">No tools match your search. Try a different word.</li>}</ul>
      </div>
    </div>
  )
}

// ---------- Navigation ----------
function Navbar({ openSearch, openMenu }: { openSearch: () => void; openMenu: () => void }) {
  const { canInstall, install } = useInstall(), user = useSession((s) => s.user), status = useSession((s) => s.status), nav = useNavigate()
  const dark = useStore((s) => s.theme === 'dark' || (s.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)), setTheme = useStore((s) => s.setTheme)
  const link = ({ isActive }: { isActive: boolean }) => `hidden items-center gap-1.5 rounded-[10px] px-3 py-2 text-sm md:flex ${isActive ? 'bg-fg/10 text-fg' : 'text-fg2 hover:text-fg'}`
  return (
    <header className="bar sticky top-0 z-40 border-b border-line/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Logo />
        <button onClick={openSearch} className="glass mx-auto hidden h-11 w-full max-w-md items-center gap-2 rounded-[12px] px-4 text-sm text-muted md:flex" aria-label="Search tools (Ctrl K)"><SearchIcon size={16} aria-hidden />Search tools…<kbd className="ml-auto text-xs">Ctrl K</kbd></button>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <NavLink to="/" end className={link} aria-label="Home"><HomeIcon size={16} aria-hidden /><span className="hidden lg:inline">Home</span></NavLink>
          <NavLink to="/favorites" className={link} aria-label="Favorites"><Star size={16} aria-hidden /><span className="hidden lg:inline">Favorites</span></NavLink>
          <NavLink to="/history" className={link} aria-label="Recent"><Clock size={16} aria-hidden /><span className="hidden lg:inline">Recent</span></NavLink>
          {canInstall && <Button variant="ghost" className="hidden md:inline-flex" onClick={install}><Download size={16} />Install</Button>}
          <Button variant="ghost" className="h-10 w-10 px-0 md:hidden" aria-label="Search" onClick={openSearch}><SearchIcon size={18} /></Button>
          <Button variant="ghost" className="h-10 w-10 px-0" aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => setTheme(dark ? 'light' : 'dark')}>{dark ? <Sun size={18} /> : <Moon size={18} />}</Button>
          {status === 'authed' && user ? <>
            <NotificationBell />
            <Dropdown label="Account menu" button={({ toggle, open }) => <button onClick={toggle} aria-label="Account menu" aria-expanded={open} className="press ml-1 rounded-full ring-1 ring-line hover:ring-accent"><Avatar user={user} size={38} /></button>}
              items={[{ label: 'Account', icon: <User size={16} />, onClick: () => nav('/account') }, { label: 'Activity', icon: <Pulse size={16} />, onClick: () => nav('/activity') }, { label: 'Settings', icon: <SettingsIcon size={16} />, onClick: () => nav('/settings') },
                { label: 'SHAFARE Admin', icon: <ShieldCheck size={16} />, hidden: user.role === 'user', onClick: () => nav('/admin') }, { label: 'Sign out', icon: <LogOut size={16} />, danger: true, onClick: () => void auth.logout() }]} /></>
            : status === 'anon' ? <><NavLink to="/settings" className={link} aria-label="Settings"><SettingsIcon size={16} aria-hidden /></NavLink><Link to="/login" className="ml-1"><Button className="h-10">Sign in</Button></Link></> : <Skeleton className="ml-1 h-10 w-10 !rounded-full" />}
          <Button variant="ghost" className="h-10 w-10 px-0 md:hidden" aria-label="Open menu" onClick={openMenu}><Menu size={18} /></Button>
        </div>
      </div>
    </header>
  )
}
function BottomNav({ openSearch }: { openSearch: () => void }) {
  const item = ({ isActive }: { isActive: boolean }) => `press flex flex-1 flex-col items-center gap-1 py-2 text-[11px] ${isActive ? 'text-cyan' : 'text-fg2'}`
  return (
    <nav aria-label="Primary" className="bar fixed inset-x-0 bottom-0 z-40 flex border-t border-line/70 pb-[env(safe-area-inset-bottom)] md:hidden">
      <NavLink to="/" end className={item}><HomeIcon size={20} aria-hidden />Home</NavLink><NavLink to="/tools" className={item}><LayoutGrid size={20} aria-hidden />Tools</NavLink>
      <button onClick={openSearch} className="press flex flex-1 flex-col items-center gap-1 py-2 text-[11px] text-fg2"><SearchIcon size={20} aria-hidden />Search</button>
      <NavLink to="/favorites" className={item}><Star size={20} aria-hidden />Favorites</NavLink><NavLink to="/settings" className={item}><SettingsIcon size={20} aria-hidden />Settings</NavLink>
    </nav>
  )
}
function Drawer({ onClose }: { onClose: () => void }) {
  const { canInstall, install } = useInstall(), user = useSession((s) => s.user)
  const links: [string, string][] = [['/', 'Home'], ['/tools', 'All tools'], ['/favorites', 'Favorites'], ['/history', 'Recent'], ['/activity', 'Activity'], [user ? '/account' : '/login', user ? 'Account' : 'Sign in'], ['/settings', 'Settings'], ['/about', 'About'], ['/privacy', 'Privacy'], ['/terms', 'Terms'], ['/contact', 'Contact']]
  return (
    <div className="fixed inset-0 z-50 bg-black/60 md:hidden" onClick={onClose} role="dialog" aria-modal="true" aria-label="Menu">
      <div className="glass page-in ml-auto h-full w-72 rounded-none p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><Logo /><Button variant="ghost" className="h-10 w-10 px-0" aria-label="Close menu" onClick={onClose}><X size={18} /></Button></div>
        <ul>{links.map(([to, l]) => <li key={to + l}><Link to={to} onClick={onClose} className="block rounded-[10px] px-3 py-3 text-sm hover:bg-fg/10">{l}</Link></li>)}
          {user && user.role !== 'user' && <li><Link to="/admin" onClick={onClose} className="block rounded-[10px] px-3 py-3 text-sm text-cyan hover:bg-fg/10">SHAFARE Admin</Link></li>}
          {canInstall && <li><button onClick={() => { void install(); onClose() }} className="flex w-full items-center gap-2 rounded-[10px] px-3 py-3 text-left text-sm text-cyan hover:bg-fg/10"><Download size={16} aria-hidden />Install app</button></li>}
          {user && <li><button onClick={() => { void auth.logout(); onClose() }} className="block w-full rounded-[10px] px-3 py-3 text-left text-sm text-[#EF4444] hover:bg-fg/10">Sign out</button></li>}</ul>
      </div>
    </div>
  )
}

// ---------- Pages ----------
const Page = ({ title, sub, children, action }: { title: string; sub?: string; children: React.ReactNode; action?: React.ReactNode }) => <main className="page-in mx-auto max-w-6xl px-4 py-10"><PageHeader title={title} sub={sub} action={action} />{children}</main>

function ToolsPage() {
  const [p, setP] = useSearchParams(), c = p.get('c') ?? '', q = p.get('q') ?? '', sort = p.get('sort') ?? 'category', favOnly = p.get('fav') === '1'
  const { favorites, history } = useStore(), off = useContent((s) => s.disabledTools)
  const set = (k: string, v: string) => { const n = new URLSearchParams(p); v ? n.set(k, v) : n.delete(k); setP(n, { replace: true }) }
  let list = (q ? search(q) : tools).filter((t) => (!c || t.category === c) && (!favOnly || favorites.includes(t.id)) && !off.includes(t.id))
  if (sort === 'az') list = [...list].sort((a, b) => a.name.localeCompare(b.name)); else if (sort === 'recent') { const r = history.map((h) => h.id); list = [...list].sort((a, b) => (r.indexOf(a.id) + 1 || 999) - (r.indexOf(b.id) + 1 || 999)) }
  return (
    <Page title="All tools" sub={`${list.length} tool${list.length === 1 ? '' : 's'}${c ? ` in ${c}` : ''}`}>
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_180px_auto]"><Input aria-label="Filter tools" placeholder="Filter tools…" value={q} onChange={(e) => set('q', e.target.value)} />
        <Select aria-label="Sort tools" value={sort} onChange={(e) => set('sort', e.target.value)}><option value="category">Group by category</option><option value="az">A → Z</option><option value="recent">Recently used</option></Select>
        <Button variant={favOnly ? 'primary' : 'ghost'} aria-pressed={favOnly} onClick={() => set('fav', favOnly ? '' : '1')}><Star size={16} />Favorites</Button></div>
      <div className="mb-6 flex flex-wrap gap-2"><Button variant={c ? 'ghost' : 'primary'} onClick={() => set('c', '')}>All</Button>{cats.map((k) => <Button key={k.id} variant={c === k.id ? 'primary' : 'ghost'} onClick={() => set('c', k.id)}>{k.id}</Button>)}</div>
      {!list.length ? <EmptyState icon={<SearchIcon size={22} />} title="No tools match" text="Try a different word or clear a filter." action={<Button variant="ghost" onClick={() => setP({})}>Clear filters</Button>} />
        : sort === 'category' && !q ? <div className="space-y-10">{cats.filter((k) => list.some((t) => t.category === k.id)).map((k) => <section key={k.id}><h2 className="mb-1 flex items-center gap-2 text-lg font-semibold"><k.icon size={18} className="text-cyan" aria-hidden />{k.id}</h2><p className="mb-4 text-sm text-fg2">{k.blurb}</p><Grid items={list.filter((t) => t.category === k.id)} /></section>)}</div> : <Grid items={list} />}
    </Page>
  )
}

const LOCAL = ['PDF', 'Images', 'Developer', 'Security', 'Text']
function ToolPage() {
  const { id } = useParams(), t = byId(id ?? ''), logUse = useStore((s) => s.logUse), off = useContent((s) => s.disabledTools)
  useEffect(() => { if (t) { logUse(t.id); me.track(t.id) } document.title = t ? `${t.name} — SHAFARE` : 'SHAFARE' }, [t?.id])
  if (!t) return <Page title="Tool not found" sub="That tool doesn’t exist."><Link to="/tools" className="text-cyan">Browse all tools</Link></Page>
  if (off.includes(t.id)) return <Page title={t.name}><EmptyState icon={<t.icon size={22} />} title="Temporarily unavailable" text="This tool has been switched off for now. Please check back soon." action={<Link to="/tools"><Button>Browse other tools</Button></Link>} /></Page>
  const cat = catOf(t.category), related = inCat(t.category).filter((x) => x.id !== t.id && !off.includes(x.id)).slice(0, 3)
  return (
    <main key={t.id} className="page-in mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-fg2"><Link to="/" className="hover:text-fg">Home</Link> / <Link to="/tools" className="hover:text-fg">Tools</Link> / <Link to={`/tools?c=${t.category}`} className="hover:text-fg">{t.category}</Link></nav>
      <header className="mb-6 flex items-start gap-4"><div className="icon-box flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"><t.icon size={22} aria-hidden /></div>
        <div className="min-w-0 flex-1"><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.name}</h1><p className="mt-1 text-fg2">{t.desc}</p>{LOCAL.includes(t.category) && <div className="mt-3"><LocalBadge /></div>}</div><StarBtn t={t} /></header>
      <Suspense fallback={<Skeleton className="h-72" />}><t.Component /></Suspense>
      <section className="mt-10 grid gap-4 md:grid-cols-2"><Card><h2 className="font-semibold">How to use</h2><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-fg2">{cat.howto.map((h) => <li key={h}>{h}</li>)}</ol></Card>
        <Card><h2 className="font-semibold">Good to know</h2><p className="mt-3 text-sm text-fg2">{LOCAL.includes(t.category) ? 'This tool runs in your browser. Your input is not uploaded or stored.' : 'Results are estimates for convenience. Double-check important figures before relying on them.'} Press Ctrl K to jump to any other tool.</p></Card></section>
      {related.length > 0 && <section className="mt-10"><h2 className="mb-4 text-lg font-semibold">Related Tools</h2><Grid items={related} /></section>}
    </main>
  )
}
function Favorites() { const { favorites } = useStore(), items = tools.filter((t) => favorites.includes(t.id))
  return <Page title="Favorites">{items.length ? <Grid items={items} /> : <EmptyState icon={<Star size={22} />} title="No favorites yet" text="Tap the star on any tool to keep it here." action={<Link to="/tools"><Button>Browse tools</Button></Link>} />}</Page> }
function History() { const { history, clearHistory } = useStore(), items = history.map((h) => byId(h.id)).filter(Boolean) as Tool[]
  return <Page title="Recently used" sub="Stored only on this device." action={items.length ? <Button variant="ghost" onClick={clearHistory}>Clear</Button> : undefined}>{items.length ? <Grid items={items} /> : <EmptyState icon={<Clock size={22} />} title="Nothing here yet" text="Tools you open will appear here." />}</Page> }
function InstallCard() {
  const { canInstall, installed, ios, install } = useInstall()
  return <Card><h2 className="mb-1 text-sm font-medium">Install app</h2>{installed ? <p className="text-xs text-fg2">SHAFARE is running as an installed app.</p>
    : canInstall ? <><p className="mb-3 text-xs text-fg2">Add SHAFARE to your device for one-tap access and offline use.</p><Button onClick={install}><Download size={16} />Install SHAFARE</Button></>
    : <p className="text-xs text-fg2">{ios ? 'On iPhone or iPad: tap Share, then Add to Home Screen.' : 'Use your browser menu and choose Install app or Add to Home Screen.'}</p>}</Card>
}
function Settings() {
  const { theme, setTheme, resetAll, notes } = useStore(), user = useSession((s) => s.user)
  return <Page title="Settings"><div className="max-w-md space-y-4">
    <InstallCard />
    <Card><h2 className="mb-3 text-sm font-medium">Theme</h2><div className="flex gap-2">{(['dark', 'light', 'system'] as const).map((t) => <Button key={t} variant={theme === t ? 'primary' : 'ghost'} className="capitalize" onClick={() => setTheme(t)}>{t}</Button>)}</div></Card>
    <Card><h2 className="mb-1 text-sm font-medium">Account</h2><p className="mb-3 text-xs text-fg2">{user ? 'Manage your profile, security, privacy and notifications.' : 'Sign in to sync across devices.'}</p><Link to={user ? '/account' : '/login'}><Button variant="ghost">{user ? 'Account settings' : 'Sign in'}</Button></Link></Card>
    <Card><h2 className="mb-1 text-sm font-medium">Data on this device</h2><p className="mb-3 text-xs text-fg2">{notes.length} note(s) saved locally.</p><div className="flex flex-wrap gap-2"><Button variant="ghost" onClick={() => void downloadBlob('shafare-data.json', new Blob([localStorage.getItem('shafare-store') ?? '{}'], { type: 'application/json' }))}>Export data</Button><Button variant="ghost" onClick={() => confirm('Delete all favorites, history, notes and tasks on this device?') && resetAll()}>Delete all data</Button></div></Card></div></Page>
}

// ---------- Admin gate: the admin bundle is only fetched by signed-in staff ----------
function AdminGate() {
  const { status, user } = useSession(), loc = useLocation()
  if (status === 'loading') return <div className="p-10"><Skeleton className="h-64" /></div>
  if (status === 'anon') return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />
  if (!user || user.role === 'user') return <Page title="Not authorized"><EmptyState icon={<ShieldCheck size={22} />} title="You don’t have access to SHAFARE Admin" text="This area is for staff accounts." action={<Link to="/"><Button>Back to SHAFARE</Button></Link>} /></Page>
  return <Suspense fallback={<div className="p-10"><Skeleton className="h-64" /></div>}><AdminApp /></Suspense>
}

// ---------- Shell ----------
function UserShell() {
  const [open, setOpen] = useState(false), [menu, setMenu] = useState(false), online = useOnline(), loc = useLocation()
  useEffect(() => { const k = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o) } }; addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [])
  const foot: [string, string][] = [['/tools', 'Tools'], ['/tools?c=Calculators', 'Calculators'], ['/tools?c=Converters', 'Converters'], ['/tools?c=Developer', 'Developer'], ['/tools?c=Security', 'Security'], ['/privacy', 'Privacy'], ['/about', 'About'], ['/contact', 'Contact']]
  const needAuth = (el: JSX.Element) => <RequireAuth>{el}</RequireAuth>
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[95] focus:m-2 focus:rounded focus:bg-surface focus:p-2">Skip to content</a>
      <Navbar openSearch={() => setOpen(true)} openMenu={() => setMenu(true)} />
      {!online && <div role="status" className="flex items-center justify-center gap-2 bg-[#F59E0B]/15 px-4 py-2 text-xs text-[#F59E0B]"><WifiOff size={14} aria-hidden />You’re offline. Tools still work; syncing and notifications resume when you’re back.</div>}
      <div id="main" key={loc.pathname} className="page-in flex-1 pb-20 md:pb-0"><Routes location={loc}>
        <Route path="/" element={<Dashboard />} /><Route path="/tools" element={<ToolsPage />} /><Route path="/tools/:id" element={<ToolPage />} />
        <Route path="/favorites" element={<Favorites />} /><Route path="/history" element={<History />} /><Route path="/activity" element={<Activity />} /><Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={needAuth(<NotificationsPage />)} /><Route path="/account" element={<Account />} /><Route path="/profile" element={<Navigate to="/account?tab=profile" replace />} />
        <Route path="/login" element={<AuthPage initial="login" />} /><Route path="/signup" element={<AuthPage initial="register" />} /><Route path="/verify" element={<VerifyEmail />} /><Route path="/reset" element={<ResetPassword />} />
        <Route path="/about" element={<About />} /><Route path="/privacy" element={<Privacy />} /><Route path="/terms" element={<Terms />} /><Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Page title="Page not found" sub="That page doesn’t exist."><Link to="/" className="text-cyan">Go home</Link></Page>} />
      </Routes></div>
      <footer className="border-t border-line/70 pb-24 pt-10 md:pb-10"><div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between"><div><Logo /><p className="mt-3 text-xs tracking-[.25em] text-fg2">ALL TOOLS. ONE PLACE.</p></div>
          <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm text-fg2 sm:grid-cols-4">{foot.map(([to, l]) => <li key={l}><Link to={to} className="hover:text-fg">{l}</Link></li>)}</ul></div>
        <p className="mt-8 text-xs text-muted">© 2026 SHAFARE</p></div></footer>
      <BottomNav openSearch={() => setOpen(true)} />
      {open && <Palette onClose={() => setOpen(false)} />}{menu && <Drawer onClose={() => setMenu(false)} />}
    </div>
  )
}
function RequireAuth({ children }: { children: JSX.Element }) {
  const status = useSession((s) => s.status), loc = useLocation()
  if (status === 'loading') return <main className="mx-auto max-w-2xl px-4 py-10"><Skeleton className="h-48" /></main>
  return status === 'anon' ? <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace /> : children
}

export default function App() {
  const [splash, setSplash] = useState(shouldSplash), done = useCallback(() => setSplash(false), [])
  const status = useSession((s) => s.status), updatedAt = useStore((s) => s.updatedAt), online = useOnline(), refresh = useNotifications((s) => s.refresh)
  useEffect(() => { void auth.restore(); void useContent.getState().load() }, [])
  useEffect(() => { if (status !== 'authed' || !online) return; const t = setTimeout(() => syncNow().catch(() => {}), 1500); return () => clearTimeout(t) }, [updatedAt, status, online])
  useEffect(() => { if (status !== 'authed' || !online) return; void refresh(); const t = setInterval(() => { if (!document.hidden) void refresh() }, 90e3); return () => clearInterval(t) }, [status, online, refresh])
  return (
    <>
      <Routes><Route path="/admin/*" element={<AdminGate />} /><Route path="*" element={<UserShell />} /></Routes>
      <ToastHost />{splash && <Splash onDone={done} />}
    </>
  )
}
