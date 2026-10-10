import type { Application, Attempt, Company, Dataset, Interview } from '@shared/types'
import { CLOSED_STAGES, type AttemptMethod, type EmailKind } from '@shared/constants'
import { t, tDays, tv } from '@/i18n'
import { diffDays, todayISO } from './dates'
import { applicationsWaiting, byId, lastContactDate, pendingFollowUps, stageHistory } from './derive'
import { computeAnalytics } from './analytics'
import { categoryStats } from './compare'
import { fmtMoney } from './format'
import type { DraftKind, DraftVars } from './drafts'

export type Severity = 'high' | 'medium' | 'low'
export interface Suggestion {
  id: string
  severity: Severity
  title: string
  /** Why the advisor is saying this, in terms of the user's own data. */
  why: string
  /** What to do. */
  action: string
  companyId?: string
  appId?: string
  /** Opens a pre-filled form. */
  cta?: { label: string; form: 'followup' | 'attempt' | 'application' | 'interview' | 'contact' | 'activity'; id?: string; defaults?: Record<string, unknown> }
  /** In-app link (when no form fits). */
  link?: { label: string; to: string }
  draft?: { kind: DraftKind; vars: DraftVars }
  /** Suggestions sharing a group are collapsed into one when there are many (e.g. "start outreach"). */
  group?: string
}
const ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 }

const ACTIVE_EARLY = ['Applied', 'HR Contact', 'Screening']
const interviewDone = (i: Interview) => ['Completed', 'Passed'].includes(i.status)

/** Name of someone to address: recruiter on the application, else an HR / recruiter contact at the company. */
function addressee(d: Dataset, a: Application): string {
  if (a.recruiter) return a.recruiter
  return d.contacts.find(c => c.companyId === a.companyId && ['HR', 'Recruiter', 'Hiring Manager'].includes(c.type))?.name ?? ''
}

/**
 * Recruitment-coach rules: turns the user's own tracked data into prioritised, concrete next steps.
 * Pure and deterministic (same data + date → same suggestions); thresholds follow common job-search practice
 * (follow up after ~a week, thank-you within a day or two, answer offers in 2–3 days, change channel after ~5 days).
 */
export function buildSuggestions(d: Dataset, staleDays = 7, me = '', today = todayISO()): Suggestion[] {
  const out: Suggestion[] = []
  const cos = byId(d.companies), apps = byId(d.applications)
  const pending = pendingFollowUps(d)
  const nameOf = (id: string) => cos.get(id)?.name ?? t('Unknown company')

  // 1) Applications waiting for a reply
  const waiting = applicationsWaiting(d, staleDays, today)
  for (const a of waiting) {
    if (pending.some(f => f.applicationId === a.id)) continue
    const idle = diffDays(today, lastContactDate(d, { appId: a.id }) ?? a.applicationDate)
    const co = nameOf(a.companyId)
    out.push({
      id: `chase-${a.id}`, severity: idle >= 14 ? 'high' : 'medium', companyId: a.companyId, appId: a.id,
      title: t('Follow up on {position} at {company}', { position: a.position, company: co }),
      why: t('No reply for {days} since your last contact, and no follow-up is scheduled.', { days: tDays(idle) }),
      action: t('Send a short, polite nudge on the channel you used, then schedule the next one for a week later.'),
      cta: { label: t('Schedule follow-up'), form: 'followup', defaults: { applicationId: a.id } },
      draft: { kind: 'followup', vars: { company: co, position: a.position, name: addressee(d, a), me, date: a.applicationDate } },
    })
    if (idle >= 30) out.push({
      id: `close-${a.id}`, severity: 'low', companyId: a.companyId, appId: a.id,
      title: t('Consider closing {position} at {company}', { position: a.position, company: co }),
      why: t('{days} without any answer.', { days: tDays(idle) }),
      action: t('Keep it as a low-priority lead and put your energy into warmer opportunities.'),
      link: { label: t('Open application'), to: `/applications/${a.id}` },
    })
  }

  // 2) After interviews
  for (const i of d.interviews) {
    const a = apps.get(i.applicationId); if (!a || CLOSED_STAGES.includes(a.status)) continue
    const co = nameOf(a.companyId)
    const since = diffDays(today, i.date)
    const base = { company: co, position: a.position, name: addressee(d, a), me, type: tv(i.type) as string }
    if (interviewDone(i) && since >= 0 && since <= 3 && !d.followUps.some(f => f.applicationId === a.id && f.status === 'Completed' && f.completedAt >= i.date)) {
      out.push({
        id: `thanks-${i.id}`, severity: 'high', companyId: a.companyId, appId: a.id,
        title: t('Send a thank-you after your {type} interview at {company}', { type: t(i.type), company: co }),
        why: t('A thank-you within a day or two keeps you top of mind and shows professionalism.'),
        action: t('Send a short note: thank them, mention one specific thing you discussed, offer anything else they need.'),
        cta: { label: t('Schedule follow-up'), form: 'followup', defaults: { applicationId: a.id, type: 'Email', notes: 'Thank-you note' } },
        draft: { kind: 'thankyou', vars: base },
      })
    } else if (interviewDone(i) && since >= 7 && !d.interviews.some(x => x.applicationId === a.id && x.date > i.date) &&
      !stageHistory(d, a.id).some(h => h.date > i.date) && !pending.some(f => f.applicationId === a.id)) {
      out.push({
        id: `feedback-${i.id}`, severity: 'medium', companyId: a.companyId, appId: a.id,
        title: t('Ask for feedback on {position} at {company}', { position: a.position, company: co }),
        why: t('It has been {days} since your {type} interview with no news.', { days: tDays(since), type: t(i.type) }),
        action: t('Ask politely about next steps and the expected timeline.'),
        cta: { label: t('Schedule follow-up'), form: 'followup', defaults: { applicationId: a.id } },
        draft: { kind: 'feedback', vars: base },
      })
    }
    // 3) Prepare for an upcoming interview
    if (['Scheduled', 'Rescheduled'].includes(i.status) && since <= 0 && since >= -3 && !i.prepNotes.trim()) {
      out.push({
        id: `prep-${i.id}`, severity: 'high', companyId: a.companyId, appId: a.id,
        title: t('Prepare for your {type} interview at {company}', { type: t(i.type), company: co }),
        why: t('It is {when} and there are no preparation notes yet.', { when: since === 0 ? t('today') : t('in {days}', { days: tDays(-since) }) }),
        action: t('Research the company and interviewer, pick 2–3 projects from your portfolio, and prepare 3 questions to ask them.'),
        cta: { label: t('Add preparation notes'), form: 'interview', id: i.id },
      })
    }
  }

  // 4) Offers
  for (const a of d.applications.filter(x => x.status === 'Offer')) {
    const co = nameOf(a.companyId)
    const vars = { company: co, position: a.position, name: addressee(d, a), me, offer: a.offerAmount != null ? fmtMoney(a.offerAmount, a.currency, 'en-GB') : '' }
    if (a.offerAmount == null) out.push({
      id: `offer-terms-${a.id}`, severity: 'high', companyId: a.companyId, appId: a.id,
      title: t('Record the offer from {company}', { company: co }),
      why: t('The application is at the offer stage but no offer amount is saved.'),
      action: t('Ask for the offer in writing (salary, allowances, start date, probation) and save the amount so you can compare.'),
      cta: { label: t('Edit application'), form: 'application', id: a.id },
    })
    else if (a.expectedSalary != null && a.offerAmount < a.expectedSalary) {
      const gap = Math.round((1 - a.offerAmount / a.expectedSalary) * 100)
      out.push({
        id: `negotiate-${a.id}`, severity: 'high', companyId: a.companyId, appId: a.id,
        title: t('Negotiate the offer from {company}', { company: co }),
        why: t('The offer is {pct}% below the salary you expected.', { pct: gap }),
        action: t('Reply within 2–3 days. Thank them, then ask to discuss the package — salary, allowances or review date — rather than a flat yes or no.'),
        cta: { label: t('Add follow-up'), form: 'followup', defaults: { applicationId: a.id } },
        draft: { kind: 'negotiate', vars },
      })
    } else out.push({
      id: `offer-reply-${a.id}`, severity: 'medium', companyId: a.companyId, appId: a.id,
      title: t('Answer the offer from {company}', { company: co }),
      why: t('An offer is open on this application.'),
      action: t('Respond within 2–3 days and ask for the terms in writing before accepting.'),
      link: { label: t('Open application'), to: `/applications/${a.id}` },
    })
  }

  // 5) Wishlist deadlines
  for (const a of d.applications.filter(x => x.status === 'Wishlist' && x.deadline)) {
    const left = diffDays(a.deadline, today)
    if (left < 0 || left > 5) continue
    out.push({
      id: `deadline-${a.id}`, severity: 'high', companyId: a.companyId, appId: a.id,
      title: t('Apply to {position} at {company}', { position: a.position, company: nameOf(a.companyId) }),
      why: left === 0 ? t('The deadline is today.') : t('The deadline is in {days}.', { days: tDays(left) }),
      action: t('Tailor your CV and portfolio to the role, apply, then move the card to Applied.'),
      link: { label: t('Open application'), to: `/applications/${a.id}` },
    })
  }

  // 6) Outreach attempts
  const attemptsOf = (c: Company) => d.attempts.filter(x => x.companyId === c.id).sort((p, q) => p.date.localeCompare(q.date) || p.createdAt.localeCompare(q.createdAt))
  for (const c of d.companies.filter(x => !x.archived)) {
    const list = attemptsOf(c)
    const hasApp = d.applications.some(a => a.companyId === c.id)
    if (!list.length && !hasApp && c.status === 'Target') {
      out.push({
        id: `start-${c.id}`, severity: c.priority === 'High' ? 'medium' : 'low', companyId: c.id, group: 'start',
        title: t('Start outreach with {company}', { company: c.name }),
        why: t('You have not tried to reach this company yet.'),
        action: t('Start with an HR or recruitment email, with your CV and portfolio attached. Find a named person on LinkedIn if you can.'),
        cta: { label: t('Add attempt'), form: 'attempt', defaults: { companyId: c.id } },
        draft: { kind: 'first', vars: { company: c.name, me } },
      })
      continue
    }
    if (!list.length) continue
    const last = list[list.length - 1]
    const idle = diffDays(today, last.date)
    if (last.response === 'Replied' && !hasApp) {
      out.push({
        id: `replied-${last.id}`, severity: 'medium', companyId: c.id,
        title: t('{company} replied — send what they asked for', { company: c.name }),
        why: t('You have a reply but no application is logged for this company.'),
        action: t('Send your CV and portfolio now, then log the application so follow-ups are tracked.'),
        cta: { label: t('Add application'), form: 'application', defaults: { companyId: c.id } },
        draft: { kind: 'reply', vars: { company: c.name, position: '', name: last.personName, me } },
      })
    } else if (last.response === 'Wrong / bounced') {
      out.push({
        id: `bounced-${last.id}`, severity: 'medium', companyId: c.id,
        title: t('Find another contact for {company}', { company: c.name }),
        why: t('Your last attempt came back as a wrong or bounced contact.'),
        action: t('Check their website or LinkedIn for a current HR / careers address or number and try again.'),
        cta: { label: t('Add attempt'), form: 'attempt', defaults: { companyId: c.id } },
      })
    } else if (['Waiting', 'No reply'].includes(last.response) && idle >= 5) {
      if (list.length >= 3) {
        out.push({
          id: `pause-${c.id}`, severity: 'low', companyId: c.id,
          title: t('Pause outreach to {company}', { company: c.name }),
          why: t('{n} attempts without a reply.', { n: list.length }),
          action: t('Leave it for 2–3 weeks, then try once more with a new angle (a different person or a specific role).'),
        })
      } else {
        const tried = new Set<AttemptMethod>(list.map(x => x.method))
        const kinds = new Set<EmailKind>(list.flatMap(x => (x.emailKind ? [x.emailKind] : [])))
        const next: { method: AttemptMethod; emailKind?: EmailKind; label: string } =
          !tried.has('Email') ? { method: 'Email', emailKind: 'HR email', label: t('HR email') }
          : kinds.size < 2 ? { method: 'Email', emailKind: kinds.has('HR email') ? 'Recruitment email' : 'HR email', label: t(kinds.has('HR email') ? 'Recruitment email' : 'HR email') }
          : !tried.has('WhatsApp') ? { method: 'WhatsApp', label: t('WhatsApp') }
          : { method: 'Other', label: t('Other') }
        out.push({
          id: `channel-${c.id}-${list.length}`, severity: 'medium', companyId: c.id,
          title: t('Try a different channel with {company}', { company: c.name }),
          why: t('Your last attempt ({method}) got no reply after {days}.', { method: t(last.method), days: tDays(idle) }),
          action: t('Switch channel — try {channel} next, and keep each touch short with your CV or portfolio attached.', { channel: next.label }),
          cta: { label: t('Add attempt'), form: 'attempt', defaults: { companyId: c.id, method: next.method, ...(next.emailKind ? { emailKind: next.emailKind } : {}) } },
          draft: { kind: 'second', vars: { company: c.name, name: last.personName, me } },
        })
      }
    }
  }

  // 7) Hygiene: named contact, categories
  for (const a of d.applications.filter(x => ACTIVE_EARLY.includes(x.status))) {
    if (a.recruiter || d.contacts.some(c => c.companyId === a.companyId)) continue
    out.push({
      id: `contact-${a.id}`, severity: 'low', companyId: a.companyId, appId: a.id,
      title: t('Find a named contact at {company}', { company: nameOf(a.companyId) }),
      why: t('Applications that reach a named person get answered more often than ones sent to a generic inbox.'),
      action: t('Look up the HR manager or hiring manager on LinkedIn and save them as a contact.'),
      cta: { label: t('Add contact'), form: 'contact', defaults: { companyId: a.companyId } },
    })
  }
  const unclassified = d.companies.filter(c => !c.archived && c.type === 'Unclassified').length
  if (unclassified) out.push({
    id: 'classify', severity: 'low',
    title: unclassified === 1 ? t('Classify 1 company') : t('Classify {n} companies', { n: unclassified }),
    why: t('Comparisons by category only work once each company is classified.'),
    action: t('Select them in the companies table and set a category in one go.'),
    link: { label: t('Open companies'), to: '/companies?category=Unclassified' },
  })

  // 8) Patterns across everything
  const an = computeAnalytics(d, 6, today)
  if (an.totals.applications >= 8 && an.interviewRate != null && an.interviewRate < 0.1) out.push({
    id: 'pattern-interviews', severity: 'high',
    title: t('Few applications turn into interviews'),
    why: t('Only {pct}% of {n} applications reached an interview.', { pct: Math.round(an.interviewRate * 100), n: an.totals.applications }),
    action: t('Tailor your CV and portfolio to each role, lead with the most relevant projects, and apply through a named contact when possible.'),
  })
  const cats = categoryStats(d).filter(r => r.type !== 'Unclassified' && r.stats.applications >= 3 && r.stats.interviewRate != null)
  if (cats.length >= 2) {
    const sorted = [...cats].sort((x, y) => (y.stats.interviewRate ?? 0) - (x.stats.interviewRate ?? 0))
    const gap = (sorted[0].stats.interviewRate ?? 0) - (sorted[sorted.length - 1].stats.interviewRate ?? 0)
    if (gap >= 0.25) out.push({
      id: 'pattern-category', severity: 'low',
      title: t('{category} companies respond better', { category: t(sorted[0].type) }),
      why: t('{best}% of your applications there reached an interview, against {worst}% elsewhere.', { best: Math.round((sorted[0].stats.interviewRate ?? 0) * 100), worst: Math.round((sorted[sorted.length - 1].stats.interviewRate ?? 0) * 100) }),
      action: t('Spend more of your outreach time on that category.'),
      link: { label: t('Compare categories'), to: '/compare' },
    })
  }

  return out.sort((x, y) => ORDER[x.severity] - ORDER[y.severity] || x.id.localeCompare(y.id))
}

/** Collapses a long run of "start outreach" items into one summary so the list stays readable. */
export function summarise(list: Suggestion[], keep = 3): Suggestion[] {
  const starts = list.filter(s => s.group === 'start')
  if (starts.length <= keep) return list
  const first = starts[0]
  const rest = list.filter(s => s.group !== 'start')
  return [...rest, {
    id: 'start-many', severity: 'medium', companyId: first.companyId,
    title: t('Start outreach with {n} companies', { n: starts.length }),
    why: t('These companies are on your list but you have not tried to reach them yet.'),
    action: t('Start with the high-priority ones: HR or recruitment email first, then WhatsApp if there is no reply in a week.'),
    link: { label: t('Open companies'), to: '/companies' },
    cta: first.cta, draft: first.draft,
  } as Suggestion].sort((x, y) => ORDER[x.severity] - ORDER[y.severity] || x.id.localeCompare(y.id))
}
export type { Attempt }
