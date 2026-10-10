import type { Application, Dataset } from '@shared/types'
import { CLOSED_STAGES, FUNNEL } from '@shared/constants'
import { addMonths, diffDays, monthKey, startOfMonth, todayISO } from './dates'
import { byId, furthestIndex, stageDate, stageHistory } from './derive'

export interface CountRow { label: string; count: number }
export interface RateRow { label: string; total: number; responded: number; rate: number }
export interface Analytics {
  months: { key: string; applications: number; interviews: number }[]
  totals: { applications: number; active: number; interviews: number; offers: number; rejected: number }
  interviewRate: number | null // applications that reached an interview / submitted applications
  offerRate: number | null
  rejectionRate: number | null
  avgDaysToInterview: number | null
  avgDaysInterviewToOffer: number | null
  avgResponseDays: number | null
  funnel: { from: string; to: string; reached: number; base: number; rate: number | null }[]
  bySource: CountRow[]
  byCompanyType: CountRow[]
  byPosition: CountRow[]
  byLocation: CountRow[]
  bestSource: (RateRow & { interviews: number }) | null
  bestCompanyType: (RateRow & { interviews: number }) | null
  companyResponse: RateRow[]
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const ratio = (a: number, b: number) => (b ? a / b : null)
const tally = (items: string[]): CountRow[] => {
  const m = new Map<string, number>()
  for (const i of items) m.set(i || 'Unknown', (m.get(i || 'Unknown') ?? 0) + 1)
  return [...m].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}
/** Position titles are grouped by their core role: "Senior Architect – Hospitality" → "Senior Architect". */
export const positionGroup = (p: string) => p.split(/\s[–—-]\s/)[0].trim()

export function computeAnalytics(d: Dataset, monthsBack = 6, today = todayISO()): Analytics {
  const submitted = d.applications.filter(a => a.status !== 'Wishlist')
  const cos = byId(d.companies)
  const idx = (a: Application) => furthestIndex(d, a)
  const reachedInterview = (a: Application) => d.interviews.some(i => i.applicationId === a.id && i.status !== 'Cancelled') || idx(a) >= FUNNEL.indexOf('Technical Interview')
  const responded = (a: Application) => idx(a) >= 1 || a.status === 'Rejected'

  // monthly series (applications by application date; interviews by interview date)
  const thisMonth = startOfMonth(today)
  const months = Array.from({ length: monthsBack }, (_, i) => monthKey(addMonths(thisMonth, i - monthsBack + 1))).map(key => ({
    key,
    applications: submitted.filter(a => a.applicationDate && monthKey(a.applicationDate) === key).length,
    interviews: d.interviews.filter(i => i.status !== 'Cancelled' && monthKey(i.date) === key).length,
  }))

  const offers = submitted.filter(a => idx(a) >= FUNNEL.indexOf('Offer'))
  const interviewed = submitted.filter(reachedInterview)

  const toInterview = submitted.flatMap(a => {
    const first = d.interviews.filter(i => i.applicationId === a.id && i.status !== 'Cancelled').map(i => i.date).sort()[0]
    return first && a.applicationDate ? [Math.max(0, diffDays(first, a.applicationDate))] : []
  })
  const interviewToOffer = offers.flatMap(a => {
    const first = d.interviews.filter(i => i.applicationId === a.id && i.status !== 'Cancelled').map(i => i.date).sort()[0]
    const offerDate = stageDate(d, a.id, 'Offer')
    return first && offerDate ? [Math.max(0, diffDays(offerDate, first))] : []
  })
  const responseDays = submitted.flatMap(a => {
    if (!a.applicationDate) return []
    const first = stageHistory(d, a.id).find(h => h.toStage && h.toStage !== 'Applied' && h.toStage !== 'Wishlist')
    return first ? [Math.max(0, diffDays(first.date, a.applicationDate))] : []
  })

  // Conversion steps: Applied→HR, HR→Interview, Interview→Final, Final→Offer, Offer→Accepted.
  // "Interview" = the first interview stage (Screening); later technical rounds count as having passed it.
  const at = (s: (typeof FUNNEL)[number]) => FUNNEL.indexOf(s)
  const count = (i: number) => submitted.filter(a => idx(a) >= i).length
  const step = (from: string, to: string, fi: number, ti: number) => ({ from, to, base: count(fi), reached: count(ti), rate: ratio(count(ti), count(fi)) })
  const briefFunnel = [
    step('Applied', 'HR Contact', at('Applied'), at('HR Contact')),
    step('HR Contact', 'Interview', at('HR Contact'), at('Screening')),
    step('Interview', 'Final Interview', at('Screening'), at('Final Interview')),
    step('Final Interview', 'Offer', at('Final Interview'), at('Offer')),
    step('Offer', 'Accepted', at('Offer'), at('Accepted')),
  ]

  const groupRates = (key: (a: Application) => string): (RateRow & { interviews: number })[] => {
    const m = new Map<string, Application[]>()
    for (const a of submitted) m.set(key(a) || 'Unknown', [...(m.get(key(a) || 'Unknown') ?? []), a])
    return [...m].map(([label, apps]) => {
      const resp = apps.filter(responded).length
      return { label, total: apps.length, responded: resp, rate: resp / apps.length, interviews: apps.filter(reachedInterview).length }
    })
  }
  // "Best" = highest interview yield, tie-broken by sample size. Require >= 2 applications to avoid 1/1 flukes.
  const best = (rows: (RateRow & { interviews: number })[]) =>
    rows.filter(r => r.total >= 2).sort((a, b) => b.interviews / b.total - a.interviews / a.total || b.total - a.total)[0] ?? null

  const bySource = groupRates(a => a.source)
  const byType = groupRates(a => cos.get(a.companyId)?.type ?? 'Other')
  const companyRows = groupRates(a => cos.get(a.companyId)?.name ?? 'Unknown')
  const companyResponse = companyRows.filter(r => r.responded > 0).sort((a, b) => b.rate - a.rate || b.total - a.total).map(({ interviews: _i, ...r }) => r)

  return {
    months,
    totals: {
      applications: submitted.length,
      active: submitted.filter(a => !CLOSED_STAGES.includes(a.status)).length,
      interviews: d.interviews.filter(i => i.status !== 'Cancelled').length,
      offers: offers.length,
      rejected: submitted.filter(a => a.status === 'Rejected').length,
    },
    interviewRate: ratio(interviewed.length, submitted.length),
    offerRate: ratio(offers.length, submitted.length),
    rejectionRate: ratio(submitted.filter(a => a.status === 'Rejected').length, submitted.length),
    avgDaysToInterview: avg(toInterview),
    avgDaysInterviewToOffer: avg(interviewToOffer),
    avgResponseDays: avg(responseDays),
    funnel: briefFunnel,
    bySource: tally(submitted.map(a => a.source)),
    byCompanyType: tally(submitted.map(a => cos.get(a.companyId)?.type ?? 'Other')),
    byPosition: tally(submitted.map(a => positionGroup(a.position))),
    byLocation: tally(submitted.map(a => a.location.split(',')[0].trim())),
    bestSource: best(bySource),
    bestCompanyType: best(byType),
    companyResponse,
  }
}
