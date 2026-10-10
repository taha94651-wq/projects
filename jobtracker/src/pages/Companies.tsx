import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Archive, ArchiveRestore, Building2, Download, ExternalLink, MoreHorizontal, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { COMPANY_STATUSES, COMPANY_TYPES, PRIORITIES, type Priority } from '@shared/constants'
import type { Company } from '@shared/types'
import { useData, useLocale } from '@/store'
import { deleteCompany, toggleArchive } from '@/actions'
import { openForm } from '@/ui-store'
import { downloadFile, toCsv } from '@/lib/csv'
import { agoDays, fmtDate, relDay, todayISO } from '@/lib/dates'
import { lastContactDate, nextFollowUp } from '@/lib/derive'
import { hostname } from '@/lib/format'
import { Badge, CompanyStatusBadge, cx, PriorityBadge } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Menu } from '@/components/ui/Menu'
import { Avatar, EmptyState, FilterBar, FilterSelect, PageHeader, SearchInput } from '@/components/ui/misc'

const PRIO: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 }

export default function Companies() {
  const data = useData(), locale = useLocale(), nav = useNavigate()
  const [q, setQ] = useState(''); const [type, setType] = useState(''); const [status, setStatus] = useState(''); const [priority, setPriority] = useState(''); const [location, setLocation] = useState(''); const [archived, setArchived] = useState(false)
  const today = todayISO()

  const rows = useMemo(() => data.companies.map(c => {
    const contacts = data.contacts.filter(x => x.companyId === c.id)
    return { c, contact: contacts.find(x => ['HR', 'Recruiter'].includes(x.type)) ?? contacts[0], last: lastContactDate(data, { companyId: c.id }), apps: data.applications.filter(a => a.companyId === c.id).length, fu: nextFollowUp(data, { companyId: c.id }) }
  }), [data])
  type Row = (typeof rows)[number]
  const locations = useMemo(() => [...new Set(data.companies.map(c => c.location.split(',').pop()?.trim()).filter(Boolean) as string[])].sort(), [data.companies])
  const filtered = rows.filter(({ c, contact }) => {
    if (!archived && c.archived) return false
    if (archived && !c.archived) return false
    if (type && c.type !== type) return false
    if (status && c.status !== status) return false
    if (priority && c.priority !== priority) return false
    if (location && !c.location.includes(location)) return false
    const s = q.trim().toLowerCase()
    return !s || [c.name, c.industry, c.location, c.website, c.notes, contact?.name].some(x => x?.toLowerCase().includes(s))
  })
  const active = !!(q || type || status || priority || location)
  const clear = () => { setQ(''); setType(''); setStatus(''); setPriority(''); setLocation('') }

  const exportCsv = () => downloadFile('companies.csv', toCsv(filtered, [
    { header: 'Company', value: r => r.c.name }, { header: 'Type', value: r => r.c.type }, { header: 'Industry', value: r => r.c.industry }, { header: 'Location', value: r => r.c.location },
    { header: 'Website', value: r => r.c.website }, { header: 'Priority', value: r => r.c.priority }, { header: 'Status', value: r => r.c.status }, { header: 'Contact', value: r => r.contact?.name },
    { header: 'Last contact', value: r => r.last }, { header: 'Applications', value: r => r.apps }, { header: 'Next follow-up', value: r => r.fu?.dueDate },
  ]))
  const menu = (c: Company) => [
    { label: 'Edit', icon: <Pencil className="size-4" />, onSelect: () => openForm({ kind: 'company', id: c.id }) },
    { label: 'Add application', icon: <Plus className="size-4" />, onSelect: () => openForm({ kind: 'application', defaults: { companyId: c.id } }) },
    { label: c.archived ? 'Restore' : 'Archive', icon: c.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />, onSelect: () => void toggleArchive(c) },
    { label: 'Delete', icon: <Trash2 className="size-4" />, danger: true, divider: true, onSelect: () => void deleteCompany(c) },
  ]

  const columns: Column<Row>[] = [
    { key: 'name', header: 'Company', sort: r => r.c.name, render: ({ c }) => (
      <div className="flex min-w-48 items-center gap-3"><Avatar name={c.name} /><div className="min-w-0"><Link to={`/companies/${c.id}`} onClick={e => e.stopPropagation()} className="block truncate font-semibold text-ink-900 hover:text-brand-800">{c.name}</Link>{c.archived && <Badge>Archived</Badge>}</div></div>) },
    { key: 'industry', header: 'Industry', sort: r => r.c.industry, hideBelow: 'xl', render: ({ c }) => <span className="text-ink-600">{c.industry || '—'}</span> },
    { key: 'location', header: 'Location', sort: r => r.c.location, render: ({ c }) => <span className="text-ink-600">{c.location || '—'}</span> },
    { key: 'website', header: 'Website', hideBelow: 'xl', render: ({ c }) => c.website ? <a href={c.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-brand-700 hover:underline">{hostname(c.website)}<ExternalLink className="size-3" /></a> : '—' },
    { key: 'type', header: 'Type', sort: r => r.c.type, render: ({ c }) => <Badge>{c.type}</Badge> },
    { key: 'priority', header: 'Priority', sort: r => PRIO[r.c.priority], render: ({ c }) => <PriorityBadge priority={c.priority} /> },
    { key: 'contact', header: 'Contact', sort: r => r.contact?.name, hideBelow: 'lg', render: ({ contact }) => contact ? <div><p className="text-ink-800">{contact.name}</p><p className="text-xs text-ink-400">{contact.type}</p></div> : '—' },
    { key: 'last', header: 'Last contact', sort: r => r.last, hideBelow: 'lg', render: ({ last }) => <span className="whitespace-nowrap text-ink-600">{last ? agoDays(last) : '—'}</span> },
    { key: 'apps', header: 'Apps', sort: r => r.apps, className: 'text-center', render: ({ apps }) => <span className="font-medium tabular-nums">{apps}</span> },
    { key: 'status', header: 'Status', sort: r => r.c.status, render: ({ c }) => <CompanyStatusBadge status={c.status} /> },
    { key: 'fu', header: 'Next follow-up', sort: r => r.fu?.dueDate, render: ({ fu }) => fu ? <span className={cx('whitespace-nowrap text-[13px]', fu.dueDate < today ? 'font-semibold text-danger-700' : 'text-ink-600')}>{fmtDate(fu.dueDate, locale, { day: 'numeric', month: 'short' })} <span className="text-ink-400">· {relDay(fu.dueDate)}</span></span> : '—' },
    { key: 'actions', header: '', className: 'w-10', render: ({ c }) => <Menu label={`Actions for ${c.name}`} trigger={<MoreHorizontal className="size-4" />} items={menu(c)} /> },
  ]
  const archivedCount = data.companies.filter(c => c.archived).length

  return (
    <>
      <PageHeader title="Companies" subtitle={`${data.companies.filter(c => !c.archived).length} offices and companies in your database`}
        actions={<>
          <button className="btn" onClick={() => openForm({ kind: 'import' })}><Upload className="size-4" />Import</button>
          <button className="btn" onClick={exportCsv} disabled={!filtered.length}><Download className="size-4" />Export CSV</button>
          <button className="btn btn-primary" onClick={() => openForm({ kind: 'company' })}><Plus className="size-4" />Add company</button>
        </>} />
      <FilterBar active={active} onClear={clear}>
        <SearchInput label="Search companies" placeholder="Search companies, contacts, notes…" value={q} onChange={setQ} />
        <FilterSelect label="Company type" all="All types" value={type} onChange={setType} options={COMPANY_TYPES} />
        <FilterSelect label="Status" all="All statuses" value={status} onChange={setStatus} options={COMPANY_STATUSES} />
        <FilterSelect label="Priority" all="All priorities" value={priority} onChange={setPriority} options={PRIORITIES} />
        <FilterSelect label="Location" all="All locations" value={location} onChange={setLocation} options={locations} />
        <label className="ms-auto inline-flex items-center gap-2 text-[13px] text-ink-600"><input type="checkbox" className="size-4 accent-brand-600" checked={archived} onChange={e => setArchived(e.target.checked)} />Archived ({archivedCount})</label>
      </FilterBar>
      <DataTable label="Companies" rows={filtered} columns={columns} rowKey={r => r.c.id} onRowClick={r => nav(`/companies/${r.c.id}`)} defaultSort={{ key: 'name', dir: 'asc' }}
        empty={<EmptyState icon={Building2} title={active ? 'No companies match your filters' : archived ? 'No archived companies' : 'No companies yet'} text={active ? 'Try removing a filter.' : 'Add the offices and companies you want to apply to.'} action={active ? <button className="btn" onClick={clear}>Clear filters</button> : <button className="btn btn-primary" onClick={() => openForm({ kind: 'company' })}><Plus className="size-4" />Add company</button>} />}
        renderCard={({ c, contact, apps, fu, last }) => (
          <div>
            <div className="flex items-start gap-3"><Avatar name={c.name} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{c.name}</p><p className="truncate text-xs text-ink-500">{c.type} · {c.location || 'No location'}</p></div>
              <Menu label={`Actions for ${c.name}`} trigger={<MoreHorizontal className="size-4" />} items={menu(c)} /></div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5"><CompanyStatusBadge status={c.status} /><PriorityBadge priority={c.priority} /><Badge>{apps} application{apps === 1 ? '' : 's'}</Badge></div>
            <p className="mt-2.5 text-xs text-ink-500">{contact ? `${contact.type}: ${contact.name} · ` : ''}Last contact {last ? agoDays(last) : '—'}{fu && ` · Follow-up ${relDay(fu.dueDate)}`}</p>
          </div>)} />
    </>
  )
}
