import { t } from '@/i18n'
import { Check } from 'lucide-react'
import { useStore } from '@/store'
import { openForm, useUI, type FormRequest } from '@/ui-store'
import type { AttemptUpdate } from '@/actions'
import { afterAttempt } from '@/lib/advisor'
import { fmtDate } from '@/lib/dates'
import { Modal } from '../ui/Modal'
import { SuggestionCard } from '../features/SuggestionsPanel'

/** Shown right after an attempt is saved: what the app updated on its own, plus coaching for the next step. */
export function AttemptSavedDialog({ req }: { req: FormRequest }) {
  const close = useUI(s => s.closeForm)
  const data = useStore(s => s.data), me = useStore(s => s.user?.name ?? ''), locale = useStore(s => s.settings.locale)
  const attempt = data.attempts.find(a => a.id === req.id)
  const updates = (req.defaults?.updates ?? []) as AttemptUpdate[]
  if (!attempt) return null
  const company = data.companies.find(c => c.id === attempt.companyId)
  const tips = afterAttempt(data, attempt, me)
  const line = (u: AttemptUpdate) => {
    switch (u.kind) {
      case 'status': return t('Company status → {status}', { status: t(u.to) })
      case 'timeline': return t('Added to the company timeline')
      case 'followup': return t('Follow-up scheduled for {date}', { date: fmtDate(u.date, locale, { day: 'numeric', month: 'short' }) })
      case 'contact': return t('{name} saved to Contacts', { name: u.name })
      case 'completed': return t('Automatic follow-up marked as done')
    }
  }
  return (
    <Modal open onClose={close} title={req.defaults?.edited ? 'Attempt updated' : 'Attempt saved'} description={company?.name} size="lg"
      footer={<>
        <button type="button" className="btn" onClick={() => { close(); openForm({ kind: 'attempt', defaults: { companyId: attempt.companyId } }) }}>Add another attempt</button>
        <button type="button" className="btn btn-primary" onClick={close} autoFocus>Done</button>
      </>}>
      {updates.length > 0 && (
        <section aria-label={t('Updated automatically')} className="mb-5">
          <h3 className="eyebrow mb-2">Updated automatically</h3>
          <ul className="space-y-1.5">{updates.map((u, i) => <li key={i} className="flex items-center gap-2 text-[13.5px] text-ink-800"><span className="grid size-5 place-items-center rounded-full bg-brand-100 text-brand-700"><Check className="size-3" /></span>{line(u)}</li>)}</ul>
        </section>
      )}
      <section aria-label={t('Suggestions')}>
        <h3 className="eyebrow mb-2">Suggestions</h3>
        <div className="space-y-3">{tips.map(s => <SuggestionCard key={s.id} s={s} />)}</div>
      </section>
    </Modal>
  )
}
