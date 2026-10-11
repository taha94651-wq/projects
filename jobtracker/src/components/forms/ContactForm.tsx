import { CONTACT_TYPES, type ContactType } from '@shared/constants'
import type { Contact } from '@shared/types'
import { useStore } from '@/store'
import { toast, useUI, type FormRequest } from '@/ui-store'
import { normUrl } from '@/lib/format'
import { FormGrid, SelectField, Span2, TextArea, TextField } from '../ui/fields'
import { emailOk, required, urlOk, useForm } from '../ui/useForm'
import { FormModal } from './FormModal'

type V = Omit<Contact, 'id' | 'createdAt'>
export function ContactForm({ req }: { req: FormRequest }) {
  const { data, add, patch } = useStore.getState()
  const existing = data.contacts.find(c => c.id === req.id)
  const close = useUI(s => s.closeForm)
  const init: V = { companyId: data.companies.filter(c => !c.archived)[0]?.id ?? '', name: '', position: '', email: '', phone: '', linkedin: '', type: 'HR', notes: '', ...(existing ?? {}), ...(req.defaults as Partial<V>) }
  const f = useForm<V>(init, v => ({ name: required(v.name, 'Name is required'), companyId: required(v.companyId, 'Choose a company'), email: emailOk(v.email), linkedin: urlOk(v.linkedin) }))
  const save = f.submit(async v => {
    const row = { ...v, name: v.name.trim(), linkedin: v.linkedin ? normUrl(v.linkedin) : '' }
    if (existing) { await patch('contacts', existing.id, row); toast('Contact updated') } else { await add('contacts', row); toast('Contact added') }
    close()
  })
  return (
    <FormModal title={existing ? 'Edit contact' : 'Add contact'} onSubmit={save} busy={f.busy} submitLabel={existing ? 'Save changes' : 'Add contact'}>
      <FormGrid>
        <TextField label="Name" required autoFocus {...f.bind('name')} />
        <SelectField label="Company" required placeholder="Select company" {...f.bind('companyId')} options={data.companies.filter(c => !c.archived || c.id === init.companyId).sort((a, b) => a.name.localeCompare(b.name)).map(c => ({ value: c.id, label: c.name }))} />
        <SelectField label="Contact type" options={CONTACT_TYPES} {...f.bind('type')} onChange={e => f.set('type', e.target.value as ContactType)} />
        <TextField label="Position" {...f.bind('position')} />
        <TextField label="Email" type="email" {...f.bind('email')} />
        <TextField label="Phone" type="tel" {...f.bind('phone')} />
        <Span2><TextField label="LinkedIn" {...f.bind('linkedin')} inputMode="url" placeholder="linkedin.com/in/…" /></Span2>
        <Span2><TextArea label="Notes" rows={3} {...f.bind('notes')} /></Span2>
      </FormGrid>
    </FormModal>
  )
}
