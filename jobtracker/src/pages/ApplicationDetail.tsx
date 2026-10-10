import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bell, Check, ExternalLink, History, Mail, MessagesSquare, Pencil, Phone, Plus, StickyNote, Trash2, Wallet } from 'lucide-react'
import { FUNNEL, STAGES, type Stage } from '@shared/constants'
import { useData, useLocale } from '@/store'
import { changeStage, deleteWithConfirm, setInterviewStatus } from '@/actions'
import { openForm } from '@/ui-store'
import { fmtDate, fmtTime } from '@/lib/dates'
import { furthestIndex } from '@/lib/derive'
import { fmtMoney, hostname, salaryRange } from '@/lib/format'
import { Badge, cx, PriorityBadge, STAGE_STYLE } from '@/components/ui/Badge'
import { Menu } from '@/components/ui/Menu'
import { Avatar, Dl, EmptyState, ExtLink, Section } from '@/components/ui/misc'
import { FollowUpCard } from '@/components/features/FollowUpCard'
import { Timeline } from '@/components/features/Timeline'

export default function ApplicationDetail() {
  const { id } = useParams(); const nav = useNavigate()
  const data = useData(), locale = useLocale()
  const a = data.applications.find(x => x.id === id)
  if (!a) return <Navigate to="/applications" replace />
  const co = data.companies.find(c => c.id === a.companyId)
  const acts = data.activities.filter(x => x.applicationId === a.id)
  const ivs = data.interviews.filter(i => i.applicationId === a.id).sort((x, y) => x.date.localeCompare(y.date))
  const fus = data.followUps.filter(f => f.applicationId === a.id).sort((x, y) => x.dueDate.localeCompare(y.dueDate))
  const reached = furthestIndex(data, a)
  const closed = a.status === 'Rejected' || a.status === 'Withdrawn'
  const money = (n: number | null) => fmtMoney(n, a.currency, locale)

  return (
    <>
      <Link to="/applications" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-500 hover:text-ink-900"><ArrowLeft className="size-3.5" />Applications</Link>
      <header className="card mb-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={co?.name ?? '?'} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-500"><Link to={`/companies/${a.companyId}`} className="font-medium text-ink-700 hover:text-brand-800 hover:underline">{co?.name}</Link>{a.location && ` · ${a.location}`}</p>
            <h1 className="page-title !text-[2rem]">{a.position}</h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="stage-select">Application stage</label>
              <select id="stage-select" className={cx('badge select-badge h-7 cursor-pointer appearance-none border-0 pe-7 ps-2.5 text-[13px] font-semibold', STAGE_STYLE[a.status].badge)} value={a.status} onChange={e => void changeStage(a.id, e.target.value as Stage)}>
                {STAGES.map(s => <option key={s} className="bg-surface text-ink-900">{s}</option>)}
              </select>
              <PriorityBadge priority={a.priority} /><Badge>{a.workType}</Badge><Badge>{a.employmentType}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={() => openForm({ kind: 'application', id: a.id })}><Pencil className="size-4" />Edit</button>
            <button className="btn text-danger-700 hover:bg-danger-50" onClick={async () => { if (await deleteWithConfirm('applications', a.id, `"${a.position}"`)) nav('/applications') }}><Trash2 className="size-4" />Delete</button>
          </div>
        </div>
        <ol className="mt-6 grid grid-cols-7 gap-1" aria-label="Pipeline progress">
          {FUNNEL.map((s, i) => (
            <li key={s} className="min-w-0">
              <div className={cx('h-1.5 rounded-full', i <= reached ? (closed ? 'bg-ink-300' : 'bg-brand-500') : 'bg-ink-100')} />
              <p className={cx('mt-1.5 truncate text-[11px] font-medium', s === a.status ? 'text-ink-900' : i <= reached ? 'text-ink-600' : 'text-ink-400')}>{s}</p>
            </li>
          ))}
        </ol>
        {closed && <p className="mt-3 text-xs text-ink-500">This application is <strong>{a.status.toLowerCase()}</strong>; the bar shows the furthest stage reached.</p>}
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <Section title="Timeline" icon={History} action={<button className="btn btn-sm" onClick={() => openForm({ kind: 'activity', defaults: { applicationId: a.id } })}><Plus className="size-3.5" />Add event</button>}>
            <Timeline activities={acts} empty="No events yet. Add the first one." />
          </Section>
          <Section title="Details" icon={StickyNote}>
            <Dl items={[
              ['Department', a.department], ['Application date', a.applicationDate ? fmtDate(a.applicationDate, locale) : ''], ['Deadline', a.deadline ? fmtDate(a.deadline, locale) : ''],
              ['Source', a.source], ['Job post', a.jobUrl ? <ExtLink href={a.jobUrl}>{hostname(a.jobUrl)} <ExternalLink className="inline size-3" /></ExtLink> : ''], ['Company type', co?.type],
            ]} />
            {a.notes && <div className="mt-4 rounded-lg bg-warn-50/70 px-3.5 py-3"><p className="eyebrow mb-1 text-warn-700">Notes</p><p className="whitespace-pre-wrap text-sm text-ink-700">{a.notes}</p></div>}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Compensation" icon={Wallet}>
            <dl className="space-y-2.5 text-sm">
              {([['Salary range', salaryRange(a, locale, false)], ['Current salary', money(a.currentSalary)], ['Expected salary', money(a.expectedSalary)]] as const).map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-ink-500">{k}</dt><dd className="font-medium">{v}</dd></div>)}
              <div className={cx('flex justify-between gap-3 rounded-lg px-3 py-2.5', a.offerAmount != null ? 'bg-brand-50 text-brand-800' : 'bg-ink-50')}><dt>Offer</dt><dd className="font-semibold">{money(a.offerAmount)}</dd></div>
            </dl>
          </Section>
          <Section title="Recruiter" icon={Mail}>
            {a.recruiter || a.recruiterEmail || a.recruiterPhone ? (
              <div className="space-y-1.5 text-sm"><p className="font-medium">{a.recruiter || '—'}</p>
                {a.recruiterEmail && <a href={`mailto:${a.recruiterEmail}`} className="flex items-center gap-2 text-brand-700 hover:underline"><Mail className="size-3.5" />{a.recruiterEmail}</a>}
                {a.recruiterPhone && <a href={`tel:${a.recruiterPhone}`} className="flex items-center gap-2 text-brand-700 hover:underline"><Phone className="size-3.5" />{a.recruiterPhone}</a>}</div>
            ) : <p className="text-sm text-ink-400">No recruiter details.</p>}
          </Section>
          <Section title={`Interviews (${ivs.length})`} icon={MessagesSquare} flush action={<button className="btn btn-sm" onClick={() => openForm({ kind: 'interview', defaults: { applicationId: a.id } })}><Plus className="size-3.5" />Add</button>}>
            {ivs.length ? <ul className="divide-y divide-ink-100 border-t border-ink-100">{ivs.map(i => (
              <li key={i.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1"><p className="text-sm font-medium">{i.type} interview</p><p className="text-xs text-ink-500">{fmtDate(i.date, locale, { day: 'numeric', month: 'short' })}{i.time && ` · ${fmtTime(i.time, locale)}`}</p></div>
                <Badge tone={i.status === 'Passed' ? 'green' : i.status === 'Failed' ? 'red' : i.status === 'Scheduled' ? 'amber' : 'neutral'}>{i.status}</Badge>
                <Menu label="Interview actions" trigger={<span className="text-lg leading-none">⋯</span>} items={[
                  { label: 'Edit', onSelect: () => openForm({ kind: 'interview', id: i.id }) },
                  { label: 'Mark completed', icon: <Check className="size-4" />, hidden: i.status !== 'Scheduled' && i.status !== 'Rescheduled', onSelect: () => void setInterviewStatus(i, 'Completed') },
                  { label: 'Delete', danger: true, divider: true, onSelect: () => void deleteWithConfirm('interviews', i.id, 'interview') },
                ]} />
              </li>))}</ul> : <EmptyState icon={MessagesSquare} title="No interviews yet" />}
          </Section>
          <Section title={`Follow-ups (${fus.length})`} icon={Bell} action={<button className="btn btn-sm" onClick={() => openForm({ kind: 'followup', defaults: { applicationId: a.id } })}><Plus className="size-3.5" />Add</button>}>
            {fus.length ? <div className="space-y-3">{fus.map(f => <FollowUpCard key={f.id} f={f} compact />)}</div> : <p className="text-sm text-ink-400">No follow-ups scheduled.</p>}
          </Section>
        </div>
      </div>
    </>
  )
}
