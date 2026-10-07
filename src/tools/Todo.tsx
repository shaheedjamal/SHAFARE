import { useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { Button, Input, Panel } from '../ui'
import { useStore } from '../store'

export default function Todo() {
  const { todos, addTodo, toggleTodo, removeTodo } = useStore(); const [t, setT] = useState('')
  const add = () => { if (t.trim()) { addTodo(t.trim()); setT('') } }
  const left = todos.filter((x) => !x.done).length
  return (
    <Panel className="mx-auto max-w-xl space-y-4">
      <div className="flex gap-2"><Input aria-label="New task" placeholder="Add a task" value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} /><Button onClick={add} aria-label="Add task"><Plus size={16} /></Button></div>
      <ul className="space-y-1">{todos.map((x) => (
        <li key={x.id} className="flex items-center gap-3 rounded-[10px] px-2 py-1.5 hover:bg-fg/5">
          <button role="checkbox" aria-checked={x.done} aria-label={`Mark "${x.text}" ${x.done ? 'not done' : 'done'}`} onClick={() => toggleTodo(x.id)} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border ${x.done ? 'border-accent bg-accent text-white' : 'border-line'}`}>{x.done && <Check size={12} />}</button>
          <span className={`flex-1 text-sm ${x.done ? 'text-muted line-through' : ''}`}>{x.text}</span>
          <button aria-label={`Delete "${x.text}"`} onClick={() => removeTodo(x.id)} className="rounded p-1.5 text-fg2 hover:bg-fg/10"><Trash2 size={14} /></button></li>))}
        {!todos.length && <li className="py-8 text-center text-sm text-muted">Nothing to do yet. Add your first task above.</li>}</ul>
      {todos.length > 0 && <p className="text-xs text-muted">{left} of {todos.length} remaining · saved on this device</p>}
    </Panel>
  )
}
