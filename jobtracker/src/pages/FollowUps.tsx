import { t } from '@/i18n'
import { useState } from 'react'
import { Bell, Plus } from 'lucide-react'
import { FOLLOWUP_TYPES } from '@shared/constants'
import { useData } from '@/store'
import { openForm } from '@/ui-store'
import { todayISO } from '@/lib/dates'
import { EmptyState, FilterBar, FilterSelect, PageHeader, Tabs } from '@/components/ui/misc'
import { FollowUpCard } from '@/components/features/FollowUpCard'

type Tab = 'due' | 'upcoming' | 'done' | 'all'
export default function FollowUps() {
  const data = useData()
  const [tab, setTab] = useState<Tab>('due')
  const [type, setType] = useState('')
  const today = todayISO()
  const all = data.followUps.filter(f => !type || f.type === type)
  const pending = all.filter(f => f.status === 'Pending').sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const due = pending.filter(f => f.dueDate <= today)
  const upcoming = pending.filter(f => f.dueDate > today)
  const done = all.filter(f => f.status !== 'Pending').sort((a, b) => b.dueDate.localeCompare(a.dueDate))
  const overdue = due.filter(f => f.dueDate < today)
  const shown = tab === 'due' ? due : tab === 'upcoming' ? upcoming : tab === 'done' ? done : [...pending, ...done]

  return (
    <>
      <PageHeader title="Follow-ups" subtitle={overdue.length ? <span className="font-semibold text-danger-700">{t('{o} overdue · {d} due today', { o: overdue.length, d: due.length - overdue.length })}</span> : t('{d} due today · {u} upcoming', { d: due.length, u: upcoming.length })}
        actions={<button className="btn btn-primary" onClick={() => openForm({ kind: 'followup' })}><Plus className="size-4" />Schedule follow-up</button>} />
      {overdue.length > 0 && tab !== 'due' && <button onClick={() => setTab('due')} className="mb-4 w-full rounded-xl border border-danger-500/40 bg-danger-50 px-4 py-3 text-start text-sm font-medium text-danger-700">⚠ {t(overdue.length === 1 ? 'You have {n} overdue follow-up — review now' : 'You have {n} overdue follow-ups — review now', { n: overdue.length })}</button>}
      <Tabs label="Follow-up status" value={tab} onChange={setTab} tabs={[{ value: 'due', label: 'Due & overdue', count: due.length, tone: 'danger' }, { value: 'upcoming', label: 'Upcoming', count: upcoming.length }, { value: 'done', label: 'Completed & skipped', count: done.length }, { value: 'all', label: 'All', count: all.length }]} />
      <div className="mt-4"><FilterBar active={!!type} onClear={() => setType('')}><FilterSelect label="Follow-up type" all="All types" value={type} onChange={setType} options={FOLLOWUP_TYPES} /></FilterBar></div>
      {shown.length ? <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">{shown.map(f => <FollowUpCard key={f.id} f={f} />)}</div>
        : <div className="card"><EmptyState icon={Bell} title={tab === 'due' ? "You're all caught up" : 'Nothing here'} text={tab === 'due' ? 'No follow-ups are due or overdue.' : undefined} /></div>}
    </>
  )
}
