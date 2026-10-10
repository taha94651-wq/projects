import { useId, type ComponentProps, type ReactNode } from 'react'

interface FieldProps { label: string; error?: string; hint?: string; required?: boolean; className?: string; children: (p: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode }
export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = useId()
  const msgId = `${id}-msg`
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}{required && <span className="text-danger-500" aria-hidden> *</span>}</label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': error || hint ? msgId : undefined })}
      {(error || hint) && <p id={msgId} role={error ? 'alert' : undefined} className={`mt-1 text-xs ${error ? 'text-danger-700' : 'text-ink-400'}`}>{error ?? hint}</p>}
    </div>
  )
}
type Common = { label: string; error?: string; hint?: string; className?: string }
export function TextField({ label, error, hint, className, required, ...p }: Common & ComponentProps<'input'>) {
  return <Field {...{ label, error, hint, className, required }}>{a => <input {...a} {...p} required={false} className="input" />}</Field>
}
export function TextArea({ label, error, hint, className, required, ...p }: Common & ComponentProps<'textarea'>) {
  return <Field {...{ label, error, hint, className, required }}>{a => <textarea {...a} {...p} className="input" />}</Field>
}
export function SelectField({ label, error, hint, className, required, options, placeholder, ...p }: Common & Omit<ComponentProps<'select'>, 'children'> & { options: readonly (string | { value: string; label: string })[]; placeholder?: string }) {
  return (
    <Field {...{ label, error, hint, className, required }}>
      {a => (
        <select {...a} {...p} className="input">
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </Field>
  )
}
export const FormGrid = ({ children }: { children: ReactNode }) => <div className="grid gap-x-4 gap-y-3.5 sm:grid-cols-2">{children}</div>
export const Span2 = ({ children }: { children: ReactNode }) => <div className="sm:col-span-2">{children}</div>
export const FormSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <fieldset className="mt-5 first:mt-0"><legend className="eyebrow mb-3 w-full border-b border-ink-100 pb-1.5">{title}</legend>{children}</fieldset>
)
