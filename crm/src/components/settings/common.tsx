"use client";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";

/** Re-index `sort` after moving item `id` up/down inside `list` (already in display order). */
export function reorder<T extends { id: string; sort: number }>(list: T[], id: string, dir: -1 | 1): T[] | null {
  const i = list.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return null;
  const arr = [...list];
  [arr[i], arr[j]] = [arr[j], arr[i]];
  return arr.map((x, k) => ({ ...x, sort: k }));
}

export function RowActions({ onUp, onDown, onEdit, onDelete, first, last }: { onUp?: () => void; onDown?: () => void; onEdit?: () => void; onDelete?: () => void; first?: boolean; last?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex shrink-0 items-center">
      {onUp && <Button size="iconSm" variant="ghost" disabled={first} onClick={onUp} aria-label={t("moveUp")}><ArrowUp /></Button>}
      {onDown && <Button size="iconSm" variant="ghost" disabled={last} onClick={onDown} aria-label={t("moveDown")}><ArrowDown /></Button>}
      {onEdit && <Button size="iconSm" variant="ghost" onClick={onEdit} aria-label={t("edit")}><Pencil /></Button>}
      {onDelete && <Button size="iconSm" variant="ghost" className="text-destructive" onClick={onDelete} aria-label={t("delete")}><Trash2 /></Button>}
    </div>
  );
}

export function UsageBadge({ n }: { n: number }) {
  const { t } = useI18n();
  if (!n) return null;
  return <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">{t("inUse", { n })}</span>;
}

/**
 * Deleting something that is in use never silently destroys data: the user must pick a replacement
 * (or explicitly leave the field empty where allowed) and every affected record is updated first.
 */
export function DeleteDialog({
  open,
  title,
  used,
  usedLabel,
  candidates,
  allowEmpty,
  extra,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  used: number;
  usedLabel?: string;
  candidates: { id: string; label: string }[];
  allowEmpty: boolean;
  extra?: ReactNode;
  onCancel: () => void;
  onConfirm: (replacementId: string) => void;
}) {
  const { t } = useI18n();
  const [rep, setRep] = useState("");
  useEffect(() => setRep(""), [open]);
  const needs = used > 0;
  const blocked = needs && !allowEmpty && !rep;
  return (
    <Modal open={open} onOpenChange={(o) => !o && onCancel()} size="sm" title={title}
      footer={<><Button variant="outline" onClick={onCancel}>{t("cancel")}</Button><Button variant="destructive" disabled={blocked} onClick={() => onConfirm(rep)}>{t("delete")}</Button></>}>
      <div className="space-y-3 text-sm">
        {extra}
        {needs ? (
          <>
            <p className="rounded-md border border-warning/40 bg-warning/10 p-2.5">{usedLabel ?? t("deleteInUseWarning", { n: used })}</p>
            <Field label={t("reassignTo")}>
              <Select value={rep} onChange={(e) => setRep(e.target.value)}>
                <option value="">{allowEmpty ? t("leaveEmpty") : t("select")}</option>
                {candidates.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </Select>
            </Field>
          </>
        ) : (
          <p className="text-muted-foreground">{t("deleteUnusedConfirm")}</p>
        )}
      </div>
    </Modal>
  );
}

export function uniqueName(list: { name: string; id: string }[], name: string, selfId?: string): boolean {
  const n = name.trim().toLowerCase();
  return !list.some((x) => x.id !== selfId && x.name.trim().toLowerCase() === n);
}
