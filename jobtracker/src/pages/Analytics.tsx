import { useMemo, useState } from 'react'
import { BarChart3, Clock, Gift, MessagesSquare, ThumbsDown, Timer, Trophy, TrendingUp } from 'lucide-react'
import { useData, useLocale } from '@/store'
import { computeAnalytics, type CountRow } from '@/lib/analytics'
import { fmtNumber, fmtPct } from '@/lib/format'
import { fmtDate } from '@/lib/dates'
import { cx } from '@/components/ui/Badge'
import { EmptyState, PageHeader, Section, Stat } from '@/components/ui/misc'

function HBars({ rows, limit = 6, fmt }: { rows: CountRow[]; limit?: number; fmt?: (n: number) => string }) {
  const max = Math.max(1, ...rows.map(r => r.count))
  if (!rows.length) return <p className="py-4 text-sm text-ink-400">No data yet.</p>
  return (
    <ul className="space-y-2.5">
      {rows.slice(0, limit).map(r => (
        <li key={r.label} className="grid grid-cols-[minmax(0,9rem)_1fr_2rem] items-center gap-3 text-[13px]">
          <span className="truncate text-ink-700" title={r.label}>{r.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-ink-100"><span className="block h-full rounded-full bg-brand-500" style={{ width: `${(r.count / max) * 100}%` }} /></span>
          <span className="text-end font-medium tabular-nums">{fmt ? fmt(r.count) : r.count}</span>
        </li>
      ))}
    </ul>
  )
}

export default function Analytics() {
  const data = useData(), locale = useLocale()
  const [months, setMonths] = useState(6)
  const a = useMemo(() => computeAnalytics(data, months), [data, months])
  const pct = (n: number | null) => fmtPct(n, locale)
  const days = (n: number | null) => (n == null ? '—' : `${fmtNumber(n, locale, 1)} d`)
  if (!a.totals.applications) return <><PageHeader title="Analytics" /><div className="card"><EmptyState icon={BarChart3} title="No data to analyse yet" text="Add and submit applications to see how your search performs." /></div></>
  const maxM = Math.max(1, ...a.months.flatMap(m => [m.applications, m.interviews]))

  return (
    <>
      <PageHeader title="Analytics" subtitle={`Based on ${a.totals.applications} submitted applications`}
        actions={<><label className="sr-only" htmlFor="range">Time range</label><select id="range" className="input w-auto" value={months} onChange={e => setMonths(Number(e.target.value))}><option value={3}>Last 3 months</option><option value={6}>Last 6 months</option><option value={12}>Last 12 months</option></select></>} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Interview rate" value={pct(a.interviewRate)} icon={MessagesSquare} tone="warn" hint="applications → interview" />
        <Stat label="Offer rate" value={pct(a.offerRate)} icon={Gift} tone="brand" hint="applications → offer" />
        <Stat label="Rejection rate" value={pct(a.rejectionRate)} icon={ThumbsDown} hint={`${a.totals.rejected} rejected`} />
        <Stat label="To interview" value={days(a.avgDaysToInterview)} icon={Timer} hint="avg. application → interview" />
        <Stat label="To offer" value={days(a.avgDaysInterviewToOffer)} icon={TrendingUp} hint="avg. interview → offer" />
        <Stat label="Response time" value={days(a.avgResponseDays)} icon={Clock} hint="avg. until first reply" />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <Section title="Applications & interviews per month" icon={BarChart3}>
          <div className="mb-3 flex gap-4 text-xs text-ink-500"><span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-brand-500" />Applications</span><span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-warn-500" />Interviews</span></div>
          <div className="flex h-52 items-end gap-2 sm:gap-4" role="img" aria-label={`Monthly chart: ${a.months.map(m => `${m.key} ${m.applications} applications, ${m.interviews} interviews`).join('; ')}`}>
            {a.months.map(m => (
              <div key={m.key} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                <div className="flex flex-1 items-end justify-center gap-1">
                  {[['applications', 'bg-brand-500', m.applications], ['interviews', 'bg-warn-500', m.interviews]].map(([k, c, v]) => (
                    <div key={k as string} className="flex h-full flex-1 flex-col items-center justify-end gap-1"><span className="text-[11px] font-medium tabular-nums text-ink-600">{v || ''}</span><div className={cx('w-full max-w-7 rounded-t-md', c as string)} style={{ height: `${((v as number) / maxM) * 85}%`, minHeight: v ? 4 : 0 }} /></div>
                  ))}
                </div>
                <p className="mt-2 text-center text-[11px] text-ink-500">{fmtDate(`${m.key}-01`, locale, { month: 'short' })}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Pipeline conversion" icon={TrendingUp}>
          <ol className="space-y-3.5">
            {a.funnel.map(s => (
              <li key={s.from} data-testid="funnel-step">
                <div className="mb-1.5 flex items-baseline justify-between text-[13px]"><span className="font-medium text-ink-800">{s.from} <span className="text-ink-400">→</span> {s.to}</span><span><strong className="tabular-nums">{pct(s.rate)}</strong> <span className="text-xs text-ink-400">({s.reached}/{s.base})</span></span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${(s.rate ?? 0) * 100}%` }} /></div>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Section title="Best application source" icon={Trophy}>
          {a.bestSource ? <><p className="font-display text-3xl">{a.bestSource.label}</p><p className="mt-1 text-sm text-ink-500">{a.bestSource.interviews} of {a.bestSource.total} applications reached an interview ({pct(a.bestSource.interviews / a.bestSource.total)})</p></> : <p className="text-sm text-ink-400">Needs at least 2 applications per source.</p>}
        </Section>
        <Section title="Best company type" icon={Trophy}>
          {a.bestCompanyType ? <><p className="font-display text-3xl">{a.bestCompanyType.label}</p><p className="mt-1 text-sm text-ink-500">{a.bestCompanyType.interviews} of {a.bestCompanyType.total} applications reached an interview ({pct(a.bestCompanyType.interviews / a.bestCompanyType.total)})</p></> : <p className="text-sm text-ink-400">Needs at least 2 applications per type.</p>}
        </Section>
        <Section title="Highest response rate" icon={Trophy}>
          <ul className="space-y-2 text-[13px]">{a.companyResponse.slice(0, 4).map(c => <li key={c.label} className="flex items-center justify-between gap-3"><span className="truncate">{c.label}</span><span className="shrink-0 font-medium tabular-nums">{pct(c.rate)} <span className="text-xs font-normal text-ink-400">({c.responded}/{c.total})</span></span></li>)}{!a.companyResponse.length && <li className="text-ink-400">No responses yet.</li>}</ul>
        </Section>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Applications by source"><HBars rows={a.bySource} /></Section>
        <Section title="Applications by company type"><HBars rows={a.byCompanyType} /></Section>
        <Section title="Applications by position"><HBars rows={a.byPosition} /></Section>
        <Section title="Applications by location"><HBars rows={a.byLocation} /></Section>
      </div>
    </>
  )
}
