/** All app dates are local calendar days stored as `YYYY-MM-DD`. */
const pad = (n: number) => String(n).padStart(2, '0')
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayISO = () => toISO(new Date())
export const parseISO = (s: string): Date => { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d) }
export const addDays = (iso: string, n: number) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d) }
export const diffDays = (a: string, b: string) => Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / 86_400_000)
export const addMonths = (iso: string, n: number) => { const d = parseISO(iso); d.setDate(1); d.setMonth(d.getMonth() + n); return toISO(d) }
export const monthKey = (iso: string) => iso.slice(0, 7)
export const startOfMonth = (iso: string) => `${iso.slice(0, 7)}-01`
export const startOfWeek = (iso: string, weekStartsOn = 0) => { const d = parseISO(iso); d.setDate(d.getDate() - ((d.getDay() - weekStartsOn + 7) % 7)); return toISO(d) }
export const isValidISO = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && toISO(parseISO(s)) === s

export function fmtDate(iso: string | null | undefined, locale: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(locale, opts).format(parseISO(iso))
}
export const fmtShort = (iso: string | null | undefined, locale: string) => fmtDate(iso, locale, { day: 'numeric', month: 'short' })
export const fmtWeekday = (iso: string, locale: string, style: 'short' | 'long' = 'short') => new Intl.DateTimeFormat(locale, { weekday: style }).format(parseISO(iso))
export const fmtMonthYear = (iso: string, locale: string) => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(parseISO(iso))
export function fmtTime(time: string | null | undefined, locale: string) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const d = new Date(2000, 0, 1, h, m)
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(d)
}

/** "Today", "Tomorrow", "in 3 days", "2 days ago" … based on whole-day difference to `today`. */
export function relDay(iso: string | null | undefined, today = todayISO()): string {
  if (!iso) return '—'
  const n = diffDays(iso, today)
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n === -1) return 'Yesterday'
  if (n > 0) return `in ${n} days`
  return `${-n} days ago`
}
export const agoDays = (iso: string | null | undefined, today = todayISO()) => {
  if (!iso) return 'Never'
  const n = diffDays(today, iso)
  if (n <= 0) return 'Today'
  if (n === 1) return 'Yesterday'
  return `${n} days ago`
}
