import { t } from '@/i18n'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, Scale, X } from 'lucide-react'
import { COMPANY_TYPES } from '@shared/constants'
import { useData, useLocale } from '@/store'
import { agoDays, fmtDate } from '@/lib/dates'
import { categoryStats, companyStats, type GroupStats } from '@/lib/compare'
import { parseInterests } from '@/lib/interests'
import { fmtMoney, fmtNumber, fmtPct } from '@/lib/format'
import { Badge, CompanyStatusBadge, cx, PriorityBadge, StageBadge } from '@/components/ui/Badge'
import { Avatar, EmptyState, PageHeader, Segmented } from '@/components/ui/misc'

const MAX = 4
type Row = { label: string; cells: React.ReactNode[]; best?: (number | null)[]; higherIsBetter?: boolean }

/** Index/indices of the best numeric value in a row (ties allowed); undefined when nothing to compare. */
function bestIdx(values: (number | null)[], higher: boolean): Set<number> {
  const nums = values.filter((v): v is number => v != null)
  if (nums.length < 2 || new Set(nums).size < 2) return new Set()
  const target = higher ? Math.max(...nums) : Math.min(...nums)
  return new Set(values.flatMap((v, i) => (v === target ? [i] : [])))
}

function CompareTable({ heads, rows }: { heads: React.ReactNode[]; rows: Row[] }) {
  return (
    <div className="card scroll-thin overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink-100">
            <th scope="col" className="w-44 px-4 py-3 text-start"><span className="sr-only">{t('Metric')}</span></th>
            {heads.map((h, i) => <th key={i} scope="col" className="px-4 py-3 text-start align-bottom">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const best = r.best ? bestIdx(r.best, r.higherIsBetter ?? true) : new Set<number>()
            return (
              <tr key={r.label} className="border-b border-ink-100 last:border-0">
                <th scope="row" className="eyebrow px-4 py-3 text-start font-semibold">{t(r.label)}</th>
                {r.cells.map((c, i) => (
                  <td key={i} className={cx('px-4 py-3 align-top', best.has(i) && 'bg-brand-50/70 font-semibold text-brand-900')}>
                    <span className="inline-flex items-center gap-1.5">{best.has(i) && <Check className="size-3.5 text-brand-600" aria-label={t('Best')} />}{c}</span>
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ByCategory() {
  const data = useData(), locale = useLocale()
  const rows = useMemo(() => categoryStats(data).filter(r => r.type !== 'Unclassified' || r.stats.companies > 0), [data])
  const pct = (n: number | null) => fmtPct(n, locale)
  const days = (n: number | null) => (n == null ? '—' : `${fmtNumber(n, locale, 1)} ${t('d')}`)
  const col = (f: (s: GroupStats) => number | null) => rows.map(r => f(r.stats))
  const mk = (label: string, f: (s: GroupStats) => number | null, fmt: (n: number | null) => string, higher = true): Row => ({ label, cells: col(f).map(fmt), best: col(f), higherIsBetter: higher })
  const num = (n: number | null) => (n == null ? '—' : fmtNumber(n, locale))
  return (
    <>
      <p className="mb-4 max-w-2xl text-sm text-ink-500">{t('How each kind of company is performing for you. The best value in each row is highlighted.')}</p>
      <CompareTable heads={rows.map(r => <span key={r.type} className="font-display text-xl">{t(r.type)}</span>)} rows={[
        mk('Companies', s => s.companies, num), mk('Applications', s => s.applications, num), mk('Active applications', s => s.active, num),
        mk('Interviews', s => s.interviews, num), mk('Offers', s => s.offers, num), mk('Rejected', s => s.rejected, num, false),
        mk('Interview rate', s => s.interviewRate, pct), mk('Response rate', s => s.responseRate, pct), mk('Avg. days to first reply', s => s.avgResponseDays, days, false),
      ]} />
    </>
  )
}

function ByCompany() {
  const data = useData(), locale = useLocale()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState('')
  const [cat, setCat] = useState('')
  const ids = (params.get('ids') ?? '').split(',').filter(id => data.companies.some(c => c.id === id)).slice(0, MAX)
  const setIds = (next: string[]) => setParams(next.length ? { ids: next.join(',') } : {}, { replace: true })
  const picked = ids.map(id => data.companies.find(c => c.id === id)!)
  const stats = picked.map(c => companyStats(data, c.id))
  const options = data.companies.filter(c => !c.archived && !ids.includes(c.id) && (!cat || c.type === cat) && (!filter || c.name.toLowerCase().includes(filter.toLowerCase())))
    .sort((a, b) => a.name.localeCompare(b.name))
  const pct = (n: number | null) => fmtPct(n, locale)
  const sameCurrency = new Set(stats.flatMap(s => (s.topSalary ? [s.topSalary.currency] : []))).size === 1
  const rows: Row[] = [
    { label: 'Category', cells: picked.map(c => <Badge tone={c.type === 'Unclassified' ? 'amber' : 'green'}>{t(c.type)}</Badge>) },
    { label: 'Interests', cells: picked.map(c => <span className="flex flex-wrap gap-1">{parseInterests(c.interests).map(i => <Badge key={i}>{t(i)}</Badge>)}{!c.interests && '—'}</span>) },
    { label: 'Location', cells: picked.map(c => c.location || '—') },
    { label: 'Priority', cells: picked.map(c => <PriorityBadge priority={c.priority} />) },
    { label: 'Status', cells: picked.map(c => <CompanyStatusBadge status={c.status} />) },
    { label: 'Applications', cells: stats.map(s => s.applications), best: stats.map(s => s.applications) },
    { label: 'Furthest stage', cells: stats.map(s => (s.furthest ? <StageBadge stage={s.furthest} /> : '—')) },
    { label: 'Interviews', cells: stats.map(s => s.interviews), best: stats.map(s => s.interviews) },
    { label: 'Offers', cells: stats.map(s => s.offers), best: stats.map(s => s.offers) },
    { label: 'Best salary seen', cells: stats.map(s => (s.topSalary ? fmtMoney(s.topSalary.max, s.topSalary.currency, locale) : '—')), best: sameCurrency ? stats.map(s => s.topSalary?.max ?? null) : undefined },
    { label: 'Response rate', cells: stats.map(s => pct(s.responseRate)), best: stats.map(s => s.responseRate) },
    { label: 'Avg. days to first reply', cells: stats.map(s => (s.avgResponseDays == null ? '—' : `${fmtNumber(s.avgResponseDays, locale, 1)} ${t('d')}`)), best: stats.map(s => s.avgResponseDays), higherIsBetter: false },
    { label: 'Last contact', cells: stats.map(s => (s.lastContact ? agoDays(s.lastContact) : '—')) },
    { label: 'Next follow-up', cells: stats.map(s => (s.nextFollowUp ? fmtDate(s.nextFollowUp, locale, { day: 'numeric', month: 'short' }) : '—')) },
    { label: 'Notes', cells: picked.map(c => <span className="whitespace-pre-wrap text-ink-600">{c.notes || '—'}</span>) },
  ]
  return (
    <>
      <div className="card mb-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {picked.map(c => (
            <span key={c.id} className="inline-flex items-center gap-2 rounded-full border border-brand-300 bg-brand-50 py-1 ps-2.5 pe-1.5 text-[13px] font-medium text-brand-900">
              {c.name}<button className="grid size-5 place-items-center rounded-full hover:bg-brand-100" aria-label={t('Remove {name}', { name: c.name })} onClick={() => setIds(ids.filter(i => i !== c.id))}><X className="size-3" /></button>
            </span>
          ))}
          {!picked.length && <span className="text-sm text-ink-500">{t('Pick 2 to 4 companies from your list')}</span>}
          {picked.length > 0 && <button className="btn btn-ghost btn-sm ms-auto text-ink-500" onClick={() => setIds([])}>{t('Clear')}</button>}
        </div>
        {ids.length < MAX && (
          <div className="mt-3 border-t border-ink-100 pt-3">
            <div className="mb-2 flex flex-wrap gap-2">
              <input className="input h-9 max-w-xs" type="search" aria-label={t('Search companies')} placeholder={t('Search companies')} value={filter} onChange={e => setFilter(e.target.value)} />
              <select className="input h-9 w-auto" aria-label={t('Filter by category')} value={cat} onChange={e => setCat(e.target.value)}>
                <option value="">{t('All categories')}</option>{COMPANY_TYPES.map(o => <option key={o} value={o}>{t(o)}</option>)}
              </select>
            </div>
            <ul className="scroll-thin flex max-h-36 flex-wrap gap-1.5 overflow-y-auto" aria-label={t('Companies')}>
              {options.slice(0, 60).map(c => (
                <li key={c.id}><button className="rounded-full border border-ink-200 bg-surface px-2.5 py-1 text-xs hover:border-brand-400 hover:bg-brand-50" onClick={() => setIds([...ids, c.id])}>+ {c.name}</button></li>
              ))}
              {!options.length && <li className="text-xs text-ink-400">{t('No companies match')}</li>}
            </ul>
          </div>
        )}
      </div>
      {picked.length >= 2 ? (
        <CompareTable heads={picked.map(c => (
          <Link key={c.id} to={`/companies/${c.id}`} className="flex items-center gap-2.5 hover:text-brand-800"><Avatar name={c.name} size="sm" /><span className="font-semibold">{c.name}</span></Link>
        ))} rows={rows} />
      ) : <div className="card"><EmptyState icon={Scale} title="Choose at least two companies" text="Compare category, interests, applications, interviews, salary and response time side by side." /></div>}
    </>
  )
}

export default function Compare() {
  const [params] = useSearchParams()
  const [tab, setTab] = useState<'category' | 'company'>(params.get('ids') ? 'company' : 'category')
  return (
    <>
      <PageHeader title="Compare" subtitle="Developers, design firms and contractors — and any companies side by side"
        actions={<Segmented label="Compare by" value={tab} onChange={setTab} options={[{ value: 'category', label: 'By category' }, { value: 'company', label: 'By company' }]} />} />
      {tab === 'category' ? <ByCategory /> : <ByCompany />}
    </>
  )
}
