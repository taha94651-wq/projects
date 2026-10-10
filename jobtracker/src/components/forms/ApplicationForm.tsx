import { CURRENCIES, EMPLOYMENT_TYPES, PRIORITIES, SOURCES, STAGES, WORK_TYPES, COMPANY_TYPES, type Currency, type CompanyType, type EmploymentType, type Priority, type Source, type Stage, type WorkType } from '@shared/constants'
import type { Application } from '@shared/types'
import { useStore } from '@/store'
import { changeStage, createApplication, createCompany } from '@/actions'
import { toast, useUI, type FormRequest } from '@/ui-store'
import { addDays, todayISO } from '@/lib/dates'
import { normUrl } from '@/lib/format'
import { FormGrid, FormSection, SelectField, Span2, TextArea, TextField } from '../ui/fields'
import { emailOk, numOk, required, toNum, urlOk, useForm } from '../ui/useForm'
import { FormModal } from './FormModal'

const NEW = '__new'
type V = Omit<Application, 'id' | 'createdAt' | 'salaryMin' | 'salaryMax' | 'currentSalary' | 'expectedSalary' | 'offerAmount'> & {
  salaryMin: string; salaryMax: string; currentSalary: string; expectedSalary: string; offerAmount: string
  newCompany: string; newCompanyType: CompanyType; followUp: string
}
const str = (n: number | null | undefined) => (n == null ? '' : String(n))

export function ApplicationForm({ req }: { req: FormRequest }) {
  const { data, settings } = useStore.getState()
  const existing = data.applications.find(a => a.id === req.id)
  const close = useUI(s => s.closeForm)
  const d = req.defaults as Partial<V> | undefined
  const base: V = {
    companyId: data.companies.filter(c => !c.archived)[0]?.id ?? NEW, position: '', department: '', jobUrl: '', location: '', workType: 'On-site', employmentType: 'Full-time',
    applicationDate: todayISO(), deadline: '', source: 'LinkedIn', salaryMin: '', salaryMax: '', currency: settings.defaultCurrency, currentSalary: '', expectedSalary: '', offerAmount: '',
    recruiter: '', recruiterEmail: '', recruiterPhone: '', status: 'Applied', priority: 'Medium', notes: '', newCompany: '', newCompanyType: 'Architecture', followUp: addDays(todayISO(), 5), ...d,
  }
  const init: V = existing ? {
    ...base, ...existing, salaryMin: str(existing.salaryMin), salaryMax: str(existing.salaryMax), currentSalary: str(existing.currentSalary),
    expectedSalary: str(existing.expectedSalary), offerAmount: str(existing.offerAmount), followUp: '',
  } : base
  const f = useForm<V>(init, v => ({
    companyId: v.companyId === NEW ? undefined : required(v.companyId, 'Choose a company'),
    newCompany: v.companyId === NEW ? required(v.newCompany, 'Enter the company name') : undefined,
    position: required(v.position, 'Position is required'),
    applicationDate: v.status !== 'Wishlist' ? required(v.applicationDate, 'Enter the application date') : undefined,
    jobUrl: urlOk(v.jobUrl), recruiterEmail: emailOk(v.recruiterEmail),
    salaryMin: numOk(v.salaryMin), salaryMax: numOk(v.salaryMax) ?? (v.salaryMin && v.salaryMax && Number(v.salaryMax) < Number(v.salaryMin) ? 'Max must be ≥ min' : undefined),
    currentSalary: numOk(v.currentSalary), expectedSalary: numOk(v.expectedSalary), offerAmount: numOk(v.offerAmount),
  }))
  const v = f.values
  const company = data.companies.find(c => c.id === v.companyId)

  const save = f.submit(async v => {
    let companyId = v.companyId
    if (companyId === NEW) {
      const c = await createCompany({ name: v.newCompany.trim(), type: v.newCompanyType, industry: '', location: v.location, website: '', priority: v.priority, status: 'Target', description: '', size: '', linkedin: '', notes: '', archived: false })
      companyId = c.id
    }
    const row = {
      companyId, position: v.position.trim(), department: v.department, jobUrl: v.jobUrl ? normUrl(v.jobUrl) : '', location: v.location || company?.location || '',
      workType: v.workType, employmentType: v.employmentType, applicationDate: v.status === 'Wishlist' ? v.applicationDate : v.applicationDate, deadline: v.deadline, source: v.source,
      salaryMin: toNum(v.salaryMin), salaryMax: toNum(v.salaryMax), currency: v.currency, currentSalary: toNum(v.currentSalary), expectedSalary: toNum(v.expectedSalary),
      recruiter: v.recruiter, recruiterEmail: v.recruiterEmail, recruiterPhone: v.recruiterPhone, status: v.status, priority: v.priority, notes: v.notes, offerAmount: toNum(v.offerAmount),
    }
    if (existing) {
      const { status, ...rest } = row
      await useStore.getState().patch('applications', existing.id, rest)
      if (status !== existing.status) await changeStage(existing.id, status)
      toast('Application updated')
    } else {
      const a = await createApplication(row, v.followUp && v.status !== 'Wishlist' ? v.followUp : undefined)
      toast(`Application added${v.followUp && v.status !== 'Wishlist' ? ' · follow-up scheduled' : ''}`)
      void a
    }
    close()
  })
  const onNum = (k: 'salaryMin' | 'salaryMax' | 'currentSalary' | 'expectedSalary' | 'offerAmount') => ({ ...f.bind(k), inputMode: 'numeric' as const, placeholder: '0' })

  return (
    <FormModal title={existing ? 'Edit application' : 'Add application'} size="lg" onSubmit={save} busy={f.busy} submitLabel={existing ? 'Save changes' : 'Add application'}>
      <FormSection title="Role">
        <FormGrid>
          <SelectField label="Company" required {...f.bind('companyId')} error={f.errors.companyId}
            options={[...data.companies.filter(c => !c.archived || c.id === v.companyId).sort((a, b) => a.name.localeCompare(b.name)).map(c => ({ value: c.id, label: c.name })), { value: NEW, label: '＋ New company…' }]} />
          {v.companyId === NEW
            ? <TextField label="New company name" required autoFocus {...f.bind('newCompany')} />
            : <TextField label="Position" required autoFocus={!existing} {...f.bind('position')} placeholder="e.g. Senior Architect" />}
          {v.companyId === NEW && <SelectField label="Company type" options={COMPANY_TYPES} {...f.bind('newCompanyType')} />}
          {v.companyId === NEW && <TextField label="Position" required {...f.bind('position')} placeholder="e.g. Senior Architect" />}
          <TextField label="Department" {...f.bind('department')} />
          <TextField label="Location" {...f.bind('location')} placeholder={company?.location || 'City, Country'} />
          <SelectField label="Work type" options={WORK_TYPES} {...f.bind('workType')} onChange={e => f.set('workType', e.target.value as WorkType)} />
          <SelectField label="Employment type" options={EMPLOYMENT_TYPES} {...f.bind('employmentType')} onChange={e => f.set('employmentType', e.target.value as EmploymentType)} />
          <Span2><TextField label="Job URL" {...f.bind('jobUrl')} inputMode="url" placeholder="https://…" /></Span2>
        </FormGrid>
      </FormSection>
      <FormSection title="Status">
        <FormGrid>
          <SelectField label="Stage" options={STAGES} {...f.bind('status')} onChange={e => f.set('status', e.target.value as Stage)} />
          <SelectField label="Priority" options={PRIORITIES} {...f.bind('priority')} onChange={e => f.set('priority', e.target.value as Priority)} />
          <TextField label="Application date" type="date" required={v.status !== 'Wishlist'} {...f.bind('applicationDate')} />
          <TextField label="Application deadline" type="date" {...f.bind('deadline')} />
          <SelectField label="Source" options={SOURCES} {...f.bind('source')} onChange={e => f.set('source', e.target.value as Source)} />
          {!existing && v.status !== 'Wishlist' && <TextField label="Next follow-up" type="date" {...f.bind('followUp')} hint="Leave empty for none" />}
        </FormGrid>
      </FormSection>
      <FormSection title="Compensation">
        <FormGrid>
          <TextField label="Salary min" {...onNum('salaryMin')} />
          <TextField label="Salary max" {...onNum('salaryMax')} />
          <SelectField label="Currency" options={CURRENCIES} {...f.bind('currency')} onChange={e => f.set('currency', e.target.value as Currency)} />
          <TextField label="Current salary" {...onNum('currentSalary')} />
          <TextField label="Expected salary" {...onNum('expectedSalary')} />
          <TextField label="Offer amount" {...onNum('offerAmount')} />
        </FormGrid>
      </FormSection>
      <FormSection title="Recruiter">
        <FormGrid>
          <TextField label="Recruiter name" {...f.bind('recruiter')} />
          <TextField label="Recruiter email" type="email" {...f.bind('recruiterEmail')} />
          <TextField label="Recruiter phone" type="tel" {...f.bind('recruiterPhone')} />
          <Span2><TextArea label="Notes" rows={3} {...f.bind('notes')} /></Span2>
        </FormGrid>
      </FormSection>
    </FormModal>
  )
}
