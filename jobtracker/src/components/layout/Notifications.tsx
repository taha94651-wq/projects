import { t } from '@/i18n'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellRing, CalendarClock, CheckCircle2, Clock, Gift, Hourglass } from 'lucide-react'
import { useStore } from '@/store'
import { buildNotifications, type Notif } from '@/lib/derive'
import { Popover } from '../ui/Menu'
import { cx } from '../ui/Badge'

const KEY = 'jt_read_notifs'
const load = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] } }
const ICON: Record<Notif['kind'], typeof Bell> = { 'followup-today': BellRing, 'followup-overdue': Clock, 'interview-today': CalendarClock, 'interview-tomorrow': CalendarClock, waiting: Hourglass, offer: Gift }
const TONE = { danger: 'bg-danger-50 text-danger-500', warn: 'bg-warn-50 text-warn-500', info: 'bg-info-50 text-info-500', success: 'bg-brand-50 text-brand-600' }

export function Notifications() {
  const data = useStore(s => s.data), staleDays = useStore(s => s.settings.staleDays)
  const nav = useNavigate()
  const [read, setRead] = useState<string[]>(load)
  const all = useMemo(() => buildNotifications(data, staleDays), [data, staleDays])
  const unread = all.filter(n => !read.includes(n.id))
  const mark = (ids: string[]) => { const next = [...new Set([...read, ...ids])].slice(-300); setRead(next); try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* private mode */ } }
  return (
    <Popover panelClass="w-[min(24rem,calc(100vw-1.5rem))]" trigger={({ toggle, ref, props }) => (
      <button ref={ref} onClick={toggle} {...props} className="btn btn-ghost btn-icon relative" aria-label={unread.length ? t('Notifications, {n} unread', { n: unread.length }) : t('Notifications')}>
        <Bell className="size-[18px]" />
        {unread.length > 0 && <span className="absolute end-1 top-1 grid min-w-4 place-items-center rounded-full bg-danger-500 px-1 text-[10px] font-semibold leading-4 text-white">{unread.length}</span>}
      </button>
    )}>
      {close => (
        <div>
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <h2 className="text-sm font-semibold">Notifications</h2>
            {unread.length > 0 && <button className="text-xs font-medium text-brand-700 hover:underline" onClick={() => mark(all.map(n => n.id))}>Mark all read</button>}
          </div>
          <ul className="scroll-thin max-h-[26rem] overflow-y-auto p-1.5">
            {!all.length && <li className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-ink-500"><CheckCircle2 className="size-6 text-brand-400" />You're all caught up</li>}
            {all.map(n => {
              const Icon = ICON[n.kind]; const isRead = read.includes(n.id)
              return (
                <li key={n.id}>
                  <button className={cx('flex w-full items-start gap-3 rounded-lg px-2.5 py-2.5 text-start hover:bg-ink-50', isRead && 'opacity-60')} onClick={() => { mark([n.id]); close(); nav(n.link) }}>
                    <span className={cx('mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg', TONE[n.severity])}><Icon className="size-4" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-ink-900">{n.title}</span><span className="block text-xs text-ink-500">{n.detail}</span></span>
                    {!isRead && <span className="mt-2 size-2 shrink-0 rounded-full bg-brand-500" aria-label="Unread" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Popover>
  )
}
