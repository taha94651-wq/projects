import { t } from '@/i18n'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Archive, ArchiveRestore, Scale, Building2, Download, ExternalLink, MoreHorizontal, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { COMPANY_STATUSES, COMPANY_TYPES, PRIORITIES, type CompanyType, type Priority } from '@shared/constants'
import type { Company } from '@shared/types'
import { useData, useLocale, useStore } from '@/store'
import { interestOptions, parseInterests } from '@/lib/interests'
import { deleteCompany, toggleArchive } from '@/actions'
import { openForm, toast } from '@/ui-store'
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
  const [params] = useSearchParams()
  const [q, setQ] = useState(''); const [type, setType] = useState(params.get('category') ?? ''); const [status, setStatus] = useState(''); const [priority, setPriority] = useState(''); const [location, setLocation] = useState(''); const [archived, setArchived] = useState(false); const [interest, setInterest] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())
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
    if (interest && !parseInterests(c.interests).includes(interest)) return false
    const s = q.trim().toLowerCase()
    return !s || [c.name, c.industry, c.location, c.website, c.notes, contact?.name].some(x => x?.toLowerCase().includes(s))
  })
  const active = !!(q || type || status || priority || location || interest)
  const clear = () => { setQ(''); setType(''); setStatus(''); setPriority(''); setLocation(''); setInterest('') }
  const allInterests = useMemo(() => interestOptions(data.companies.flatMap(c => parseInterests(c.interests))), [data.companies])
  const bulk = async (changes: Partial<Company>, what: string) => {
    const ids = [...sel]
    await Promise.all(ids.map(id => useStore.getState().patch('companies', id, changes)))
    toast(t('{n} companies updated', { n: ids.length }) + ` · ${what}`)
  }

  const exportCsv = () => downloadFile('companies.csv', toCsv(filtered, [
    { header: 'Company', value: r => r.c.name }, { header: 'Category', value: r => r.c.type }, { header: 'Interests', value: r => parseInterests(r.c.interests).join(' | ') }, { header: 'Industry', value: r => r.c.industry }, { header: 'Location', value: r => r.c.location },
    { header: 'Website', value: r => r.c.website }, { header: 'Priority', value: r => r.c.priority }, { header: 'Status', value: r => r.c.status }, { header: 'Contact', value: r => r.contact?.name },
    { header: 'Last contact', value: r => r.last }, { header: 'Applications', value: r => r.apps }, { header: 'Next follow-up', value: r => r.fu?.dueDate },
  ]))
  const menu = (c: Company) => [
    { label: 'Edit', icon: <Pencil className="size-4" />, onSelect: () => openForm({ kind: 'company', id: c.id }) },
    { label: 'Add application', icon: <Plus className="size-4" />, onSelect: () => openForm({ kind: 'application', defaults: { companyId: c.id } }) },
    { label: c.archived ? t('Restore') : t('Archive'), icon: c.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />, onSelect: () => void toggleArchive(c) },
    { label: 'Delete', icon: <Trash2 className="size-4" />, danger: true, divider: true, onSelect: () => void deleteCompany(c) },
  ]

  const columns: Column<Row>[] = [
    { key: 'name', header: 'Company', sort: r => r.c.name, render: ({ c }) => (
      <div className="flex min-w-48 items-center gap-3"><Avatar name={c.name} /><div className="min-w-0"><Link to={`/companies/${c.id}`} onClick={e => e.stopPropagation()} className="block truncate font-semibold text-ink-900 hover:text-brand-800">{c.name}</Link>{c.archived && <Badge>{t('Archived')}</Badge>}</div></div>) },
    { key: 'industry', header: 'Industry', sort: r => r.c.industry, hideBelow: 'xl', render: ({ c }) => <span className="text-ink-600">{c.industry || '—'}</span> },
    { key: 'location', header: 'Location', sort: r => r.c.location, render: ({ c }) => <span className="text-ink-600">{c.location || '—'}</span> },
    { key: 'website', header: 'Website', hideBelow: 'xl', render: ({ c }) => c.website ? <a href={c.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-brand-700 hover:underline">{hostname(c.website)}<ExternalLink className="size-3" /></a> : '—' },
    { key: 'type', header: 'Category', sort: r => r.c.type, render: ({ c }) => <Badge tone={c.type === 'Unclassified' ? 'amber' : c.type === 'Developer' ? 'blue' : c.type === 'Design' ? 'green' : 'solid'}>{t(c.type)}</Badge> },
    { key: 'interests', header: 'Interests', hideBelow: '2xl', render: ({ c }) => <div className="flex max-w-56 flex-wrap gap-1">{parseInterests(c.interests).map(i => <Badge key={i}>{t(i)}</Badge>)}{!c.interests && <span className="text-ink-300">—</span>}</div> },
    { key: 'priority', header: 'Priority', sort: r => PRIO[r.c.priority], render: ({ c }) => <PriorityBadge priority={c.priority} /> },
    { key: 'contact', header: 'Contact', sort: r => r.contact?.name, hideBelow: 'lg', render: ({ contact }) => contact ? <div><p className="text-ink-800">{contact.name}</p><p className="text-xs text-ink-400">{t(contact.type)}</p></div> : '—' },
    { key: 'last', header: 'Last contact', sort: r => r.last, hideBelow: 'lg', render: ({ last }) => <span className="whitespace-nowrap text-ink-600">{last ? agoDays(last) : '—'}</span> },
    { key: 'apps', header: 'Apps', sort: r => r.apps, className: 'text-center', render: ({ apps }) => <span className="font-medium tabular-nums">{apps}</span> },
    { key: 'status', header: 'Status', sort: r => r.c.status, render: ({ c }) => <CompanyStatusBadge status={c.status} /> },
    { key: 'fu', header: 'Next follow-up', sort: r => r.fu?.dueDate, render: ({ fu }) => fu ? <span className={cx('whitespace-nowrap text-[13px]', fu.dueDate < today ? 'font-semibold text-danger-700' : 'text-ink-600')}>{fmtDate(fu.dueDate, locale, { day: 'numeric', month: 'short' })} <span className="text-ink-400">· {relDay(fu.dueDate)}</span></span> : '—' },
    { key: 'actions', header: '', className: 'w-10', render: ({ c }) => <Menu label={`Actions for ${c.name}`} trigger={<MoreHorizontal className="size-4" />} items={menu(c)} /> },
  ]
  const archivedCount = data.companies.filter(c => c.archived).length

  return (
    <>
      <PageHeader title="Companies" subtitle={t('{n} offices and companies in your database', { n: data.companies.filter(c => !c.archived).length })}
        actions={<>
          <button className="btn" onClick={() => openForm({ kind: 'import' })}><Upload className="size-4" />Import</button>
          <button className="btn" onClick={exportCsv} disabled={!filtered.length}><Download className="size-4" />Export CSV</button>
          <button className="btn btn-primary" onClick={() => openForm({ kind: 'company' })}><Plus className="size-4" />Add company</button>
        </>} />
      <FilterBar active={active} onClear={clear}>
        <SearchInput label="Search companies" placeholder="Search companies, contacts, notes…" value={q} onChange={setQ} />
        <FilterSelect label="Category" all="All categories" value={type} onChange={setType} options={COMPANY_TYPES} />
        <FilterSelect label="Interests" all="All interests" value={interest} onChange={setInterest} options={allInterests} />
        <FilterSelect label="Status" all="All statuses" value={status} onChange={setStatus} options={COMPANY_STATUSES} />
        <FilterSelect label="Priority" all="All priorities" value={priority} onChange={setPriority} options={PRIORITIES} />
        <FilterSelect label="Location" all="All locations" value={location} onChange={setLocation} options={locations} />
        <label className="ms-auto inline-flex items-center gap-2 text-[13px] text-ink-600"><input type="checkbox" className="size-4 accent-brand-600" checked={archived} onChange={e => setArchived(e.target.checked)} />{t('Archived')} ({archivedCount})</label>
      </FilterBar>
      {sel.size > 0 && (
        <div className="sticky top-[calc(4rem+env(safe-area-inset-top,0px))] z-10 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-brand-300 bg-brand-50 px-3 py-2.5 shadow-card" role="region" aria-label={t('Bulk actions')}>
          <strong className="text-sm text-brand-900">{t('{n} selected', { n: sel.size })}</strong>
          <select aria-label={t('Set category')} className="input h-8 w-auto py-0 text-[13px]" value="" onChange={e => { if (e.target.value) void bulk({ type: e.target.value as CompanyType }, t(e.target.value)) }}>
            <option value="">{t('Set category…')}</option>{COMPANY_TYPES.map(o => <option key={o} value={o}>{t(o)}</option>)}
          </select>
          <select aria-label={t('Set priority')} className="input h-8 w-auto py-0 text-[13px]" value="" onChange={e => { if (e.target.value) void bulk({ priority: e.target.value as Priority }, t(e.target.value)) }}>
            <option value="">{t('Set priority…')}</option>{PRIORITIES.map(o => <option key={o} value={o}>{t(o)}</option>)}
          </select>
          <select aria-label={t('Add interest')} className="input h-8 w-auto py-0 text-[13px]" value="" onChange={e => { const i = e.target.value; if (!i) return; void Promise.all([...sel].map(id => { const c = data.companies.find(x => x.id === id)!; return useStore.getState().patch('companies', id, { interests: [...new Set([...parseInterests(c.interests), i])].join(',') }) })).then(() => toast(t('{n} companies updated', { n: sel.size }) + ` · ${t(i)}`)) }}>
            <option value="">{t('Add interest…')}</option>{allInterests.map(o => <option key={o} value={o}>{t(o)}</option>)}
          </select>
          <button className="btn btn-sm btn-primary" disabled={sel.size < 2 || sel.size > 4} title={sel.size < 2 || sel.size > 4 ? t('Select 2 to 4 companies to compare') : undefined} onClick={() => nav(`/compare?ids=${[...sel].join(',')}`)}><Scale className="size-3.5" />{t('Compare')}</button>
          <button className="btn btn-sm btn-ghost ms-auto" onClick={() => setSel(new Set())}>{t('Clear selection')}</button>
        </div>
      )}
      <DataTable label="Companies" selection={{ ids: sel, onChange: setSel }} rows={filtered} columns={columns} rowKey={r => r.c.id} onRowClick={r => nav(`/companies/${r.c.id}`)} defaultSort={{ key: 'name', dir: 'asc' }}
        empty={<EmptyState icon={Building2} title={active ? 'No companies match your filters' : archived ? 'No archived companies' : 'No companies yet'} text={active ? 'Try removing a filter.' : 'Add the offices and companies you want to apply to.'} action={active ? <button className="btn" onClick={clear}>Clear filters</button> : <button className="btn btn-primary" onClick={() => openForm({ kind: 'company' })}><Plus className="size-4" />Add company</button>} />}
        renderCard={({ c, contact, apps, fu, last }) => (
          <div>
            <div className="flex items-start gap-3"><input type="checkbox" aria-label={t('Select row')} className="mt-2 size-4 accent-brand-600" checked={sel.has(c.id)} onClick={e => e.stopPropagation()} onChange={e => setSel(p => { const n = new Set(p); e.target.checked ? n.add(c.id) : n.delete(c.id); return n })} /><Avatar name={c.name} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{c.name}</p><p className="truncate text-xs text-ink-500">{t(c.type)} · {c.location || t('No location')}</p></div>
              <Menu label={`Actions for ${c.name}`} trigger={<MoreHorizontal className="size-4" />} items={menu(c)} /></div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5"><CompanyStatusBadge status={c.status} /><PriorityBadge priority={c.priority} /><Badge>{t(apps === 1 ? '{n} application' : '{n} applications', { n: apps })}</Badge></div>
            <p className="mt-2.5 text-xs text-ink-500">{contact ? `${t(contact.type)}: ${contact.name} · ` : ''}{t('Last contact')} {last ? agoDays(last) : '—'}{fu && ` · ${t('Follow-up')} ${relDay(fu.dueDate)}`}</p>
          </div>)} />
    </>
  )
}
