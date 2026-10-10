import { chromium } from 'playwright-core'
const base = process.env.BASE ?? 'http://localhost:3077'
const exe = process.env.CHROMIUM ?? '/opt/pw-browsers/chromium'
const browser = await chromium.launch({ executablePath: exe })
const errors = []
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
page.on('pageerror', e => errors.push('pageerror: ' + e.message))
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
await page.goto(base)
await page.screenshot({ path: 'shots/00-setup.png' })
if (await page.getByLabel('Your name').count()) {
await page.getByLabel('Your name').fill('Mostafa Taha')
await page.getByLabel('Email').fill('me@example.com')
await page.getByLabel('Password').fill('correct-horse-9')
await page.getByText('Demo data').click()
await page.getByRole('button', { name: 'Create account' }).click()
} else { await page.getByLabel('Email').fill('me@example.com'); await page.getByLabel('Password').fill('correct-horse-9'); await page.getByRole('button', { name: 'Sign in' }).click() }
await page.waitForSelector('text=Application pipeline')
const pages = ['/', '/companies', '/applications', '/interviews', '/follow-ups', '/contacts', '/calendar', '/analytics', '/settings', '/companies/co_alnoor', '/applications/ap_alnoor', '/contacts/ct_ahmed']
for (const p of pages) {
  await page.goto(base + p); await page.waitForLoadState('networkidle'); await page.waitForTimeout(250)
  await page.screenshot({ path: `shots/d${p.replace(/\W+/g, '_')}.png`, fullPage: true })
}
await ctx.close()
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true })
const mp = await m.newPage()
mp.on('pageerror', e => errors.push('m pageerror: ' + e.message))
await mp.goto(base); await mp.getByLabel('Email').fill('me@example.com'); await mp.getByLabel('Password').fill('correct-horse-9'); await mp.getByRole('button', { name: 'Sign in' }).click()
await mp.waitForSelector('text=Application pipeline')
for (const p of ['/', '/applications', '/follow-ups', '/calendar', '/companies', '/interviews', '/contacts', '/analytics', '/settings', '/applications/ap_alnoor', '/companies/co_alnoor']) {
  await mp.goto(base + p); await mp.waitForLoadState('networkidle'); await mp.waitForTimeout(250)
  await mp.screenshot({ path: `shots/m${p.replace(/\W+/g, '_')}.png`, fullPage: true })
  const over = await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  if (over) errors.push(`horizontal overflow on mobile ${p}`)
}
const t = await browser.newContext({ viewport: { width: 820, height: 1100 } })
const tp = await t.newPage()
await tp.goto(base); await tp.getByLabel('Email').fill('me@example.com'); await tp.getByLabel('Password').fill('correct-horse-9'); await tp.getByRole('button', { name: 'Sign in' }).click()
await tp.waitForSelector('text=Application pipeline')
for (const p of ['/', '/applications', '/companies']) { await tp.goto(base + p); await tp.waitForLoadState('networkidle'); await tp.screenshot({ path: `shots/t${p.replace(/\W+/g, '_')}.png` }); if (await tp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) errors.push('overflow tablet ' + p) }
await browser.close()
console.log(errors.length ? errors.join('\n') : 'no errors')
