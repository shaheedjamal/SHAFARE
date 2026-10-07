import { useState } from 'react'
import { Pin, Plus, Trash2 } from 'lucide-react'
import { Button, Input, Panel } from '../ui'
import { Note, useStore } from '../store'

export default function Notes() {
  const { notes, upsertNote, deleteNote } = useStore()
  const [q, setQ] = useState(''); const [sel, setSel] = useState<string | null>(null)
  const list = notes.filter((n) => (n.title + n.body).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated - a.updated)
  const cur = notes.find((n) => n.id === sel)
  const save = (n: Note, patch: Partial<Note>) => upsertNote({ ...n, ...patch, updated: Date.now() })
  const add = () => { const n: Note = { id: crypto.randomUUID(), title: '', body: '', pinned: false, updated: Date.now() }; upsertNote(n); setSel(n.id) }
  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <Panel className="space-y-3">
        <div className="flex gap-2"><Input placeholder="Search notes" aria-label="Search notes" value={q} onChange={(e) => setQ(e.target.value)} /><Button onClick={add} aria-label="New note"><Plus size={16} /></Button></div>
        <ul className="space-y-1">
          {list.map((n) => (
            <li key={n.id}><button onClick={() => setSel(n.id)} className={`flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-sm ${sel === n.id ? 'bg-surface2' : 'hover:bg-surface2'}`}>
              {n.pinned && <Pin size={14} className="shrink-0 text-accent" />}<span className="truncate">{n.title || n.body.slice(0, 40) || 'Untitled'}</span></button></li>))}
          {!list.length && <li className="px-3 py-2 text-sm text-muted">No notes yet.</li>}
        </ul>
      </Panel>
      <Panel className="space-y-3">
        {cur ? (<>
          <div className="flex gap-2"><Input placeholder="Title" aria-label="Title" value={cur.title} onChange={(e) => save(cur, { title: e.target.value })} />
            <Button variant="ghost" aria-label="Pin note" onClick={() => save(cur, { pinned: !cur.pinned })}><Pin size={16} /></Button>
            <Button variant="ghost" aria-label="Delete note" onClick={() => { deleteNote(cur.id); setSel(null) }}><Trash2 size={16} /></Button></div>
          <textarea aria-label="Note body" value={cur.body} onChange={(e) => save(cur, { body: e.target.value })} rows={14} className="w-full rounded-[10px] border border-line bg-surface2 p-3 text-sm" />
          <p className="text-xs text-muted">Saved automatically on this device.</p>
        </>) : <p className="text-sm text-muted">Select or create a note.</p>}
      </Panel>
    </div>
  )
}
