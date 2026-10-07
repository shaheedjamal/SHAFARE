// SHAFARE ADMIN: a separate shell with its own navigation. Visibility here is a convenience;
// every action is enforced again on the server by role permissions.
import { useState } from 'react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { ArrowLeft, BarChart3, FileDown, KeyRound, LayoutDashboard, Megaphone, Menu, Newspaper, ScrollText, SlidersHorizontal, Users, X } from 'lucide-react'
import { useSession, can } from '../../state/session'
import { Avatar, Badge, Button, EmptyState } from '../../ds'
import { Analytics, ContentPage, LogsPage, NotificationsAdmin, Overview, ReportsPage, RolesPage, SettingsPage, UsersPage } from './pages'

const NAV = [
  { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard, perm: 'analytics.read', el: <Overview /> },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, perm: 'analytics.read', el: <Analytics /> },
  { to: '/admin/users', label: 'Users', icon: Users, perm: 'users.read', el: <UsersPage /> },
  { to: '/admin/content', label: 'Content', icon: Newspaper, perm: 'content.write', el: <ContentPage /> },
  { to: '/admin/reports', label: 'Reports', icon: FileDown, perm: 'reports.read', el: <ReportsPage /> },
  { to: '/admin/notifications', label: 'Notifications', icon: Megaphone, perm: 'notifications.send', el: <NotificationsAdmin /> },
  { to: '/admin/logs', label: 'Security logs', icon: ScrollText, perm: 'logs.read', el: <LogsPage /> },
  { to: '/admin/settings', label: 'Settings', icon: SlidersHorizontal, perm: 'settings.read', el: <SettingsPage /> },
  { to: '/admin/roles', label: 'Roles & access', icon: KeyRound, perm: 'settings.read', el: <RolesPage /> }
]

export default function AdminApp() {
  const user = useSession((s) => s.user)!, [open, setOpen] = useState(false), items = NAV.filter((n) => can(user, n.perm))
  const side = (
    <nav aria-label="Admin" className="flex h-full flex-col gap-1 p-4">
      <Link to="/admin" className="mb-5 flex items-center gap-2.5 px-2"><img src="/logo-mark.png" alt="" width={32} height={32} className="rounded-full" /><span><span className="font-display block text-sm font-bold tracking-[.2em]">SHAFARE</span><span className="block text-[10px] font-semibold tracking-[.3em] text-cyan">ADMIN</span></span></Link>
      {items.map((n) => <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)} className={({ isActive }) => `press flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm ${isActive ? 'btn-grad text-white' : 'text-fg2 hover:bg-fg/10 hover:text-fg'}`}><n.icon size={17} aria-hidden />{n.label}</NavLink>)}
      <div className="mt-auto space-y-3 border-t border-line pt-4"><div className="flex items-center gap-3 px-2"><Avatar user={user} size={34} /><div className="min-w-0"><div className="truncate text-sm font-medium">{user.name || user.email}</div><Badge tone="blue">{user.role}</Badge></div></div>
        <Link to="/" className="flex items-center gap-2 rounded-[12px] px-3 py-2.5 text-sm text-fg2 hover:bg-fg/10 hover:text-fg"><ArrowLeft size={16} aria-hidden />Back to SHAFARE</Link></div>
    </nav>
  )
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="glass sticky top-0 hidden h-screen rounded-none border-y-0 border-l-0 lg:block">{side}</aside>
      <div className="bar sticky top-0 z-40 flex items-center justify-between border-b border-line/70 px-4 py-3 lg:hidden"><span className="font-display text-sm font-bold tracking-[.2em]">SHAFARE <span className="text-cyan">ADMIN</span></span><Button variant="ghost" className="h-10 w-10 px-0" aria-label="Open admin menu" onClick={() => setOpen(true)}><Menu size={18} /></Button></div>
      {open && <div className="fixed inset-0 z-50 bg-black/60 lg:hidden" onClick={() => setOpen(false)}><aside className="glass page-in h-full w-72 rounded-none" onClick={(e) => e.stopPropagation()}><div className="flex justify-end p-2"><Button variant="ghost" className="h-10 w-10 px-0" aria-label="Close admin menu" onClick={() => setOpen(false)}><X size={18} /></Button></div>{side}</aside></div>}
      <main className="page-in min-w-0 px-4 py-8 lg:px-8">
        <Routes>{items.map((n) => <Route key={n.to} index={n.end} path={n.end ? undefined : n.to.replace('/admin/', '')} element={n.el} />)}
          <Route path="*" element={<EmptyState icon={<KeyRound size={22} />} title="Nothing here" text="That page doesn’t exist, or your role can’t access it." />} /></Routes>
      </main>
    </div>
  )
}
