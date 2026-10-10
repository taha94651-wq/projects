import { Link } from 'react-router-dom'
import { ArrowRightLeft, Bell, Briefcase, Eye, Gift, Handshake, AtSign, Mail, MessageCircle, MoreHorizontal, Paperclip, Phone, StickyNote, UsersRound, type LucideIcon } from 'lucide-react'
import type { ActivityType } from '@shared/constants'
import type { Activity } from '@shared/types'
import { useData, useLocale } from '@/store'
import { deleteWithConfirm } from '@/actions'
import { openForm } from '@/ui-store'
import { fmtDate } from '@/lib/dates'
import { cx } from '../ui/Badge'
import { Menu } from '../ui/Menu'

export const ACTIVITY_ICON: Record<ActivityType, { icon: LucideIcon; tone: string }> = {
  Contacted: { icon: Handshake, tone: 'bg-info-50 text-info-500' }, Applied: { icon: Briefcase, tone: 'bg-brand-50 text-brand-600' },
  'HR viewed CV': { icon: Eye, tone: 'bg-ink-100 text-ink-500' }, Interview: { icon: UsersRound, tone: 'bg-warn-50 text-warn-500' },
  'Follow-up': { icon: Bell, tone: 'bg-brand-50 text-brand-600' }, Email: { icon: Mail, tone: 'bg-info-50 text-info-500' },
  'Phone call': { icon: Phone, tone: 'bg-info-50 text-info-500' }, WhatsApp: { icon: MessageCircle, tone: 'bg-brand-50 text-brand-600' },
  'LinkedIn message': { icon: AtSign, tone: 'bg-info-50 text-info-500' }, 'Stage change': { icon: ArrowRightLeft, tone: 'bg-ink-100 text-ink-500' },
  Note: { icon: StickyNote, tone: 'bg-ink-100 text-ink-500' }, Offer: { icon: Gift, tone: 'bg-brand-600 text-white' }, Other: { icon: StickyNote, tone: 'bg-ink-100 text-ink-500' },
}

export function Timeline({ activities, showApplication, empty = 'No activity recorded yet.' }: { activities: Activity[]; showApplication?: boolean; empty?: string }) {
  const data = useData(), locale = useLocale()
  const sorted = [...activities].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  if (!sorted.length) return <p className="py-6 text-center text-sm text-ink-400">{empty}</p>
  return (
    <ol className="relative" aria-label="Timeline">
      {sorted.map((a, i) => {
        const { icon: Icon, tone } = ACTIVITY_ICON[a.type]
        const contact = data.contacts.find(c => c.id === a.contactId)
        const app = showApplication ? data.applications.find(x => x.id === a.applicationId) : undefined
        const files = data.attachments.filter(f => f.activityId === a.id)
        return (
          <li key={a.id} className="relative flex gap-3.5 pb-5 last:pb-0" data-testid="timeline-item">
            {i < sorted.length - 1 && <span className="absolute start-[15px] top-9 -bottom-0 w-px bg-ink-200" aria-hidden />}
            <span className={cx('relative z-10 grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-surface', tone)}><Icon className="size-3.5" aria-hidden /></span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium text-ink-900">{a.description || a.type}</p>
                  <p className="text-xs text-ink-500">
                    <time dateTime={a.date}>{fmtDate(a.date, locale, { day: 'numeric', month: 'short', year: 'numeric' })}</time> · {a.type}
                    {contact && <> · <Link to={`/contacts/${contact.id}`} className="hover:underline">{contact.name}</Link></>}
                    {app && <> · <Link to={`/applications/${app.id}`} className="hover:underline">{app.position}</Link></>}
                  </p>
                </div>
                <Menu label="Event actions" trigger={<MoreHorizontal className="size-4" />} items={[
                  { label: 'Edit', onSelect: () => openForm({ kind: 'activity', id: a.id }) },
                  { label: 'Delete', danger: true, divider: true, onSelect: () => void deleteWithConfirm('activities', a.id, 'timeline entry') },
                ]} />
              </div>
              {a.notes && <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-ink-50 px-3 py-2 text-[13px] leading-relaxed text-ink-600">{a.notes}</p>}
              {files.length > 0 && (
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {files.map(f => <li key={f.id}><a href={`/api/attachments/${f.id}/file`} download className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-surface px-2 py-1 text-xs text-ink-700 hover:bg-ink-50"><Paperclip className="size-3" />{f.name}</a></li>)}
                </ul>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
