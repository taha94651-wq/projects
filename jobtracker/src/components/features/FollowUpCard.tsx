import { t, tDays } from '@/i18n'
import { Link } from 'react-router-dom'
import { Check, MoreHorizontal, RotateCcw, SkipForward } from 'lucide-react'
import type { FollowUp } from '@shared/types'
import { useData, useLocale, useStore } from '@/store'
import { completeFollowUp, deleteWithConfirm, skipFollowUp } from '@/actions'
import { openForm, toast } from '@/ui-store'
import { agoDays, diffDays, fmtDate, todayISO } from '@/lib/dates'
import { lastContactDate } from '@/lib/derive'
import { cx } from '../ui/Badge'
import { Menu } from '../ui/Menu'
import { Avatar } from '../ui/misc'

export function followUpState(f: FollowUp, today = todayISO()) {
  if (f.status !== 'Pending') return { key: f.status.toLowerCase(), label: f.status === 'Completed' ? t('COMPLETED') : t('SKIPPED'), tone: 'muted' as const }
  const n = diffDays(f.dueDate, today)
  if (n < 0) return { key: 'overdue', label: t('OVERDUE · {days}', { days: tDays(-n) }).toUpperCase(), tone: 'danger' as const }
  if (n === 0) return { key: 'today', label: t('FOLLOW UP TODAY'), tone: 'warn' as const }
  return { key: 'upcoming', label: n === 1 ? t('TOMORROW') : t('IN {days}', { days: tDays(n) }).toUpperCase(), tone: 'neutral' as const }
}
const TONE = {
  danger: 'border-danger-500/40 bg-danger-50/50', warn: 'border-warn-500/40 bg-warn-50/60', neutral: 'border-ink-200/80 bg-surface', muted: 'border-ink-200/80 bg-surface opacity-75',
}
const LABEL = { danger: 'text-danger-700', warn: 'text-warn-700', neutral: 'text-ink-500', muted: 'text-ink-400' }

export function FollowUpCard({ f, compact }: { f: FollowUp; compact?: boolean }) {
  const data = useData(), locale = useLocale()
  const app = data.applications.find(a => a.id === f.applicationId)
  const company = data.companies.find(c => c.id === (app?.companyId ?? f.companyId))
  const contact = data.contacts.find(c => c.id === f.contactId)
  const last = lastContactDate(data, { companyId: company?.id })
  const s = followUpState(f)
  const pending = f.status === 'Pending'
  return (
    <article className={cx('rounded-xl border p-4', TONE[s.tone])} data-testid="followup-card" data-state={s.key}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={cx('text-[11px] font-bold tracking-[0.1em]', LABEL[s.tone])}>{s.label}</p>
          <div className="mt-2 flex items-center gap-2.5">
            <Avatar name={company?.name ?? '?'} size="sm" />
            <div className="min-w-0">
              <Link to={company ? `/companies/${company.id}` : '#'} className="block truncate text-[14px] font-semibold hover:text-brand-800">{company?.name ?? 'Unknown company'}</Link>
              {app && <Link to={`/applications/${app.id}`} className="block truncate text-[13px] text-ink-600 hover:underline">{app.position}</Link>}
            </div>
          </div>
        </div>
        <Menu label="Follow-up actions" trigger={<MoreHorizontal className="size-4" />} items={[
          { label: 'Edit', onSelect: () => openForm({ kind: 'followup', id: f.id }) },
          { label: 'Skip', icon: <SkipForward className="size-4" />, hidden: !pending, onSelect: () => void skipFollowUp(f) },
          { label: 'Reopen as pending', icon: <RotateCcw className="size-4" />, hidden: pending, onSelect: () => void useStore.getState().patch('followUps', f.id, { status: 'Pending', completedAt: '' }).then(() => toast('Follow-up reopened', 'info')) },
          { label: 'Delete', danger: true, divider: true, onSelect: () => void deleteWithConfirm('followUps', f.id, 'follow-up') },
        ]} />
      </div>
      <dl className="mt-3 space-y-0.5 text-[13px] text-ink-600">
        {contact && <div className="flex gap-1.5"><dt className="text-ink-400">{t(contact.type)}:</dt><dd className="font-medium text-ink-800">{contact.name}</dd></div>}
        <div className="flex gap-1.5"><dt className="text-ink-400">Last contact:</dt><dd>{agoDays(last)}</dd></div>
        <div className="flex gap-1.5"><dt className="text-ink-400">Via:</dt><dd>{t(f.type)} · {t('due {date}', { date: fmtDate(f.dueDate, locale, { day: 'numeric', month: 'short' }) })}</dd></div>
      </dl>
      {!compact && f.notes && <p className="mt-2 rounded-lg bg-ink-50 px-2.5 py-2 text-[13px] leading-relaxed text-ink-600">{f.notes}</p>}
      {pending && (
        <div className="mt-3.5 flex flex-wrap gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => void completeFollowUp(f)}><Check className="size-3.5" />Mark Completed</button>
          <button className="btn btn-sm" onClick={() => openForm({ kind: 'reschedule', id: f.id })}>Reschedule</button>
        </div>
      )}
    </article>
  )
}
