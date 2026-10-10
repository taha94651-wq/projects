import { chromium } from 'playwright-core'
const base = process.env.BASE ?? 'http://localhost:3077'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
const p = await ctx.newPage()
const errors = []; p.on('pageerror', e => errors.push(e.message))
await p.goto(base)
await p.getByLabel('Your name').fill('مصطفى طه'); await p.getByLabel('Email').fill('me@example.com'); await p.getByLabel('Password').fill('correct-horse-9')
await p.getByText('Demo data').click(); await p.getByRole('button', { name: 'Create account' }).click()
await p.waitForSelector('text=Application pipeline')
await p.goto(base + '/settings'); await p.getByLabel('Language', { exact: true }).selectOption('ar'); await p.waitForSelector('html[lang=ar]'); await p.waitForTimeout(800)
for (const path of ['/', '/companies', '/compare', '/follow-ups', '/applications']) {
  await p.goto(base + path); await p.waitForLoadState('networkidle'); await p.waitForTimeout(400)
  await p.screenshot({ path: `shots/ar${path.replace(/\W+/g, '_')}.png`, fullPage: false })
}
await p.goto(base + '/compare?ids=co_alnoor,co_gulfretail,co_capital'); await p.waitForTimeout(500)
await p.screenshot({ path: 'shots/ar_compare_companies.png', fullPage: true })
const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, storageState: await ctx.storageState() })).newPage()
await m.goto(base); await m.waitForTimeout(900); await m.screenshot({ path: 'shots/ar_mobile.png' })
console.log(errors.length ? errors.join('\n') : 'no errors'); await b.close()
