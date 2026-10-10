import { useRef, useState } from 'react'
import { Paperclip, X } from 'lucide-react'
import { ACTIVITY_TYPES, type ActivityType } from '@shared/constants'
import type { Activity } from '@shared/types'
import { api } from '@/api'
import { useStore } from '@/store'
import { toast, useUI, type FormRequest } from '@/ui-store'
import { todayISO } from '@/lib/dates'
import { FormGrid, SelectField, Span2, TextArea, TextField } from '../ui/fields'
import { required, useForm } from '../ui/useForm'
import { FormModal } from './FormModal'

type V = { applicationId: string; companyId: string; contactId: string; type: ActivityType; date: string; description: string; notes: string }
const MAX = 15 * 1024 * 1024

export function ActivityForm({ req }: { req: FormRequest }) {
  const { data, add, patch, remove } = useStore.getState()
  const existing = data.activities.find(a => a.id === req.id)
  const close = useUI(s => s.closeForm)
  const [files, setFiles] = useState<File[]>([])
  const [removed, setRemoved] = useState<string[]>([])
  const input = useRef<HTMLInputElement>(null)
  const cos = new Map(data.companies.map(c => [c.id, c.name]))
  const init: V = { applicationId: '', companyId: '', contactId: '', type: 'Email', date: todayISO(), description: '', notes: '', ...(existing ? { ...existing, applicationId: existing.applicationId ?? '', companyId: existing.companyId ?? '', contactId: existing.contactId ?? '' } : {}), ...(req.defaults as Partial<V>) }
  const f = useForm<V>(init, v => ({
    description: required(v.description, 'Add a short description'), date: required(v.date, 'Choose a date'),
    companyId: v.applicationId ? undefined : required(v.companyId, 'Choose an application or a company'),
  }))
  const v = f.values
  const app = data.applications.find(a => a.id === v.applicationId)
  const companyId = app?.companyId ?? v.companyId
  const contacts = data.contacts.filter(c => c.companyId === companyId)
  const current = existing ? data.attachments.filter(a => a.activityId === existing.id && !removed.includes(a.id)) : []
  const tooBig = files.find(x => x.size > MAX)

  const save = f.submit(async v => {
    if (tooBig) { toast(`"${tooBig.name}" is larger than 15MB`, 'error'); return }
    const row: Omit<Activity, 'id' | 'createdAt'> = {
      applicationId: v.applicationId || null, companyId: companyId || null, contactId: v.contactId || null, type: v.type, date: v.date,
      description: v.description.trim(), notes: v.notes, fromStage: existing?.fromStage ?? '', toStage: existing?.toStage ?? '',
    }
    const saved = existing ? (await patch('activities', existing.id, row), existing) : await add('activities', row)
    for (const id of removed) await remove('attachments', id)
    if (files.length) {
      try {
        const up = await Promise.all(files.map(file => api.upload(file, { activityId: saved.id, applicationId: row.applicationId ?? undefined, companyId: row.companyId ?? undefined })))
        useStore.getState().replaceAttachments([...useStore.getState().data.attachments, ...up])
      } catch (e) { toast(`Saved, but upload failed: ${(e as Error).message}`, 'error') }
    }
    toast(existing ? 'Entry updated' : 'Activity logged')
    close()
  })

  return (
    <FormModal title={existing ? 'Edit timeline event' : 'Log activity'} onSubmit={save} busy={f.busy} submitLabel={existing ? 'Save changes' : 'Log activity'}>
      <FormGrid>
        <Span2><SelectField label="Application" placeholder="None (company-level)" {...f.bind('applicationId')}
          onChange={e => { f.set('applicationId', e.target.value); f.set('contactId', '') }}
          options={data.applications.map(a => ({ value: a.id, label: `${cos.get(a.companyId) ?? '—'} — ${a.position}` }))} /></Span2>
        {!v.applicationId && <Span2><SelectField label="Company" required placeholder="Select company" {...f.bind('companyId')}
          onChange={e => { f.set('companyId', e.target.value); f.set('contactId', '') }} options={data.companies.map(c => ({ value: c.id, label: c.name }))} /></Span2>}
        <SelectField label="Event type" options={ACTIVITY_TYPES.filter(t => t !== 'Stage change' || existing?.type === 'Stage change')} {...f.bind('type')} onChange={e => f.set('type', e.target.value as ActivityType)} />
        <TextField label="Date" type="date" required {...f.bind('date')} />
        <Span2><TextField label="Description" required autoFocus {...f.bind('description')} placeholder="e.g. HR viewed my CV" /></Span2>
        <Span2><SelectField label="Contact" placeholder="No specific contact" {...f.bind('contactId')} options={contacts.map(c => ({ value: c.id, label: `${c.name} (${c.type})` }))} /></Span2>
        <Span2><TextArea label="Notes" rows={3} {...f.bind('notes')} /></Span2>
        <Span2>
          <span className="label">Attachments</span>
          <ul className="mb-2 space-y-1">
            {current.map(a => <FileRow key={a.id} name={a.name} size={a.size} onRemove={() => setRemoved(r => [...r, a.id])} />)}
            {files.map((file, i) => <FileRow key={i} name={file.name} size={file.size} bad={file.size > MAX} onRemove={() => setFiles(fs => fs.filter((_, j) => j !== i))} />)}
          </ul>
          <input ref={input} type="file" multiple hidden onChange={e => { const picked = Array.from(e.target.files ?? []); setFiles(fs => [...fs, ...picked]); e.target.value = '' }} />
          <button type="button" className="btn btn-sm" onClick={() => input.current?.click()}><Paperclip className="size-3.5" />Attach files</button>
          <span className="ms-2 text-xs text-ink-400">Up to 15MB each</span>
        </Span2>
      </FormGrid>
    </FormModal>
  )
}
const FileRow = ({ name, size, onRemove, bad }: { name: string; size: number; onRemove: () => void; bad?: boolean }) => (
  <li className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[13px] ${bad ? 'border-danger-500 bg-danger-50' : 'border-ink-200 bg-ink-50'}`}>
    <Paperclip className="size-3.5 text-ink-400" /><span className="min-w-0 flex-1 truncate">{name}</span>
    <span className="text-xs text-ink-400">{(size / 1024).toFixed(0)} KB</span>
    <button type="button" className="rounded p-0.5 hover:bg-ink-200" onClick={onRemove} aria-label={`Remove ${name}`}><X className="size-3.5" /></button>
  </li>
)
