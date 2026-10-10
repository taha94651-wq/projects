import { useState } from 'react'
import { Database, Download, KeyRound, SlidersHorizontal, Upload, User as UserIcon } from 'lucide-react'
import { CURRENCIES, LOCALES, type Currency } from '@shared/constants'
import { buildTargetCompanies, TARGET_COUNT } from '@shared/targets'
import { api, type DataMode } from '@/api'
import { useStore } from '@/store'
import { confirmDialog, openForm, toast } from '@/ui-store'
import { downloadFile, toCsv } from '@/lib/csv'
import { fmtDate, todayISO } from '@/lib/dates'
import { fmtMoney } from '@/lib/format'
import { SelectField, TextField, FormGrid } from '@/components/ui/fields'
import { emailOk, required, useForm } from '@/components/ui/useForm'
import { PageHeader, Section } from '@/components/ui/misc'

function Profile() {
  const user = useStore(s => s.user)!
  const f = useForm({ name: user.name, email: user.email }, v => ({ name: required(v.name, 'Enter your name'), email: required(v.email, 'Enter your email') ?? emailOk(v.email) }))
  const save = f.submit(async v => { try { const r = await api.profile(v); useStore.getState().setUser(r.user); toast('Profile updated') } catch (e) { toast((e as Error).message, 'error'); throw e } })
  return (
    <Section title="Profile" icon={UserIcon}>
      <form onSubmit={save} noValidate><FormGrid><TextField label="Name" {...f.bind('name')} /><TextField label="Email" type="email" {...f.bind('email')} /></FormGrid>
        <button className="btn btn-primary mt-4" disabled={f.busy}>Save profile</button></form>
    </Section>
  )
}
function Password() {
  const f = useForm({ current: '', next: '', confirm: '' }, v => ({ current: required(v.current, 'Enter your current password'), next: v.next.length < 8 ? 'Use at least 8 characters' : undefined, confirm: v.confirm !== v.next ? 'Passwords do not match' : undefined }))
  const save = f.submit(async v => { try { await api.password({ current: v.current, next: v.next }); f.setValues({ current: '', next: '', confirm: '' }); toast('Password changed') } catch (e) { toast((e as Error).message, 'error'); throw e } })
  return (
    <Section title="Password" icon={KeyRound}>
      <form onSubmit={save} noValidate><div className="grid gap-3.5 sm:grid-cols-3">
        <TextField label="Current password" type="password" autoComplete="current-password" {...f.bind('current')} />
        <TextField label="New password" type="password" autoComplete="new-password" {...f.bind('next')} />
        <TextField label="Confirm new password" type="password" autoComplete="new-password" {...f.bind('confirm')} /></div>
        <button className="btn btn-primary mt-4" disabled={f.busy}>Change password</button></form>
    </Section>
  )
}

export default function Settings() {
  const { settings, saveSettings, data } = useStore()
  const [busy, setBusy] = useState(false)
  const exportAll = async () => {
    const res = await fetch('/api/export'); const json = await res.text()
    downloadFile(`jobtracker-backup-${todayISO()}.json`, json, 'application/json')
  }
  const exportCsvs = () => {
    const d = data
    const cos = new Map(d.companies.map(c => [c.id, c.name]))
    downloadFile('interviews.csv', toCsv(d.interviews, [{ header: 'Company', value: i => cos.get(d.applications.find(a => a.id === i.applicationId)?.companyId ?? '') }, { header: 'Position', value: i => d.applications.find(a => a.id === i.applicationId)?.position }, { header: 'Type', value: i => i.type }, { header: 'Date', value: i => i.date }, { header: 'Time', value: i => i.time }, { header: 'Location', value: i => i.location }, { header: 'Interviewer', value: i => i.interviewer }, { header: 'Status', value: i => i.status }, { header: 'Result', value: i => i.result }, { header: 'Prep notes', value: i => i.prepNotes }, { header: 'Post notes', value: i => i.postNotes }]))
    downloadFile('follow-ups.csv', toCsv(d.followUps, [{ header: 'Company', value: f => cos.get(f.companyId ?? '') }, { header: 'Position', value: f => d.applications.find(a => a.id === f.applicationId)?.position }, { header: 'Contact', value: f => d.contacts.find(c => c.id === f.contactId)?.name }, { header: 'Due', value: f => f.dueDate }, { header: 'Type', value: f => f.type }, { header: 'Status', value: f => f.status }, { header: 'Notes', value: f => f.notes }]))
  }
  const reset = async (mode: DataMode, label: string) => {
    if (!await confirmDialog({ title: label, message: 'This permanently replaces ALL your current data (companies, applications, interviews, contacts, notes and attachments). Export a backup first if you need one.', confirmLabel: 'Replace all data', tone: 'danger' })) return
    setBusy(true)
    try { await useStore.getState().resetData(mode); toast('Data replaced') } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }
  const addTargets = async () => {
    const have = new Set(data.companies.map(c => c.name.toLowerCase()))
    const fresh = buildTargetCompanies().filter(c => !have.has(c.name.toLowerCase())).map(({ id: _i, createdAt: _c, ...c }) => c)
    if (!fresh.length) return toast('All target offices are already in your list', 'info')
    await useStore.getState().addMany('companies', fresh); toast(`${fresh.length} target offices added`)
  }
  const sample = 1234567
  return (
    <>
      <PageHeader title="Settings" subtitle="Account, preferences and your data" />
      <div className="max-w-4xl space-y-6">
        <Profile />
        <Section title="Preferences" icon={SlidersHorizontal}>
          <FormGrid>
            <SelectField label="Language & date format" value={settings.locale} options={LOCALES.map(l => ({ value: l.value, label: l.label }))} onChange={e => void saveSettings({ locale: e.target.value })} hint={`Preview: ${fmtDate(todayISO(), settings.locale)} · ${fmtMoney(sample, settings.defaultCurrency, settings.locale)}`} />
            <SelectField label="Default currency" value={settings.defaultCurrency} options={CURRENCIES} onChange={e => void saveSettings({ defaultCurrency: e.target.value as Currency })} hint="Used when adding new applications" />
            <SelectField label="Flag applications waiting for a response after" value={String(settings.staleDays)} options={[3, 5, 7, 10, 14, 21].map(n => ({ value: String(n), label: `${n} days` }))} onChange={e => void saveSettings({ staleDays: Number(e.target.value) })} />
          </FormGrid>
        </Section>
        <Password />
        <Section title="Your data" icon={Database}>
          <p className="mb-4 text-sm text-ink-500">Everything is stored in a SQLite database on this server (<code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">data/jobtracker.db</code>). {data.companies.length} companies · {data.applications.length} applications · {data.interviews.length} interviews · {data.contacts.length} contacts.</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={() => void exportAll()}><Download className="size-4" />Full backup (JSON)</button>
            <button className="btn" onClick={exportCsvs}><Download className="size-4" />Export interviews & follow-ups (CSV)</button>
            <button className="btn" onClick={() => openForm({ kind: 'import' })}><Upload className="size-4" />Import companies</button>
            <button className="btn" onClick={() => void addTargets()}>Add my {TARGET_COUNT} target offices</button>
          </div>
          <div className="mt-6 rounded-xl border border-danger-500/30 bg-danger-50/40 p-4">
            <h3 className="text-sm font-semibold text-danger-700">Replace all data</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn btn-sm" disabled={busy} onClick={() => void reset('targets', `Start over with my ${TARGET_COUNT} target offices?`)}>Reset to my target offices</button>
              <button className="btn btn-sm" disabled={busy} onClick={() => void reset('sample', 'Load demo data?')}>Load demo data</button>
              <button className="btn btn-sm btn-danger" disabled={busy} onClick={() => void reset('empty', 'Delete everything?')}>Delete everything</button>
            </div>
          </div>
        </Section>
      </div>
    </>
  )
}
