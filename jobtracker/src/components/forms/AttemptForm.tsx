import { t } from '@/i18n'
import { AtSign, Mail, MessageCircle } from 'lucide-react'
import { ATTEMPT_METHODS, ATTEMPT_RESPONSES, CONTACT_TYPES, EMAIL_KINDS, type AttemptMethod, type AttemptResponse, type EmailKind } from '@shared/constants'
import type { Attempt } from '@shared/types'
import { useStore } from '@/store'
import { openForm, useUI, type FormRequest } from '@/ui-store'
import { saveAttempt } from '@/actions'
import { todayISO } from '@/lib/dates'
import { FormGrid, SelectField, Span2, TextArea, TextField } from '../ui/fields'
import type { ContactType } from '@shared/constants'
import { cx } from '../ui/Badge'
import { required, useForm } from '../ui/useForm'
import { FormModal } from './FormModal'

type V = Omit<Attempt, 'id' | 'createdAt'> & { saveContact?: boolean }
export const METHOD_ICON = { Email: Mail, WhatsApp: MessageCircle, Other: AtSign } as const
const PHONE = /^\+?[\d\s().-]{6,}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AttemptForm({ req }: { req: FormRequest }) {
  const { data } = useStore.getState()
  const existing = data.attempts.find(a => a.id === req.id)
  const close = useUI(s => s.closeForm)
  const init: V = { companyId: data.companies.filter(c => !c.archived)[0]?.id ?? '', method: 'Email', emailKind: 'HR email', contact: '', role: '', personName: '', date: todayISO(), response: 'Waiting', reply: '', progress: '', ...(existing ?? {}), ...(req.defaults as Partial<V>) }
  const f = useForm<V>(init, v => ({
    companyId: required(v.companyId, 'Choose a company'),
    contact: v.method === 'Email' ? (required(v.contact, 'Enter the email address') ?? (EMAIL.test(v.contact.trim()) ? undefined : 'Enter a valid email address'))
      : v.method === 'WhatsApp' ? (required(v.contact, 'Enter the WhatsApp number') ?? (PHONE.test(v.contact.trim()) ? undefined : 'Enter a valid number'))
      : required(v.contact, 'Describe what you tried'),
    role: v.method === 'WhatsApp' ? required(v.role, 'Choose their role') : undefined,
    date: required(v.date, 'Choose a date'),
  }))
  const v = f.values
  const save = f.submit(async v => {
    const { saveContact: _unused, ...rest } = v
    void _unused
    const row = { ...rest, contact: v.contact.trim(), personName: v.personName.trim(), role: v.method === 'Email' ? '' as const : v.role, emailKind: v.method === 'Email' ? v.emailKind || 'HR email' as const : '' as const }
    const { attempt, updates } = await saveAttempt(row, existing?.id)
    close()
    openForm({ kind: 'attemptSaved', id: attempt.id, defaults: { updates, edited: !!existing } })
  })
  const label = v.method === 'Email' ? 'Email address' : v.method === 'WhatsApp' ? 'WhatsApp number' : 'What you tried'
  return (
    <FormModal title={existing ? 'Edit attempt' : 'Add contact attempt'} description="Each try at reaching a company — and what came back." onSubmit={save} busy={f.busy} submitLabel={existing ? 'Save changes' : 'Add attempt'}>
      <FormGrid>
        <Span2><SelectField label="Company" required placeholder="Select company" {...f.bind('companyId')} options={data.companies.filter(c => !c.archived || c.id === init.companyId).sort((a, b) => a.name.localeCompare(b.name)).map(c => ({ value: c.id, label: c.name }))} /></Span2>
        <Span2>
          <fieldset>
            <legend className="label">How did you try?</legend>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('How did you try?')}>
              {ATTEMPT_METHODS.map(m => {
                const Icon = METHOD_ICON[m]; const on = v.method === m
                return (
                  <label key={m} className={cx('flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center text-[13px] font-medium transition', on ? 'border-brand-600 bg-brand-50 text-brand-900 ring-3 ring-brand-500/10' : 'border-ink-200 text-ink-600 hover:border-ink-300')}>
                    <input type="radio" name="method" className="sr-only" checked={on} onChange={() => { f.set('method', m as AttemptMethod); f.set('contact', '') }} />
                    <Icon className="size-4" aria-hidden />{m === 'WhatsApp' ? 'WhatsApp' : t(m)}
                  </label>
                )
              })}
            </div>
          </fieldset>
        </Span2>
        {v.method === 'Email' && <SelectField label="Email type" options={EMAIL_KINDS} {...f.bind('emailKind')} onChange={e => f.set('emailKind', e.target.value as EmailKind)} />}
        <TextField label={label} required autoFocus className={v.method === 'Email' ? '' : 'sm:col-span-2'} {...f.bind('contact')}
          type={v.method === 'Email' ? 'email' : v.method === 'WhatsApp' ? 'tel' : 'text'} dir={v.method === 'Other' ? undefined : 'ltr'}
          placeholder={v.method === 'Email' ? 'name@company.com' : v.method === 'WhatsApp' ? '+966 5X XXX XXXX' : 'e.g. LinkedIn message to HR'} />
        {v.method !== 'Email' && (
          <>
            <SelectField label="Their role" required={v.method === 'WhatsApp'} placeholder="Select role" options={CONTACT_TYPES} {...f.bind('role')} onChange={e => f.set('role', e.target.value as ContactType)} hint="Who did you speak to?" />
            <TextField label="Their name" {...f.bind('personName')} hint="Optional — saved to Contacts automatically" />

          </>
        )}
        <TextField label="Date" type="date" required {...f.bind('date')} />
        <SelectField label="Response" options={ATTEMPT_RESPONSES} {...f.bind('response')} onChange={e => f.set('response', e.target.value as AttemptResponse)} />
        <Span2><TextArea label="Their reply" rows={2} {...f.bind('reply')} placeholder="What they answered, if anything" /></Span2>
        <Span2><TextArea label="Where I got with this" rows={3} {...f.bind('progress')} placeholder="e.g. Sent CV, waiting for an interview slot" /></Span2>
      </FormGrid>
    </FormModal>
  )
}
