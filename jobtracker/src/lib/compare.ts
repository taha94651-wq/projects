import type { Application, Dataset } from '@shared/types'
import { COMPANY_TYPES, CLOSED_STAGES, FUNNEL, type Stage } from '@shared/constants'
import { diffDays, todayISO } from './dates'
import { furthestIndex, lastContactDate, nextFollowUp, stageHistory } from './derive'

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const submitted = (apps: Application[]) => apps.filter(a => a.status !== 'Wishlist')

/** Days from application to the first sign of life (any stage change after Applied). */
function responseDays(d: Dataset, a: Application): number | null {
  if (!a.applicationDate) return null
  const first = stageHistory(d, a.id).find(h => h.toStage && h.toStage !== 'Applied' && h.toStage !== 'Wishlist')
  return first ? Math.max(0, diffDays(first.date, a.applicationDate)) : null
}

export interface GroupStats {
  companies: number
  applications: number
  active: number
  interviews: number
  offers: number
  rejected: number
  interviewRate: number | null
  responseRate: number | null
  avgResponseDays: number | null
}
function statsFor(d: Dataset, apps: Application[], companies: number): GroupStats {
  const sub = submitted(apps)
  const ids = new Set(apps.map(a => a.id))
  const interviewed = sub.filter(a => d.interviews.some(i => i.applicationId === a.id && i.status !== 'Cancelled') || furthestIndex(d, a) >= FUNNEL.indexOf('Technical Interview'))
  const responded = sub.filter(a => furthestIndex(d, a) >= 1 || a.status === 'Rejected')
  return {
    companies, applications: sub.length, active: sub.filter(a => !CLOSED_STAGES.includes(a.status)).length,
    interviews: d.interviews.filter(i => ids.has(i.applicationId) && i.status !== 'Cancelled').length,
    offers: sub.filter(a => furthestIndex(d, a) >= FUNNEL.indexOf('Offer')).length,
    rejected: sub.filter(a => a.status === 'Rejected').length,
    interviewRate: sub.length ? interviewed.length / sub.length : null,
    responseRate: sub.length ? responded.length / sub.length : null,
    avgResponseDays: avg(sub.flatMap(a => { const r = responseDays(d, a); return r == null ? [] : [r] })),
  }
}

/** One row per category (Developer / Design / Execution / Unclassified) — archived companies excluded. */
export function categoryStats(d: Dataset) {
  return COMPANY_TYPES.map(type => {
    const cos = d.companies.filter(c => !c.archived && c.type === type)
    const ids = new Set(cos.map(c => c.id))
    return { type, stats: statsFor(d, d.applications.filter(a => ids.has(a.companyId)), cos.length) }
  })
}

export interface CompanyStats extends GroupStats {
  furthest: Stage | null
  topSalary: { max: number; currency: string } | null
  lastContact: string | undefined
  nextFollowUp: string | undefined
}
export function companyStats(d: Dataset, companyId: string, today = todayISO()): CompanyStats {
  const apps = d.applications.filter(a => a.companyId === companyId)
  const base = statsFor(d, apps, 1)
  const idx = Math.max(-1, ...submitted(apps).map(a => furthestIndex(d, a)))
  const withMax = apps.filter(a => a.salaryMax != null || a.offerAmount != null).sort((a, b) => (b.offerAmount ?? b.salaryMax ?? 0) - (a.offerAmount ?? a.salaryMax ?? 0))[0]
  void today
  return {
    ...base, furthest: idx >= 0 ? FUNNEL[idx] : null,
    topSalary: withMax ? { max: (withMax.offerAmount ?? withMax.salaryMax)!, currency: withMax.currency } : null,
    lastContact: lastContactDate(d, { companyId }), nextFollowUp: nextFollowUp(d, { companyId })?.dueDate,
  }
}
