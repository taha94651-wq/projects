"use client";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Badge, Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { planDeleteStage } from "@/lib/store/logic";
import { sorted, usageCount } from "@/lib/store/selectors";
import type { Stage, StageKind, StageRole } from "@/lib/types";
import { nowIso, uid } from "@/lib/utils";
import { DeleteDialog, RowActions, UsageBadge, reorder } from "./common";

export function StageManager() {
  const { t, name } = useI18n();
  const { db, commit, notify } = useStore();
  const stages = sorted(db.stages);
  const [edit, setEdit] = useState<Stage | "new" | null>(null);
  const [del, setDel] = useState<Stage | null>(null);
  const move = async (id: string, dir: -1 | 1) => {
    const r = reorder(stages, id, dir);
    if (r) await commit({ upsert: { stages: r.map((s) => ({ ...s, updatedAt: nowIso() })) } });
  };
  // the pipeline needs at least one open, one won and one lost stage for statistics to make sense
  const lastOfKind = (s: Stage) => stages.filter((x) => x.kind === s.kind).length <= 1 && s.kind !== "hold";
  const kindLabel: Record<StageKind, string> = { open: t("kindOpen"), won: t("kindWon"), lost: t("kindLost"), hold: t("kindHold") };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{t("stagesHelp")}</p><Button variant="bronze" onClick={() => setEdit("new")}><Plus /> {t("addStage")}</Button></div>
      <Card className="divide-y">
        {stages.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 px-3 py-2 text-sm">
            <span className="size-3 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="w-6 text-xs text-muted-foreground">{i + 1}</span>
            <span className="flex-1 font-medium">{name(s)}</span>
            <Badge className="bg-secondary">{kindLabel[s.kind]}</Badge>
            <span className="hidden w-12 text-xs text-muted-foreground sm:block" dir="ltr">{s.probability}%</span>
            <UsageBadge n={usageCount(db, "stage", s.id)} />
            <RowActions first={i === 0} last={i === stages.length - 1} onUp={() => move(s.id, -1)} onDown={() => move(s.id, 1)} onEdit={() => setEdit(s)}
              onDelete={() => (lastOfKind(s) ? notify(t("cannotDeleteLastStage", { kind: kindLabel[s.kind] }), "error") : setDel(s))} />
          </div>
        ))}
      </Card>
      <StageDialog value={edit} onClose={() => setEdit(null)} />
      <DeleteDialog
        open={!!del}
        title={t("deleteStage", { name: del ? name(del) : "" })}
        used={del ? usageCount(db, "stage", del.id) : 0}
        candidates={stages.filter((s) => s.id !== del?.id).map((s) => ({ id: s.id, label: name(s) }))}
        allowEmpty={false}
        onCancel={() => setDel(null)}
        onConfirm={async (rep) => {
          if (!del) return;
          const fallback = rep || stages.find((s) => s.id !== del.id)?.id || "";
          if (await commit(planDeleteStage(db, del.id, fallback))) notify(t("deleted"));
          setDel(null);
        }}
      />
    </div>
  );
}

function StageDialog({ value, onClose }: { value: Stage | "new" | null; onClose: () => void }) {
  const { t } = useI18n();
  const { db, commit, notify } = useStore();
  const [f, setF] = useState({ name: "", nameAr: "", kind: "open" as StageKind, role: "" as StageRole, color: "#64748b", probability: "10" });
  const [err, setErr] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!value) return;
    setErr({});
    setF(value === "new" ? { name: "", nameAr: "", kind: "open", role: "", color: "#64748b", probability: "10" } : { name: value.name, nameAr: value.nameAr, kind: value.kind, role: value.role, color: value.color, probability: String(value.probability) });
  }, [value]);
  const save = async () => {
    const e: Record<string, string> = {};
    const nm = f.name.trim();
    const cur = value && value !== "new" ? value : null;
    if (!nm) e.name = t("errRequired");
    else if (db.stages.some((s) => s.id !== cur?.id && s.name.toLowerCase() === nm.toLowerCase())) e.name = t("errDuplicateName");
    const p = Number(f.probability);
    if (isNaN(p) || p < 0 || p > 100) e.probability = t("errProbability");
    if (cur && cur.kind !== f.kind && db.stages.filter((s) => s.kind === cur.kind).length <= 1 && cur.kind !== "hold") e.kind = t("cannotDeleteLastStage", { kind: cur.kind });
    setErr(e);
    if (Object.keys(e).length) return;
    const n = nowIso();
    // a role (dashboard card mapping) belongs to exactly one stage
    const clear = f.role ? db.stages.filter((s) => s.role === f.role && s.id !== cur?.id).map((s) => ({ ...s, role: "" as StageRole, updatedAt: n })) : [];
    const row: Stage = { ...(cur ?? { id: uid(), sort: db.stages.length, createdAt: n }), name: nm, nameAr: f.nameAr.trim(), kind: f.kind, role: f.kind === "open" ? f.role : "", color: f.color, probability: p, updatedAt: n };
    // changing kind of a stage in use: keep leads' outcome consistent
    const leads = cur && cur.kind !== f.kind ? db.leads.filter((l) => l.stageId === cur.id).map((l) => ({ ...l, outcome: f.kind === "won" || f.kind === "lost" ? { result: f.kind as "won" | "lost", finalValue: f.kind === "won" ? l.value : null, reasonId: "", reason: "", notes: "", date: n.slice(0, 10) } : null, updatedAt: n })) : [];
    if (await commit({ upsert: { stages: [...clear, row], leads } })) { notify(t("saved")); onClose(); }
  };
  return (
    <Modal open={!!value} onOpenChange={(o) => !o && onClose()} title={value === "new" ? t("addStage") : t("editStage")}
      footer={<><Button variant="outline" onClick={onClose}>{t("cancel")}</Button><Button variant="bronze" onClick={save}>{t("save")}</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("nameEn")} required error={err.name}><Input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label={t("nameAr")}><Input dir="rtl" value={f.nameAr} onChange={(e) => setF({ ...f, nameAr: e.target.value })} /></Field>
        <Field label={t("stageKind")} error={err.kind} hint={t("stageKindHint")}>
          <Select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as StageKind })}>
            <option value="open">{t("kindOpen")}</option><option value="won">{t("kindWon")}</option><option value="lost">{t("kindLost")}</option><option value="hold">{t("kindHold")}</option>
          </Select>
        </Field>
        <Field label={t("dashboardCard")} hint={t("dashboardCardHint")}>
          <Select value={f.role} disabled={f.kind !== "open"} onChange={(e) => setF({ ...f, role: e.target.value as StageRole })}>
            <option value="">—</option><option value="new">{t("kpiNewLeads")}</option><option value="contacted">{t("kpiContacted")}</option><option value="meeting">{t("kpiMeetings")}</option><option value="quotation">{t("kpiQuotations")}</option>
          </Select>
        </Field>
        <Field label={t("defaultProbability") + " (%)"} error={err.probability}><Input dir="ltr" inputMode="numeric" value={f.probability} onChange={(e) => setF({ ...f, probability: e.target.value })} /></Field>
        <Field label={t("color")}><input type="color" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} className="h-9 w-full cursor-pointer rounded-md border border-input bg-card p-1" aria-label={t("color")} /></Field>
      </div>
    </Modal>
  );
}
