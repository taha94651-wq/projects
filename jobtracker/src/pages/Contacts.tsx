import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Contact as ContactIcon, Download, Mail, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { CONTACT_TYPES } from '@shared/constants'
import type { Contact } from '@shared/types'
import { useData } from '@/store'
import { deleteWithConfirm } from '@/actions'
import { openForm } from '@/ui-store'
import { downloadFile, toCsv } from '@/lib/csv'
import { agoDays } from '@/lib/dates'
import { lastContactDate } from '@/lib/derive'
import { Badge } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Menu } from '@/components/ui/Menu'
import { Avatar, EmptyState, FilterBar, FilterSelect, PageHeader, SearchInput } from '@/components/ui/misc'

export default function Contacts() {
  const data = useData(), nav = useNavigate()
  const [q, setQ] = useState(''); const [type, setType] = useState(''); const [company, setCompany] = useState('')
  const rows = useMemo(() => data.contacts.map(c => ({ c, co: data.companies.find(x => x.id === c.companyId), last: lastContactDate(data, { contactId: c.id }) })), [data])
  type Row = (typeof rows)[number]
  const filtered = rows.filter(({ c, co }) => (!type || c.type === type) && (!company || c.companyId === company) &&
    (!q.trim() || [c.name, c.email, c.position, c.notes, co?.name].some(x => x?.toLowerCase().includes(q.trim().toLowerCase()))))
  const active = !!(q || type || company)
  const menu = (c: Contact) => [
    { label: 'Edit', icon: <Pencil className="size-4" />, onSelect: () => openForm({ kind: 'contact', id: c.id }) },
    { label: 'Log interaction', icon: <Plus className="size-4" />, onSelect: () => openForm({ kind: 'activity', defaults: { companyId: c.companyId, contactId: c.id } }) },
    { label: 'Delete', icon: <Trash2 className="size-4" />, danger: true, divider: true, onSelect: () => void deleteWithConfirm('contacts', c.id, `"${c.name}"`) },
  ]
  const columns: Column<Row>[] = [
    { key: 'name', header: 'Name', sort: r => r.c.name, render: ({ c }) => <div className="flex min-w-44 items-center gap-3"><Avatar name={c.name} size="sm" /><div><Link to={`/contacts/${c.id}`} onClick={e => e.stopPropagation()} className="font-semibold hover:text-brand-800">{c.name}</Link>{c.position && <p className="text-xs text-ink-400">{c.position}</p>}</div></div> },
    { key: 'company', header: 'Company', sort: r => r.co?.name, render: ({ co }) => <span className="text-ink-700">{co?.name ?? '—'}</span> },
    { key: 'type', header: 'Type', sort: r => r.c.type, render: ({ c }) => <Badge>{c.type}</Badge> },
    { key: 'email', header: 'Email', sort: r => r.c.email, hideBelow: 'lg', render: ({ c }) => c.email ? <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()} className="text-brand-700 hover:underline">{c.email}</a> : '—' },
    { key: 'phone', header: 'Phone', hideBelow: 'xl', render: ({ c }) => c.phone || '—' },
    { key: 'last', header: 'Last contact', sort: r => r.last, render: ({ last }) => <span className="whitespace-nowrap text-ink-600">{last ? agoDays(last) : '—'}</span> },
    { key: 'actions', header: '', className: 'w-10', render: ({ c }) => <Menu label={`Actions for ${c.name}`} trigger={<MoreHorizontal className="size-4" />} items={menu(c)} /> },
  ]
  const exportCsv = () => downloadFile('contacts.csv', toCsv(filtered, [
    { header: 'Name', value: r => r.c.name }, { header: 'Company', value: r => r.co?.name }, { header: 'Position', value: r => r.c.position }, { header: 'Type', value: r => r.c.type },
    { header: 'Email', value: r => r.c.email }, { header: 'Phone', value: r => r.c.phone }, { header: 'LinkedIn', value: r => r.c.linkedin }, { header: 'Last contact', value: r => r.last }, { header: 'Notes', value: r => r.c.notes },
  ]))
  return (
    <>
      <PageHeader title="Contacts" subtitle={`${data.contacts.length} recruiters, HR and hiring managers`}
        actions={<><button className="btn" onClick={exportCsv} disabled={!filtered.length}><Download className="size-4" />Export CSV</button><button className="btn btn-primary" onClick={() => openForm({ kind: 'contact' })}><Plus className="size-4" />Add contact</button></>} />
      <FilterBar active={active} onClear={() => { setQ(''); setType(''); setCompany('') }}>
        <SearchInput label="Search contacts" placeholder="Search name, email, company…" value={q} onChange={setQ} />
        <FilterSelect label="Contact type" all="All types" value={type} onChange={setType} options={CONTACT_TYPES} />
        <FilterSelect label="Company" all="All companies" value={company} onChange={setCompany} options={[...data.companies].sort((a, b) => a.name.localeCompare(b.name)).map(c => ({ value: c.id, label: c.name }))} />
      </FilterBar>
      <DataTable label="Contacts" rows={filtered} columns={columns} rowKey={r => r.c.id} onRowClick={r => nav(`/contacts/${r.c.id}`)} defaultSort={{ key: 'name', dir: 'asc' }}
        empty={<EmptyState icon={ContactIcon} title={active ? 'No contacts match' : 'No contacts yet'} text="Keep every recruiter and hiring manager in one place." action={!active && <button className="btn btn-primary btn-sm" onClick={() => openForm({ kind: 'contact' })}>Add contact</button>} />}
        renderCard={({ c, co, last }) => (
          <div className="flex items-start gap-3"><Avatar name={c.name} /><div className="min-w-0 flex-1"><p className="font-semibold">{c.name}</p><p className="text-xs text-ink-500">{c.type} · {co?.name}</p>
            {c.email && <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-brand-700"><Mail className="size-3" />{c.email}</p>}<p className="mt-1 text-xs text-ink-400">Last contact {last ? agoDays(last) : '—'}</p></div>
            <Menu label={`Actions for ${c.name}`} trigger={<MoreHorizontal className="size-4" />} items={menu(c)} /></div>)} />
    </>
  )
}
