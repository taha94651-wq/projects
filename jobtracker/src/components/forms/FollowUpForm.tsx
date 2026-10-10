import { t } from '@/i18n'
import { FOLLOWUP_STATUSES, FOLLOWUP_TYPES, type FollowUpStatus, type FollowUpType } from '@shared/constants'
import type { FollowUp } from '@shared/types'
import { useStore } from '@/store'
import { toast, useUI, type FormRequest } from '@/ui-store'
import { addDays, todayISO } from '@/lib/dates'
import { FormGrid, SelectField, Span2, TextArea, TextField } from '../ui/fields'
import { required, useForm } from '../ui/useForm'
import { FormModal } from './FormModal'

type V = Omit<FollowUp, 'id' | 'createdAt' | 'completedAt'> & { applicationId: string; companyId: string; contactId: string }
export function FollowUpForm({ req }: { req: FormRequest }) {
  const { data, add, patch } = useStore.getState()
  const existing = data.followUps.find(x => x.id === req.id)
  const close = useUI(s => s.closeForm)
  const cos = new Map(data.companies.map(c => [c.id, c.name]))
  const init: V = { applicationId: '', companyId: '', contactId: '', dueDate: addDays(todayISO(), 3), type: 'Email', status: 'Pending', notes: '', ...(existing ? { ...existing, applicationId: existing.applicationId ?? '', companyId: existing.companyId ?? '', contactId: existing.contactId ?? '' } : {}), ...(req.defaults as Partial<V>) }
  const f = useForm<V>(init, v => ({ dueDate: required(v.dueDate, 'Choose a due date'), companyId: v.applicationId ? undefined : required(v.companyId, 'Choose an application or a company') }))
  const v = f.values
  const app = data.applications.find(a => a.id === v.applicationId)
  const companyId = app?.companyId ?? v.companyId
  const contacts = data.contacts.filter(c => c.companyId === companyId)
  const save = f.submit(async v => {
    const row = {
      applicationId: v.applicationId || null, companyId: companyId || null, contactId: v.contactId || null, dueDate: v.dueDate, type: v.type, status: v.status, notes: v.notes,
      completedAt: v.status === 'Completed' ? (existing?.completedAt || todayISO()) : '',
    }
    if (existing) { await patch('followUps', existing.id, row); toast('Follow-up updated') } else { await add('followUps', row); toast('Follow-up scheduled') }
    close()
  })
  return (
    <FormModal title={existing ? 'Edit follow-up' : 'Schedule follow-up'} onSubmit={save} busy={f.busy} submitLabel={existing ? 'Save changes' : 'Schedule'}>
      <FormGrid>
        <Span2><SelectField label="Application" placeholder="None (company-level)" {...f.bind('applicationId')}
          onChange={e => { f.set('applicationId', e.target.value); f.set('contactId', '') }}
          options={data.applications.map(a => ({ value: a.id, label: `${cos.get(a.companyId) ?? '—'} — ${a.position}` }))} /></Span2>
        {!v.applicationId && <Span2><SelectField label="Company" required placeholder="Select company" {...f.bind('companyId')} error={f.errors.companyId}
          onChange={e => { f.set('companyId', e.target.value); f.set('contactId', '') }} options={data.companies.map(c => ({ value: c.id, label: c.name }))} /></Span2>}
        <SelectField label="Contact" placeholder="No specific contact" {...f.bind('contactId')} options={contacts.map(c => ({ value: c.id, label: `${c.name} (${t(c.type)})` }))} />
        <TextField label="Due date" type="date" required autoFocus {...f.bind('dueDate')} />
        <SelectField label="Follow-up type" options={FOLLOWUP_TYPES} {...f.bind('type')} onChange={e => f.set('type', e.target.value as FollowUpType)} />
        <SelectField label="Status" options={FOLLOWUP_STATUSES} {...f.bind('status')} onChange={e => f.set('status', e.target.value as FollowUpStatus)} />
        <Span2><TextArea label="Notes" rows={3} {...f.bind('notes')} placeholder="What do you want to ask or say?" /></Span2>
      </FormGrid>
    </FormModal>
  )
}
