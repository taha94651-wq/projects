import { buildSeed } from '@shared/seed'
import { buildTargetCompanies } from '@shared/targets'
import { ENTITY_KEYS, SCHEMA } from '@shared/schema'
import type { Dataset, EntityKey, Settings, User } from '@shared/types'
import { cascade } from './store'

/**
 * Preview-only stand-in for the Express API: handles the same `/api/*` routes in the browser
 * so the real UI can run as a static page. State persists in localStorage when available.
 */
const KEY = 'pipeline-preview-v1'
const USER: User = { id: 'demo', name: 'Mostafa Taha', email: 'demo@example.com' }
const DEFAULTS: Settings = { locale: 'en-GB', defaultCurrency: 'SAR', staleDays: 7 }
const EMPTY: Dataset = { companies: [], contacts: [], applications: [], interviews: [], followUps: [], activities: [], attachments: [] }

interface State { data: Dataset; settings: Settings; user: User }
let state: State
let signedIn = true

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as State
  } catch { /* storage unavailable */ }
  return { data: buildSeed(), settings: DEFAULTS, user: USER }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ } }

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const fail = (error: string, status = 400) => json({ error }, status)
const entity = (name: string): EntityKey | undefined => ENTITY_KEYS.find(k => k === name)

export function installDemoApi() {
  state = load()
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
