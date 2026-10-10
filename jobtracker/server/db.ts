import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { ENTITY_KEYS, SCHEMA } from '../shared/schema'
import { LEGACY_TYPE_MAP } from '../shared/constants'
import type { Dataset, EntityKey, Settings } from '../shared/types'

export const DATA_DIR = process.env.JOBTRACKER_DATA ?? path.resolve(process.cwd(), 'data')
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

export const db = new DatabaseSync(path.join(DATA_DIR, 'jobtracker.db'))
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')

const sqlType = { text: 'TEXT', num: 'REAL', bool: 'INTEGER' } as const

function migrate() {
  db.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, salt TEXT NOT NULL);
           CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);`)
  for (const key of ENTITY_KEYS) {
    const def = SCHEMA[key]
    const cols = Object.entries(def.cols).map(([name, type]) => {
      const fk = def.fks?.[name]
      const isRequiredFk = fk && def.required.includes(name)
      const nullable = fk && !isRequiredFk
      const base = `"${name}" ${sqlType[type]}${nullable ? '' : type === 'text' ? " NOT NULL DEFAULT ''" : type === 'bool' ? ' NOT NULL DEFAULT 0' : ''}`
      return fk ? `${base} REFERENCES ${fk[0]}(id) ON DELETE ${fk[1]}` : base
    })
    db.exec(`CREATE TABLE IF NOT EXISTS ${def.table} (id TEXT PRIMARY KEY, ${cols.join(', ')});`)
    for (const [col] of Object.entries(def.fks ?? {})) db.exec(`CREATE INDEX IF NOT EXISTS idx_${def.table}_${col} ON ${def.table}("${col}");`)
  }
}
migrate()

/** Additive migrations for databases created by earlier versions. */
function upgrade() {
  const cols = (db.prepare('PRAGMA table_info(companies)').all() as { name: string }[]).map(c => c.name)
  if (!cols.includes('interests')) db.exec("ALTER TABLE companies ADD COLUMN interests TEXT NOT NULL DEFAULT ''")
  for (const [from, to] of Object.entries(LEGACY_TYPE_MAP)) if (from !== to) db.prepare('UPDATE companies SET type = ? WHERE type = ?').run(to, from)
}
upgrade()

type Row = Record<string, unknown>
const fromRow = (key: EntityKey, row: Row): Row => {
  const out: Row = { id: row.id }
  for (const [c, type] of Object.entries(SCHEMA[key].cols)) out[c] = type === 'bool' ? row[c] === 1 : row[c]
  return out
}
function toParams(key: EntityKey, input: Row): Row {
  const def = SCHEMA[key]
  const out: Row = {}
  for (const [c, type] of Object.entries(def.cols)) {
    if (!(c in input)) continue
    let v = input[c]
    if (type === 'bool') v = v ? 1 : 0
    else if (type === 'num') v = v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v)
    else if (def.fks?.[c] && (v === '' || v == null)) v = null
    else if (type === 'text') v = v == null ? '' : String(v)
    out[c] = v as never
  }
  return out
}

export function listAll(key: EntityKey): Row[] {
  return db.prepare(`SELECT * FROM ${SCHEMA[key].table} ORDER BY rowid`).all().map(r => fromRow(key, r as Row))
}
export function getOne(key: EntityKey, id: string): Row | undefined {
  const r = db.prepare(`SELECT * FROM ${SCHEMA[key].table} WHERE id = ?`).get(id)
  return r ? fromRow(key, r as Row) : undefined
}
export function validate(key: EntityKey, input: Row, partial = false): string | null {
  for (const f of SCHEMA[key].required) {
    if (partial && !(f in input)) continue
    const v = input[f]
    if (v == null || String(v).trim() === '') return `${f} is required`
  }
  return null
}
export function insert(key: EntityKey, input: Row): Row {
  const params = toParams(key, input)
  const id = typeof input.id === 'string' && input.id ? input.id : crypto.randomUUID()
  if (!params.createdAt && 'createdAt' in SCHEMA[key].cols) params.createdAt = new Date().toISOString()
  const cols = ['id', ...Object.keys(params)]
  db.prepare(`INSERT INTO ${SCHEMA[key].table} (${cols.map(c => `"${c}"`).join(',')}) VALUES (${cols.map(() => '?').join(',')})`)
    .run(id, ...Object.values(params) as never[])
  return getOne(key, id)!
}
export function update(key: EntityKey, id: string, input: Row): Row | undefined {
  const params = toParams(key, input)
  delete params.createdAt
  const cols = Object.keys(params)
  if (cols.length) db.prepare(`UPDATE ${SCHEMA[key].table} SET ${cols.map(c => `"${c}" = ?`).join(', ')} WHERE id = ?`).run(...Object.values(params) as never[], id)
  return getOne(key, id)
}
export function remove(key: EntityKey, id: string): boolean {
  const res = db.prepare(`DELETE FROM ${SCHEMA[key].table} WHERE id = ?`).run(id)
  sweepUploads()
  return Number(res.changes) > 0
}
export function transaction<T>(fn: () => T): T {
  db.exec('BEGIN')
  try { const r = fn(); db.exec('COMMIT'); return r } catch (e) { db.exec('ROLLBACK'); throw e }
}
export function snapshot(): Dataset {
  return Object.fromEntries(ENTITY_KEYS.map(k => [k, listAll(k)])) as unknown as Dataset
}
export function clearData() {
  transaction(() => { for (const k of [...ENTITY_KEYS].reverse()) db.exec(`DELETE FROM ${SCHEMA[k].table}`) })
  sweepUploads()
}
export function loadDataset(ds: Dataset) {
  transaction(() => { for (const k of ENTITY_KEYS) for (const row of ds[k] as unknown as Row[]) insert(k, row) })
}
/** Removes uploaded files whose attachment row no longer exists (e.g. after a cascade delete). */
export function sweepUploads() {
  const ids = new Set(listAll('attachments').map(a => a.id as string))
  for (const f of fs.readdirSync(UPLOAD_DIR)) if (!ids.has(f)) fs.rmSync(path.join(UPLOAD_DIR, f), { force: true })
}

export const DEFAULT_SETTINGS: Settings = { lang: 'en', locale: 'en-GB', defaultCurrency: 'SAR', staleDays: 7 }
export function getSettings(): Settings {
  const r = db.prepare("SELECT value FROM settings WHERE key = 'app'").get() as { value: string } | undefined
  return { ...DEFAULT_SETTINGS, ...(r ? JSON.parse(r.value) : {}) }
}
export function saveSettings(s: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...s }
  db.prepare("INSERT INTO settings (key, value) VALUES ('app', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(JSON.stringify(next))
  return next
}
