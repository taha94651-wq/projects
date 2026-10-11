import { chromium } from 'playwright-core'
const base = process.env.BASE ?? 'http://localhost:3077'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage()
await p.goto(base); await p.getByLabel('Email').fill('me@example.com'); await p.getByLabel('Password').fill('correct-horse-9'); await p.getByRole('button', { name: 'Sign in' }).click()
await p.waitForSelector('text=Application pipeline')
for (const path of process.argv.slice(2)) {
  await p.goto(base + path); await p.waitForLoadState('networkidle')
  const res = await p.evaluate(() => {
    const out = []
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      if (r.right > window.innerWidth + 1 && r.width > 0) {
        // skip if inside a horizontally scrollable ancestor
        let a = el.parentElement, scroll = false
        while (a) { const s = getComputedStyle(a); if (/(auto|scroll)/.test(s.overflowX) && a !== document.body && a !== document.documentElement) { scroll = true; break } a = a.parentElement }
        if (!scroll) out.push(`${el.tagName}.${String(el.className).slice(0, 60)} right=${Math.round(r.right)}`)
      }
    }
    return out.slice(0, 8)
  })
  console.log(path, res)
}
await b.close()
