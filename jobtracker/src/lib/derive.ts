import { t, tDays } from '@/i18n'
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
    return { name: c?.name ?? t('Unknown company'), pos: a?.position ?? '' }
  }
  const out: Notif[] = []
  for (const f of pendingFollowUps(d)) {
    const l = label(f.applicationId, f.companyId)
    const n = diffDays(f.dueDate, today)
    if (n < 0) out.push({ id: `fu-o-${f.id}`, kind: 'followup-overdue', severity: 'danger', title: t('Follow-up overdue · {name}', { name: l.name }), detail: t('{what} · {days} overdue', { what: l.pos || t(f.type), days: tDays(-n) }), link: '/follow-ups' })
    else if (n === 0) out.push({ id: `fu-t-${f.id}`, kind: 'followup-today', severity: 'warn', title: t('Follow-up due today · {name}', { name: l.name }), detail: t('{what} via {type}', { what: l.pos || t(f.type), type: t(f.type) }), link: '/follow-ups' })
  }
  for (const i of d.interviews) {
    if (!isUpcomingInterview(i, today)) continue
    const n = diffDays(i.date, today)
    if (n > 1) continue
    const l = label(i.applicationId, null)
    out.push({ id: `iv-${i.id}-${i.date}`, kind: n === 0 ? 'interview-today' : 'interview-tomorrow', severity: n === 0 ? 'warn' : 'info', title: t(n === 0 ? 'Interview today · {name}' : 'Interview tomorrow · {name}', { name: l.name }), detail: i.time ? t('{type} interview at {time}', { type: t(i.type), time: i.time }) : t('{type} interview', { type: t(i.type) }), link: '/interviews' })
  }
  for (const a of applicationsWaiting(d, staleDays, today)) {
    const l = label(a.id, null)
    out.push({ id: `wait-${a.id}`, kind: 'waiting', severity: 'info', title: t('Waiting for response · {name}', { name: l.name }), detail: t('{pos} · applied {days} ago', { pos: a.position, days: tDays(diffDays(today, a.applicationDate)) }), link: `/applications/${a.id}` })
  }
  for (const a of d.applications.filter(x => x.status === 'Offer')) {
    const l = label(a.id, null)
    out.push({ id: `offer-${a.id}`, kind: 'offer', severity: 'success', title: t('Offer received · {name}', { name: l.name }), detail: a.position, link: `/applications/${a.id}` })
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
    if (a.status === 'Offer') out.push({ app: a, reason: t('Offer awaiting your decision'), tone: 'green', rank: 0 })
    else if (a.status === 'Wishlist' && a.deadline) {
      const n = diffDays(a.deadline, today)
      if (n >= 0 && n <= 7) out.push({ app: a, reason: n === 0 ? t('Apply today — deadline is today') : t('Apply within {days}', { days: tDays(n) }), tone: 'warn', rank: 1 })
      else if (n < 0) out.push({ app: a, reason: t('Deadline passed {days} ago', { days: tDays(-n) }), tone: 'danger', rank: 1 })
    } else if (waiting.has(a.id)) {
      out.push({ app: a, reason: t('No response for {days}', { days: tDays(diffDays(today, lastContactDate(d, { appId: a.id }) ?? a.applicationDate)) }), tone: 'info', rank: 2 })
    } else if (['Applied', 'HR Contact', 'Screening'].includes(a.status) && !pendingFollowUps(d).some(f => f.applicationId === a.id)) {
      out.push({ app: a, reason: t('No follow-up scheduled'), tone: 'info', rank: 3 })
    }
  }
  return out.sort((x, y) => x.rank - y.rank)
}
