import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Check, Clock, List, MapPin, MessagesSquare, MoreHorizontal, Pencil, Plus, Trash2, User, XCircle } from 'lucide-react'
import { INTERVIEW_STATUSES, INTERVIEW_TYPES } from '@shared/constants'
import type { Interview } from '@shared/types'
import { useData, useLocale } from '@/store'
import { deleteWithConfirm, setInterviewStatus } from '@/actions'
import { openForm } from '@/ui-store'
import { fmtDate, fmtTime, relDay, todayISO } from '@/lib/dates'
import { interviewStamp, isUpcomingInterview } from '@/lib/derive'
import { Badge, cx, type Tone } from '@/components/ui/Badge'
import { Menu } from '@/components/ui/Menu'
import { EmptyState, FilterBar, FilterSelect, PageHeader, Segmented, Tabs } from '@/components/ui/misc'
import { CalendarView } from './Calendar'

const STATUS_TONE: Record<Interview['status'], Tone> = { Scheduled: 'amber', Completed: 'blue', Rescheduled: 'neutral', Cancelled: 'neutral', Passed: 'green', Failed: 'red' }
const RESULT_TONE: Record<Interview['result'], Tone> = { Pending: 'neutral', Passed: 'green', Failed: 'red', 'On hold': 'amber' }

export default function Interviews() {
  const data = useData(), locale = useLocale()
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [tab, setTab] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [type, setType] = useState(''); const [status, setStatus] = useState('')
  const today = todayISO()
  const rows = useMemo(() => data.interviews.map(i => { const app = data.applications.find(a => a.id === i.applicationId); return { i, app, co: data.companies.find(c => c.id === app?.companyId) } }), [data])
  const upcoming = rows.filter(r => isUpcomingInterview(r.i, today))
  const past = rows.filter(r => !isUpcomingInterview(r.i, today))
  const list = (tab === 'upcoming' ? upcoming : tab === 'past' ? past : rows).filter(r => (!type || r.i.type === type) && (!status || r.i.status === status))
    .sort((a, b) => (tab === 'upcoming' ? 1 : -1) * interviewStamp(a.i).localeCompare(interviewStamp(b.i)))
  const menu = (i: Interview) => [
    { label: 'Edit', icon: <Pencil className="size-4" />, onSelect: () => openForm({ kind: 'interview', id: i.id }) },
    { label: 'Mark completed', icon: <Check className="size-4" />, hidden: i.status === 'Completed', onSelect: () => void setInterviewStatus(i, 'Completed') },
    { label: 'Mark passed', icon: <Check className="size-4" />, hidden: i.status === 'Passed', onSelect: () => void setInterviewStatus(i, 'Passed') },
    { label: 'Mark failed', icon: <XCircle className="size-4" />, hidden: i.status === 'Failed', onSelect: () => void setInterviewStatus(i, 'Failed') },
    { label: 'Cancel interview', hidden: i.status === 'Cancelled', onSelect: () => void setInterviewStatus(i, 'Cancelled') },
    { label: 'Delete', icon: <Trash2 className="size-4" />, danger: true, divider: true, onSelect: () => void deleteWithConfirm('interviews', i.id, 'interview') },
  ]
  return (
    <>
      <PageHeader title="Interviews" subtitle={`${upcoming.length} upcoming · ${past.length} past`}
        actions={<><Segmented label="View" value={view} onChange={setView} options={[{ value: 'list', label: 'List', icon: <List className="size-3.5" /> }, { value: 'calendar', label: 'Calendar', icon: <CalendarDays className="size-3.5" /> }]} />
          <button className="btn btn-primary" onClick={() => openForm({ kind: 'interview' })}><Plus className="size-4" />Schedule interview</button></>} />
      {view === 'calendar' ? <CalendarView kinds={['interview']} /> : (
        <>
          <Tabs label="Interview timeframe" value={tab} onChange={setTab} tabs={[{ value: 'upcoming', label: 'Upcoming', count: upcoming.length }, { value: 'past', label: 'Past', count: past.length }, { value: 'all', label: 'All', count: rows.length }]} />
          <div className="mt-4"><FilterBar active={!!(type || status)} onClear={() => { setType(''); setStatus('') }}>
            <FilterSelect label="Interview type" all="All types" value={type} onChange={setType} options={INTERVIEW_TYPES} />
            <FilterSelect label="Status" all="All statuses" value={status} onChange={setStatus} options={INTERVIEW_STATUSES} />
          </FilterBar></div>
          {list.length ? (
            <ul className="grid gap-3 lg:grid-cols-2" aria-label="Interviews">
              {list.map(({ i, app, co }) => {
                const n = Math.round((new Date(i.date).getTime() - new Date(today).getTime()) / 864e5)
                const soon = isUpcomingInterview(i, today) && n <= 1
                return (
                  <li key={i.id} className={cx('card p-4 sm:p-5', soon && 'border-warn-500/50 bg-warn-50/30')} data-testid="interview-card">
                    <div className="flex items-start gap-4">
                      <div className={cx('grid w-14 shrink-0 place-items-center rounded-xl py-2 text-center', soon ? 'bg-warn-100 text-warn-700' : 'bg-ink-100 text-ink-600')}>
                        <span className="text-[10px] font-semibold uppercase tracking-wide">{fmtDate(i.date, locale, { month: 'short' })}</span>
                        <span className="font-display text-2xl leading-none">{fmtDate(i.date, locale, { day: 'numeric' })}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5"><Badge tone="solid">{i.type}</Badge><Badge tone={STATUS_TONE[i.status]}>{i.status}</Badge>{i.result !== 'Pending' && <Badge tone={RESULT_TONE[i.result]}>Result: {i.result}</Badge>}{isUpcomingInterview(i, today) && <Badge tone={soon ? 'amber' : 'neutral'}>{relDay(i.date)}</Badge>}</div>
                        <p className="mt-1.5 truncate text-[15px] font-semibold">{co ? <Link to={`/companies/${co.id}`} className="hover:text-brand-800">{co.name}</Link> : '—'}</p>
                        <p className="truncate text-sm text-ink-600">{app ? <Link to={`/applications/${app.id}`} className="hover:underline">{app.position}</Link> : '—'}</p>
                      </div>
                      <Menu label="Interview actions" trigger={<MoreHorizontal className="size-4" />} items={menu(i)} />
                    </div>
                    <dl className="mt-3.5 grid gap-1.5 text-[13px] text-ink-600">
                      <div className="flex items-center gap-2"><Clock className="size-3.5 text-ink-400" /><dt className="sr-only">Time</dt><dd>{fmtDate(i.date, locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}{i.time && ` · ${fmtTime(i.time, locale)}`}</dd></div>
                      {i.location && <div className="flex items-start gap-2"><MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-400" /><dt className="sr-only">Location</dt><dd className="min-w-0 break-words">{/^https?:\/\//.test(i.location) ? <a className="text-brand-700 hover:underline" href={i.location} target="_blank" rel="noopener noreferrer">{i.location}</a> : i.location}</dd></div>}
                      {i.interviewer && <div className="flex items-center gap-2"><User className="size-3.5 text-ink-400" /><dt className="sr-only">Interviewer</dt><dd>{i.interviewer}</dd></div>}
                    </dl>
                    {(i.prepNotes || i.postNotes) && (
                      <div className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
                        {i.prepNotes && <div className="rounded-lg bg-ink-50 px-3 py-2"><p className="eyebrow mb-0.5">Preparation</p><p className="whitespace-pre-wrap text-ink-700">{i.prepNotes}</p></div>}
                        {i.postNotes && <div className="rounded-lg bg-brand-50/60 px-3 py-2"><p className="eyebrow mb-0.5">After</p><p className="whitespace-pre-wrap text-ink-700">{i.postNotes}</p></div>}
                      </div>)}
                  </li>
                )
              })}
            </ul>
          ) : <div className="card"><EmptyState icon={MessagesSquare} title="No interviews here" text={tab === 'upcoming' ? 'Schedule one when a company invites you.' : 'Nothing matches these filters.'} action={<button className="btn btn-primary btn-sm" onClick={() => openForm({ kind: 'interview' })}>Schedule interview</button>} /></div>}
        </>
      )}
    </>
  )
}
