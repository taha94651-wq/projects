import { t } from '@/i18n'
import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cx } from './Badge'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  /** Provide to make the column sortable. */
  sort?: (row: T) => string | number | null | undefined
  className?: string
  /** Hide the column below this breakpoint. */
  hideBelow?: 'lg' | 'xl' | '2xl'
}
type Dir = 'asc' | 'desc'

export function DataTable<T>({ rows, columns, rowKey, onRowClick, defaultSort, renderCard, empty, label, selection }: {
  rows: T[]; columns: Column<T>[]; rowKey: (r: T) => string; onRowClick?: (r: T) => void
  defaultSort?: { key: string; dir: Dir }; renderCard?: (r: T) => ReactNode; empty: ReactNode; label: string
  /** Adds a checkbox column. */
  selection?: { ids: Set<string>; onChange: (ids: Set<string>) => void }
}) {
  const [sort, setSort] = useState(defaultSort)
  const sorted = useMemo(() => {
    const col = columns.find(c => c.key === sort?.key)
    if (!col?.sort || !sort) return rows
    const f = col.sort, m = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const x = f(a), y = f(b)
      if (x == null || x === '') return y == null || y === '' ? 0 : 1 // blanks always last
      if (y == null || y === '') return -1
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: 'base' })) * m
    })
  }, [rows, columns, sort])
  const hide = { lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell', '2xl': 'hidden 2xl:table-cell' }

  if (!rows.length) return <div className="card">{empty}</div>
  return (
    <>
      <div className={cx('card scroll-thin overflow-x-auto', renderCard && 'hidden md:block')}>
        <table className="w-full min-w-[640px] text-sm" aria-label={label}>
          <thead>
            <tr className="border-b border-ink-100 text-[11.5px] uppercase tracking-wider text-ink-400">
              {selection && (
                <th scope="col" className="w-10 px-4 py-3">
                  <input type="checkbox" aria-label={t('Select all')} className="size-4 accent-brand-600" checked={sorted.length > 0 && sorted.every(r => selection.ids.has(rowKey(r)))}
                    onChange={e => selection.onChange(e.target.checked ? new Set([...selection.ids, ...sorted.map(rowKey)]) : new Set([...selection.ids].filter(id => !sorted.some(r => rowKey(r) === id))))} />
                </th>
              )}
              {columns.map(c => (
                <th key={c.key} scope="col" className={cx('whitespace-nowrap px-4 py-3 text-start font-semibold', c.hideBelow && hide[c.hideBelow], c.className)}
                  aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {c.sort ? (
                    <button className="th-sort uppercase tracking-wider hover:text-ink-700" onClick={() => setSort(s => ({ key: c.key, dir: s?.key === c.key && s.dir === 'asc' ? 'desc' : 'asc' }))}>
                      {c.header}
                      {sort?.key === c.key ? (sort.dir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ChevronsUpDown className="size-3 opacity-40" />}
                    </button>
                  ) : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(r => (
              <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={cx('border-b border-ink-100 last:border-0 transition-colors', onRowClick && 'cursor-pointer hover:bg-brand-50/40')}>
                {selection && (
                  <td className="w-10 px-4 py-3" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" aria-label={t('Select row')} className="size-4 accent-brand-600" checked={selection.ids.has(rowKey(r))}
                      onChange={e => { const n = new Set(selection.ids); e.target.checked ? n.add(rowKey(r)) : n.delete(rowKey(r)); selection.onChange(n) }} />
                  </td>
                )}
                {columns.map(c => <td key={c.key} className={cx('px-4 py-3 align-middle', c.hideBelow && hide[c.hideBelow], c.className)}>{c.render(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderCard && (
        <ul className="grid gap-3 md:hidden" aria-label={label}>
          {sorted.map(r => <li key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cx('card p-4', onRowClick && 'cursor-pointer active:bg-ink-50')}>{renderCard(r)}</li>)}
        </ul>
      )}
    </>
  )
}
