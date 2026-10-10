// Lists every translatable key (auto-wrapped JSX strings + manual t('…') calls). Usage: npx tsx scripts/i18n-keys.ts [--missing]
import fs from 'node:fs'
import path from 'node:path'
import { transformSource } from '../build/i18n-transform'
import { ar } from '../src/i18n-ar'

const keys = new Set<string>()
const walk = (d: string) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) {
  const p = path.join(d, f.name)
  if (f.isDirectory()) walk(p)
  else if (/\.(tsx?|ts)$/.test(f.name) && !/i18n-ar|\.test\./.test(f.name)) {
    const code = fs.readFileSync(p, 'utf8')
    if (f.name.endsWith('.tsx')) transformSource(code, p).keys.forEach(k => keys.add(k))
    for (const m of code.matchAll(/\btr?\(\s*(["'])((?:\\.|(?!\1).)*)\1/g)) keys.add(m[2].replace(/\\'/g, "'"))
  }
} }
walk('src')
const list = [...keys].sort()
if (process.argv.includes('--missing')) {
  const missing = list.filter(k => !(k in ar))
  console.log(missing.map(k => JSON.stringify(k)).join('\n'))
  console.error(`${missing.length} missing of ${list.length}`)
  process.exit(missing.length ? 1 : 0)
}
console.log(list.map(k => JSON.stringify(k)).join('\n'))
console.error(`${list.length} keys`)
