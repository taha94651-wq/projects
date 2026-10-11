import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cx } from './Badge'

export interface MenuItem { label: string; icon?: ReactNode; onSelect: () => void; danger?: boolean; hidden?: boolean; disabled?: boolean; divider?: boolean }

/** Popover wrapper: closes on outside click / Esc, returns focus to trigger. */
export function Popover({ trigger, children, align = 'end', className, panelClass }: {
  trigger: (p: { open: boolean; toggle: () => void; ref: React.RefObject<HTMLButtonElement | null>; props: Record<string, unknown> }) => ReactNode
  children: (close: () => void) => ReactNode; align?: 'start' | 'end'; className?: string; panelClass?: string
}) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const down = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus() } }
    document.addEventListener('mousedown', down); document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [open])
  return (
    <div ref={wrap} className={cx('relative', className)}>
      {trigger({ open, toggle: () => setOpen(o => !o), ref: btn, props: { 'aria-haspopup': 'true', 'aria-expanded': open } })}
      {open && <div className={cx('anim-pop absolute top-full z-40 mt-1.5 rounded-xl border border-ink-200 bg-surface shadow-pop', align === 'end' ? 'end-0' : 'start-0', panelClass)}>{children(() => setOpen(false))}</div>}
    </div>
  )
}

export function Menu({ trigger, items, align, label }: { trigger: ReactNode; items: MenuItem[]; align?: 'start' | 'end'; label: string }) {
  const visible = items.filter(i => !i.hidden)
  return (
    <Popover align={align} panelClass="min-w-48 p-1" trigger={({ toggle, ref, props }) => (
      <button ref={ref} type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={label} onClick={e => { e.stopPropagation(); toggle() }} {...props}>{trigger}</button>
    )}>
      {close => (
        <div role="menu" onKeyDown={e => {
          const els = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
          const i = els.indexOf(document.activeElement as HTMLButtonElement)
          if (e.key === 'ArrowDown') { e.preventDefault(); els[(i + 1) % els.length]?.focus() }
          if (e.key === 'ArrowUp') { e.preventDefault(); els[(i - 1 + els.length) % els.length]?.focus() }
        }}>
          {visible.map((it, idx) => (
            <div key={it.label}>
              {it.divider && idx > 0 && <div className="my-1 h-px bg-ink-100" />}
              <button role="menuitem" type="button" disabled={it.disabled}
                className={cx('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-[13px] hover:bg-ink-50 disabled:opacity-40', it.danger ? 'text-danger-700 hover:bg-danger-50' : 'text-ink-800')}
                onClick={e => { e.stopPropagation(); close(); it.onSelect() }}>
                {it.icon}{it.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </Popover>
  )
}
