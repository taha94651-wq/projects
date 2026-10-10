// Persistence checks for the preview build: artifact database, recovery of older browser data, graceful fallback.
import { chromium } from 'playwright-core'
import http from 'node:http'
import fs from 'node:fs'
const frag = fs.readFileSync('dist-demo/preview-fragment.html', 'utf8')
const doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}</style></head><body>${frag}</body></html>`
const srv = http.createServer((_, res) => { res.setHeader('content-type', 'text/html'); res.end(doc) }).listen(0)
const base = `http://localhost:${srv.address().port}/`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
let fail = 0; const ok = (n, c, x = '') => { console.log(`${c ? '✓' : '✗ FAIL'} ${n}${c ? '' : ' ' + x}`); if (!c) fail++ }
const errors = []

const fakeDb = (initial, broken = false) => `
  window.__store = ${JSON.stringify(initial)};
  const mk = p => ({ get: async () => { if (${broken}) throw new Error('down'); return { exists: p in window.__store, data: () => window.__store[p] } },
                     set: async d => { if (${broken}) throw new Error('down'); window.__store[p] = JSON.parse(JSON.stringify(d)) }, update: async () => {} });
  window.claude = { use: async n => (n === 'db' ? { doc: mk, collection: () => ({}) } : null) };`
const legacy = { data: {
  companies: [{ id: 'c1', name: 'Legacy Co', type: 'Design', industry: '', location: '', website: '', priority: 'High', status: 'Target', description: '', size: '', linkedin: '', notes: '', archived: false, createdAt: '2026-10-01' }],
  attempts: [{ id: 'a1', companyId: 'c1', method: 'WhatsApp', emailKind: '', contact: '+966 50 111 2222', date: '2026-10-05', response: 'Replied', reply: 'Send CV', progress: 'Sent', createdAt: '2026-10-05' }],
}, settings: { lang: 'en', locale: 'en-GB', defaultCurrency: 'SAR', staleDays: 7 } }

// A: first run on the database, with an older build's data still in this browser
const ctxA = await b.newContext({ viewport: { width: 1300, height: 900 } })
await ctxA.addInitScript(fakeDb({}))
await ctxA.addInitScript(`try { localStorage.setItem('pipeline-preview-v4', ${JSON.stringify(JSON.stringify(legacy))}) } catch {}`)
const a = await ctxA.newPage(); a.on('pageerror', e => errors.push(e.message))
await a.goto(base); await a.waitForSelector('text=Application pipeline')
ok('banner says changes are saved with the page', await a.getByText('saved with this page').isVisible())
await a.getByRole('link', { name: 'Companies' }).first().click(); await a.waitForSelector('table tbody tr')
ok('data from an older build is recovered', await a.getByRole('link', { name: 'Legacy Co' }).isVisible())
await a.getByRole('button', { name: 'Add company' }).first().click()
await a.getByLabel(/Company name/).fill('Persist Test Co'); await a.getByRole('button', { name: 'Add company' }).last().click()
await a.locator('[role=status]', { hasText: 'Company added' }).waitFor()
await a.waitForTimeout(900)
const stored = await a.evaluate(() => window.__store['pipeline/state'])
ok('state written to the database document', !!stored && stored.payload.includes('Persist Test Co') && stored.payload.includes('Legacy Co') && stored.payload.includes('+966 50 111 2222'))
const snapshot = await a.evaluate(() => window.__store)
await ctxA.close()

// B: a different device — empty browser storage, same database
const ctxB = await b.newContext({ viewport: { width: 1300, height: 900 } })
await ctxB.addInitScript(fakeDb(snapshot))
const bp = await ctxB.newPage(); bp.on('pageerror', e => errors.push(e.message))
await bp.goto(base); await bp.waitForSelector('text=Application pipeline')
await bp.getByRole('link', { name: 'Companies' }).first().click(); await bp.waitForSelector('table tbody tr')
ok('a fresh device loads the saved data from the database', await bp.getByRole('link', { name: 'Persist Test Co' }).isVisible() && await bp.getByRole('link', { name: 'Legacy Co' }).isVisible())
await bp.getByRole('link', { name: 'Legacy Co' }).click()
await bp.getByRole('link', { name: '+966 50 111 2222' }).waitFor({ timeout: 5000 }).catch(() => {})
ok('contact attempts survive', await bp.getByRole('link', { name: '+966 50 111 2222' }).isVisible())
await ctxB.close()

// C: database unavailable — still works from this browser
const ctxC = await b.newContext({ viewport: { width: 1300, height: 900 } })
await ctxC.addInitScript(fakeDb({}, true))
const c = await ctxC.newPage(); c.on('pageerror', e => errors.push(e.message))
await c.goto(base); await c.waitForSelector('text=Application pipeline')
ok('falls back to browser storage when the database fails', await c.getByText('saved in this browser only').isVisible())
await c.getByRole('link', { name: 'Companies' }).first().click(); await c.waitForSelector('table tbody tr')
ok('still shows the 13 offices', (await c.locator('table tbody tr').count()) === 13)
await ctxC.close()

// D: no capability at all (e.g. opened outside the viewer)
const ctxD = await b.newContext({ viewport: { width: 1300, height: 900 } })
const d = await ctxD.newPage(); d.on('pageerror', e => errors.push(e.message))
await d.goto(base); await d.waitForSelector('text=Application pipeline')
ok('works with no database capability', await d.getByText('saved in this browser only').isVisible())
await b.close(); srv.close()
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors'); process.exit(fail || errors.length ? 1 : 0)
