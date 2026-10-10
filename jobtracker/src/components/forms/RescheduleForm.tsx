import { useStore } from '@/store'
import { rescheduleFollowUp } from '@/actions'
import { useUI, type FormRequest } from '@/ui-store'
import { addDays, todayISO } from '@/lib/dates'
import { TextField } from '../ui/fields'
import { required, useForm } from '../ui/useForm'
import { FormModal } from './FormModal'

export function RescheduleForm({ req }: { req: FormRequest }) {
  const fu = useStore.getState().data.followUps.find(x => x.id === req.id)
  const close = useUI(s => s.closeForm)
  const f = useForm({ dueDate: addDays(todayISO(), 1) }, v => ({ dueDate: required(v.dueDate, 'Choose a date') }))
  if (!fu) return null
  const save = f.submit(async v => { await rescheduleFollowUp(fu, v.dueDate); close() })
  return (
    <FormModal title="Reschedule follow-up" size="sm" onSubmit={save} busy={f.busy} submitLabel="Reschedule">
      <div className="mb-3 flex flex-wrap gap-2">
        {[['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7], ['In 2 weeks', 14]].map(([l, n]) => (
          <button type="button" key={l} className="btn btn-sm" onClick={() => f.set('dueDate', addDays(todayISO(), n as number))}>{l}</button>
        ))}
      </div>
      <TextField label="New due date" type="date" autoFocus {...f.bind('dueDate')} />
    </FormModal>
  )
}
