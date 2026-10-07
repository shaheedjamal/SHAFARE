import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bell, FileText, Flame, Heart, Layers, Sparkles, Star, X } from 'lucide-react'
import { byId, catOf, cats, inCat, search, tools, Tool } from '../../registry'
import { useStore } from '../../store'
import { useSession } from '../../state/session'
import { useContent } from '../../state/content'
import { useNotifications } from '../../state/notifications'
import { Grid, Section } from '../../components/ToolCard'
import { BarChart, Button, Card, Notice, Particles, StatCard } from '../../ds'
import { ago } from '../../lib/hooks'
import { lastDays } from '../activity/Activity'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon } from 'lucide-react'

const QUICK = ['advanced-calculator', 'percentage', 'bmi', 'age', 'emi', 'unit-converter']
const SHORTCUTS: [string, string][] = [['advanced-calculator', 'Calculator'], ['bmi', 'BMI'], ['pdf-to-image', 'PDF → Image'], ['qr-scanner', 'QR Scanner'], ['percentage', 'Percentage'], ['json-formatter', 'JSON Formatter']]
const greet = () => { const h = new Date().getHours(); return h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening' }
const get = (ids: string[]) => ids.map(byId).filter(Boolean) as Tool[]

function HeroSearch() {
  const [q, setQ] = useState(''), [i, setI] = useState(0), nav = useNavigate(), list = q.trim() ? search(q).slice(0, 6) : []
  const go = (t: Tool) => nav(`/tools/${t.id}`)
  return (
    <div className="relative mx-auto mt-6 max-w-2xl text-left">
      <div className="glass flex items-center gap-3 rounded-[18px] px-4 shadow-[0_0_60px_rgb(var(--accent)/.18)]"><SearchIcon size={20} className="text-cyan" aria-hidden />
        <input aria-label="Search tools" placeholder="What do you need?" value={q} onChange={(e) => { setQ(e.target.value); setI(0) }}
          onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setI(Math.min(i + 1, list.length - 1)) } else if (e.key === 'ArrowUp') { e.preventDefault(); setI(Math.max(i - 1, 0)) } else if (e.key === 'Enter' && list[i]) go(list[i]) }}
          className="h-14 w-full bg-transparent text-base text-fg outline-none placeholder:text-muted" /><kbd className="hidden rounded border border-line px-1.5 py-0.5 text-xs text-muted sm:block">Ctrl K</kbd></div>
      {q.trim() && <ul role="listbox" aria-label="Results" className="glass absolute z-20 mt-2 w-full rounded-[18px] p-2">{list.map((t, n) => <li key={t.id} role="option" aria-selected={n === i}><button onClick={() => go(t)} className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm ${n === i ? 'bg-accent/15' : 'hover:bg-fg/5'}`}><t.icon size={16} className="text-cyan" aria-hidden />{t.name}<span className="ml-auto text-xs text-muted">{t.category}</span></button></li>)}{!list.length && <li className="px-3 py-5 text-center text-sm text-muted">No tools match “{q}”.</li>}</ul>}
    </div>
  )
}

export default function Dashboard() {
  const user = useSession((s) => s.user), authed = useSession((s) => s.status) === 'authed'
  const { favorites, history, notes, usage, dismissed, dismiss } = useStore(), content = useContent(), notif = useNotifications()
  const personal = user?.settings.privacy.personalization !== false
  const recent = get(history.map((h) => h.id)).slice(0, 4), favs = get(favorites).slice(0, 6)
  const week = lastDays(usage, 7), weekTotal = week.reduce((a, d) => a + d.value, 0), activeDays = week.filter((d) => d.value).length
  const featured = get(content.featured.length ? content.featured : ['pdf-to-image', 'password', 'json-formatter']).filter((t) => !content.disabledTools.includes(t.id)).slice(0, 3)
  const recs = useMemo(() => {
    if (!personal) return get(['advanced-calculator', 'image-compress', 'qr-generator'])
    const used = new Set(history.map((h) => h.id)), weight: Record<string, number> = {}
    ;[...history.map((h) => h.id), ...favorites].forEach((id) => { const t = byId(id); if (t) weight[t.category] = (weight[t.category] ?? 0) + 1 })
    const order = Object.entries(weight).sort((a, b) => b[1] - a[1]).map(([c]) => c)
    const pool = [...order.flatMap((c) => inCat(c)), ...tools].filter((t) => !used.has(t.id) && !favorites.includes(t.id) && !content.disabledTools.includes(t.id))
    return [...new Map(pool.map((t) => [t.id, t])).values()].slice(0, 3)
  }, [personal, history, favorites, content.disabledTools])
  const banner = content.announcements.find((a) => !dismissed.includes(a.id))
  const first = user?.name?.split(' ')[0]
  return (
    <div className="page-in">
      {banner && <div className="mx-auto max-w-6xl px-4 pt-4"><Notice tone={banner.level === 'warning' ? 'warning' : banner.level === 'success' ? 'success' : 'info'} title={banner.title}><span className="flex items-start justify-between gap-3">{banner.body}<button onClick={() => dismiss(banner.id)} aria-label="Dismiss announcement" className="text-muted hover:text-fg"><X size={16} /></button></span></Notice></div>}
      <section className="relative mx-auto max-w-6xl overflow-hidden px-4 pb-6 pt-12 text-center sm:pt-16">
        <Particles />
        <div className="relative mx-auto h-24 w-24"><div className="absolute inset-0 rounded-full bg-accent/40 blur-3xl" aria-hidden /><img src="/logo-mark.png" alt="SHAFARE" width={96} height={96} className="relative rounded-full border border-line" /></div>
        <p className="relative mt-5 text-xs font-medium tracking-[.3em] text-fg2">{first ? `${greet().toUpperCase()}, ${first.toUpperCase()}` : 'ALL TOOLS. ONE PLACE.'}</p>
        <h1 className="relative mx-auto mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">{first ? <>What will you <span className="grad-text">get done</span> today?</> : <>One place.<br /><span className="grad-text">Every useful tool.</span></>}</h1>
        <p className="relative mx-auto mt-4 max-w-xl text-fg2">Calculate, convert, create, optimize and manage your everyday digital tasks.</p>
        <div className="relative"><HeroSearch />
          <div className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-2">{SHORTCUTS.map(([id, l]) => <Link key={id} to={`/tools/${id}`} className="press rounded-[10px] border border-line bg-fg/5 px-3.5 py-2 text-sm text-fg2 transition hover:border-accent/50 hover:text-fg">{l}</Link>)}</div></div>
      </section>

      <Section title="Your activity" sub="A quick look at how you’ve been using SHAFARE.">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="grid grid-cols-2 gap-4"><StatCard label="Tools opened (7 days)" value={weekTotal} icon={<Layers size={16} />} /><StatCard label="Active days" value={activeDays} hint="of the last 7" icon={<Flame size={16} />} /><StatCard label="Favorites" value={favorites.length} icon={<Heart size={16} />} /><StatCard label="Notes" value={notes.length} icon={<FileText size={16} />} /></div>
          <Card><h3 className="mb-1 text-sm font-medium text-fg2">Tool opens this week</h3><BarChart data={week} label="Tool opens per day" /></Card></div>
      </Section>

      <Section title="Quick actions"><Grid items={get(QUICK)} /></Section>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-4 lg:grid-cols-3">
        <Card className="lg:col-span-1"><h3 className="mb-3 flex items-center gap-2 font-semibold"><Star size={16} className="text-[#F59E0B]" aria-hidden />{recent.length ? 'Recently used' : 'Start here'}</h3>
          {recent.length ? <ul className="space-y-1">{recent.map((t) => <li key={t.id}><Link to={`/tools/${t.id}`} className="flex items-center gap-3 rounded-[10px] px-2 py-2 text-sm hover:bg-fg/10"><t.icon size={16} className="text-cyan" aria-hidden />{t.name}</Link></li>)}</ul> : <p className="text-sm text-fg2">Tools you open will appear here for one-tap access.</p>}</Card>
        <Card className="lg:col-span-1"><h3 className="mb-3 flex items-center gap-2 font-semibold"><Sparkles size={16} className="text-cyan" aria-hidden />{personal && history.length ? 'Recommended for you' : 'Popular right now'}</h3>
          <ul className="space-y-1">{recs.map((t) => <li key={t.id}><Link to={`/tools/${t.id}`} className="flex items-center gap-3 rounded-[10px] px-2 py-2 text-sm hover:bg-fg/10"><t.icon size={16} className="text-cyan" aria-hidden />{t.name}</Link></li>)}</ul></Card>
        <Card className="lg:col-span-1"><h3 className="mb-3 flex items-center justify-between font-semibold"><span className="flex items-center gap-2"><Bell size={16} className="text-cyan" aria-hidden />Notifications</span>{authed && <Link to="/notifications" className="text-xs font-normal text-cyan">View all</Link>}</h3>
          {authed ? (notif.items.length ? <ul className="space-y-2">{notif.items.slice(0, 3).map((n) => <li key={n.id} className="text-sm"><div className="font-medium">{n.title}</div><div className="text-xs text-fg2">{n.body} · {ago(n.at)}</div></li>)}</ul> : <p className="text-sm text-fg2">You’re all caught up.</p>)
            : <div><p className="text-sm text-fg2">Sign in to get security alerts and announcements, and to sync across devices.</p><Link to="/login"><Button className="mt-3">Sign in</Button></Link></div>}</Card>
      </div>

      <Section title="Featured" sub="Hand-picked by the SHAFARE team."><Grid items={featured} /></Section>
      {favs.length > 0 && <Section title="Your favorites" action={<Link to="/favorites" className="text-sm text-cyan hover:underline">See all</Link>}><Grid items={favs} /></Section>}

      <div className="mx-auto max-w-6xl px-4 pt-6"><h2 className="font-display text-2xl font-bold">Explore all tools</h2></div>
      {cats.map((c) => { const list = inCat(c.id); return <Section key={c.id} title={c.id} sub={c.blurb} action={list.length > 6 ? <Link to={`/tools?c=${c.id}`} className="text-sm text-cyan hover:underline">View all {list.length}</Link> : undefined}><Grid items={list.slice(0, 6)} /></Section> })}
    </div>
  )
}
void catOf
