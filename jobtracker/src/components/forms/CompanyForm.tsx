import { COMPANY_STATUSES, COMPANY_TYPES, PRIORITIES, type CompanyStatus, type CompanyType, type Priority } from '@shared/constants'
import type { Company } from '@shared/types'
import { useStore } from '@/store'
import { createCompany } from '@/actions'
import { toast, useUI, type FormRequest } from '@/ui-store'
import { normUrl } from '@/lib/format'
import { FormGrid, SelectField, Span2, TextArea, TextField } from '../ui/fields'
import { required, urlOk, useForm } from '../ui/useForm'
import { FormModal } from './FormModal'

const SIZES = ['1–5', '5–20', '20–50', '50–200', '200–500', '500+']
type V = Omit<Company, 'id' | 'createdAt' | 'archived'>

export function CompanyForm({ req }: { req: FormRequest }) {
  const existing = useStore(s => s.data.companies.find(c => c.id === req.id))
  const { patch } = useStore.getState()
  const close = useUI(s => s.closeForm)
  const init: V = {
    name: '', industry: '', location: '', website: '', type: 'Architecture', priority: 'Medium', status: 'Target', description: '', size: '', linkedin: '', notes: '',
    ...(existing ?? {}), ...(req.defaults as Partial<V>),
  }
  const f = useForm<V>(init, v => ({
    name: required(v.name, 'Company name is required'), website: urlOk(v.website), linkedin: urlOk(v.linkedin),
  }))
  const save = f.submit(async v => {
    const clean = { ...v, name: v.name.trim(), website: v.website ? normUrl(v.website) : '', linkedin: v.linkedin ? normUrl(v.linkedin) : '' }
    const dup = useStore.getState().data.companies.find(c => c.name.toLowerCase() === clean.name.toLowerCase() && c.id !== existing?.id)
    if (dup && !existing) toast(`Note: a company named "${dup.name}" already exists`, 'info')
    if (existing) { await patch('companies', existing.id, clean); toast('Company updated') }
    else { await createCompany({ ...clean, archived: false }); toast('Company added') }
    close()
  })
  return (
    <FormModal title={existing ? 'Edit company' : 'Add company'} onSubmit={save} busy={f.busy} submitLabel={existing ? 'Save changes' : 'Add company'}>
      <FormGrid>
        <Span2><TextField label="Company name" required autoFocus {...f.bind('name')} placeholder="e.g. Al Noor Architecture" /></Span2>
        <SelectField label="Company type" options={COMPANY_TYPES} {...f.bind('type')} onChange={e => f.set('type', e.target.value as CompanyType)} />
        <SelectField label="Status" options={COMPANY_STATUSES} {...f.bind('status')} onChange={e => f.set('status', e.target.value as CompanyStatus)} />
        <SelectField label="Priority" options={PRIORITIES} {...f.bind('priority')} onChange={e => f.set('priority', e.target.value as Priority)} />
        <SelectField label="Company size" placeholder="Unknown" options={SIZES} {...f.bind('size')} />
        <TextField label="Industry" {...f.bind('industry')} placeholder="e.g. Architecture & Urban Design" />
        <TextField label="Location" {...f.bind('location')} placeholder="City, Country" />
        <TextField label="Website" {...f.bind('website')} placeholder="company.com" inputMode="url" />
        <TextField label="LinkedIn" {...f.bind('linkedin')} placeholder="linkedin.com/company/…" inputMode="url" />
        <Span2><TextArea label="Description" rows={2} {...f.bind('description')} /></Span2>
        <Span2><TextArea label="Notes" rows={2} {...f.bind('notes')} /></Span2>
      </FormGrid>
    </FormModal>
  )
}
