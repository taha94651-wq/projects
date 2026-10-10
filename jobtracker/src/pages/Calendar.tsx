import { t } from '@/i18n'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CalendarClock, ChevronLeft, ChevronRight, Flag, MessagesSquare, Sparkles } from 'lucide-react'
import { useData, useLocale } from '@/store'
import { openForm } from '@/ui-store'
import { addDays, addMonths, fmtDate, fmtMonthYear, fmtTime, parseISO, startOfMonth, startOfWeek, todayISO } from '@/lib/dates'
import { cx } from '@/components/ui/Badge'
import { EmptyState, PageHeader, Segmented } from '@/components/ui/misc'

export type EventKind = 'interview' | 'followup' | 'deadline' | 'event'
interface CalEvent { id: string; date: string; time?: string; kind: EventKind; title: string; sub: string; muted?: boolean; open: () => void }

const KIND: Record<EventKind, { label: string; pill: string; dot: string; icon: typeof Bell }> = {
  interview: { label: 'Interviews', pill: 'bg-warn-50 text-warn-700 border-warn-500/30', dot: 'bg-warn-500', icon: MessagesSquare },
  followup: { label: 'Follow-ups', pill: 'bg-brand-50 text-brand-800 border-brand-300/60', dot: 'bg-brand-500', icon: Bell },
  deadline: { label: 'Deadlines', pill: 'bg-danger-50 text-danger-700 border-danger-500/30', dot: 'bg-danger-500', icon: Flag },
  event: { label: 'Recruitment events', pill: 'bg-info-50 text-info-700 border-info-500/30', dot: 'bg-info-500', icon: Sparkles },
}
const weekStartFor = (locale: string) => (locale.startsWith('ar') ? 6 : locale === 'en-US' ? 0 : 1)

function useEvents(kinds: EventKind[]): CalEvent[] {
  const data = useData(), nav = useNavigate()
  return useMemo(() => {
    const cos = new Map(data.companies.map(c => [c.id, c.name])), apps = new Map(data.applications.map(a => [a.id, a]))
    const out: CalEvent[] = []
    for (const i of data.interviews) {
      if (i.status === 'Cancelled') continue
      const a = apps.get(i.applicationId)
      out.push({ id: `i${i.id}`, date: i.date, time: i.time, kind: 'interview', title: `${t(i.type)} · ${cos.get(a?.companyId ?? '') ?? ''}`, sub: a?.position ?? '', muted: ['Completed', 'Passed', 'Failed'].includes(i.status), open: () => openForm({ kind: 'interview', id: i.id }) })
    }
    for (const f of data.followUps) {
      if (f.status === 'Skipped') continue
      const a = f.applicationId ? apps.get(f.applicationId) : undefined
      out.push({ id: `f${f.id}`, date: f.dueDate, kind: 'followup', title: `${t('Follow up')} · ${cos.get(a?.companyId ?? f.companyId ?? '') ?? ''}`, sub: `${t(f.type)}${a ? ` · ${a.position}` : ''}`, muted: f.status === 'Completed', open: () => openForm({ kind: 'followup', id: f.id }) })
    }
    for (const a of data.applications) {
      if (a.deadline && a.status === 'Wishlist') out.push({ id: `d${a.id}`, date: a.deadline, kind: 'deadline', title: `${t('Deadline')} · ${cos.get(a.companyId) ?? ''}`, sub: a.position, open: () => nav(`/applications/${a.id}`) })
    }
    for (const ac of data.activities) {
      const important = ac.type === 'Applied' || ac.type === 'Offer' || ['Rejected', 'Accepted', 'Withdrawn'].includes(ac.toStage)
      if (!important || !ac.applicationId) continue
      const a = apps.get(ac.applicationId)
      out.push({ id: `e${ac.id}`, date: ac.date, kind: 'event', title: ac.toStage && ac.type === 'Stage change' ? `${t(ac.toStage)} · ${cos.get(a?.companyId ?? '') ?? ''}` : `${t(ac.type === 'Offer' ? 'Offer' : 'Applied')} · ${cos.get(a?.companyId ?? '') ?? ''}`, sub: a?.position ?? '', muted: true, open: () => nav(`/applications/${ac.applicationId}`) })
    }
    return out.filter(e => kinds.includes(e.kind)).sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
  }, [data, kinds, nav])
}

function Pill({ e, locale, full }: { e: CalEvent; locale: string; full?: boolean }) {
  const K = KIND[e.kind]
  return (
    <button onClick={ev => { ev.stopPropagation(); e.open() }} title={`${e.title}${e.sub ? ` — ${e.sub}` : ''}`}
      className={cx('flex w-full items-start gap-1.5 truncate rounded-md border px-1.5 py-1 text-start text-[11.5px] leading-tight font-medium hover:brightness-95', K.pill, e.muted && 'opacity-60')}>
      <K.icon className="mt-px size-3 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">{e.time && <span className="opacity-70">{fmtTime(e.time, locale)} </span>}<span className="truncate">{e.title}</span>{full && e.sub && <span className="block truncate font-normal opacity-80">{e.sub}</span>}</span>
    </button>
  )
}

export function CalendarView({ kinds: allowed = ['interview', 'followup', 'deadline', 'event'] }: { kinds?: EventKind[] }) {
  const locale = useLocale()
  const today = todayISO()
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>('month')
  const [cursor, setCursor] = useState(today)
  const [shown, setShown] = useState<EventKind[]>(allowed)
  const events = useEvents(shown)
  const ws = weekStartFor(locale)
  const byDate = useMemo(() => { const m = new Map<string, CalEvent[]>(); for (const e of events) m.set(e.date, [...(m.get(e.date) ?? []), e]); return m }, [events])
  const step = (dir: -1 | 1) => setCursor(c => view === 'month' ? addMonths(c, dir) : view === 'week' ? addDays(c, 7 * dir) : addDays(c, (view === 'agenda' ? 30 : 1) * dir))
  const title = view === 'month' ? fmtMonthYear(cursor, locale) : view === 'day' ? fmtDate(cursor, locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : view === 'week' ? `${fmtDate(startOfWeek(cursor, ws), locale, { day: 'numeric', month: 'short' })} – ${fmtDate(addDays(startOfWeek(cursor, ws), 6), locale, { day: 'numeric', month: 'short', year: 'numeric' })}`
    : t('From {date}', { date: fmtDate(cursor, locale, { day: 'numeric', month: 'short' }) })
  const dayNames = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(parseISO(addDays(startOfWeek('2026-10-10', ws), i))))
  const go = (d: string) => { setCursor(d); setView('day') }

  const monthStart = startOfWeek(startOfMonth(cursor), ws)
  const monthDays = Array.from({ length: 42 }, (_, i) => addDays(monthStart, i))
  const rows = monthDays[35].slice(0, 7) !== cursor.slice(0, 7) && parseISO(monthDays[35]).getMonth() !== parseISO(cursor).getMonth() ? 5 : 6
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor, ws), i))
  const agenda = [...byDate.entries()].filter(([d]) => d >= cursor && d <= addDays(cursor, 60))

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <button className="btn btn-icon" onClick={() => step(-1)} aria-label="Previous"><ChevronLeft className="size-4 rtl:-scale-x-100" /></button>
          <button className="btn" onClick={() => setCursor(today)}>Today</button>
          <button className="btn btn-icon" onClick={() => step(1)} aria-label="Next"><ChevronRight className="size-4 rtl:-scale-x-100" /></button>
        </div>
        <h2 className="min-w-0 flex-1 truncate px-1 text-[17px] font-semibold" aria-live="polite">{title}</h2>
        <Segmented label="Calendar view" value={view} onChange={setView} options={[{ value: 'month', label: 'Month' }, { value: 'week', label: 'Week' }, { value: 'day', label: 'Day' }, { value: 'agenda', label: 'Agenda' }]} />
      </div>
      {allowed.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Show event types">
          {allowed.map(k => { const on = shown.includes(k); return (
            <button key={k} aria-pressed={on} onClick={() => setShown(s => on ? s.filter(x => x !== k) : [...s, k])} className={cx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition', on ? 'border-ink-300 bg-surface text-ink-800' : 'border-transparent bg-ink-100 text-ink-400')}>
              <span className={cx('size-2 rounded-full', on ? KIND[k].dot : 'bg-ink-300')} />{t(KIND[k].label)}</button>) })}
        </div>
      )}

      {view === 'month' && (
        <div className="card overflow-hidden" role="grid" aria-label={title}>
          <div className="grid grid-cols-7 border-b border-ink-100 bg-ink-50/60 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-400">{dayNames.map(n => <div key={n} className="py-2" role="columnheader">{n}</div>)}</div>
          <div className="grid grid-cols-7">
            {monthDays.slice(0, rows * 7).map((d, i) => {
              const ev = byDate.get(d) ?? []; const inMonth = d.slice(0, 7) === cursor.slice(0, 7)
              return (
                <div key={d} role="gridcell" tabIndex={0} aria-label={t('{date}, {n} events', { date: fmtDate(d, locale), n: ev.length })} onClick={() => go(d)} onKeyDown={e => e.key === 'Enter' && go(d)} data-date={d}
                  className={cx('min-h-[4.5rem] cursor-pointer border-b border-e border-ink-100 p-1 transition hover:bg-brand-50/40 sm:min-h-28 sm:p-1.5', (i + 1) % 7 === 0 && 'border-e-0', !inMonth && 'bg-ink-50/50')}>
                  <span className={cx('mb-1 grid size-6 place-items-center rounded-full text-xs font-medium sm:size-6', d === today ? 'bg-brand-600 text-white' : inMonth ? 'text-ink-700' : 'text-ink-300')}>{parseISO(d).getDate()}</span>
                  <div className="hidden space-y-1 sm:block">{ev.slice(0, 3).map(e => <Pill key={e.id} e={e} locale={locale} />)}{ev.length > 3 && <p className="px-1 text-[11px] font-medium text-ink-500">+{ev.length - 3} more</p>}</div>
                  <div className="flex flex-wrap gap-0.5 sm:hidden">{ev.slice(0, 6).map(e => <span key={e.id} className={cx('size-1.5 rounded-full', KIND[e.kind].dot)} />)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === 'week' && (
        <div className="grid gap-3 md:grid-cols-7">
          {weekDays.map(d => (
            <section key={d} aria-label={fmtDate(d, locale)} className={cx('card min-h-32 p-2.5', d === today && 'ring-2 ring-brand-500/40')}>
              <button className="mb-2 flex w-full items-baseline justify-between text-start" onClick={() => go(d)}>
                <span className="text-xs font-semibold uppercase text-ink-400">{fmtDate(d, locale, { weekday: 'short' })}</span>
                <span className={cx('text-lg font-semibold', d === today ? 'text-brand-700' : 'text-ink-800')}>{parseISO(d).getDate()}</span>
              </button>
              <div className="space-y-1.5">{(byDate.get(d) ?? []).map(e => <Pill key={e.id} e={e} locale={locale} full />)}{!(byDate.get(d) ?? []).length && <p className="text-xs text-ink-300">—</p>}</div>
            </section>
          ))}
        </div>
      )}

      {view === 'day' && (
        <div className="card divide-y divide-ink-100">
          {(byDate.get(cursor) ?? []).map(e => (
            <button key={e.id} onClick={e.open} className="flex w-full items-center gap-4 px-5 py-4 text-start hover:bg-ink-50">
              <span className="w-20 shrink-0 text-sm font-medium text-ink-500">{e.time ? fmtTime(e.time, locale) : t('All day')}</span>
              <span className={cx('h-10 w-1 rounded-full', KIND[e.kind].dot)} />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{e.title}</span><span className="block truncate text-xs text-ink-500">{t(KIND[e.kind].label)}{e.sub && ` · ${e.sub}`}</span></span>
            </button>
          ))}
          {!(byDate.get(cursor) ?? []).length && <EmptyState icon={CalendarClock} title="Nothing scheduled" text="Enjoy a clear day, or add something." />}
        </div>
      )}

      {view === 'agenda' && (
        agenda.length ? (
          <div className="space-y-4">
            {agenda.map(([d, ev]) => (
              <section key={d} className="card overflow-hidden">
                <h3 className={cx('border-b border-ink-100 px-5 py-2.5 text-[13px] font-semibold', d === today ? 'bg-brand-50 text-brand-800' : 'bg-ink-50/60')}>{fmtDate(d, locale, { weekday: 'long', day: 'numeric', month: 'long' })}{d === today && ` · ${t('Today')}`}</h3>
                <ul className="divide-y divide-ink-100">{ev.map(e => <li key={e.id}><button onClick={e.open} className="flex w-full items-center gap-3 px-5 py-3 text-start hover:bg-ink-50"><span className={cx('size-2 shrink-0 rounded-full', KIND[e.kind].dot)} /><span className="w-16 shrink-0 text-xs text-ink-500">{e.time ? fmtTime(e.time, locale) : ''}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{e.title}</span><span className="block truncate text-xs text-ink-500">{e.sub}</span></span></button></li>)}</ul>
              </section>
            ))}
          </div>
        ) : <div className="card"><EmptyState icon={CalendarClock} title="No events in the next 60 days" /></div>
      )}
    </div>
  )
}

export default function CalendarPage() {
  return (<><PageHeader title="Calendar" subtitle="Interviews, follow-ups, deadlines and key recruitment events" /><CalendarView /></>)
}
