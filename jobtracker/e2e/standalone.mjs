// Opens dist-demo/Pipeline-Job-Tracker.html straight from disk (file://) like a user would, and exercises the main flows.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'
const file = 'file://' + path.resolve('dist-demo/Pipeline-Job-Tracker.html')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
let fail = 0; const ok = (n, c, x = '') => { console.log(`${c ? '✓' : '✗ FAIL'} ${n}${c ? '' : ' ' + x}`); if (!c) fail++ }
const errors = []
const toast = async (p, text) => { try { await p.locator('[role=status]', { hasText: text }).first().waitFor({ timeout: 4000 }); return true } catch { return false } }

const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true })
const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type() === 'error' && !/fonts\.g|ERR_INTERNET|Failed to load resource/.test(m.text()) && errors.push(m.text()))
await p.goto(file); await p.waitForSelector('text=Application pipeline')
ok('opens straight from disk, no login', true)
ok('banner: saved in this browser', await p.getByText('saved in this browser only').isVisible())
await p.getByRole('link', { name: 'Companies' }).first().click(); await p.waitForSelector('table tbody tr')
ok('starts with your 13 offices', (await p.locator('table tbody tr').count()) === 13)

// add + persist across a reload
await p.getByRole('button', { name: 'Add company' }).first().click()
await p.getByLabel(/Company name/).fill('Standalone Test Co'); await p.getByRole('button', { name: 'Add company' }).last().click()
ok('add company', await toast(p, 'Company added'))
await p.reload(); await p.waitForSelector('main h1')
await p.getByRole('link', { name: 'Companies' }).first().click(); await p.waitForSelector('table tbody tr')
ok('data survives a reload', await p.getByRole('link', { name: 'Standalone Test Co' }).isVisible())

// contact attempt → automatic updates + suggestions
await p.getByRole('link', { name: 'Standalone Test Co' }).click()
await p.getByRole('button', { name: 'Add attempt' }).first().click()
await p.getByLabel('Email address').fill('hr@standalone.example.com')
await p.getByRole('button', { name: 'Add attempt' }).last().click()
await p.getByRole('heading', { name: 'Attempt saved' }).waitFor()
const dlg = await p.locator('dialog[open]').innerText()
ok('attempt → status, timeline, follow-up + suggestions', dlg.includes('Company status → Contacted') && dlg.includes('Follow-up scheduled') && dlg.includes('Prepare your next touch'))
await p.getByRole('button', { name: 'Done', exact: true }).click()

// attachment upload + real download
await p.getByRole('button', { name: 'Log activity' }).first().click()
await p.getByLabel(/Description/).fill('Sent CV')
fs.writeFileSync('/tmp/cv-test.txt', 'my cv')
await p.locator('input[type=file]').setInputFiles('/tmp/cv-test.txt')
await p.getByRole('button', { name: 'Log activity' }).last().click()
await p.getByRole('link', { name: 'cv-test.txt' }).waitFor()
const [att] = await Promise.all([p.waitForEvent('download'), p.getByRole('link', { name: 'cv-test.txt' }).click()])
ok('attachment downloads with its content', fs.readFileSync(await att.path(), 'utf8') === 'my cv' && att.suggestedFilename() === 'cv-test.txt')

// exports are real downloads here
await p.getByRole('link', { name: 'Settings' }).first().click()
const [bk] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: /Full backup/ }).click()])
const backup = JSON.parse(fs.readFileSync(await bk.path(), 'utf8').replace(/^﻿/, ''))
ok('JSON backup downloads with all data', backup.data.companies.length === 14 && backup.data.attempts.length === 1 && backup.data.attachments.length === 1)
await p.getByRole('link', { name: 'Companies' }).first().click(); await p.waitForSelector('table tbody tr')
const [csv] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Export CSV' }).click()])
ok('companies CSV downloads', fs.readFileSync(await csv.path(), 'utf8').includes('Standalone Test Co'))

// classification, compare, suggestions, calendar, analytics all open
await p.getByLabel('Select row').nth(0).check(); await p.getByLabel('Select row').nth(1).check()
await p.getByLabel('Set category', { exact: true }).selectOption('Developer')
ok('bulk classify', await toast(p, '2 companies updated'))
for (const n of ['Compare', 'Suggestions', 'Calendar', 'Analytics', 'Interviews', 'Follow-ups', 'Contacts', 'Applications']) { await p.getByRole('link', { name: n, exact: true }).first().click(); await p.waitForTimeout(150) }
ok('every page opens', true)

// Arabic + RTL persists across reload
await p.getByRole('link', { name: 'Settings' }).first().click()
await p.getByLabel('Language', { exact: true }).selectOption('ar')
await p.waitForSelector('html[lang=ar]'); await p.getByRole('heading', { name: 'الإعدادات' }).waitFor()
ok('Arabic / RTL', (await p.evaluate(() => document.documentElement.dir)) === 'rtl')
await p.reload(); await p.waitForSelector('html[lang=ar]')
await p.getByRole('heading', { name: 'الإعدادات' }).waitFor()
ok('language and page persist after reload', (await p.evaluate(() => document.documentElement.dir)) === 'rtl')
await ctx.close()

// Edge "tracking prevention" can block storage entirely — the app must still open and work for the session
const ctx2 = await b.newContext({ viewport: { width: 1360, height: 900 } })
await ctx2.addInitScript(() => { for (const k of ['localStorage', 'sessionStorage']) Object.defineProperty(window, k, { get() { throw new DOMException('blocked', 'SecurityError') } }) })
const q = await ctx2.newPage(); q.on('pageerror', e => errors.push('blocked-storage: ' + e.message))
await q.goto(file); await q.waitForSelector('text=Application pipeline')
await q.getByRole('link', { name: 'Companies' }).first().click(); await q.waitForSelector('table tbody tr')
ok('opens and works even when browser storage is blocked', (await q.locator('table tbody tr').count()) === 13)
await q.getByRole('button', { name: 'Add company' }).first().click(); await q.getByLabel(/Company name/).fill('No Storage Co'); await q.getByRole('button', { name: 'Add company' }).last().click()
ok('can still add records in that session', await toast(q, 'Company added'))

// phone width
const ctx3 = await b.newContext({ viewport: { width: 390, height: 844 } })
const m = await ctx3.newPage(); await m.goto(file); await m.waitForSelector('text=Application pipeline')
ok('no horizontal overflow on a phone', !(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)))
await b.close()
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors'); process.exit(fail || errors.length ? 1 : 0)
