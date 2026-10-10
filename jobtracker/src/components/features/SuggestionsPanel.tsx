import { t, tDays } from '@/i18n'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellOff, Check, Copy, MessageSquareText } from 'lucide-react'
import { useData, useLocale, useStore } from '@/store'
import { openForm, toast } from '@/ui-store'
import { buildSuggestions, summarise, type Severity, type Suggestion } from '@/lib/advisor'
import { defaultDraftLang, draftText, type DraftLang } from '@/lib/drafts'
import { diffDays, fmtDate, todayISO } from '@/lib/dates'
import { cx } from '../ui/Badge'
import { EmptyState, Segmented } from '../ui/misc'

const SNOOZE_KEY = 'pipeline-snoozed-suggestions'
const SNOOZE_DAYS = 7
const readSnoozed = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(SNOOZE_KEY) ?? '{}') } catch { return {} } }

const SEV: Record<Severity, { label: string; dot: string; chip: string }> = {
  high: { label: 'Do now', dot: 'bg-danger-500', chip: 'bg-danger-50 text-danger-700' },
  medium: { label: 'Soon', dot: 'bg-warn-500', chip: 'bg-warn-50 text-warn-700' },
  low: { label: 'When you can', dot: 'bg-info-500', chip: 'bg-info-50 text-info-700' },
}

/** Suggestions for the current data, minus any the user has hidden for a week. `all` skips the collapsing of outreach items. */
export function useSuggestions(opts: { companyId?: string; all?: boolean } = {}) {
  const data = useData(), staleDays = useStore(s => s.settings.staleDays), me = useStore(s => s.user?.name ?? '')
  const [snoozed, setSnoozed] = useState(readSnoozed)
  const today = todayISO()
  const raw = useMemo(() => buildSuggestions(data, staleDays, me), [data, staleDays, me])
  const visible = useMemo(() => {
    const list = opts.companyId ? raw.filter(s => s.companyId === opts.companyId) : opts.all ? raw : summarise(raw)
    return list.filter(s => !snoozed[s.id] || diffDays(today, snoozed[s.id]) >= SNOOZE_DAYS)
  }, [raw, snoozed, opts.companyId, opts.all, today])
  const snooze = (id: string) => {
    const next = { ...snoozed, [id]: today }
    setSnoozed(next)
    try { localStorage.setItem(SNOOZE_KEY, JSON.stringify(next)) } catch { /* private mode */ }
    toast(t('Hidden for {days}', { days: tDays(SNOOZE_DAYS) }), 'info')
  }
  return { items: visible, snooze }
}

function Draft({ s }: { s: Suggestion }) {
  const locale = useLocale()
  const me = useStore(st => st.user?.name ?? '')
  const company = s.draft!.vars.company
  const [lang, setLang] = useState<DraftLang>(() => defaultDraftLang(company))
  const vars = { ...s.draft!.vars, me, date: s.draft!.vars.date ? fmtDate(s.draft!.vars.date, lang === 'ar' ? 'ar-EG' : 'en-GB') : '' }
  const text = draftText(s.draft!.kind, vars, lang)
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); toast(t('Message copied')) }
    catch { toast(t('Select the text and copy it'), 'info') }
  }
  void locale
  return (
    <div className="mt-3 rounded-xl border border-ink-200 bg-ink-50/60 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Segmented label="Message language" value={lang} onChange={setLang} options={[{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }]} />
        <button className="btn btn-sm" onClick={() => void copy()}><Copy className="size-3.5" />{t('Copy message')}</button>
      </div>
      <textarea readOnly dir={lang === 'ar' ? 'rtl' : 'ltr'} lang={lang} aria-label={t('Draft message')} rows={8} className="input font-sans text-[13px] leading-relaxed" value={text} onFocus={e => e.currentTarget.select()} />
      <p className="mt-1.5 text-xs text-ink-400">{t('Edit the details before sending — add the attachment and the name if you know it.')}</p>
    </div>
  )
}

export function SuggestionCard({ s, onSnooze }: { s: Suggestion; onSnooze: (id: string) => void }) {
  const [showDraft, setShowDraft] = useState(false)
  const sev = SEV[s.severity]
  return (
    <article className="rounded-xl border border-ink-200/80 bg-surface p-4" data-testid="suggestion" data-severity={s.severity}>
      <div className="flex items-start gap-3">
        <span className={cx('mt-1.5 size-2.5 shrink-0 rounded-full', sev.dot)} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14px] font-semibold text-ink-900">{s.title}</h3>
            <span className={cx('badge', sev.chip)}>{t(sev.label)}</span>
          </div>
          <p className="mt-1 text-[13px] text-ink-500">{s.why}</p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-800"><strong className="font-semibold">{t('What to do')}: </strong>{s.action}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {s.cta && <button className="btn btn-primary btn-sm" onClick={() => openForm({ kind: s.cta!.form, id: s.cta!.id, defaults: s.cta!.defaults })}>{s.cta.label}</button>}
            {s.link && <Link to={s.link.to} className="btn btn-sm">{s.link.label}</Link>}
            {s.draft && <button className="btn btn-sm" aria-expanded={showDraft} onClick={() => setShowDraft(v => !v)}><MessageSquareText className="size-3.5" />{t('Draft message')}</button>}
            <button className="btn btn-ghost btn-sm ms-auto text-ink-500" onClick={() => onSnooze(s.id)} title={t('Hide for {days}', { days: tDays(SNOOZE_DAYS) })}><BellOff className="size-3.5" />{t('Hide')}</button>
          </div>
          {showDraft && s.draft && <Draft s={s} />}
        </div>
      </div>
    </article>
  )
}

export function SuggestionsList({ items, onSnooze, limit }: { items: Suggestion[]; onSnooze: (id: string) => void; limit?: number }) {
  const shown = limit ? items.slice(0, limit) : items
  if (!shown.length) return <EmptyState icon={Check} title="Nothing to suggest right now" text="You are on top of things. New suggestions appear as your data changes." />
  return <div className="space-y-3">{shown.map(s => <SuggestionCard key={s.id} s={s} onSnooze={onSnooze} />)}</div>
}
