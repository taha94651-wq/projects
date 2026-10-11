import { ar } from './i18n-ar'

export type Lang = 'en' | 'ar'
const STORAGE = 'pipeline-lang'
let lang: Lang = 'en'
try {
  const v = typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE)
  if (v === 'ar' || v === 'en') lang = v
  else if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ar')) lang = 'ar' // first visit: follow the browser language
} catch { /* storage unavailable */ }

export const getLang = (): Lang => lang
export const isRtl = () => lang === 'ar'
export function setLang(next: Lang) {
  lang = next
  try { localStorage.setItem(STORAGE, next) } catch { /* ignore */ }
  if (typeof document !== 'undefined') { document.documentElement.lang = next; document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr' }
}
setLang(lang)

/** Translate a UI string. Unknown strings fall back to English; `{name}` placeholders are filled from `vars`. */
export function t(text: string, vars?: Record<string, string | number>): string {
  let out = lang === 'ar' ? (ar[text] ?? text) : text
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v))
  return out
}
/** Translate a stored enum value (stage, type, status …); anything else passes through unchanged. */
export const tv = <T,>(v: T): T | string => (typeof v === 'string' ? t(v) : v)

/** "3 days" / "٣ أيام" with correct Arabic number agreement. */
export function tDays(n: number): string {
  if (lang !== 'ar') return `${n} day${n === 1 ? '' : 's'}`
  const d = n === 1 ? 'يوم' : n === 2 ? 'يومان' : n >= 3 && n <= 10 ? `${n} أيام` : `${n} يومًا`
  return n === 1 || n === 2 ? d : d
}

/** Stored, auto-generated activity text ("Moved from A to B", "HR interview scheduled" …) is kept in English; translate it for display. */
export function tDesc(text: string): string {
  if (lang !== 'ar' || !text) return text
  const direct = ar[text]
  if (direct) return direct
  let m = text.match(/^Moved from (.+) to (.+)$/)
  if (m) return t('Moved from {from} to {to}', { from: t(m[1]), to: t(m[2]) })
  m = text.match(/^(HR|Technical|Hiring Manager|Final|Portfolio Review|Site Interview) interview (scheduled|completed|passed|failed|cancelled)(?: for (.+))?$/)
  if (m) return t(`{type} interview ${m[2]}`, { type: t(m[1]) }) + (m[3] ? ` · ${m[3]}` : '')
  m = text.match(/^Follow-up completed \((.+)\)$/)
  if (m) return t('Follow-up completed ({type})', { type: t(m[1]) })
  return text
}
