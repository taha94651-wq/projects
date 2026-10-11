import { t } from '@/i18n'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Lightbulb, Archive, ArchiveRestore, ArrowLeft, Bell, Briefcase, Contact, ExternalLink, Globe, History, MapPin, Pencil, Plus, Trash2, Users, Building2, Mail, Phone } from 'lucide-react'
import { useData, useLocale } from '@/store'
import { parseInterests } from '@/lib/interests'
import { deleteCompany, toggleArchive } from '@/actions'
import { openForm } from '@/ui-store'
import { agoDays, fmtDate } from '@/lib/dates'
import { lastContactDate, nextFollowUp } from '@/lib/derive'
import { hostname, salaryRange } from '@/lib/format'
import { Badge, CompanyStatusBadge, PriorityBadge, StageBadge } from '@/components/ui/Badge'
import { Avatar, Dl, EmptyState, ExtLink, Section } from '@/components/ui/misc'
import { Timeline } from '@/components/features/Timeline'
import { AttemptsSection } from '@/components/features/AttemptsSection'
import { SuggestionsList, useSuggestions } from '@/components/features/SuggestionsPanel'
import { FollowUpCard } from '@/components/features/FollowUpCard'

export default function CompanyDetail() {
  const { id } = useParams(); const nav = useNavigate()
  const data = useData(), locale = useLocale()
  const c = data.companies.find(x => x.id === id)
  if (!c) return <Navigate to="/companies" replace />
  const contacts = data.contacts.filter(x => x.companyId === c.id)
  const apps = data.applications.filter(a => a.companyId === c.id)
  const acts = data.activities.filter(a => a.companyId === c.id)
  const fus = data.followUps.filter(f => f.companyId === c.id && f.status === 'Pending').sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const { items: tips, snooze } = useSuggestions({ companyId: c.id })
  const last = lastContactDate(data, { companyId: c.id }); const next = nextFollowUp(data, { companyId: c.id })

  return (
    <>
      <Link to="/companies" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-500 hover:text-ink-900"><ArrowLeft className="size-3.5 rtl:-scale-x-100" />Companies</Link>
      <header className="card mb-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={c.name} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h1 className="page-title !text-[2rem]">{c.name}</h1>{c.archived && <Badge>{t('Archived')}</Badge>}</div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-600">
              {c.location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-ink-400" />{c.location}</span>}
              {c.industry && <span className="inline-flex items-center gap-1.5"><Building2 className="size-3.5 text-ink-400" />{c.industry}</span>}
              {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-brand-700 hover:underline"><Globe className="size-3.5" />{hostname(c.website)}</a>}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5"><CompanyStatusBadge status={c.status} /><PriorityBadge priority={c.priority} /><Badge tone={c.type === 'Unclassified' ? 'amber' : 'green'}>{t(c.type)}</Badge>{parseInterests(c.interests).map(i => <Badge key={i}>{t(i)}</Badge>)}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={() => openForm({ kind: 'company', id: c.id })}><Pencil className="size-4" />Edit</button>
            <button className="btn" onClick={() => void toggleArchive(c)}>{c.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}{c.archived ? t('Restore') : t('Archive')}</button>
            <button className="btn text-danger-700 hover:bg-danger-50" onClick={async () => { if (await deleteCompany(c)) nav('/companies') }}><Trash2 className="size-4" />Delete</button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <Section title="Overview" icon={Building2}>
            <Dl items={[['Company size', c.size ? t('{n} employees', { n: c.size }) : ''], ['Last contact', last ? agoDays(last) : t('Never')], ['Next follow-up', next ? fmtDate(next.dueDate, locale) : ''],
              ['Website', c.website ? <ExtLink href={c.website}>{hostname(c.website)} <ExternalLink className="inline size-3" /></ExtLink> : ''], ['LinkedIn', c.linkedin ? <ExtLink href={c.linkedin}>Company page</ExtLink> : ''], ['Added', fmtDate(c.createdAt.slice(0, 10), locale)]]} />
            {c.description && <p className="mt-4 text-sm leading-relaxed text-ink-600">{c.description}</p>}
            {c.notes && <div className="mt-4 rounded-lg bg-warn-50/70 px-3.5 py-3"><p className="eyebrow mb-1 text-warn-700">Notes</p><p className="whitespace-pre-wrap text-sm text-ink-700">{c.notes}</p></div>}
          </Section>

          {tips.length > 0 && <Section title="Suggestions" icon={Lightbulb}><SuggestionsList items={tips} onSnooze={snooze} /></Section>}

          <AttemptsSection companyId={c.id} />

          <Section title={t('Applications ({n})', { n: apps.length })} icon={Briefcase} flush action={<button className="btn btn-sm" onClick={() => openForm({ kind: 'application', defaults: { companyId: c.id } })}><Plus className="size-3.5" />Add</button>}>
            {apps.length ? (
              <ul className="divide-y divide-ink-100 border-t border-ink-100">
                {apps.map(a => <li key={a.id}><Link to={`/applications/${a.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3.5 hover:bg-ink-50">
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{a.position}</p><p className="text-xs text-ink-500">{a.applicationDate ? t('Applied {date}', { date: fmtDate(a.applicationDate, locale) }) : t('Not applied yet')} · {salaryRange(a, locale)}</p></div>
                  <PriorityBadge priority={a.priority} /><StageBadge stage={a.status} /></Link></li>)}
              </ul>
            ) : <EmptyState icon={Briefcase} title="No applications yet" action={<button className="btn btn-primary btn-sm" onClick={() => openForm({ kind: 'application', defaults: { companyId: c.id } })}>Add application</button>} />}
          </Section>

          <Section title="Activity timeline" icon={History} action={<button className="btn btn-sm" onClick={() => openForm({ kind: 'activity', defaults: { companyId: c.id } })}><Plus className="size-3.5" />Log activity</button>}>
            <Timeline activities={acts} showApplication empty="No activity yet. Log an email, call, WhatsApp or LinkedIn message." />
          </Section>
        </div>

        <div className="space-y-6">
          <Section title={t('Contacts ({n})', { n: contacts.length })} icon={Users} flush action={<button className="btn btn-sm" onClick={() => openForm({ kind: 'contact', defaults: { companyId: c.id } })}><Plus className="size-3.5" />Add</button>}>
            {contacts.length ? (
              <ul className="divide-y divide-ink-100 border-t border-ink-100">
                {contacts.map(p => (
                  <li key={p.id} className="flex items-start gap-3 px-5 py-3.5">
                    <Avatar name={p.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/contacts/${p.id}`} className="block truncate text-sm font-medium hover:text-brand-800">{p.name}</Link>
                      <p className="text-xs text-ink-500">{t(p.type)}{p.position && ` · ${p.position}`}</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-xs">
                        {p.email && <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1 text-brand-700 hover:underline"><Mail className="size-3" />{p.email}</a>}
                        {p.phone && <a href={`tel:${p.phone}`} className="inline-flex items-center gap-1 text-brand-700 hover:underline"><Phone className="size-3" />{p.phone}</a>}
                      </div>
                    </div>
                  </li>))}
              </ul>
            ) : <EmptyState icon={Contact} title="No contacts yet" text="Add HR, recruiters and hiring managers." />}
          </Section>
          <Section title="Pending follow-ups" icon={Bell} action={<button className="btn btn-sm" onClick={() => openForm({ kind: 'followup', defaults: { companyId: c.id } })}><Plus className="size-3.5" />Add</button>}>
            {fus.length ? <div className="space-y-3">{fus.map(f => <FollowUpCard key={f.id} f={f} compact />)}</div> : <p className="text-sm text-ink-400">Nothing scheduled.</p>}
          </Section>
        </div>
      </div>
    </>
  )
}
