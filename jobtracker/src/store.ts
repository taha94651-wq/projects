import { create } from 'zustand'
import type { Dataset, EntityKey, Settings, User } from '@shared/types'
import { api, type DataMode } from './api'
import { uid } from './lib/format'
import { toast } from './ui-store'

export type Item<K extends EntityKey> = Dataset[K][number]
export type Draft<K extends EntityKey> = Omit<Item<K>, 'id' | 'createdAt'> & { id?: string }
const EMPTY: Dataset = { companies: [], contacts: [], applications: [], interviews: [], followUps: [], activities: [], attachments: [] }
const DEFAULTS: Settings = { locale: 'en-GB', defaultCurrency: 'SAR', staleDays: 7 }

/** Mirrors the database's ON DELETE rules so the UI stays consistent without a refetch. */
export function cascade(d: Dataset, key: EntityKey, id: string): Dataset {
  const next = { ...d }
  const drop = <K extends EntityKey>(k: K, pred: (x: Item<K>) => boolean) => { (next[k] as Item<K>[]) = (next[k] as Item<K>[]).filter(x => !pred(x)) }
  if (key === 'companies') {
    const appIds = new Set(d.applications.filter(a => a.companyId === id).map(a => a.id))
    drop('companies', x => x.id === id); drop('contacts', x => x.companyId === id); drop('applications', x => x.companyId === id)
    drop('interviews', x => appIds.has(x.applicationId)); drop('followUps', x => x.companyId === id || (!!x.applicationId && appIds.has(x.applicationId)))
    drop('activities', x => x.companyId === id || (!!x.applicationId && appIds.has(x.applicationId)))
    drop('attachments', x => x.companyId === id || (!!x.applicationId && appIds.has(x.applicationId)))
  } else if (key === 'applications') {
    drop('applications', x => x.id === id); drop('interviews', x => x.applicationId === id)
    drop('followUps', x => x.applicationId === id); drop('activities', x => x.applicationId === id); drop('attachments', x => x.applicationId === id)
  } else if (key === 'contacts') {
    drop('contacts', x => x.id === id)
    next.followUps = d.followUps.map(f => (f.contactId === id ? { ...f, contactId: null } : f))
    next.activities = d.activities.map(a => (a.contactId === id ? { ...a, contactId: null } : a))
  } else if (key === 'activities') {
    drop('activities', x => x.id === id); drop('attachments', x => x.activityId === id)
  } else drop(key, (x: { id: string }) => x.id === id)
  return next
}

interface State {
  phase: 'loading' | 'setup' | 'login' | 'ready'
  setupCodeRequired: boolean
  user: User | null
  settings: Settings
  data: Dataset
  init: () => Promise<void>
  afterAuth: () => Promise<void>
  signOut: () => Promise<void>
  setUser: (u: User) => void
  saveSettings: (s: Partial<Settings>) => Promise<void>
  resetData: (mode: DataMode) => Promise<void>
  add: <K extends EntityKey>(key: K, draft: Draft<K>) => Promise<Item<K>>
  addMany: <K extends EntityKey>(key: K, drafts: Draft<K>[]) => Promise<Item<K>[]>
  patch: <K extends EntityKey>(key: K, id: string, changes: Partial<Item<K>>) => Promise<void>
  remove: (key: EntityKey, id: string) => Promise<void>
  replaceAttachments: (list: Dataset['attachments']) => void
}

export const useStore = create<State>((set, get) => ({
  phase: 'loading', setupCodeRequired: false, user: null, settings: DEFAULTS, data: EMPTY,
  init: async () => {
    try {
      const s = await api.status()
      if (!s.configured) return set({ phase: 'setup', setupCodeRequired: !!s.setupCodeRequired })
      if (!s.user) return set({ phase: 'login' })
      await get().afterAuth()
    } catch { set({ phase: 'login' }) }
  },
  afterAuth: async () => {
    const b = await api.bootstrap()
    set({ user: b.user, settings: b.settings, data: b.data, phase: 'ready' })
  },
  signOut: async () => { await api.logout().catch(() => {}); set({ phase: 'login', user: null, data: EMPTY }) },
  setUser: user => set({ user }),
  saveSettings: async s => {
    const prev = get().settings
    set({ settings: { ...prev, ...s } })
    try { set({ settings: await api.saveSettings(s) }) } catch (e) { set({ settings: prev }); toast((e as Error).message, 'error'); throw e }
  },
  resetData: async mode => { const r = await api.reset(mode); set({ data: r.data }) },

  add: async (key, draft) => {
    const row = { ...draft, id: draft.id ?? uid(), createdAt: new Date().toISOString() } as unknown as Item<typeof key>
    const before = get().data
    set({ data: { ...before, [key]: [...before[key], row] } as Dataset })
    try {
      const saved = await api.create<Item<typeof key>>(key, row)
      set(s => ({ data: { ...s.data, [key]: (s.data[key] as Item<typeof key>[]).map(x => (x.id === row.id ? saved : x)) } as Dataset }))
      return saved
    } catch (e) {
      set(s => ({ data: { ...s.data, [key]: (s.data[key] as Item<typeof key>[]).filter(x => x.id !== row.id) } as Dataset }))
      toast((e as Error).message, 'error'); throw e
    }
  },
  addMany: async (key, drafts) => {
    const rows = drafts.map(d => ({ ...d, id: d.id ?? uid(), createdAt: new Date().toISOString() }))
    try {
      const saved = await api.createMany<Item<typeof key>>(key, rows)
      set(s => ({ data: { ...s.data, [key]: [...s.data[key], ...saved] } as Dataset }))
      return saved
    } catch (e) { toast((e as Error).message, 'error'); throw e }
  },
  patch: async (key, id, changes) => {
    const before = get().data
    set({ data: { ...before, [key]: (before[key] as Item<typeof key>[]).map(x => (x.id === id ? { ...x, ...changes } : x)) } as Dataset })
    try { await api.update(key, id, changes) } catch (e) { set({ data: before }); toast((e as Error).message, 'error'); throw e }
  },
  remove: async (key, id) => {
    const before = get().data
    set({ data: cascade(before, key, id) })
    try { await api.remove(key, id) } catch (e) { set({ data: before }); toast((e as Error).message, 'error'); throw e }
  },
  replaceAttachments: list => set(s => ({ data: { ...s.data, attachments: list } })),
}))

export const useData = () => useStore(s => s.data)
export const useLocale = () => useStore(s => s.settings.locale)
