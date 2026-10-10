import type { ReactNode } from 'react'
import { Search, X, type LucideIcon } from 'lucide-react'
import { cx } from './Badge'
import { initials } from '@/lib/format'

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 grid size-11 place-items-center rounded-full bg-brand-50 text-brand-600"><Icon className="size-5" /></div>
      <p className="text-sm font-semibold text-ink-800">{title}</p>
      {text && <p className="mt-1 max-w-sm text-[13px] text-ink-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
export function Section({ title, icon: Icon, action, children, className, flush }: { title: string; icon?: LucideIcon; action?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={cx('card', className)}>
      <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink-800">{Icon && <Icon className="size-4 text-ink-400" aria-hidden />}{title}</h2>
        {action}
      </header>
      <div className={flush ? '' : 'px-5 pb-5'}>{children}</div>
    </section>
  )
}
const AV = ['bg-brand-100 text-brand-800', 'bg-info-100 text-info-700', 'bg-warn-100 text-warn-700', 'bg-ink-200 text-ink-700', 'bg-brand-200 text-brand-900']
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
  const s = { sm: 'size-7 text-[11px]', md: 'size-9 text-xs', lg: 'size-11 text-sm', xl: 'size-16 text-xl rounded-2xl' }[size]
  return <span aria-hidden className={cx('grid shrink-0 place-items-center rounded-lg font-semibold', s, AV[hash % AV.length])}>{initials(name) || '?'}</span>
}
export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: ReactNode }[]; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-ink-200 bg-ink-50 p-0.5">
      {options.map(o => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}
          className={cx('inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition', o.value === value ? 'bg-surface text-ink-900 shadow-card' : 'text-ink-500 hover:text-ink-800')}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  )
}
export function Tabs<T extends string>({ value, onChange, tabs, label }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; count?: number; tone?: 'danger' }[]; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="scroll-thin flex gap-1 overflow-x-auto border-b border-ink-200">
      {tabs.map(t => (
        <button key={t.value} role="tab" aria-selected={t.value === value} onClick={() => onChange(t.value)}
          className={cx('-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-medium transition', t.value === value ? 'border-brand-600 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-800')}>
          {t.label}
          {t.count !== undefined && <span className={cx('rounded-full px-1.5 text-[11px] font-semibold', t.tone === 'danger' && t.count > 0 ? 'bg-danger-50 text-danger-700' : 'bg-ink-100 text-ink-500')}>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}
export function SearchInput({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
      <input type="search" aria-label={label} className="input ps-9" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
export function FilterSelect({ label, value, onChange, options, all }: { label: string; value: string; onChange: (v: string) => void; options: readonly (string | { value: string; label: string })[]; all: string }) {
  return (
    <select aria-label={`Filter by ${label.toLowerCase()}`} className={cx('input h-9 w-auto min-w-0 max-w-[11rem] py-0 text-[13px]', value && 'border-brand-400 bg-brand-50/50')} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{all}</option>
      {options.map(o => typeof o === 'string' ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
export function DateFilter({ label, from, to, onChange }: { label: string; from: string; to: string; onChange: (from: string, to: string) => void }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-[12px] text-ink-500" role="group" aria-label={label}>
      <span>{label}</span>
      <input type="date" aria-label={`${label} from`} className="input h-9 w-auto px-2 text-[13px]" value={from} max={to || undefined} onChange={e => onChange(e.target.value, to)} />
      <span aria-hidden>–</span>
      <input type="date" aria-label={`${label} to`} className="input h-9 w-auto px-2 text-[13px]" value={to} min={from || undefined} onChange={e => onChange(from, e.target.value)} />
    </div>
  )
}
export const FilterBar = ({ children, active, onClear }: { children: ReactNode; active: boolean; onClear: () => void }) => (
  <div className="mb-4 flex flex-wrap items-center gap-2" role="search">
    {children}
    {active && <button className="btn btn-ghost btn-sm text-ink-500" onClick={onClear}><X className="size-3.5" />Clear</button>}
  </div>
)
export function Stat({ label, value, hint, icon: Icon, tone = 'default', onClick }: { label: string; value: ReactNode; hint?: string; icon: LucideIcon; tone?: 'default' | 'danger' | 'brand' | 'warn'; onClick?: () => void }) {
  const t = { default: 'bg-ink-100 text-ink-600', danger: 'bg-danger-50 text-danger-500', brand: 'bg-brand-50 text-brand-600', warn: 'bg-warn-50 text-warn-500' }[tone]
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className={cx('card p-4 text-start', onClick && 'transition hover:border-ink-300 hover:shadow-pop')}>
      <div className="flex items-center justify-between"><span className="eyebrow">{label}</span><span className={cx('grid size-7 place-items-center rounded-lg', t)}><Icon className="size-3.5" aria-hidden /></span></div>
      <div className="mt-2 font-display text-[2.1rem] leading-none tracking-tight">{value}</div>
      {hint && <div className="mt-1.5 text-xs text-ink-400">{hint}</div>}
    </Tag>
  )
}
export const Dl = ({ items }: { items: [string, ReactNode][] }) => (
  <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
    {items.map(([k, v]) => <div key={k} className="min-w-0"><dt className="eyebrow">{k}</dt><dd className="mt-0.5 break-words text-sm text-ink-800">{v || '—'}</dd></div>)}
  </dl>
)
export const ExtLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-900">{children}</a>
)
