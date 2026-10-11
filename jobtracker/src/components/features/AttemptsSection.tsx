import { t } from '@/i18n'
import { MoreHorizontal, Pencil, Plus, Send, Trash2 } from 'lucide-react'
import type { Attempt } from '@shared/types'
import type { AttemptResponse } from '@shared/constants'
import { useData, useLocale } from '@/store'
import { deleteWithConfirm } from '@/actions'
import { openForm } from '@/ui-store'
import { fmtDate } from '@/lib/dates'
import { Badge, type Tone } from '../ui/Badge'
import { Menu } from '../ui/Menu'
import { EmptyState, Section } from '../ui/misc'
import { METHOD_ICON } from '../forms/AttemptForm'

export const RESPONSE_TONE: Record<AttemptResponse, Tone> = { Waiting: 'amber', Replied: 'green', 'No reply': 'neutral', 'Wrong / bounced': 'red' }
export const sortAttempts = (list: Attempt[]) => [...list].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))

/** Where the attempt's contact value points: a mailto link, a WhatsApp chat, or plain text. */
function ContactValue({ a }: { a: Attempt }) {
  if (a.method === 'Email') return <a href={`mailto:${a.contact}`} className="break-all text-brand-700 hover:underline" dir="ltr">{a.contact}</a>
  if (a.method === 'WhatsApp') {
    const digits = a.contact.replace(/\D/g, '')
    return <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline" dir="ltr">{a.contact}</a>
  }
  return <span>{a.contact}</span>
}

export function AttemptsSection({ companyId }: { companyId: string }) {
  const data = useData(), locale = useLocale()
  const list = sortAttempts(data.attempts.filter(a => a.companyId === companyId))
  return (
    <Section title={t('Contact attempts ({n})', { n: list.length })} icon={Send} action={<button className="btn btn-sm" onClick={() => openForm({ kind: 'attempt', defaults: { companyId } })}><Plus className="size-3.5" />Add attempt</button>}>
      {list.length ? (
        <ol className="space-y-3" aria-label={t('Contact attempts')}>
          {list.map((a, i) => {
            const Icon = METHOD_ICON[a.method]
            return (
              <li key={a.id} className="rounded-xl border border-ink-200/80 p-3.5" data-testid="attempt">
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><Icon className="size-4" aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <strong className="text-[13.5px]">{t('Attempt {n}', { n: i + 1 })}</strong>
                      <Badge tone="solid">{a.method === 'WhatsApp' ? 'WhatsApp' : t(a.method)}</Badge>
                      {a.method === 'Email' && a.emailKind && <Badge tone="blue">{t(a.emailKind)}</Badge>}
                      <Badge tone={RESPONSE_TONE[a.response]}>{t(a.response)}</Badge>
                      <span className="text-xs text-ink-400">{fmtDate(a.date, locale, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <p className="mt-1 text-sm"><ContactValue a={a} />{(a.personName || a.role) && <span className="text-ink-500"> · {[a.personName, a.role ? t(a.role) : ''].filter(Boolean).join(' · ')}</span>}</p>
                  </div>
                  <Menu label={t('Attempt actions')} trigger={<MoreHorizontal className="size-4" />} items={[
                    { label: t('Edit'), icon: <Pencil className="size-4" />, onSelect: () => openForm({ kind: 'attempt', id: a.id }) },
                    { label: t('Delete'), icon: <Trash2 className="size-4" />, danger: true, divider: true, onSelect: () => void deleteWithConfirm('attempts', a.id, 'attempt') },
                  ]} />
                </div>
                {(a.reply || a.progress) && (
                  <dl className="mt-2.5 grid gap-2 text-[13px] sm:grid-cols-2">
                    {a.reply && <div className="rounded-lg bg-ink-50 px-3 py-2"><dt className="eyebrow mb-0.5">Their reply</dt><dd className="whitespace-pre-wrap text-ink-700">{a.reply}</dd></div>}
                    {a.progress && <div className="rounded-lg bg-brand-50/60 px-3 py-2"><dt className="eyebrow mb-0.5">Where I got with this</dt><dd className="whitespace-pre-wrap text-ink-700">{a.progress}</dd></div>}
                  </dl>
                )}
              </li>
            )
          })}
        </ol>
      ) : <EmptyState icon={Send} title="No attempts yet" text="Log each try — an email (HR or recruitment), a WhatsApp number, or anything else — and what came back." action={<button className="btn btn-primary btn-sm" onClick={() => openForm({ kind: 'attempt', defaults: { companyId } })}>Add attempt</button>} />}
    </Section>
  )
}
