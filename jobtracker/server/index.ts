import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { buildSeed } from '../shared/seed'
import { buildTargetCompanies } from '../shared/targets'
import { ENTITY_KEYS } from '../shared/schema'
import type { EntityKey } from '../shared/types'
import * as store from './db'
import { UPLOAD_DIR } from './db'
import * as auth from './auth'

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '25mb' }))
app.use('/api', auth.requireJson)
app.use((_, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'DENY'); next() })

const emptyData = { companies: [], contacts: [], applications: [], interviews: [], followUps: [], activities: [], attachments: [] }
function loadMode(mode: string) {
  if (mode === 'sample') store.loadDataset(buildSeed())
  else if (mode === 'targets') store.loadDataset({ ...emptyData, companies: buildTargetCompanies() })
}

const api = express.Router()
type AuthedReq = express.Request & { user: auth.DbUser }
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

// ---------- auth ----------
api.get('/auth/status', (req, res) => {
  const u = auth.sessionUser(req)
  res.json({ configured: auth.userExists(), user: u ? auth.publicUser(u) : null })
})
api.post('/auth/setup', (req, res) => {
  if (auth.userExists()) return res.status(403).json({ error: 'Already configured' })
  const name = str(req.body.name), email = str(req.body.email).toLowerCase(), password = String(req.body.password ?? '')
  if (!name) return res.status(400).json({ error: 'Name is required' })
  if (!validEmail(email)) return res.status(400).json({ error: 'Enter a valid email' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
  const id = crypto.randomUUID()
  const { salt, hash } = auth.hashPassword(password)
  store.db.prepare('INSERT INTO users (id, name, email, password_hash, salt) VALUES (?,?,?,?,?)').run(id, name, email, hash, salt)
  loadMode(req.body.mode ?? (req.body.sample ? 'sample' : 'empty'))
  auth.setSession(res, id)
  res.json({ user: { id, name, email } })
})
api.post('/auth/login', (req, res) => {
  const email = str(req.body.email).toLowerCase()
  if (auth.throttle(email)) return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' })
  const user = auth.getUserByEmail(email)
  const ok = !!user && auth.verifyPassword(user, String(req.body.password ?? ''))
  auth.recordAttempt(email, ok)
  if (!ok || !user) return res.status(401).json({ error: 'Incorrect email or password' })
  auth.setSession(res, user.id)
  res.json({ user: auth.publicUser(user) })
})
api.post('/auth/logout', (_req, res) => { auth.clearSession(res); res.json({ ok: true }) })

// ---------- everything below needs a session ----------
api.use(auth.requireAuth)

api.put('/auth/profile', (req, res) => {
  const u = (req as AuthedReq).user
  const name = str(req.body.name), email = str(req.body.email).toLowerCase()
  if (!name || !validEmail(email)) return res.status(400).json({ error: 'Valid name and email are required' })
  const clash = auth.getUserByEmail(email)
  if (clash && clash.id !== u.id) return res.status(409).json({ error: 'Email already in use' })
  store.db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, u.id)
  res.json({ user: { id: u.id, name, email } })
})
api.post('/auth/password', (req, res) => {
  const u = (req as AuthedReq).user
  const next = String(req.body.next ?? '')
  if (!auth.verifyPassword(u, String(req.body.current ?? ''))) return res.status(400).json({ error: 'Current password is incorrect' })
  if (next.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' })
  const { salt, hash } = auth.hashPassword(next)
  store.db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(hash, salt, u.id)
  res.json({ ok: true })
})

api.get('/bootstrap', (req, res) => {
  res.json({ user: auth.publicUser((req as AuthedReq).user), settings: store.getSettings(), data: store.snapshot() })
})
api.put('/settings', (req, res) => res.json(store.saveSettings(req.body)))
api.get('/export', (_req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="jobtracker-backup.json"')
  res.json({ exportedAt: new Date().toISOString(), settings: store.getSettings(), data: store.snapshot() })
})
api.post('/reset', (req, res) => {
  store.clearData()
  loadMode(req.body.mode)
  res.json({ data: store.snapshot() })
})

// ---------- generic CRUD ----------
const entityOf = (name: string): EntityKey | undefined => ENTITY_KEYS.find(k => k === name)
api.post('/data/:entity', (req, res) => {
  const key = entityOf(req.params.entity)
  if (!key) return res.status(404).json({ error: 'Unknown entity' })
  const items: Record<string, unknown>[] = Array.isArray(req.body) ? req.body : [req.body]
  try {
    for (const it of items) { const err = store.validate(key, it); if (err) return res.status(400).json({ error: err }) }
    const rows = store.transaction(() => items.map(it => store.insert(key, it)))
    res.status(201).json(Array.isArray(req.body) ? rows : rows[0])
  } catch (e) { res.status(400).json({ error: (e as Error).message }) }
})
api.put('/data/:entity/:id', (req, res) => {
  const key = entityOf(req.params.entity)
  if (!key) return res.status(404).json({ error: 'Unknown entity' })
  const err = store.validate(key, req.body, true)
  if (err) return res.status(400).json({ error: err })
  try {
    const row = store.update(key, req.params.id, req.body)
    row ? res.json(row) : res.status(404).json({ error: 'Not found' })
  } catch (e) { res.status(400).json({ error: (e as Error).message }) }
})
api.delete('/data/:entity/:id', (req, res) => {
  const key = entityOf(req.params.entity)
  if (!key) return res.status(404).json({ error: 'Unknown entity' })
  store.remove(key, req.params.id) ? res.json({ ok: true }) : res.status(404).json({ error: 'Not found' })
})

// ---------- attachments ----------
api.post('/attachments', (req, res) => {
  const { name, mime, data, activityId, applicationId, companyId } = req.body as Record<string, string>
  if (!name || !data) return res.status(400).json({ error: 'name and data are required' })
  const buf = Buffer.from(data, 'base64')
  if (buf.length > 15 * 1024 * 1024) return res.status(413).json({ error: 'File too large (max 15MB)' })
  const row = store.insert('attachments', { name: path.basename(name), mime: mime || 'application/octet-stream', size: buf.length, activityId, applicationId, companyId })
  fs.writeFileSync(path.join(UPLOAD_DIR, row.id as string), buf)
  res.status(201).json(row)
})
api.get('/attachments/:id/file', (req, res) => {
  const row = store.getOne('attachments', req.params.id)
  const file = path.join(UPLOAD_DIR, req.params.id)
  if (!row || !fs.existsSync(file)) return res.status(404).json({ error: 'Not found' })
  res.setHeader('Content-Type', String(row.mime))
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(String(row.name))}`)
  res.sendFile(file)
})

api.use((_req, res) => res.status(404).json({ error: 'Not found' }))
app.use('/api', api)

const dist = path.resolve(process.cwd(), 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }))
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

const port = Number(process.env.PORT ?? 3001)
app.listen(port, process.env.HOST ?? '127.0.0.1', () => console.log(`JobTracker API on http://localhost:${port}`))
