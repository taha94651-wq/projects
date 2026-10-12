"use client";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { planDeleteOption } from "@/lib/store/logic";
import { optionsOf, usageCount } from "@/lib/store/selectors";
import { OPTION_LISTS, type Option, type OptionList } from "@/lib/types";
import { nowIso, uid } from "@/lib/utils";
import { DeleteDialog, RowActions, UsageBadge, reorder } from "./common";

export const LIST_LABEL: Record<OptionList, string> = {
  source: "listSource", priority: "listPriority", clientType: "listClientType", assignee: "listAssignee", companySize: "listCompanySize", industry: "listIndustry",
  relationship: "listRelationship", projectType: "listProjectType", projectStatus: "listProjectStatus", activityType: "listActivityType", lossReason: "listLossReason", city: "listCity", siteRole: "listSiteRole",
};
const COLORED: OptionList[] = ["priority", "relationship", "projectStatus", "activityType"];
// leads must always have a way to log system events
const PROTECTED: Record<string, true> = { "activityType:system": true };

export function OptionManager({ list }: { list: OptionList }) {
  const { t, name } = useI18n();
  const { db, commit, notify } = useStore();
  const items = optionsOf(db, list);
  const [edit, setEdit] = useState<Option | "new" | null>(null);
  const [del, setDel] = useState<Option | null>(null);
  const move = async (id: string, dir: -1 | 1) => {
    const r = reorder(items, id, dir);
    if (r) await commit({ upsert: { options: r.map((o) => ({ ...o, updatedAt: nowIso() })) } });
  };
  const colored = COLORED.includes(list);
  const required = list === "assignee" || list === "priority" || list === "source"; // keep at least one so forms stay usable
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{t(LIST_LABEL[list])}</h3><Button variant="bronze" size="sm" onClick={() => setEdit("new")}><Plus /> {t("addItem")}</Button></div>
      <Card className="divide-y">
        {items.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">{t("listEmpty")}</p>}
        {items.map((o, i) => (
          <div key={o.id} className="flex items-center gap-3 px-3 py-2 text-sm">
            {colored && <span className="size-3 shrink-0 rounded-full border" style={{ background: o.color || "transparent" }} />}
            <span className="flex-1">{name(o)}{o.nameAr && o.name && <span className="ms-2 text-xs text-muted-foreground">{name({ name: o.nameAr, nameAr: o.name })}</span>}</span>
            <UsageBadge n={usageCount(db, "option", o.id)} />
            <RowActions first={i === 0} last={i === items.length - 1} onUp={() => move(o.id, -1)} onDown={() => move(o.id, 1)} onEdit={() => setEdit(o)}
              onDelete={() => {
                if (PROTECTED[`${list}:${o.key}`]) return notify(t("itemProtected"), "error");
                if (required && items.length <= 1) return notify(t("cannotDeleteLastItem"), "error");
                setDel(o);
              }} />
          </div>
        ))}
      </Card>
      <OptionDialog list={list} value={edit} colored={colored} onClose={() => setEdit(null)} />
      <DeleteDialog
        open={!!del}
        title={t("deleteItem", { name: del ? name(del) : "" })}
        used={del ? usageCount(db, "option", del.id) : 0}
        candidates={items.filter((o) => o.id !== del?.id).map((o) => ({ id: o.id, label: name(o) }))}
        allowEmpty={list !== "activityType"}
        onCancel={() => setDel(null)}
        onConfirm={async (rep) => {
          if (!del) return;
          const fallback = list === "activityType" && !rep ? (items.find((o) => o.id !== del.id)?.id ?? "") : rep;
          if (await commit(planDeleteOption(db, del.id, fallback))) notify(t("deleted"));
          setDel(null);
        }}
      />
    </div>
  );
}

function OptionDialog({ list, value, colored, onClose }: { list: OptionList; value: Option | "new" | null; colored: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { db, commit, notify } = useStore();
  const [f, setF] = useState({ name: "", nameAr: "", color: "#64748b" });
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!value) return;
    setErr("");
    setF(value === "new" ? { name: "", nameAr: "", color: "#64748b" } : { name: value.name, nameAr: value.nameAr, color: value.color || "#64748b" });
  }, [value]);
  const save = async () => {
    const nm = f.name.trim();
    const cur = value && value !== "new" ? value : null;
    if (!nm) return setErr(t("errRequired"));
    if (nm.length > 100) return setErr(t("errTooLong"));
    if (db.options.some((o) => o.list === list && o.id !== cur?.id && o.name.toLowerCase() === nm.toLowerCase())) return setErr(t("errDuplicateName"));
    const n = nowIso();
    const row: Option = { ...(cur ?? { id: uid(), list, key: "", sort: optionsOf(db, list).length, createdAt: n }), name: nm, nameAr: f.nameAr.trim(), color: colored ? f.color : "", updatedAt: n };
    const upsert: Parameters<typeof commit>[0]["upsert"] = { options: [row] };
    // cities are stored by name on records: rename them everywhere so nothing is orphaned
    if (cur && list === "city" && cur.name !== nm) {
      upsert.leads = db.leads.filter((l) => l.city === cur.name).map((l) => ({ ...l, city: nm, updatedAt: n }));
      upsert.companies = db.companies.filter((c) => c.city === cur.name).map((c) => ({ ...c, city: nm, updatedAt: n }));
    }
    if (await commit({ upsert })) { notify(t("saved")); onClose(); }
  };
  return (
    <Modal open={!!value} onOpenChange={(o) => !o && onClose()} size="sm" title={value === "new" ? t("addItem") : t("editItem")}
      footer={<><Button variant="outline" onClick={onClose}>{t("cancel")}</Button><Button variant="bronze" onClick={save}>{t("save")}</Button></>}>
      <div className="grid gap-3">
        <Field label={t("nameEn")} required error={err}><Input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && save()} /></Field>
        <Field label={t("nameAr")}><Input dir="rtl" value={f.nameAr} onChange={(e) => setF({ ...f, nameAr: e.target.value })} onKeyDown={(e) => e.key === "Enter" && save()} /></Field>
        {colored && <Field label={t("color")}><input type="color" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} className="h-9 w-full cursor-pointer rounded-md border border-input bg-card p-1" aria-label={t("color")} /></Field>}
      </div>
    </Modal>
  );
}

export function AllOptionLists() {
  const { t } = useI18n();
  const [list, setList] = useState<OptionList>("source");
  return (
    <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
      <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label={t("dropdownLists")}>
        {OPTION_LISTS.map((l) => (
          <button key={l} onClick={() => setList(l)} className={`shrink-0 rounded-md px-3 py-2 text-start text-sm ${list === l ? "bg-accent font-medium text-accent-foreground" : "hover:bg-secondary"}`}>{t(LIST_LABEL[l])}</button>
        ))}
      </nav>
      <OptionManager list={list} key={list} />
    </div>
  );
}

export { Select };
