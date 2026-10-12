"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { sorted } from "@/lib/store/selectors";

function useOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && cb();
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  });
}

interface Group {
  id: string;
  label: string;
  items: { id: string; label: string }[];
}

/** Grouped multi-select (categories & services, custom multiselect fields). */
export function GroupedMultiSelect({
  groups,
  value,
  onChange,
  placeholder,
  invalid,
}: {
  groups: Group[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  const labels = useMemo(() => new Map(groups.flatMap((g) => g.items.map((i) => [i.id, i.label] as const))), [groups]);
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  const ql = q.trim().toLowerCase();

  return (
    <div ref={ref} className="relative">
      <div
        role="combobox"
        aria-expanded={open}
        aria-invalid={invalid}
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpen(!open))}
        className={cn("flex min-h-9 w-full cursor-pointer flex-wrap items-center gap-1 rounded-md border border-input bg-card px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", invalid && "border-destructive")}
      >
        {value.length === 0 && <span className="px-1 text-muted-foreground">{placeholder ?? t("select")}</span>}
        {value.map((id) => (
          <span key={id} className="inline-flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">
            {labels.get(id) ?? "?"}
            <button type="button" aria-label="remove" onClick={(e) => { e.stopPropagation(); toggle(id); }}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        <ChevronDown className="ms-auto size-4 shrink-0 text-muted-foreground" />
      </div>
      {open && (
        <div className="absolute z-40 mt-1 max-h-72 w-full min-w-[16rem] overflow-y-auto rounded-md border bg-card p-1 shadow-lg scroll-thin">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            className="mb-1 h-8 w-full rounded border border-input bg-background px-2 text-sm focus:outline-none"
          />
          {groups.map((g) => {
            const items = g.items.filter((i) => !ql || i.label.toLowerCase().includes(ql));
            if (!items.length) return null;
            return (
              <div key={g.id}>
                {g.label && <div className="px-2 pb-0.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</div>}
                {items.map((i) => (
                  <label key={i.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent">
                    <input type="checkbox" checked={value.includes(i.id)} onChange={() => toggle(i.id)} className="size-4 accent-[hsl(var(--bronze))]" />
                    {i.label}
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Category tree picker (groups -> subcategories) used for lead / project / company forms. */
export function CategoryPicker({ value, onChange, invalid }: { value: string[]; onChange: (v: string[]) => void; invalid?: boolean }) {
  const { db } = useStore();
  const { name, t } = useI18n();
  const groups = useMemo(
    () =>
      sorted(db.categories.filter((c) => !c.parentId)).map((g) => ({
        id: g.id,
        label: name(g),
        items: sorted(db.categories.filter((c) => c.parentId === g.id)).map((c) => ({ id: c.id, label: name(c) })),
      })),
    [db.categories, name],
  );
  return <GroupedMultiSelect groups={groups} value={value} onChange={onChange} invalid={invalid} placeholder={t("selectCategories")} />;
}
