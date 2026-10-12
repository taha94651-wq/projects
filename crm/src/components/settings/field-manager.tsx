"use client";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Badge, Card } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { planDeleteCustomField } from "@/lib/store/logic";
import { sorted, usageCount } from "@/lib/store/selectors";
import type { CustomField, CustomFieldType } from "@/lib/types";
import { nowIso, uid } from "@/lib/utils";
import { RowActions, UsageBadge, reorder } from "./common";

const TYPES: CustomFieldType[] = ["text", "number", "date", "dropdown", "multiselect", "url", "email", "phone"];

export function FieldManager() {
  const { t, label } = useI18n();
  const { db, commit, notify } = useStore();
  const confirm = useConfirm();
  const fields = sorted(db.customFields);
  const [edit, setEdit] = useState<CustomField | "new" | null>(null);
  const move = async (id: string, dir: -1 | 1) => {
    const r = reorder(fields, id, dir);
    if (r) await commit({ upsert: { customFields: r.map((f) => ({ ...f, updatedAt: nowIso() })) } });
  };
  const remove = async (f: CustomField) => {
    const n = usageCount(db, "customField", f.id);
    const ok = await confirm({ title: t("deleteField", { name: label(f) }), message: n > 0 ? t("deleteFieldInUse", { n }) : t("deleteUnusedConfirm") });
    if (ok && (await commit(planDeleteCustomField(db, f.id)))) notify(t("deleted"));
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{t("customFieldsHelp")}</p><Button variant="bronze" onClick={() => setEdit("new")}><Plus /> {t("addField")}</Button></div>
      <Card className="divide-y">
        {fields.length === 0 && <p className="p-5 text-center text-sm text-muted-foreground">{t("noCustomFields")}</p>}
        {fields.map((f, i) => (
          <div key={f.id} className="flex items-center gap-3 px-3 py-2 text-sm">
            <span className="flex-1 font-medium">{label(f)}{f.required && <span className="ms-1 text-destructive">*</span>}</span>
            <Badge className="bg-secondary">{t("type_" + f.type)}</Badge>
            <UsageBadge n={usageCount(db, "customField", f.id)} />
            <RowActions first={i === 0} last={i === fields.length - 1} onUp={() => move(f.id, -1)} onDown={() => move(f.id, 1)} onEdit={() => setEdit(f)} onDelete={() => remove(f)} />
          </div>
        ))}
      </Card>
      <FieldDialog value={edit} onClose={() => setEdit(null)} />
    </div>
  );
}

function FieldDialog({ value, onClose }: { value: CustomField | "new" | null; onClose: () => void }) {
  const { t } = useI18n();
  const { db, commit, notify } = useStore();
  const [f, setF] = useState({ label: "", labelAr: "", type: "text" as CustomFieldType, options: "", required: false });
  const [err, setErr] = useState<Record<string, string>>({});
  const cur = value && value !== "new" ? value : null;
  const used = cur ? usageCount(db, "customField", cur.id) : 0;
  useEffect(() => {
    if (!value) return;
    setErr({});
    setF(value === "new" ? { label: "", labelAr: "", type: "text", options: "", required: false } : { label: value.label, labelAr: value.labelAr, type: value.type, options: value.options.join("\n"), required: value.required });
  }, [value]);

  const save = async () => {
    const e: Record<string, string> = {};
    const lb = f.label.trim();
    if (!lb) e.label = t("errRequired");
    else if (db.customFields.some((x) => x.id !== cur?.id && x.label.toLowerCase() === lb.toLowerCase())) e.label = t("errDuplicateName");
    const opts = [...new Set(f.options.split(/[\n,;]/).map((s) => s.trim()).filter(Boolean))];
    const listType = f.type === "dropdown" || f.type === "multiselect";
    if (listType && opts.length === 0) e.options = t("errOptionsRequired");
    // data-loss guards
    if (cur && used > 0 && cur.type !== f.type) {
      const compatible = (cur.type === "dropdown" && f.type === "multiselect") || (["text", "url", "email", "phone"].includes(cur.type) && f.type === "text");
      if (!compatible) e.type = t("errTypeChangeInUse", { n: used });
    }
    if (cur && used > 0 && listType && (cur.type === "dropdown" || cur.type === "multiselect")) {
      const removed = cur.options.filter((o) => !opts.includes(o));
      const stillUsed = removed.filter((o) => db.leads.some((l) => { const v = l.custom[cur.id]; return Array.isArray(v) ? v.includes(o) : v === o; }));
      if (stillUsed.length) e.options = t("errOptionInUse", { list: stillUsed.join(", ") });
    }
    setErr(e);
    if (Object.keys(e).length) return;
    const n = nowIso();
    const row: CustomField = { ...(cur ?? { id: uid(), entity: "lead" as const, sort: db.customFields.length, createdAt: n }), label: lb, labelAr: f.labelAr.trim(), type: f.type, options: listType ? opts : [], required: f.required, updatedAt: n };
    // dropdown -> multiselect: wrap existing single values so they stay valid
    const leads = cur && cur.type === "dropdown" && f.type === "multiselect" ? db.leads.filter((l) => typeof l.custom[cur.id] === "string" && l.custom[cur.id] !== "").map((l) => ({ ...l, custom: { ...l.custom, [cur.id]: [l.custom[cur.id] as string] }, updatedAt: n })) : [];
    if (await commit({ upsert: { customFields: [row], leads } })) { notify(t("saved")); onClose(); }
  };

  return (
    <Modal open={!!value} onOpenChange={(o) => !o && onClose()} title={value === "new" ? t("addField") : t("editField")}
      footer={<><Button variant="outline" onClick={onClose}>{t("cancel")}</Button><Button variant="bronze" onClick={save}>{t("save")}</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("labelEn")} required error={err.label}><Input autoFocus value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></Field>
        <Field label={t("labelAr")}><Input dir="rtl" value={f.labelAr} onChange={(e) => setF({ ...f, labelAr: e.target.value })} /></Field>
        <Field label={t("fieldType")} error={err.type} hint={used > 0 ? t("typeLockedHint", { n: used }) : undefined}>
          <Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as CustomFieldType })}>{TYPES.map((x) => <option key={x} value={x}>{t("type_" + x)}</option>)}</Select>
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={f.required} onChange={(e) => setF({ ...f, required: e.target.checked })} className="size-4 accent-[hsl(var(--bronze))]" />{t("requiredField")}</label>
        {(f.type === "dropdown" || f.type === "multiselect") && (
          <Field label={t("fieldOptions")} error={err.options} hint={t("fieldOptionsHint")} className="sm:col-span-2"><Textarea rows={4} value={f.options} onChange={(e) => setF({ ...f, options: e.target.value })} /></Field>
        )}
      </div>
    </Modal>
  );
}
