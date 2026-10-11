import { t } from '@/i18n'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, MoreHorizontal, Wallet, BellRing } from 'lucide-react'
import { STAGES, type Stage } from '@shared/constants'
import type { Application } from '@shared/types'
import { useData, useLocale } from '@/store'
import { changeStage, deleteWithConfirm } from '@/actions'
import { openForm } from '@/ui-store'
import { fmtShort, relDay, todayISO } from '@/lib/dates'
import { nextFollowUp } from '@/lib/derive'
import { salaryRange } from '@/lib/format'
import { cx, PriorityBadge, StageBadge } from '../ui/Badge'
import { Menu } from '../ui/Menu'
import { Avatar } from '../ui/misc'

export function ApplicationCard({ app, draggable, onDragStart, showStage = true }: { app: Application; draggable?: boolean; onDragStart?: (e: React.DragEvent) => void; showStage?: boolean }) {
  const data = useData(), locale = useLocale()
  const company = data.companies.find(c => c.id === app.companyId)
  const fu = nextFollowUp(data, { appId: app.id })
  const overdue = !!fu && fu.dueDate < todayISO()
  const closed = ['Rejected', 'Withdrawn', 'Accepted'].includes(app.status)
  const high = app.priority === 'High' && !closed
  return (
    <article draggable={draggable} onDragStart={onDragStart} data-testid="app-card"
      className={cx('group relative rounded-xl border bg-surface p-3.5 shadow-card transition hover:border-ink-300 hover:shadow-pop', draggable && 'cursor-grab active:cursor-grabbing',
        high ? 'border-brand-300 ring-1 ring-brand-300/60' : 'border-ink-200/80', closed && 'opacity-80')}>
      {high && <span className="absolute inset-y-3 start-0 w-1 rounded-e-full bg-brand-500" aria-hidden />}
      <div className="flex items-start gap-2.5">
        <Avatar name={company?.name ?? '?'} size="sm" />
        <div className="min-w-0 flex-1">
          <Link to={`/applications/${app.id}`} className="block truncate text-[13.5px] font-semibold text-ink-900 after:absolute after:inset-0 hover:text-brand-800">{company?.name ?? 'Unknown company'}</Link>
          <p className="truncate text-[13px] text-ink-600">{app.position}</p>
        </div>
        <div className="relative z-10 -me-1.5 -mt-1">
          <Menu label={`Actions for ${app.position}`} trigger={<MoreHorizontal className="size-4" />} items={[
            { label: 'Edit', onSelect: () => openForm({ kind: 'application', id: app.id }) },
            { label: 'Log activity', onSelect: () => openForm({ kind: 'activity', defaults: { applicationId: app.id } }) },
            { label: 'Schedule follow-up', onSelect: () => openForm({ kind: 'followup', defaults: { applicationId: app.id } }) },
            { label: 'Delete', danger: true, divider: true, onSelect: () => void deleteWithConfirm('applications', app.id, `"${app.position}"`) },
            ...STAGES.filter(s => s !== app.status).map(s => ({ label: t('Move to {stage}', { stage: t(s) }), divider: s === STAGES.filter(x => x !== app.status)[0], onSelect: () => void changeStage(app.id, s as Stage) })),
          ]} />
        </div>
      </div>
      <dl className="mt-3 space-y-1.5 text-xs text-ink-500">
        {app.location && <div className="flex items-center gap-1.5"><MapPin className="size-3.5 shrink-0" aria-hidden /><dt className="sr-only">Location</dt><dd className="truncate">{app.location}</dd></div>}
        <div className="flex items-center gap-1.5"><CalendarDays className="size-3.5 shrink-0" aria-hidden /><dt className="sr-only">Applied</dt><dd>{app.applicationDate ? t('Applied {date}', { date: fmtShort(app.applicationDate, locale) }) : app.deadline ? t('Deadline {date}', { date: fmtShort(app.deadline, locale) }) : t('Not applied yet')}</dd></div>
        <div className="flex items-center gap-1.5"><Wallet className="size-3.5 shrink-0" aria-hidden /><dt className="sr-only">Salary</dt><dd>{salaryRange(app, locale)}</dd></div>
      </dl>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {showStage && <StageBadge stage={app.status} />}
        <PriorityBadge priority={app.priority} />
        {fu && <span className={cx('badge', overdue ? 'bg-danger-50 text-danger-700' : 'bg-ink-100 text-ink-600')} title="Next follow-up"><BellRing className="size-3" aria-hidden />{overdue ? `${t('Overdue')} · ` : ''}{relDay(fu.dueDate) === t('Today') || overdue ? relDay(fu.dueDate) : fmtShort(fu.dueDate, locale)}</span>}
      </div>
    </article>
  )
}
