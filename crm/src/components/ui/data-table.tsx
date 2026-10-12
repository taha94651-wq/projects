"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Select } from "./input";
import { EmptyState } from "./card";
import { useI18n } from "@/lib/i18n";

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Sort accessor; omit for non-sortable. */
  sort?: (row: T) => string | number;
  cell: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  pageSize = 25,
  selectable,
  selected,
  onSelectedChange,
  onRowClick,
  empty,
  initialSort,
  rowClassName,
}: {
  rows: T[];
  columns: Column<T>[];
  pageSize?: number;
  selectable?: boolean;
  selected?: Set<string>;
  onSelectedChange?: (s: Set<string>) => void;
  onRowClick?: (r: T) => void;
  empty?: ReactNode;
  initialSort?: { key: string; dir: "asc" | "desc" };
  rowClassName?: (r: T) => string;
}) {
  const { t, locale } = useI18n();
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(pageSize);
  useEffect(() => setSize(pageSize), [pageSize]);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sort) return rows;
    const f = col.sort;
    const coll = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
    const m = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = f(a);
      const y = f(b);
      // empty values always last, regardless of direction
      const xe = x === "" || x === undefined || x === null;
      const ye = y === "" || y === undefined || y === null;
      if (xe || ye) return xe === ye ? 0 : xe ? 1 : -1;
      return m * (typeof x === "number" && typeof y === "number" ? x - y : coll.compare(String(x), String(y)));
    });
  }, [rows, sort, columns, locale]);

  const pages = Math.max(1, Math.ceil(sortedRows.length / size));
  useEffect(() => {
    if (page > pages - 1) setPage(pages - 1);
  }, [pages, page]);
  const view = sortedRows.slice(page * size, page * size + size);
  const allOnPage = view.length > 0 && view.every((r) => selected?.has(r.id));

  const toggleAll = () => {
    if (!onSelectedChange) return;
    const n = new Set(selected);
    if (allOnPage) view.forEach((r) => n.delete(r.id));
    else view.forEach((r) => n.add(r.id));
    onSelectedChange(n);
  };
  const toggle = (id: string) => {
    if (!onSelectedChange) return;
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    onSelectedChange(n);
  };

  return (
    <div>
      <div className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-start text-xs text-muted-foreground">
              {selectable && (
                <th className="w-10 px-3 py-2.5">
                  <input type="checkbox" aria-label={t("selectAll")} checked={allOnPage} onChange={toggleAll} className="size-4 accent-[hsl(var(--bronze))]" />
                </th>
              )}
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th key={c.key} className={cn("px-3 py-2.5 text-start font-medium", c.className)} aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}>
                    {c.sort ? (
                      <button
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() => setSort(active ? (sort!.dir === "asc" ? { key: c.key, dir: "desc" } : null) : { key: c.key, dir: "asc" })}
                      >
                        {c.header}
                        {active ? sort!.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ChevronsUpDown className="size-3 opacity-40" />}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr
                key={r.id}
                className={cn("border-b last:border-0 hover:bg-accent/40", onRowClick && "cursor-pointer", selected?.has(r.id) && "bg-accent/60", rowClassName?.(r))}
                onClick={() => onRowClick?.(r)}
              >
                {selectable && (
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" aria-label={t("select")} checked={!!selected?.has(r.id)} onChange={() => toggle(r.id)} className="size-4 accent-[hsl(var(--bronze))]" />
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-3 py-2.5 align-middle", c.className)}>
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (empty ?? <EmptyState title={t("noResults")} />)}
      {rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
          <span>
            {t("showing", { from: page * size + 1, to: Math.min(rows.length, page * size + size), total: rows.length })}
          </span>
          <div className="flex items-center gap-2">
            <Select className="h-8 w-auto text-xs" value={size} onChange={(e) => { setSize(+e.target.value); setPage(0); }} aria-label={t("rowsPerPage")}>
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
            <Button variant="outline" size="iconSm" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label={t("prev")}>
              <ChevronLeft className="rtl-flip" />
            </Button>
            <span>
              {page + 1} / {pages}
            </span>
            <Button variant="outline" size="iconSm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} aria-label={t("next")}>
              <ChevronRight className="rtl-flip" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
