import { buildSeed } from '@shared/seed'
import { LEGACY_TYPE_MAP } from '@shared/constants'
import { buildTargetCompanies } from '@shared/targets'
import { ENTITY_KEYS, SCHEMA } from '@shared/schema'
import type { Dataset, EntityKey, Settings, User } from '@shared/types'
import { cascade } from './store'
import { t } from './i18n'
import { setPersistMode } from './persist-mode'
import { toast } from './ui-store'

/**
 * Preview-only stand-in for the Express API: handles the same `/api/*` routes in the browser
 * so the real UI can run as a static page.
 *
 * Persistence: when the page has the artifact `db` capability, the whole state is kept in one document
 * (`pipeline/state`) so it survives reloads, devices and republishes. localStorage is a local cache and the
 * fallback when the database is unavailable. NEVER change STORAGE_KEY again: a new key silently drops saved data.
 * Data written by earlier preview builds (keys `pipeline-preview-v1` … `v9`) is recovered once.
 */
const STORAGE_KEY = 'pipeline-preview-state'
const LEGACY_PREFIX = 'pipeline-preview-v'
const DOC_PATH = 'pipeline/state'
const USER: User = { id: 'demo', name: 'Mostafa Taha', email: 'demo@example.com' }
const DEFAULTS: Settings = { lang: 'en', locale: 'en-GB', defaultCurrency: 'SAR', staleDays: 7 }
const EMPTY: Dataset = { companies: [], attempts: [], contacts: [], applications: [], interviews: [], followUps: [], activities: [], attachments: [] }

interface State { data: Dataset; settings: Settings; user: User }
interface Doc { get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>; set(d: Record<string, unknown>): Promise<void> }
interface CloudDb { doc(path: string): Doc }
let state: State
let signedIn = true
let cloud: Doc | null = null

/** Brings data saved by earlier versions up to the current shape. Idempotent. */
function normalize(st: State): State {
  const data = { ...EMPTY, ...st.data }
  data.attempts = (data.attempts ?? []).map(a => ({ ...a, role: a.role ?? '', personName: a.personName ?? '' }))
  data.companies = data.companies.map(c => ({ ...c, type: (LEGACY_TYPE_MAP[c.type as string] ?? c.type) as typeof c.type, interests: c.interests ?? '' }))
  return { data, settings: { ...DEFAULTS, ...st.settings }, user: st.user ?? USER }
}
function readLocal(): State | null {
  try {
    const keys = [STORAGE_KEY, ...Array.from({ length: 9 }, (_, i) => `${LEGACY_PREFIX}${9 - i}`)]
    for (const k of keys) { const raw = localStorage.getItem(k); if (raw) return normalize(JSON.parse(raw) as State) }
  } catch { /* storage unavailable or corrupt */ }
  return null
}
// Starts with the user's own offices only (no outside companies); demo data is opt-in from Settings.
const fresh = (): State => ({ data: { ...EMPTY, companies: buildTargetCompanies() }, settings: DEFAULTS, user: USER })

async function getCloud(): Promise<CloudDb | null> {
  try {
    const claude = (window as unknown as { claude?: { use(n: string): Promise<unknown> } }).claude
    if (!claude?.use) return null
    return ((await claude.use('db')) as CloudDb | null) ?? null
  } catch { return null }
}

let timer: ReturnType<typeof setTimeout> | undefined
let writing = false
let again = false
let warned = false
async function flush() {
  if (!cloud) return
  if (writing) { again = true; return }
  writing = true
  try {
    const payload = JSON.stringify(state)
    if (payload.length > 240_000) throw new Error('too large')
    await cloud.set({ payload, savedAt: new Date().toISOString(), schema: 2 })
  } catch {
    if (!warned) { warned = true; toast(t('Could not save to the page database — saved in this browser only'), 'error') }
  } finally { writing = false; if (again) { again = false; schedule() } }
}
function schedule() { if (cloud) { clearTimeout(timer); timer = setTimeout(() => void flush(), 400) } }
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
  schedule()
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const fail = (error: string, status = 400) => json({ error }, status)
const entity = (name: string): EntityKey | undefined => ENTITY_KEYS.find(k => k === name)

export async function installDemoApi() {
  const db = await getCloud()
  const doc = db?.doc(DOC_PATH) ?? null
  let loaded: State | null = null
  if (doc) {
    try {
      const snap = await doc.get()
      const payload = snap.exists ? (snap.data()?.payload as string | undefined) : undefined
      if (payload) loaded = normalize(JSON.parse(payload) as State)
      cloud = doc
      setPersistMode('cloud')
    } catch { cloud = null } // database unreachable: keep working from this browser
  }
  const local = readLocal()
  state = loaded ?? local ?? fresh()
  // First time on the database: carry over what this browser already holds (including data from older builds).
  if (cloud && !loaded) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ } schedule() }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { clearTimeout(timer); void flush() } })
  const real = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
    if (!url.startsWith('/api/')) return real(input, init)
    const method = (init?.method ?? 'GET').toUpperCase()
    const body = init?.body ? JSON.parse(String(init.body)) : {}
    const [, , a, b, c] = url.split('?')[0].split('/') // ['', 'api', a, b, c]
    await new Promise(r => setTimeout(r, 40)) // feel like a network call

    if (a === 'auth') {
      if (b === 'status') return json({ configured: true, user: signedIn ? state.user : null })
      if (b === 'login') { signedIn = true; return json({ user: state.user }) }
      if (b === 'logout') { signedIn = false; return json({ ok: true }) }
      if (b === 'profile') { state.user = { ...state.user, name: body.name, email: body.email }; save(); return json({ user: state.user }) }
      if (b === 'password') return json({ ok: true })
    }
    if (!signedIn) return fail('Not authenticated', 401)
    if (a === 'bootstrap') return json({ user: state.user, settings: state.settings, data: state.data })
    if (a === 'settings' && method === 'PUT') { state.settings = { ...state.settings, ...body }; save(); return json(state.settings) }
    if (a === 'export') return json({ exportedAt: new Date().toISOString(), settings: state.settings, data: state.data })
    if (a === 'reset') {
      state.data = body.mode === 'sample' ? buildSeed() : body.mode === 'targets' ? { ...EMPTY, companies: buildTargetCompanies() } : { ...EMPTY }
      save(); return json({ data: state.data })
    }
    if (a === 'attachments') {
      const row = { id: crypto.randomUUID(), name: body.name, mime: body.mime, size: Math.floor((body.data?.length ?? 0) * 0.75), activityId: body.activityId ?? null, applicationId: body.applicationId ?? null, companyId: body.companyId ?? null, createdAt: new Date().toISOString() }
      ;(state.data.attachments as unknown[]).push(row); save(); return json(row, 201)
    }
    if (a === 'data') {
      const key = b ? entity(b) : undefined
      if (!key) return fail('Unknown entity', 404)
      const list = state.data[key] as unknown as { id: string }[]
      if (method === 'POST') {
        const items: Record<string, unknown>[] = Array.isArray(body) ? body : [body]
        for (const it of items) for (const f of SCHEMA[key].required) if (it[f] == null || String(it[f]).trim() === '') return fail(`${f} is required`)
        const rows = items.map(it => ({ ...it, id: (it.id as string) || crypto.randomUUID() }))
        list.push(...(rows as never[])); save()
        return json(Array.isArray(body) ? rows : rows[0], 201)
      }
      const i = list.findIndex(x => x.id === c)
      if (i < 0) return fail('Not found', 404)
      if (method === 'PUT') { list[i] = { ...list[i], ...body, id: c }; save(); return json(list[i]) }
      if (method === 'DELETE') { state.data = cascade(state.data, key, c); save(); return json({ ok: true }) }
    }
    return fail('Not found', 404)
  }
}
