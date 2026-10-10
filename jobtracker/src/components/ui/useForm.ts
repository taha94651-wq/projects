import { useCallback, useState } from 'react'

type Errors<T> = Partial<Record<keyof T, string>>
/** Minimal form state + validation. `validate` returns an error map; empty = valid. */
export function useForm<T extends object>(initial: T, validate: (v: T) => Errors<T>) {
  const [values, setValues] = useState<T>(initial)
  const [errors, setErrors] = useState<Errors<T>>({})
  const [busy, setBusy] = useState(false)
  const set = useCallback(<K extends keyof T>(k: K, v: T[K]) => {
    setValues(s => ({ ...s, [k]: v }))
    setErrors(e => (e[k] ? { ...e, [k]: undefined } : e))
  }, [])
  const bind = <K extends keyof T>(k: K) => ({
    value: (values[k] ?? '') as string | number, error: errors[k],
    onChange: (e: { target: { value: string } }) => set(k, e.target.value as T[K]),
  })
  const submit = (fn: (v: T) => Promise<void>) => async (e?: { preventDefault: () => void }) => {
    e?.preventDefault()
    const errs = validate(values)
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    setBusy(true)
    try { await fn(values) } catch { /* surfaced by store via toast */ } finally { setBusy(false) }
  }
  return { values, set, bind, errors, busy, submit, setValues }
}
export const required = (v: unknown, msg = 'Required') => (v == null || String(v).trim() === '' ? msg : undefined)
export const emailOk = (v: string) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Enter a valid email address' : undefined)
export const urlOk = (v: string) => { if (!v) return undefined; try { new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`); return v.includes('.') ? undefined : 'Enter a valid URL' } catch { return 'Enter a valid URL' } }
export const numOk = (v: unknown, label = 'Enter a valid number') => (v === '' || v == null || (Number.isFinite(Number(v)) && Number(v) >= 0) ? undefined : label)
export const toNum = (v: unknown): number | null => (v === '' || v == null ? null : Number(v))
