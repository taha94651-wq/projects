import { t } from '@/i18n'
import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { useStore } from '@/store'
import { useUI } from '@/ui-store'
import { todayISO } from '@/lib/dates'
import { cx } from '../ui/Badge'
import { NAV } from './nav'

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-lg bg-brand-500/20 ring-1 ring-brand-400/30">
        <svg viewBox="0 0 32 32" className="size-5" aria-hidden><path d="M7 25V13l9-6 9 6v12h-5.5v-7h-7v7z" fill="#98b59c" /></svg>
      </span>
      <span className="font-display text-[1.45rem] leading-none tracking-tight">Pipeline</span>
    </div>
  )
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const dueCount = useStore(s => s.data.followUps.filter(f => f.status === 'Pending' && f.dueDate <= todayISO()).length)
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5 px-3">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} onClick={onNavigate}
          className={({ isActive }) => cx('group flex h-10 items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition', isActive ? 'bg-white/10 text-white' : 'text-ink-300 hover:bg-white/5 hover:text-white')}>
          {({ isActive }) => (<>
            <Icon className={cx('size-[18px]', isActive ? 'text-brand-300' : 'text-ink-400 group-hover:text-ink-200')} aria-hidden />
            <span className="flex-1">{label}</span>
            {to === '/follow-ups' && dueCount > 0 && <span className="rounded-full bg-danger-500 px-1.5 py-px text-[11px] font-semibold text-white" aria-label={t('{n} due', { n: dueCount })}>{dueCount}</span>}
          </>)}
        </NavLink>
      ))}
    </nav>
  )
}

/** Fixed sidebar ≥ lg; slide-over drawer below. */
export function Sidebar() {
  const { navOpen, setNav } = useUI()
  const { pathname } = useLocation()
  useEffect(() => setNav(false), [pathname, setNav])
  useEffect(() => {
    if (!navOpen) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setNav(false)
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [navOpen, setNav])
  const user = useStore(s => s.user)
  const body = (
    <div className="flex h-full flex-col bg-ink-900 text-white">
      <div className="flex h-16 items-center justify-between px-6"><Logo />
        <button className="btn btn-ghost btn-icon btn-sm text-ink-300 hover:bg-white/10 lg:hidden" onClick={() => setNav(false)} aria-label="Close menu"><X className="size-4" /></button>
      </div>
      <div className="scroll-thin flex-1 overflow-y-auto py-2"><NavList /></div>
      <div className="m-3 rounded-xl bg-white/5 p-3.5 text-xs leading-relaxed text-ink-300">
        <p className="font-medium text-white">{user?.name}</p>
        <p className="mt-0.5 truncate text-ink-400">{user?.email}</p>
      </div>
    </div>
  )
  return (
    <>
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-60 lg:block">{body}</aside>
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="anim-fade absolute inset-0 bg-ink-950/50" onClick={() => setNav(false)} />
          <aside className="anim-pop absolute inset-y-0 start-0 w-72 max-w-[85vw] shadow-pop">{body}</aside>
        </div>
      )}
    </>
  )
}

const BOTTOM = ['/', '/applications', '/interviews', '/follow-ups']
export function BottomNav() {
  const setNav = useUI(s => s.setNav)
  const dueCount = useStore(s => s.data.followUps.filter(f => f.status === 'Pending' && f.dueDate <= todayISO()).length)
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-ink-200 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {NAV.filter(n => BOTTOM.includes(n.to)).map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => cx('relative flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium', isActive ? 'text-brand-700' : 'text-ink-500')}>
          <Icon className="size-5" aria-hidden />{label}
          {to === '/follow-ups' && dueCount > 0 && <span className="absolute end-1/2 top-1 translate-x-5 rounded-full bg-danger-500 px-1 text-[10px] font-semibold text-white">{dueCount}</span>}
        </NavLink>
      ))}
      <button onClick={() => setNav(true)} className="flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium text-ink-500" aria-label="More navigation">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg>More
      </button>
    </nav>
  )
}
