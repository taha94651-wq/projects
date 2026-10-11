import { INTERVIEW_RESULTS, INTERVIEW_STATUSES, INTERVIEW_TYPES, type InterviewResult, type InterviewStatus, type InterviewType } from '@shared/constants'
import type { Interview } from '@shared/types'
import { useStore } from '@/store'
import { toast, useUI, type FormRequest } from '@/ui-store'
import { todayISO } from '@/lib/dates'
import { FormGrid, SelectField, Span2, TextArea, TextField } from '../ui/fields'
import { required, useForm } from '../ui/useForm'
import { FormModal } from './FormModal'

type V = Omit<Interview, 'id' | 'createdAt'>
export function InterviewForm({ req }: { req: FormRequest }) {
  const { data, add, patch } = useStore.getState()
  const existing = data.interviews.find(i => i.id === req.id)
  const close = useUI(s => s.closeForm)
  const cos = new Map(data.companies.map(c => [c.id, c.name]))
  const apps = data.applications.filter(a => !['Rejected', 'Withdrawn', 'Accepted'].includes(a.status) || a.id === existing?.applicationId || a.id === (req.defaults?.applicationId as string))
  const init: V = { applicationId: apps.find(a => a.status !== 'Wishlist')?.id ?? apps[0]?.id ?? '', type: 'HR', date: todayISO(), time: '10:00', location: '', interviewer: '', status: 'Scheduled', prepNotes: '', postNotes: '', result: 'Pending', ...(existing ?? {}), ...(req.defaults as Partial<V>) }
  const f = useForm<V>(init, v => ({ applicationId: required(v.applicationId, 'Choose an application'), date: required(v.date, 'Choose a date') }))
  const save = f.submit(async v => {
    if (existing) { await patch('interviews', existing.id, v); toast('Interview updated') }
    else {
      await add('interviews', v)
      const app = data.applications.find(a => a.id === v.applicationId)
      if (app) await add('activities', { companyId: app.companyId, applicationId: app.id, contactId: null, type: 'Interview', date: todayISO(), description: `${v.type} interview scheduled for ${v.date}`, notes: '', fromStage: '', toStage: '' })
      toast('Interview scheduled')
    }
    close()
  })
  const status = (s: InterviewStatus) => { f.set('status', s); if (s === 'Passed') f.set('result', 'Passed'); if (s === 'Failed') f.set('result', 'Failed') }
  return (
    <FormModal title={existing ? 'Edit interview' : 'Schedule interview'} size="lg" onSubmit={save} busy={f.busy} submitLabel={existing ? 'Save changes' : 'Schedule'}>
      <FormGrid>
        <Span2><SelectField label="Application" required placeholder="Select application" {...f.bind('applicationId')} options={apps.map(a => ({ value: a.id, label: `${cos.get(a.companyId) ?? '—'} — ${a.position}` }))} /></Span2>
        <SelectField label="Interview type" options={INTERVIEW_TYPES} {...f.bind('type')} onChange={e => f.set('type', e.target.value as InterviewType)} />
        <SelectField label="Status" options={INTERVIEW_STATUSES} {...f.bind('status')} onChange={e => status(e.target.value as InterviewStatus)} />
        <TextField label="Date" type="date" required autoFocus {...f.bind('date')} />
        <TextField label="Time" type="time" {...f.bind('time')} />
        <TextField label="Location / meeting link" {...f.bind('location')} placeholder="Office address or https://…" />
        <TextField label="Interviewer" {...f.bind('interviewer')} />
        <Span2><TextArea label="Preparation notes" rows={3} {...f.bind('prepNotes')} /></Span2>
        <Span2><TextArea label="Post-interview notes" rows={3} {...f.bind('postNotes')} /></Span2>
        <SelectField label="Result" options={INTERVIEW_RESULTS} {...f.bind('result')} onChange={e => f.set('result', e.target.value as InterviewResult)} />
      </FormGrid>
    </FormModal>
  )
}
