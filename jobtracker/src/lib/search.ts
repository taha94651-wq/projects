import { t, tDesc } from '@/i18n'
import type { Dataset } from '@shared/types'
import { byId } from './derive'

export interface SearchHit { kind: 'Company' | 'Application' | 'Contact' | 'Note'; id: string; title: string; subtitle: string; link: string }
const norm = (s: string) => s.toLowerCase()

export function globalSearch(d: Dataset, query: string, limit = 6): SearchHit[] {
  const q = norm(query.trim())
  if (!q) return []
  const has = (...fields: (string | null | undefined)[]) => fields.some(f => f && norm(f).includes(q))
  const cos = byId(d.companies), apps = byId(d.applications)
  const hits: SearchHit[] = []
  const add = (list: SearchHit[]) => hits.push(...list.slice(0, limit))

  add(d.companies.filter(c => has(c.name, c.industry, c.location, c.type, c.notes, c.description)).map(c => ({
    kind: 'Company', id: c.id, title: c.name, subtitle: `${t(c.type)} · ${c.location}${c.archived ? ` · ${t('archived')}` : ''}`, link: `/companies/${c.id}` })))
  add(d.applications.filter(a => has(a.position, a.department, a.location, a.notes, a.recruiter, cos.get(a.companyId)?.name)).map(a => ({
    kind: 'Application', id: a.id, title: a.position, subtitle: `${cos.get(a.companyId)?.name ?? ''} · ${t(a.status)}`, link: `/applications/${a.id}` })))
  add(d.contacts.filter(c => has(c.name, c.email, c.position, c.notes, cos.get(c.companyId)?.name)).map(c => ({
    kind: 'Contact', id: c.id, title: c.name, subtitle: `${t(c.type)} · ${cos.get(c.companyId)?.name ?? ''}`, link: `/contacts/${c.id}` })))
  add(d.activities.filter(a => has(a.description, a.notes)).map(a => {
    const app = a.applicationId ? apps.get(a.applicationId) : undefined
    return { kind: 'Note' as const, id: a.id, title: tDesc(a.description) || t(a.type), subtitle: `${t(a.type)} · ${cos.get(a.companyId ?? '')?.name ?? ''}`, link: app ? `/applications/${app.id}` : a.companyId ? `/companies/${a.companyId}` : '/' }
  }))
  return hits
}
