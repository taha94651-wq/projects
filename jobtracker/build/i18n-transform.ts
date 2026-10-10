import { parse } from '@babel/parser'
import MagicString from 'magic-string'

/**
 * Build-time i18n: wraps static UI strings in `__t(...)` so the source stays readable English.
 *  - JSX text:            <b>Add company</b>        → <b>{__t("Add company")}</b>
 *  - UI attributes:       placeholder / aria-label / title / label / hint / … (incl. ternary branches)
 *  - object properties:   { label: 'Table' }, { header: 'Company' }, …
 *  - enum-like members:   {a.status}, {c.type} …     → {__tv(a.status)}
 * Dynamic strings (template literals, concatenation) are translated by hand with t('… {name}', { name }).
 */
const ATTRS = new Set(['placeholder', 'aria-label', 'title', 'label', 'hint', 'description', 'all', 'submitLabel', 'confirmLabel', 'text', 'alt', 'empty', 'subtitle'])
const PROPS = new Set(['label', 'header', 'title', 'text', 'hint', 'message', 'confirmLabel', 'placeholder', 'description'])
const ENUM_MEMBERS = new Set(['type', 'status', 'priority', 'workType', 'employmentType', 'source', 'result', 'size'])
const CALLS = new Set(['toast'])

type N = { type: string; start: number; end: number; [k: string]: unknown }

export function transformSource(code: string, file = ''): { code: string; keys: Set<string>; changed: boolean } {
  const keys = new Set<string>()
  const s = new MagicString(code)
  let changed = false
  const ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'], sourceFilename: file })

  const wrapLiteral = (n: N, braces = false) => {
    const value = n.value as string
    if (!/[A-Za-z]/.test(value)) return
    keys.add(value)
    const call = `__t(${JSON.stringify(value)})`
    s.overwrite(n.start, n.end, braces ? `{${call}}` : call)
    changed = true
  }
  /** Wrap string literals that end up as the displayed value (direct, ternary branches, `||`/`??` fallbacks). */
  const wrapResult = (n: N | null | undefined) => {
    if (!n) return
    if (n.type === 'StringLiteral') wrapLiteral(n)
    else if (n.type === 'ConditionalExpression') { wrapResult(n.consequent as N); wrapResult(n.alternate as N) }
    else if (n.type === 'LogicalExpression') wrapResult(n.right as N)
  }

  const walk = (node: unknown, parent?: N) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) { node.forEach(c => walk(c, parent)); return }
    const n = node as N
    if (typeof n.type !== 'string') return

    if (n.type === 'JSXText') {
      const raw = code.slice(n.start, n.end)
      const lead = raw.match(/^\s*/)![0], trail = raw.match(/\s*$/)![0]
      const body = raw.slice(lead.length, raw.length - trail.length)
      if (/[A-Za-z]/.test(body)) {
        // keep leading / trailing punctuation (· — : ( ) + →) outside the translated key
        const m = body.match(/^([^A-Za-z0-9]*)([\s\S]*?)([^A-Za-z0-9.!?…%]*)$/)!
        const [, pre, core, post] = m
        if (/[A-Za-z]/.test(core)) {
          keys.add(core)
          s.overwrite(n.start, n.end, `${lead}${pre}{__t(${JSON.stringify(core)})}${post}${trail}`)
          changed = true
        }
      }
      return
    }
    if (n.type === 'JSXAttribute') {
      const name = (n.name as N & { name: string }).name
      const value = n.value as N | null
      if (ATTRS.has(name) && value) {
        if (value.type === 'StringLiteral') wrapLiteral(value, true) // attr="x" → attr={__t("x")}
        else if (value.type === 'JSXExpressionContainer') wrapResult(value.expression as N)
      }
      walk(value, n)
      return
    }
    if (n.type === 'JSXExpressionContainer' && parent?.type !== 'JSXAttribute') {
      const e = n.expression as N
      if (e.type === 'MemberExpression' && !e.computed && ENUM_MEMBERS.has((e.property as N & { name: string }).name) && (e.object as N).type !== 'ThisExpression') {
        s.prependLeft(e.start, '__tv(')
        s.appendRight(e.end, ')')
        changed = true
        return
      }
    }
    if (n.type === 'ObjectProperty' && !n.computed) {
      const k = n.key as N & { name?: string; value?: string }
      const key = k.name ?? k.value
      if (key && PROPS.has(key)) wrapResult(n.value as N)
    }
    if (n.type === 'CallExpression') {
      const c = n.callee as N & { name?: string }
      if (c.type === 'Identifier' && c.name && CALLS.has(c.name)) wrapResult((n.arguments as N[])[0])
    }
    for (const key of Object.keys(n)) {
      if (key === 'loc' || key === 'start' || key === 'end' || key === 'extra') continue
      walk(n[key], n)
    }
  }
  walk(ast.program)
  if (changed) s.prepend(`import { t as __t, tv as __tv } from '@/i18n';\n`)
  return { code: s.toString(), keys, changed }
}
