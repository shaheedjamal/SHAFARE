import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Star } from 'lucide-react'
import { Tool } from '../registry'
import { useStore } from '../store'
import { useContent } from '../state/content'

export const StarBtn = ({ t, className = '' }: { t: Tool; className?: string }) => {
  const { favorites, toggleFav } = useStore(); const fav = favorites.includes(t.id)
  return <button onClick={() => toggleFav(t.id)} aria-pressed={fav} aria-label={fav ? `Remove ${t.name} from favorites` : `Add ${t.name} to favorites`} className={`press rounded-[8px] p-1.5 text-muted transition hover:text-fg ${className}`}><Star size={18} className={fav ? 'fill-[#F59E0B] text-[#F59E0B]' : ''} /></button>
}
export function ToolCard({ t }: { t: Tool }) {
  return (
    <div className="relative">
      <Link to={`/tools/${t.id}`} className="glass card-hover block h-full rounded-[20px] p-5">
        <div className="icon-box flex h-11 w-11 items-center justify-center rounded-[14px]"><t.icon size={20} aria-hidden /></div>
        <h3 className="mt-4 pr-8 font-semibold">{t.name}</h3><p className="mt-1 text-sm leading-relaxed text-fg2">{t.desc}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm text-cyan">Open Tool <ArrowRight size={14} className="arrow" /></span>
      </Link>
      <StarBtn t={t} className="absolute right-3 top-3" />
    </div>
  )
}
export function Grid({ items }: { items: Tool[] }) {
  const off = useContent((s) => s.disabledTools)
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.filter((t) => !off.includes(t.id)).map((t) => <ToolCard key={t.id} t={t} />)}</div>
}
export const Section = ({ title, sub, action, children }: { title: string; sub?: string; action?: ReactNode; children: ReactNode }) => (
  <section className="mx-auto max-w-6xl px-4 py-7"><div className="mb-5 flex items-end justify-between gap-3"><div><h2 className="text-xl font-semibold tracking-tight">{title}</h2>{sub && <p className="mt-1 text-sm text-fg2">{sub}</p>}</div>{action}</div>{children}</section>
)
