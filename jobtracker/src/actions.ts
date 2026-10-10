import { t } from '@/i18n'
import type { Application, Attempt, Company, FollowUp, Interview } from '@shared/types'
import type { ContactType } from '@shared/constants'
import type { Stage } from '@shared/constants'
import { useStore } from './store'
import { confirmDialog, toast } from './ui-store'
import { addDays, todayISO } from './lib/dates'
import { companyStatusFromApps, byId } from './lib/derive'

const st = () => useStore.getState()

/** Recompute a company's status from its applications after the pipeline changed. */
async function syncCompanyStatus(companyId: string) {
  const { data } = st()
  const c = data.companies.find(x => x.id === companyId)
  if (!c) return
  const next = companyStatusFromApps(data.applications.filter(a => a.companyId === companyId), c.status)
  if (next !== c.status) await st().patch('companies', c.id, { status: next })
}

export async function changeStage(appId: string, to: Stage, date = todayISO()) {
  const app = st().data.applications.find(a => a.id === appId)
  if (!app || app.status === to) return
  const from = app.status
  const changes: Partial<Application> = { status: to }
  if (from === 'Wishlist' && to !== 'Wishlist' && !app.applicationDate) changes.applicationDate = date
  await st().patch('applications', appId, changes)
  await st().add('activities', {
    companyId: app.companyId, applicationId: appId, contactId: null,
    type: to === 'Offer' ? 'Offer' : to === 'Applied' ? 'Applied' : 'Stage change', date,
    description: `Moved from ${from} to ${to}`, notes: '', fromStage: from, toStage: to,
  })
  await syncCompanyStatus(app.companyId)
  toast(t('Moved to {stage}', { stage: t(to) }))
}

export async function createCompany(draft: Omit<Company, 'id' | 'createdAt'>) {
  return st().add('companies', draft)
}

export async function createApplication(draft: Omit<Application, 'id' | 'createdAt'>, followUpDate?: string) {
  const app = await st().add('applications', draft)
  const wish = app.status === 'Wishlist'
  await st().add('activities', {
    companyId: app.companyId, applicationId: app.id, contactId: null, type: wish ? 'Note' : 'Applied',
    date: wish ? todayISO() : app.applicationDate || todayISO(), description: wish ? 'Added to wishlist' : 'Application submitted',
    notes: '', fromStage: '', toStage: app.status,
  })
  if (followUpDate) {
    await st().add('followUps', { companyId: app.companyId, applicationId: app.id, contactId: null, dueDate: followUpDate, type: 'Email', status: 'Pending', notes: '', completedAt: '' })
  }
  await syncCompanyStatus(app.companyId)
  return app
}

export async function completeFollowUp(f: FollowUp, note = '') {
  const date = todayISO()
  await st().patch('followUps', f.id, { status: 'Completed', completedAt: date })
  await st().add('activities', { companyId: f.companyId, applicationId: f.applicationId, contactId: f.contactId, type: 'Follow-up', date, description: `Follow-up completed (${f.type})`, notes: note || f.notes, fromStage: '', toStage: '' })
  toast(t('Follow-up marked as completed'))
}
export async function skipFollowUp(f: FollowUp) {
  await st().patch('followUps', f.id, { status: 'Skipped' })
  toast(t('Follow-up skipped'), 'info')
}
export async function rescheduleFollowUp(f: FollowUp, dueDate: string) {
  await st().patch('followUps', f.id, { dueDate, status: 'Pending', completedAt: '' })
  toast(t('Follow-up rescheduled'))
}

export async function setInterviewStatus(i: Interview, status: Interview['status']) {
  const result: Interview['result'] = status === 'Passed' ? 'Passed' : status === 'Failed' ? 'Failed' : i.result
  await st().patch('interviews', i.id, { status, result })
  if (status === 'Completed' || status === 'Passed' || status === 'Failed') {
    const app = st().data.applications.find(a => a.id === i.applicationId)
    if (app) await st().add('activities', { companyId: app.companyId, applicationId: app.id, contactId: null, type: 'Interview', date: todayISO(), description: `${i.type} interview ${status.toLowerCase()}`, notes: '', fromStage: '', toStage: '' })
  }
  toast(t('Interview marked {status}', { status: t(status).toLowerCase() }))
}

/* -------- destructive actions, always behind a confirmation dialog -------- */
export async function deleteWithConfirm(key: Parameters<ReturnType<typeof st>['remove']>[0], id: string, label: string, warning = ''): Promise<boolean> {
  const shown = label.startsWith('"') ? label : t(label)
  const ok = await confirmDialog({ title: t('Delete {name}?', { name: shown }), message: `${warning ? warning + ' ' : ''}${t("This can't be undone.")}`, confirmLabel: t('Delete'), tone: 'danger' })
  if (!ok) return false
  await st().remove(key, id)
  toast(t('{name} deleted', { name: shown }))
  return true
}
export const deleteCompany = (c: Company) => {
  const d = st().data
  const apps = d.applications.filter(a => a.companyId === c.id).length, contacts = d.contacts.filter(x => x.companyId === c.id).length
  return deleteWithConfirm('companies', c.id, `"${c.name}"`, apps || contacts ? t('This also deletes {apps} application(s), {contacts} contact(s) and all related interviews, follow-ups and activity.', { apps, contacts }) : '')
}
export async function toggleArchive(c: Company) {
  await st().patch('companies', c.id, { archived: !c.archived })
  toast(c.archived ? t('"{name}" restored', { name: c.name }) : t('"{name}" archived', { name: c.name }), 'info')
}
export const maps = () => { const d = st().data; return { companies: byId(d.companies), applications: byId(d.applications), contacts: byId(d.contacts) } }

/* -------- contact attempts: one save updates everything that follows from it -------- */
export type AttemptUpdate =
  | { kind: 'status'; to: string }
  | { kind: 'timeline' }
  | { kind: 'followup'; date: string }
  | { kind: 'contact'; name: string }
  | { kind: 'completed' }

const RANK: Record<string, number> = { Target: 0, Contacted: 1, Active: 2, Interviewing: 3, Offer: 4, Closed: 5 }
const AUTO_NOTE = 'Auto: follow up on your contact attempt'
export type AttemptDraft = Omit<Attempt, 'id' | 'createdAt'>

/**
 * Saves a contact attempt and applies its consequences without extra clicks:
 *  - company status moves forward (Target → Contacted; a reply → Active),
 *  - an entry lands on the company timeline (linked to the person, if known),
 *  - a follow-up is scheduled ~5 days after a silent attempt (unless one is already pending),
 *  - the person is saved to Contacts when a name is given,
 *  - a reply completes the automatic follow-up.
 * Returns the saved attempt and a list of what changed (shown to the user).
 */
export async function saveAttempt(draft: AttemptDraft, existingId?: string): Promise<{ attempt: Attempt; updates: AttemptUpdate[] }> {
  const store = st()
  const updates: AttemptUpdate[] = []
  const before = existingId ? store.data.attempts.find(x => x.id === existingId) : undefined
  let attempt: Attempt
  if (existingId) { await store.patch('attempts', existingId, draft); attempt = { ...before!, ...draft } }
  else attempt = await store.add('attempts', draft)

  const company = st().data.companies.find(c => c.id === attempt.companyId)
  if (!company) return { attempt, updates }
  const replied = attempt.response === 'Replied' && before?.response !== 'Replied'

  // person → Contacts
  let contactId: string | null = null
  if (attempt.personName.trim() && attempt.method !== 'Email') {
    const existing = st().data.contacts.find(c => c.companyId === company.id && (c.phone === attempt.contact || c.name === attempt.personName.trim()))
    if (existing) contactId = existing.id
    else {
      const c = await store.add('contacts', { companyId: company.id, name: attempt.personName.trim(), position: '', email: '', phone: attempt.method === 'WhatsApp' ? attempt.contact : '', linkedin: '', type: (attempt.role || 'Employee') as ContactType, notes: '' })
      contactId = c.id
      updates.push({ kind: 'contact', name: c.name })
    }
  }

  // timeline
  if (!existingId || replied) {
    const how = attempt.method === 'Email' ? `Email (${attempt.emailKind || 'HR email'})` : attempt.method
    await store.add('activities', {
      companyId: company.id, applicationId: null, contactId, type: attempt.method === 'Email' ? 'Email' : attempt.method === 'WhatsApp' ? 'WhatsApp' : 'Contacted', date: replied && existingId ? todayISO() : attempt.date,
      description: replied ? `Reply received via ${how}` : `Contact attempt: ${how}`, notes: [attempt.reply, attempt.progress].filter(Boolean).join('\n'), fromStage: '', toStage: '',
    })
    updates.push({ kind: 'timeline' })
  }

  // company status only moves forward
  const target = attempt.response === 'Replied' ? 'Active' : 'Contacted'
  if (company.status !== 'Closed' && RANK[company.status] < RANK[target]) {
    await store.patch('companies', company.id, { status: target })
    updates.push({ kind: 'status', to: target })
  }

  // follow-up scheduling / completion
  const pending = st().data.followUps.filter(f => f.companyId === company.id && f.status === 'Pending')
  if (!existingId && ['Waiting', 'No reply'].includes(attempt.response) && !pending.length) {
    const due = [addDays(attempt.date, 5), todayISO()].sort().at(-1)!
    await store.add('followUps', { companyId: company.id, applicationId: null, contactId, dueDate: due, type: attempt.method === 'Email' ? 'Email' : attempt.method === 'WhatsApp' ? 'WhatsApp' : 'Other', status: 'Pending', notes: AUTO_NOTE, completedAt: '' })
    updates.push({ kind: 'followup', date: due })
  }
  if (replied) {
    const auto = pending.filter(f => f.notes === AUTO_NOTE)
    for (const f of auto) await store.patch('followUps', f.id, { status: 'Completed', completedAt: todayISO() })
    if (auto.length) updates.push({ kind: 'completed' })
  }
  return { attempt, updates }
}
