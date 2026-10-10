import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Building2, Contact, Search, StickyNote } from 'lucide-react'
import { useData } from '@/store'
import { globalSearch, type SearchHit } from '@/lib/search'
import { cx } from '../ui/Badge'

const ICON = { Company: Building2, Application: Briefcase, Contact, Note: StickyNote }

export function GlobalSearch() {
  const data = useData()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const hits = useMemo(() => globalSearch(data, q), [data, q])

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.current?.focus() } }
    const down = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('keydown', key); document.addEventListener('mousedown', down)
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('mousedown', down) }
  }, [])
  useEffect(() => setActive(0), [q])

  const go = (h: SearchHit) => { setOpen(false); setQ(''); input.current?.blur(); nav(h.link) }
  const groups = (['Company', 'Application', 'Contact', 'Note'] as const).map(k => [k, hits.filter(h => h.kind === k)] as const).filter(([, l]) => l.length)
  return (
    <div ref={box} className="relative min-w-0 flex-1 sm:max-w-md">
      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
      <input ref={input} role="combobox" aria-expanded={open && !!q} aria-controls="search-results" aria-label="Search companies, applications, contacts and notes" aria-autocomplete="list"
        className="input bg-ink-50 ps-9 pe-14" placeholder="Search…" value={q}
        onChange={e => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, hits.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
          else if (e.key === 'Enter' && hits[active]) go(hits[active])
          else if (e.key === 'Escape') { setOpen(false); input.current?.blur() }
        }} />
      <kbd className="pointer-events-none absolute end-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-ink-200 bg-surface px-1.5 py-0.5 text-[10.5px] font-medium text-ink-400 sm:block">Ctrl K</kbd>
      {open && q.trim() && (
        <div id="search-results" role="listbox" className="anim-pop scroll-thin absolute inset-x-0 top-full z-50 mt-1.5 max-h-[70vh] overflow-y-auto rounded-xl border border-ink-200 bg-surface p-1.5 shadow-pop sm:min-w-[26rem]">
          {!hits.length && <p className="px-3 py-6 text-center text-sm text-ink-500">No results for “{q}”</p>}
          {groups.map(([kind, list]) => (
            <div key={kind}>
              <p className="eyebrow px-2.5 pb-1 pt-2">{kind === 'Note' ? 'Notes & activity' : `${kind}s`}</p>
              {list.map(h => {
                const Icon = ICON[h.kind]; const idx = hits.indexOf(h)
                return (
                  <button key={h.kind + h.id} role="option" aria-selected={idx === active} onMouseEnter={() => setActive(idx)} onClick={() => go(h)}
                    className={cx('flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start', idx === active && 'bg-brand-50')}>
                    <Icon className="size-4 shrink-0 text-ink-400" aria-hidden />
                    <span className="min-w-0"><span className="block truncate text-[13.5px] font-medium text-ink-900">{h.title}</span><span className="block truncate text-xs text-ink-500">{h.subtitle}</span></span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
