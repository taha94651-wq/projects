import { useUI } from '@/ui-store'
import { ActivityForm } from './ActivityForm'
import { AttemptForm } from './AttemptForm'
import { AttemptSavedDialog } from './AttemptSavedDialog'
import { ApplicationForm } from './ApplicationForm'
import { CompanyForm } from './CompanyForm'
import { ContactForm } from './ContactForm'
import { FollowUpForm } from './FollowUpForm'
import { ImportForm } from './ImportForm'
import { InterviewForm } from './InterviewForm'
import { RescheduleForm } from './RescheduleForm'

/** Renders whichever record form was requested via `openForm()`. Keyed so state resets between records. */
export function FormHost() {
  const form = useUI(s => s.form)
  if (!form) return null
  const key = `${form.kind}:${form.id ?? 'new'}:${JSON.stringify(form.defaults ?? {})}`
  switch (form.kind) {
    case 'company': return <CompanyForm key={key} req={form} />
    case 'attempt': return <AttemptForm key={key} req={form} />
    case 'attemptSaved': return <AttemptSavedDialog key={key} req={form} />
    case 'application': return <ApplicationForm key={key} req={form} />
    case 'contact': return <ContactForm key={key} req={form} />
    case 'interview': return <InterviewForm key={key} req={form} />
    case 'followup': return <FollowUpForm key={key} req={form} />
    case 'activity': return <ActivityForm key={key} req={form} />
    case 'reschedule': return <RescheduleForm key={key} req={form} />
    case 'import': return <ImportForm key={key} />
  }
}
