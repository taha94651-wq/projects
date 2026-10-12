"use client";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { planDeleteCategory } from "@/lib/store/logic";
import { sorted, usageCount } from "@/lib/store/selectors";
import type { Category } from "@/lib/types";
import { nowIso, uid } from "@/lib/utils";
import { DeleteDialog, RowActions, UsageBadge, reorder } from "./common";

export function CategoryManager() {
  const { t, name } = useI18n();
  const { db, commit, notify } = useStore();
  const [open, setOpen] = useState<Set<string>>(new Set(db.categories.filter((c) => !c.parentId).map((c) => c.id)));
  const [edit, setEdit] = useState<{ cat?: Category; parentId: string } | null>(null);
  const [del, setDel] = useState<Category | null>(null);

  const groups = sorted(db.categories.filter((c) => !c.parentId));
  const subs = (g: string) => sorted(db.categories.filter((c) => c.parentId === g));
  const move = async (list: Category[], id: string, dir: -1 | 1) => {
    const r = reorder(list, id, dir);
    if (r) await commit({ upsert: { categories: r.map((c) => ({ ...c, updatedAt: nowIso() })) } });
  };

  const usedBy = (c: Category) => usageCount(db, "category", c.id) + db.categories.filter((k) => k.parentId === c.id).reduce((a, k) => a + usageCount(db, "category", k.id), 0);
  const candidates = del ? db.categories.filter((c) => c.parentId && c.id !== del.id && c.parentId !== del.id).map((c) => ({ id: c.id, label: `${name(db.categories.find((g) => g.id === c.parentId))} › ${name(c)}` })) : [];

  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button variant="bronze" onClick={() => setEdit({ parentId: "" })}><Plus /> {t("addCategoryGroup")}</Button></div>
      {groups.length === 0 && <Card className="p-6 text-center text-sm text-muted-foreground">{t("noCategories")}</Card>}
      {groups.map((g, gi) => {
        const isOpen = open.has(g.id);
        const kids = subs(g.id);
        return (
          <Card key={g.id}>
            <div className="flex items-center gap-2 px-3 py-2.5">
              <button className="flex flex-1 items-center gap-2 text-start" aria-expanded={isOpen} onClick={() => setOpen((s) => { const n = new Set(s); n.has(g.id) ? n.delete(g.id) : n.add(g.id); return n; })}>
                {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4 rtl-flip" />}
                <span className="font-semibold">{name(g)}</span>
                <span className="text-xs text-muted-foreground">({kids.length})</span>
                <UsageBadge n={usedBy(g)} />
              </button>
              <Button size="sm" variant="outline" onClick={() => setEdit({ parentId: g.id })}><Plus /> {t("addService")}</Button>
              <RowActions first={gi === 0} last={gi === groups.length - 1} onUp={() => move(groups, g.id, -1)} onDown={() => move(groups, g.id, 1)} onEdit={() => setEdit({ cat: g, parentId: "" })} onDelete={() => setDel(g)} />
            </div>
            {isOpen && (
              <ul className="divide-y border-t">
                {kids.length === 0 && <li className="px-5 py-3 text-sm text-muted-foreground">{t("noServicesYet")}</li>}
                {kids.map((c, i) => (
                  <li key={c.id} className="flex items-center gap-2 py-1.5 pe-3 ps-9 text-sm">
                    <span className="flex-1">{name(c)}{c.nameAr && c.name && <span className="ms-2 text-xs text-muted-foreground">{name({ name: c.nameAr, nameAr: c.name })}</span>}</span>
                    <UsageBadge n={usageCount(db, "category", c.id)} />
                    <RowActions first={i === 0} last={i === kids.length - 1} onUp={() => move(kids, c.id, -1)} onDown={() => move(kids, c.id, 1)} onEdit={() => setEdit({ cat: c, parentId: g.id })} onDelete={() => setDel(c)} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}

      <CategoryDialog state={edit} onClose={() => setEdit(null)} />
      <DeleteDialog
        open={!!del}
        title={t("deleteCategory", { name: del ? name(del) : "" })}
        used={del ? usedBy(del) : 0}
        usedLabel={del ? t("deleteCategoryInUse", { n: usedBy(del) }) : undefined}
        candidates={candidates}
        allowEmpty
        extra={del && !del.parentId && subs(del.id).length > 0 ? <p className="text-warning">{t("deleteGroupAlso", { n: subs(del.id).length })}</p> : null}
        onCancel={() => setDel(null)}
        onConfirm={async (rep) => {
          if (del && (await commit(planDeleteCategory(db, del.id, rep)))) notify(t("deleted"));
          setDel(null);
        }}
      />
    </div>
  );
}

function CategoryDialog({ state, onClose }: { state: { cat?: Category; parentId: string } | null; onClose: () => void }) {
  const { t, name } = useI18n();
  const { db, commit, notify } = useStore();
  const [f, setF] = useState({ name: "", nameAr: "", parentId: "" });
  const [err, setErr] = useState("");
  useEffect(() => {
    if (state) { setF({ name: state.cat?.name ?? "", nameAr: state.cat?.nameAr ?? "", parentId: state.cat ? state.cat.parentId : state.parentId }); setErr(""); }
  }, [state]);
  const isGroup = state ? (state.cat ? !state.cat.parentId : !state.parentId) : false;
  const save = async () => {
    const nm = f.name.trim();
    if (!nm) return setErr(t("errRequired"));
    if (nm.length > 100) return setErr(t("errTooLong"));
    const siblings = db.categories.filter((c) => c.parentId === f.parentId && c.id !== state?.cat?.id);
    if (siblings.some((c) => c.name.toLowerCase() === nm.toLowerCase())) return setErr(t("errDuplicateName"));
    const n = nowIso();
    const parentChanged = state?.cat && state.cat.parentId !== f.parentId;
    const row: Category = state?.cat
      ? { ...state.cat, name: nm, nameAr: f.nameAr.trim(), parentId: f.parentId, sort: parentChanged ? siblings.length : state.cat.sort, updatedAt: n }
      : { id: uid(), name: nm, nameAr: f.nameAr.trim(), parentId: f.parentId, sort: siblings.length, createdAt: n, updatedAt: n };
    if (await commit({ upsert: { categories: [row] } })) { notify(t("saved")); onClose(); }
  };
  return (
    <Modal open={!!state} onOpenChange={(o) => !o && onClose()} size="sm" title={state?.cat ? t("editCategory") : isGroup ? t("addCategoryGroup") : t("addService")}
      footer={<><Button variant="outline" onClick={onClose}>{t("cancel")}</Button><Button variant="bronze" onClick={save}>{t("save")}</Button></>}>
      <div className="grid gap-3">
        <Field label={t("nameEn")} required error={err}><Input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && save()} /></Field>
        <Field label={t("nameAr")}><Input dir="rtl" value={f.nameAr} onChange={(e) => setF({ ...f, nameAr: e.target.value })} onKeyDown={(e) => e.key === "Enter" && save()} /></Field>
        {state?.cat && state.cat.parentId && (
          <Field label={t("group")}>
            <Select value={f.parentId} onChange={(e) => setF({ ...f, parentId: e.target.value })}>
              {db.categories.filter((c) => !c.parentId).map((g) => <option key={g.id} value={g.id}>{name(g)}</option>)}
            </Select>
          </Field>
        )}
      </div>
    </Modal>
  );
}
