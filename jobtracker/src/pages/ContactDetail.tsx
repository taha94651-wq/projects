import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bell, History, Mail, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { useData } from '@/store'
import { deleteWithConfirm } from '@/actions'
import { openForm } from '@/ui-store'
import { agoDays } from '@/lib/dates'
import { lastContactDate } from '@/lib/derive'
import { hostname } from '@/lib/format'
import { Badge } from '@/components/ui/Badge'
import { Avatar, Dl, ExtLink, Section } from '@/components/ui/misc'
import { FollowUpCard } from '@/components/features/FollowUpCard'
import { Timeline } from '@/components/features/Timeline'

export default function ContactDetail() {
  const { id } = useParams(); const nav = useNavigate(); const data = useData()
  const c = data.contacts.find(x => x.id === id)
  if (!c) return <Navigate to="/contacts" replace />
  const co = data.companies.find(x => x.id === c.companyId)
  const acts = data.activities.filter(a => a.contactId === c.id)
  const fus = data.followUps.filter(f => f.contactId === c.id).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const last = lastContactDate(data, { contactId: c.id })
  return (
    <>
      <Link to="/contacts" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-500 hover:text-ink-900"><ArrowLeft className="size-3.5" />Contacts</Link>
      <header className="card mb-6 flex flex-wrap items-start gap-4 p-5 sm:p-6">
        <Avatar name={c.name} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="page-title !text-[2rem]">{c.name}</h1>
          <p className="mt-1 text-sm text-ink-600">{c.position && `${c.position} · `}<Link to={`/companies/${c.companyId}`} className="font-medium hover:text-brand-800 hover:underline">{co?.name}</Link></p>
          <div className="mt-3 flex flex-wrap items-center gap-2"><Badge tone="green">{c.type}</Badge><span className="text-xs text-ink-500">Last contact: {last ? agoDays(last) : 'never'}</span></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={() => openForm({ kind: 'contact', id: c.id })}><Pencil className="size-4" />Edit</button>
          <button className="btn text-danger-700 hover:bg-danger-50" onClick={async () => { if (await deleteWithConfirm('contacts', c.id, `"${c.name}"`)) nav('/contacts') }}><Trash2 className="size-4" />Delete</button>
        </div>
      </header>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Section title="Interaction history" icon={History} action={<button className="btn btn-sm" onClick={() => openForm({ kind: 'activity', defaults: { companyId: c.companyId, contactId: c.id } })}><Plus className="size-3.5" />Log interaction</button>}>
          <Timeline activities={acts} showApplication empty="No interactions logged with this contact yet." />
        </Section>
        <div className="space-y-6">
          <Section title="Contact details" icon={Mail}>
            <Dl items={[['Email', c.email ? <a className="text-brand-700 hover:underline" href={`mailto:${c.email}`}>{c.email}</a> : ''], ['Phone', c.phone ? <a className="text-brand-700 hover:underline" href={`tel:${c.phone}`}><Phone className="me-1 inline size-3" />{c.phone}</a> : ''], ['LinkedIn', c.linkedin ? <ExtLink href={c.linkedin}>{hostname(c.linkedin)}</ExtLink> : '']]} />
            {c.notes && <p className="mt-4 whitespace-pre-wrap rounded-lg bg-warn-50/70 px-3.5 py-3 text-sm text-ink-700">{c.notes}</p>}
          </Section>
          <Section title="Follow-ups" icon={Bell} action={<button className="btn btn-sm" onClick={() => openForm({ kind: 'followup', defaults: { companyId: c.companyId, contactId: c.id } })}><Plus className="size-3.5" />Add</button>}>
            {fus.length ? <div className="space-y-3">{fus.map(f => <FollowUpCard key={f.id} f={f} compact />)}</div> : <p className="text-sm text-ink-400">None scheduled.</p>}
          </Section>
        </div>
      </div>
    </>
  )
}
