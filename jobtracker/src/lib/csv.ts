import { IS_DEMO } from '../env'
import { toast } from '../ui-store'
export type CsvValue = string | number | boolean | null | undefined
export function toCsv<T>(rows: T[], columns: { header: string; value: (r: T) => CsvValue }[]): string {
  const esc = (v: CsvValue) => {
    let s = v == null ? '' : String(v)
    if (/^[=+\-@\t\r]/.test(s) && Number.isNaN(Number(s))) s = `'${s}` // neutralise spreadsheet formula injection
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [columns.map(c => esc(c.header)).join(','), ...rows.map(r => columns.map(c => esc(c.value(r))).join(','))].join('\r\n')
}
export function downloadFile(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  if (IS_DEMO) { // file downloads are blocked inside the preview frame: copy instead
    void navigator.clipboard?.writeText(content).then(() => toast(`${filename} copied to clipboard (downloads are off in the preview)`), () => toast('Export is available in the full app', 'info'))
    return
  }
  const blob = new Blob(['﻿', content], { type: mime }) // BOM so Excel opens UTF-8 (Arabic) correctly
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
/** RFC-4180-ish parser: quoted fields, escaped quotes, CRLF/LF, comma / semicolon / tab delimiter auto-detected. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '')
  const first = src.split(/\r?\n/, 1)[0] ?? ''
  const delim = [',', ';', '\t'].map(d => [d, first.split(d).length] as const).sort((a, b) => b[1] - a[1])[0][0]
  const rows: string[][] = []
  let row: string[] = [], cell = '', q = false
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (q) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') q = false
      else cell += c
    } else if (c === '"') q = true
    else if (c === delim) { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && src[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = '' }
    else cell += c
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows.filter(r => r.some(c => c.trim() !== ''))
}
