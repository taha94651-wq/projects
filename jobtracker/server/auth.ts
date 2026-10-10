import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { NextFunction, Request, Response } from 'express'
import { DATA_DIR, db } from './db'

const secretFile = path.join(DATA_DIR, 'session.secret')
if (!fs.existsSync(secretFile)) fs.writeFileSync(secretFile, crypto.randomBytes(48).toString('hex'), { mode: 0o600 })
const SECRET = fs.readFileSync(secretFile, 'utf8')
const COOKIE = 'jt_session'
const TTL_MS = 1000 * 60 * 60 * 24 * 30

export interface DbUser { id: string; name: string; email: string; password_hash: string; salt: string }

export const hashPassword = (password: string, salt = crypto.randomBytes(16).toString('hex')) =>
  ({ salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') })
export function verifyPassword(user: DbUser, password: string) {
  const a = Buffer.from(hashPassword(password, user.salt).hash, 'hex')
  const b = Buffer.from(user.password_hash, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
export const getUserByEmail = (email: string) => db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as DbUser | undefined
export const getUserById = (id: string) => db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser | undefined
export const userExists = () => (db.prepare('SELECT COUNT(*) c FROM users').get() as { c: number }).c > 0
export const publicUser = (u: DbUser) => ({ id: u.id, name: u.name, email: u.email })

const sign = (payload: string) => crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
export function setSession(res: Response, userId: string) {
  const payload = `${userId}.${Date.now() + TTL_MS}`
  const secure = process.env.NODE_ENV === 'production' && process.env.INSECURE_COOKIES !== '1'
  res.setHeader('Set-Cookie', `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TTL_MS / 1000}${secure ? '; Secure' : ''}`)
}
export const clearSession = (res: Response) => res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)

export function sessionUser(req: Request): DbUser | undefined {
  const raw = req.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1)
  if (!raw) return
  const [userId, exp, sig] = raw.split('.')
  if (!userId || !exp || !sig) return
  const expected = sign(`${userId}.${exp}`)
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return
  if (Number(exp) < Date.now()) return
  return getUserById(userId)
}
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = sessionUser(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  ;(req as Request & { user: DbUser }).user = user
  next()
}
/** State-changing requests must be JSON — blocks simple cross-site form posts. */
export function requireJson(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.is('application/json')) return next()
  res.status(415).json({ error: 'JSON required' })
}

const attempts = new Map<string, { n: number; until: number }>()
export function throttle(key: string): boolean {
  const a = attempts.get(key)
  return !!a && a.n >= 8 && a.until > Date.now()
}
export function recordAttempt(key: string, ok: boolean) {
  if (ok) return void attempts.delete(key)
  const a = attempts.get(key) ?? { n: 0, until: 0 }
  attempts.set(key, { n: a.n + 1, until: Date.now() + 5 * 60_000 })
}
