import type { Application, Company, Dataset, FollowUp, Interview } from '@shared/types'
import { CLOSED_STAGES, FUNNEL, type Stage } from '@shared/constants'
import { addDays, diffDays, todayISO } from './dates'

export const byId = <T extends { id: string }>(list: T[]) => new Map(list.map(x => [x.id, x]))
export const isActiveApp = (a: Application) => !CLOSED_STAGES.includes(a.status) && a.status !== 'Wishlist'
export const isOpenApp = (a: Application) => !CLOSED_STAGES.includes(a.status)

export const interviewsOf = (d: Dataset, appId: string) => d.interviews.filter(i => i.applicationId === appId)
export const interviewStamp = (i: Interview) => `${i.date}T${i.time || '00:00'}`
export const isUpcomingInterview = (i: Interview, today = todayISO()) => i.status === 'Scheduled' || i.status === 'Rescheduled' ? i.date >= today : false

export function nextInterview(d: Dataset, appId: string, today = todayISO()) {
  return interviewsOf(d, appId).filter(i => isUpcomingInterview(i, today)).sort((a, b) => interviewStamp(a).localeCompare(interviewStamp(b)))[0]
}
export const pendingFollowUps = (d: Dataset) => d.followUps.filter(f => f.status === 'Pending')
export function nextFollowUp(d: Dataset, filter: { appId?: string; companyId?: string }): FollowUp | undefined {
  return pendingFollowUps(d)
    .filter(f => (filter.appId ? f.applicationId === filter.appId : true) && (filter.companyId ? f.companyId === filter.companyId : true))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
}
/** Latest recorded interaction (activity) for a company / application / contact. */
export function lastContactDate(d: Dataset, filter: { companyId?: string; appId?: string; contactId?: string }): string | undefined {
  const dates = d.activities
    .filter(a => (filter.companyId ? a.companyId === filter.companyId : true) && (filter.appId ? a.applicationId === filter.appId : true) && (filter.contactId ? a.contactId === filter.contactId : true))
    .filter(a => a.type !== 'Note' && a.type !== 'Stage change')
    .map(a => a.date)
    .filter(x => x <= addDays(todayISO(), 0))
  return dates.sort().at(-1)
}
export const stageHistory = (d: Dataset, appId: string) =>
  d.activities.filter(a => a.applicationId === appId && a.toStage).sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))

/** Highest funnel index the application ever reached (-1 if never applied). */
export function furthestIndex(d: Dataset, a: Application): number {
  const stages = new Set<string>([a.status, ...stageHistory(d, a.id).map(x => x.toStage)])
  return Math.max(-1, ...FUNNEL.map((s, i) => (stages.has(s) ? i : -1)))
}
export function stageDate(d: Dataset, appId: string, stage: Stage): string | undefined {
  return stageHistory(d, appId).find(x => x.toStage === stage)?.date
}

export function applicationsWaiting(d: Dataset, staleDays: number, today = todayISO()) {
  return d.applications.filter(a => a.status === 'Applied' && a.applicationDate && diffDays(today, lastContactDate(d, { appId: a.id }) ?? a.applicationDate) >= staleDays)
}

export type NotifKind = 'followup-today' | 'followup-overdue' | 'interview-today' | 'interview-tomorrow' | 'waiting' | 'offer'
export interface Notif { id: string; kind: NotifKind; title: string; detail: string; link: string; severity: 'danger' | 'warn' | 'info' | 'success' }

export function buildNotifications(d: Dataset, staleDays: number, today = todayISO()): Notif[] {
  const apps = byId(d.applications), cos = byId(d.companies)
  const label = (appId: string | null, coId: string | null) => {
    const a = appId ? apps.get(appId) : undefined
    const c = cos.get(a?.companyId ?? coId ?? '')
    return { name: c?.name ?? 'Unknown company', pos: a?.position ?? '' }
  }
  const out: Notif[] = []
  for (const f of pendingFollowUps(d)) {
    const l = label(f.applicationId, f.companyId)
    const n = diffDays(f.dueDate, today)
    if (n < 0) out.push({ id: `fu-o-${f.id}`, kind: 'followup-overdue', severity: 'danger', title: `Follow-up overdue · ${l.name}`, detail: `${l.pos || f.type} · ${-n} day${n === -1 ? '' : 's'} overdue`, link: '/follow-ups' })
    else if (n === 0) out.push({ id: `fu-t-${f.id}`, kind: 'followup-today', severity: 'warn', title: `Follow-up due today · ${l.name}`, detail: `${l.pos || f.type} via ${f.type}`, link: '/follow-ups' })
  }
  for (const i of d.interviews) {
    if (!isUpcomingInterview(i, today)) continue
    const n = diffDays(i.date, today)
    if (n > 1) continue
    const l = label(i.applicationId, null)
    out.push({ id: `iv-${i.id}-${i.date}`, kind: n === 0 ? 'interview-today' : 'interview-tomorrow', severity: n === 0 ? 'warn' : 'info', title: `Interview ${n === 0 ? 'today' : 'tomorrow'} · ${l.name}`, detail: `${i.type} interview${i.time ? ` at ${i.time}` : ''}`, link: '/interviews' })
  }
  for (const a of applicationsWaiting(d, staleDays, today)) {
    const l = label(a.id, null)
    out.push({ id: `wait-${a.id}`, kind: 'waiting', severity: 'info', title: `Waiting for response · ${l.name}`, detail: `${a.position} · applied ${diffDays(today, a.applicationDate)} days ago`, link: `/applications/${a.id}` })
  }
  for (const a of d.applications.filter(x => x.status === 'Offer')) {
    const l = label(a.id, null)
    out.push({ id: `offer-${a.id}`, kind: 'offer', severity: 'success', title: `Offer received · ${l.name}`, detail: a.position, link: `/applications/${a.id}` })
  }
  const order = { danger: 0, warn: 1, success: 2, info: 3 }
  return out.sort((x, y) => order[x.severity] - order[y.severity])
}

export function companyStatusFromApps(apps: Application[], current: Company['status']): Company['status'] {
  if (!apps.length) return current
  if (apps.some(a => a.status === 'Offer')) return 'Offer'
  if (apps.some(a => ['Screening', 'Technical Interview', 'Final Interview'].includes(a.status))) return 'Interviewing'
  if (apps.some(a => ['Applied', 'HR Contact'].includes(a.status))) return 'Active'
  if (apps.every(a => CLOSED_STAGES.includes(a.status))) return 'Closed'
  return current === 'Closed' ? 'Target' : current
}

export interface ActionItem { app: Application; reason: string; tone: 'danger' | 'warn' | 'info' | 'green'; rank: number }
/** Applications that need the user's attention, most urgent first. */
export function actionItems(d: Dataset, staleDays: number, today = todayISO()): ActionItem[] {
  const out: ActionItem[] = []
  const waiting = new Set(applicationsWaiting(d, staleDays, today).map(a => a.id))
  for (const a of d.applications) {
    if (a.status === 'Offer') out.push({ app: a, reason: 'Offer awaiting your decision', tone: 'green', rank: 0 })
    else if (a.status === 'Wishlist' && a.deadline) {
      const n = diffDays(a.deadline, today)
      if (n >= 0 && n <= 7) out.push({ app: a, reason: n === 0 ? 'Apply today — deadline is today' : `Apply within ${n} day${n === 1 ? '' : 's'}`, tone: 'warn', rank: 1 })
      else if (n < 0) out.push({ app: a, reason: `Deadline passed ${-n} days ago`, tone: 'danger', rank: 1 })
    } else if (waiting.has(a.id)) {
      out.push({ app: a, reason: `No response for ${diffDays(today, lastContactDate(d, { appId: a.id }) ?? a.applicationDate)} days`, tone: 'info', rank: 2 })
    } else if (['Applied', 'HR Contact', 'Screening'].includes(a.status) && !pendingFollowUps(d).some(f => f.applicationId === a.id)) {
      out.push({ app: a, reason: 'No follow-up scheduled', tone: 'info', rank: 3 })
    }
  }
  return out.sort((x, y) => x.rank - y.rank)
}
