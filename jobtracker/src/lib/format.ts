import type { Application } from '@shared/types'
import type { Currency } from '@shared/constants'

export function fmtMoney(n: number | null | undefined, currency: Currency | string, locale: string, compact = false) {
  if (n == null) return '—'
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0, notation: compact ? 'compact' : 'standard' }).format(n)
  } catch { return `${currency} ${n}` }
}
export function fmtNumber(n: number, locale: string, digits = 0) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(n)
}
export const fmtPct = (n: number | null, locale: string) => n == null ? '—' : new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(n)

export function salaryRange(a: Pick<Application, 'salaryMin' | 'salaryMax' | 'currency'>, locale: string, compact = true) {
  const { salaryMin: lo, salaryMax: hi, currency } = a
  if (lo == null && hi == null) return '—'
  const f = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0, notation: compact ? 'compact' : 'standard' }).format(n)
  if (lo != null && hi != null) return `${currency} ${f(lo)}–${f(hi)}`
  return `${currency} ${f((lo ?? hi)!)}${lo != null ? '+' : ' max'}`
}
export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('')
export const hostname = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url } }
export const normUrl = (u: string) => (u && !/^https?:\/\//i.test(u) ? `https://${u}` : u)
export const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
