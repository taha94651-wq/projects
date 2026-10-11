import { t } from '@/i18n'
import { useMemo, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { COMPANY_TYPES, PRIORITIES, COMPANY_STATUSES, type CompanyType, type Priority, type CompanyStatus } from '@shared/constants'
import { buildTargetCompanies, TARGET_COUNT } from '@shared/targets'
import type { Company } from '@shared/types'
import { useStore } from '@/store'
import { toast, useUI } from '@/ui-store'
import { parseCsv } from '@/lib/csv'
import { FormModal } from './FormModal'
import { TextArea } from '../ui/fields'

const pick = <T extends string>(list: readonly T[], v: string | undefined, fallback: T): T => list.find(x => x.toLowerCase() === (v ?? '').trim().toLowerCase()) ?? fallback

/** Turns pasted text / CSV into company drafts. A plain list (one name per line) works; with a header row, columns are matched by name. */
export function parseCompanies(text: string): Omit<Company, 'id' | 'createdAt'>[] {
  const rows = parseCsv(text)
  if (!rows.length) return []
  const head = rows[0].map(h => h.trim().toLowerCase())
  const hasHeader = head.includes('name') || head.includes('company')
  const col = (...names: string[]) => head.findIndex(h => names.includes(h))
  const idx = { name: hasHeader ? col('name', 'company') : 0, type: col('type', 'company type'), industry: col('industry'), location: col('location', 'city'), website: col('website', 'url'), interests: col('interests'), priority: col('priority'), status: col('status'), notes: col('notes') }
  const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? '').trim() : '')
  return (hasHeader ? rows.slice(1) : rows).map(r => ({
    name: get(r, idx.name), type: pick<CompanyType>(COMPANY_TYPES, get(r, idx.type), 'Unclassified'), industry: get(r, idx.industry), location: get(r, idx.location), website: get(r, idx.website),
    priority: pick<Priority>(PRIORITIES, get(r, idx.priority), 'Medium'), status: pick<CompanyStatus>(COMPANY_STATUSES, get(r, idx.status), 'Target'),
    description: '', size: '', linkedin: '', interests: get(r, idx.interests).split(/[;|]/).map(x => x.trim()).filter(Boolean).join(','), notes: get(r, idx.notes), archived: false,
  })).filter(c => c.name)
}

export function ImportForm() {
  const close = useUI(s => s.closeForm)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const existing = useStore(s => s.data.companies)
  const parsed = useMemo(() => parseCompanies(text), [text])
  const names = new Set(existing.map(c => c.name.toLowerCase()))
  const fresh = parsed.filter((c, i) => !names.has(c.name.toLowerCase()) && parsed.findIndex(p => p.name.toLowerCase() === c.name.toLowerCase()) === i)

  const run = async () => {
    setBusy(true)
    try { await useStore.getState().addMany('companies', fresh); toast(parsed.length - fresh.length ? t('{n} companies imported · {d} duplicates skipped', { n: fresh.length, d: parsed.length - fresh.length }) : t('{n} companies imported', { n: fresh.length })); close() } catch { /* toast shown */ } finally { setBusy(false) }
  }
  return (
    <FormModal title="Import companies" description="Paste one company per line, or a CSV with a header row (name, type, location, website, priority, status, interests, notes)." onSubmit={e => { e?.preventDefault(); void run() }} busy={busy} submitLabel={fresh.length ? t('Import {n} companies', { n: fresh.length }) : t('Import')}>
      <TextArea label="Companies" rows={9} value={text} onChange={e => setText(e.target.value)} placeholder={'Al Noor Architecture\nRiyadh Design Studio\n…'} />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input ref={file} type="file" accept=".csv,.txt,text/csv,text/plain" hidden onChange={async e => { const f = e.target.files?.[0]; if (f) setText(await f.text()); e.target.value = '' }} />
        <button type="button" className="btn btn-sm" onClick={() => file.current?.click()}><Upload className="size-3.5" />Choose CSV file</button>
        <button type="button" className="btn btn-sm" onClick={() => setText(buildTargetCompanies().map(c => c.name).join('\n'))}>{t('Use my {n}-office target list', { n: TARGET_COUNT })}</button>
      </div>
      <p className="mt-3 text-[13px] text-ink-500" aria-live="polite">
        {parsed.length ? <><strong className="text-ink-800">{fresh.length}</strong> {t('new')} · {t('{n} already in your list', { n: parsed.length - fresh.length })}</> : t('Nothing to import yet.')}
      </p>
    </FormModal>
  )
}
