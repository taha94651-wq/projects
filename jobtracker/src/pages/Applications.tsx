import { t } from '@/i18n'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Briefcase, Download, ExternalLink, Kanban, MoreHorizontal, Pencil, Plus, Table2, Trash2 } from 'lucide-react'
import { COMPANY_TYPES, PRIORITIES, SOURCES, STAGES, type Priority, type Stage } from '@shared/constants'
import type { Application } from '@shared/types'
import { useData, useLocale } from '@/store'
import { deleteWithConfirm } from '@/actions'
import { openForm } from '@/ui-store'
import { downloadFile, toCsv } from '@/lib/csv'
import { fmtDate, relDay, todayISO } from '@/lib/dates'
import { interviewStamp, nextFollowUp, nextInterview } from '@/lib/derive'
import { salaryRange } from '@/lib/format'
import { Badge, cx, PriorityBadge, StageBadge } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Menu } from '@/components/ui/Menu'
import { Avatar, DateFilter, EmptyState, FilterBar, FilterSelect, PageHeader, SearchInput, Segmented } from '@/components/ui/misc'
import { KanbanBoard } from '@/components/features/KanbanBoard'

const PRIO: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 }

export default function Applications() {
  const data = useData(), locale = useLocale(), nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState<'table' | 'board'>('table')
  const [q, setQ] = useState('')
  const [f, setF] = useState({ status: params.get('status') ?? '', priority: '', type: '', location: '', source: '', salaryMin: '', from: '', to: '', fuFrom: '', fuTo: '' })
  const set = (k: keyof typeof f, v: string) => { setF(s => ({ ...s, [k]: v })); if (k === 'status') { const p = new URLSearchParams(params); v ? p.set('status', v) : p.delete('status'); setParams(p, { replace: true }) } }
  const cos = useMemo(() => new Map(data.companies.map(c => [c.id, c])), [data.companies])

  const rows = useMemo(() => data.applications.map(a => ({ a, co: cos.get(a.companyId), fu: nextFollowUp(data, { appId: a.id }), iv: nextInterview(data, a.id) })), [data, cos])
  type Row = (typeof rows)[number]
  const locations = useMemo(() => [...new Set(data.applications.map(a => a.location.split(',')[0].trim()).filter(Boolean))].sort(), [data.applications])
  const filtered = rows.filter(({ a, co, fu }) => {
    if (f.status && a.status !== f.status) return false
    if (f.priority && a.priority !== f.priority) return false
    if (f.type && co?.type !== f.type) return false
    if (f.location && !a.location.startsWith(f.location)) return false
    if (f.source && a.source !== f.source) return false
    if (f.salaryMin && (a.salaryMax ?? a.salaryMin ?? 0) < Number(f.salaryMin)) return false
    if (f.from && (!a.applicationDate || a.applicationDate < f.from)) return false
    if (f.to && (!a.applicationDate || a.applicationDate > f.to)) return false
    if (f.fuFrom && (!fu || fu.dueDate < f.fuFrom)) return false
    if (f.fuTo && (!fu || fu.dueDate > f.fuTo)) return false
    const s = q.trim().toLowerCase()
    return !s || [a.position, a.department, a.location, a.notes, a.recruiter, co?.name].some(x => x?.toLowerCase().includes(s))
  })
  const active = !!(q || Object.values(f).some(Boolean))
  const clear = () => { setQ(''); setF({ status: '', priority: '', type: '', location: '', source: '', salaryMin: '', from: '', to: '', fuFrom: '', fuTo: '' }); setParams({}, { replace: true }) }
  const today = todayISO()

  const exportCsv = () => downloadFile('applications.csv', toCsv(filtered, [
    { header: 'Company', value: r => r.co?.name }, { header: 'Position', value: r => r.a.position }, { header: 'Department', value: r => r.a.department }, { header: 'Location', value: r => r.a.location },
    { header: 'Work type', value: r => r.a.workType }, { header: 'Employment type', value: r => r.a.employmentType }, { header: 'Application date', value: r => r.a.applicationDate },
    { header: 'Source', value: r => r.a.source }, { header: 'Currency', value: r => r.a.currency }, { header: 'Salary min', value: r => r.a.salaryMin }, { header: 'Salary max', value: r => r.a.salaryMax },
    { header: 'Current salary', value: r => r.a.currentSalary }, { header: 'Expected salary', value: r => r.a.expectedSalary }, { header: 'Offer amount', value: r => r.a.offerAmount },
    { header: 'Recruiter', value: r => r.a.recruiter }, { header: 'Recruiter email', value: r => r.a.recruiterEmail }, { header: 'Recruiter phone', value: r => r.a.recruiterPhone },
    { header: 'Status', value: r => r.a.status }, { header: 'Priority', value: r => r.a.priority }, { header: 'Next follow-up', value: r => r.fu?.dueDate },
    { header: 'Interview date', value: r => r.iv?.date }, { header: 'Job URL', value: r => r.a.jobUrl }, { header: 'Notes', value: r => r.a.notes },
  ]))
  const menu = (a: Application) => [
    { label: 'Edit', icon: <Pencil className="size-4" />, onSelect: () => openForm({ kind: 'application', id: a.id }) },
    { label: 'Schedule interview', onSelect: () => openForm({ kind: 'interview', defaults: { applicationId: a.id } }) },
    { label: 'Schedule follow-up', onSelect: () => openForm({ kind: 'followup', defaults: { applicationId: a.id } }) },
    { label: 'Delete', icon: <Trash2 className="size-4" />, danger: true, divider: true, onSelect: () => void deleteWithConfirm('applications', a.id, `"${a.position}"`) },
  ]
  const columns: Column<Row>[] = [
    { key: 'company', header: 'Company', sort: r => r.co?.name, render: ({ a, co }) => (
      <div className="flex min-w-44 items-center gap-2.5">{a.priority === 'High' && <span className="h-8 w-1 shrink-0 rounded-full bg-brand-500" aria-label="High priority" />}<Avatar name={co?.name ?? '?'} size="sm" /><span className="truncate font-semibold">{co?.name ?? '—'}</span></div>) },
    { key: 'position', header: 'Position', sort: r => r.a.position, render: ({ a }) => <div className="min-w-44"><p className="font-medium text-ink-800">{a.position}</p><p className="text-xs text-ink-400">{t(a.workType)} · {t(a.employmentType)}</p></div> },
    { key: 'location', header: 'Location', sort: r => r.a.location, hideBelow: 'xl', render: ({ a }) => <span className="text-ink-600">{a.location || '—'}</span> },
    { key: 'status', header: 'Stage', sort: r => STAGES.indexOf(r.a.status), render: ({ a }) => <StageBadge stage={a.status} /> },
    { key: 'priority', header: 'Priority', sort: r => PRIO[r.a.priority], render: ({ a }) => <PriorityBadge priority={a.priority} /> },
    { key: 'date', header: 'Applied', sort: r => r.a.applicationDate, render: ({ a }) => <span className="whitespace-nowrap text-ink-600">{a.applicationDate ? fmtDate(a.applicationDate, locale, { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}</span> },
    { key: 'source', header: 'Source', sort: r => r.a.source, hideBelow: '2xl', render: ({ a }) => <span className="text-ink-600">{t(a.source)}</span> },
    { key: 'salary', header: 'Salary', sort: r => r.a.salaryMax ?? r.a.salaryMin, render: ({ a }) => <span className="whitespace-nowrap text-ink-600">{salaryRange(a, locale)}</span> },
    { key: 'iv', header: 'Interview', sort: r => (r.iv ? interviewStamp(r.iv) : null), hideBelow: '2xl', render: ({ iv }) => iv ? <span className="whitespace-nowrap text-[13px]">{fmtDate(iv.date, locale, { day: 'numeric', month: 'short' })}</span> : '—' },
    { key: 'fu', header: 'Follow-up', sort: r => r.fu?.dueDate, render: ({ fu }) => fu ? <span className={cx('whitespace-nowrap text-[13px]', fu.dueDate < today ? 'font-semibold text-danger-700' : 'text-ink-600')}>{relDay(fu.dueDate)}</span> : '—' },
    { key: 'actions', header: '', className: 'w-10', render: ({ a }) => <Menu label={`Actions for ${a.position}`} trigger={<MoreHorizontal className="size-4" />} items={menu(a)} /> },
  ]
  return (
    <>
      <PageHeader title="Applications" subtitle={t('{n} of {total} applications', { n: filtered.length, total: data.applications.length })}
        actions={<>
          <Segmented label="View" value={view} onChange={setView} options={[{ value: 'table', label: 'Table', icon: <Table2 className="size-3.5" /> }, { value: 'board', label: 'Board', icon: <Kanban className="size-3.5" /> }]} />
          <button className="btn" onClick={exportCsv} disabled={!filtered.length}><Download className="size-4" />Export CSV</button>
          <button className="btn btn-primary" onClick={() => openForm({ kind: 'application' })}><Plus className="size-4" />Add application</button>
        </>} />
      <FilterBar active={active} onClear={clear}>
        <SearchInput label="Search applications" placeholder="Search position, company, notes…" value={q} onChange={setQ} />
        <FilterSelect label="Status" all="All stages" value={f.status} onChange={v => set('status', v as Stage)} options={STAGES} />
        <FilterSelect label="Priority" all="All priorities" value={f.priority} onChange={v => set('priority', v)} options={PRIORITIES} />
        <FilterSelect label="Category" all="All categories" value={f.type} onChange={v => set('type', v)} options={COMPANY_TYPES} />
        <FilterSelect label="Location" all="All locations" value={f.location} onChange={v => set('location', v)} options={locations} />
        <FilterSelect label="Source" all="All sources" value={f.source} onChange={v => set('source', v)} options={SOURCES} />
        <input type="number" min={0} aria-label="Minimum salary" placeholder="Min salary" className="input h-9 w-28 text-[13px]" value={f.salaryMin} onChange={e => set('salaryMin', e.target.value)} />
        <DateFilter label="Applied" from={f.from} to={f.to} onChange={(a, b) => setF(s => ({ ...s, from: a, to: b }))} />
        <DateFilter label="Follow-up" from={f.fuFrom} to={f.fuTo} onChange={(a, b) => setF(s => ({ ...s, fuFrom: a, fuTo: b }))} />
      </FilterBar>
      {view === 'board' ? <KanbanBoard apps={filtered.map(r => r.a)} /> : (
        <DataTable label="Applications" rows={filtered} columns={columns} rowKey={r => r.a.id} onRowClick={r => nav(`/applications/${r.a.id}`)} defaultSort={{ key: 'date', dir: 'desc' }}
          empty={<EmptyState icon={Briefcase} title={active ? 'No applications match your filters' : 'No applications yet'} text={active ? 'Try removing a filter.' : 'Track your first application.'} action={active ? <button className="btn" onClick={clear}>Clear filters</button> : <button className="btn btn-primary" onClick={() => openForm({ kind: 'application' })}><Plus className="size-4" />Add application</button>} />}
          renderCard={({ a, co, fu }) => (
            <div>
              <div className="flex items-start gap-3"><Avatar name={co?.name ?? '?'} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{co?.name}</p><p className="truncate text-sm text-ink-600">{a.position}</p></div>
                <Menu label={`Actions for ${a.position}`} trigger={<MoreHorizontal className="size-4" />} items={menu(a)} /></div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5"><StageBadge stage={a.status} /><PriorityBadge priority={a.priority} />{fu && <Badge tone={fu.dueDate < today ? 'red' : 'neutral'}>{t('Follow-up')} {relDay(fu.dueDate)}</Badge>}</div>
              <p className="mt-2.5 text-xs text-ink-500">{a.location} · {salaryRange(a, locale)}{a.jobUrl && <> · <a href={a.jobUrl} onClick={e => e.stopPropagation()} target="_blank" rel="noopener noreferrer" className="text-brand-700">Job post <ExternalLink className="inline size-3" /></a></>}</p>
            </div>)} />
      )}
    </>
  )
}
