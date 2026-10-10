import { useState } from 'react'
import { Database, FileText, FlaskConical } from 'lucide-react'
import { api, type DataMode } from '@/api'
import { useStore } from '@/store'
import { TextField } from '@/components/ui/fields'
import { emailOk, required, useForm } from '@/components/ui/useForm'
import { cx } from '@/components/ui/Badge'
import { TARGET_COUNT } from '@shared/targets'

export function AuthPage({ mode }: { mode: 'setup' | 'login' }) {
  const setup = mode === 'setup'
  const [data, setData] = useState<DataMode>('targets')
  const [error, setError] = useState('')
  const f = useForm({ name: '', email: '', password: '' }, v => ({
    name: setup ? required(v.name, 'Enter your name') : undefined,
    email: required(v.email, 'Enter your email') ?? emailOk(v.email),
    password: required(v.password, 'Enter a password') ?? (setup && v.password.length < 8 ? 'Use at least 8 characters' : undefined),
  }))
  const go = f.submit(async v => {
    setError('')
    try {
      if (setup) await api.setup({ name: v.name, email: v.email, password: v.password, mode: data })
      else await api.login({ email: v.email, password: v.password })
      await useStore.getState().afterAuth()
    } catch (e) { setError((e as Error).message); throw e }
  })
  const opts: { v: DataMode; icon: typeof Database; title: string; text: string }[] = [
    { v: 'targets', icon: FileText, title: `My ${TARGET_COUNT} target offices`, text: 'Your list, ready to start applying' },
    { v: 'sample', icon: FlaskConical, title: 'Demo data', text: 'Fictional data to explore every screen' },
    { v: 'empty', icon: Database, title: 'Empty', text: 'Start from scratch' },
  ]
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2.5"><svg viewBox="0 0 32 32" className="size-7" aria-hidden><path d="M7 25V13l9-6 9 6v12h-5.5v-7h-7v7z" fill="#98b59c" /></svg><span className="font-display text-3xl">Pipeline</span></div>
        <div>
          <p className="font-display text-[3.4rem] leading-[1.05] tracking-tight">Every application,<br /><span className="text-brand-300">one clear line</span> to an offer.</p>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-300">Track offices, applications, interviews and follow-ups for architecture, interiors, fit-out and construction roles.</p>
        </div>
        <svg className="pointer-events-none absolute -bottom-10 -end-10 size-[28rem] text-white/[0.04]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.6" aria-hidden>
          {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M0 ${8 * i + 4}H100M${8 * i + 4} 0V100`} />)}<path d="M20 80V45l30-20 30 20v35H64V58H36v22z" strokeWidth="1.2" />
        </svg>
      </aside>
      <main className="flex items-center justify-center p-6">
        <form onSubmit={go} noValidate className="w-full max-w-sm">
          <h1 className="font-display text-4xl tracking-tight">{setup ? 'Create your account' : 'Welcome back'}</h1>
          <p className="mt-1.5 text-sm text-ink-500">{setup ? 'A private workspace stored on this server. Only you can sign in.' : 'Sign in to continue your search.'}</p>
          <div className="mt-7 space-y-4">
            {setup && <TextField label="Your name" autoComplete="name" autoFocus {...f.bind('name')} />}
            <TextField label="Email" type="email" autoComplete="username" autoFocus={!setup} {...f.bind('email')} />
            <TextField label="Password" type="password" autoComplete={setup ? 'new-password' : 'current-password'} {...f.bind('password')} hint={setup ? 'At least 8 characters' : undefined} />
            {setup && (
              <fieldset>
                <legend className="label">Start with</legend>
                <div className="grid gap-2">
                  {opts.map(o => (
                    <label key={o.v} className={cx('flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition', data === o.v ? 'border-brand-500 bg-brand-50/60 ring-3 ring-brand-500/10' : 'border-ink-200 hover:border-ink-300')}>
                      <input type="radio" name="data" className="sr-only" checked={data === o.v} onChange={() => setData(o.v)} />
                      <o.icon className="size-4 text-brand-600" aria-hidden /><span><span className="block text-[13px] font-medium">{o.title}</span><span className="block text-xs text-ink-500">{o.text}</span></span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </div>
          {error && <p role="alert" className="mt-4 rounded-lg bg-danger-50 px-3 py-2 text-[13px] text-danger-700">{error}</p>}
          <button type="submit" className="btn btn-dark mt-6 h-10 w-full" disabled={f.busy}>{f.busy ? 'Please wait…' : setup ? 'Create account' : 'Sign in'}</button>
        </form>
      </main>
    </div>
  )
}
