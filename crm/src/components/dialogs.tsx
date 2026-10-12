"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { LeadFormDialog } from "@/components/forms/lead-form";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { useLookups } from "@/lib/store/hooks";
import { applyChanges, mergeChanges, planCompleteActivity, planMoveLead, planSaveActivity } from "@/lib/store/logic";
import type { Activity, Lead } from "@/lib/types";
import { addDays, today, uid } from "@/lib/utils";

// ---------------------------------------------------------------- UI context

interface UI {
  openLeadForm: (o?: { leadId?: string; defaults?: Partial<Lead> }) => void;
  openActivity: (o?: { leadId?: string; activityId?: string; projectId?: string; done?: boolean }) => void;
  /** Complete a pending activity, or a lead-level follow-up that has no activity record yet. */
  openComplete: (t: { activityId: string } | { leadId: string; date: string }) => void;
  /** Move to a stage; prompts for the outcome when the stage is Won / Lost. */
  moveLead: (leadId: string, stageId: string) => Promise<void>;
}
const Ctx = createContext<UI | null>(null);
export const useUI = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUI outside provider");
  return v;
};

export function UIProvider({ children }: { children: ReactNode }) {
  const { db, commit, notify } = useStore();
  const { t } = useI18n();
  const [lead, setLead] = useState<{ open: boolean; leadId?: string; defaults?: Partial<Lead> }>({ open: false });
  const [act, setAct] = useState<{ open: boolean; leadId?: string; activityId?: string; projectId?: string; done?: boolean }>({ open: false });
  const [comp, setComp] = useState<{ activityId: string } | { leadId: string; date: string } | null>(null);
  const [outcome, setOutcome] = useState<{ leadId: string; stageId: string } | null>(null);

  const moveLead = useCallback(
    async (leadId: string, stageId: string) => {
      const stage = db.stages.find((s) => s.id === stageId);
      const l = db.leads.find((x) => x.id === leadId);
      if (!stage || !l || l.stageId === stageId) return;
      if (stage.kind === "won" || stage.kind === "lost") {
        setOutcome({ leadId, stageId });
        return;
      }
      if (await commit(planMoveLead(db, leadId, stageId))) notify(t("movedTo", { stage: stage.name }));
    },
    [db, commit, notify, t],
  );

  const ui: UI = {
    openLeadForm: (o) => setLead({ open: true, leadId: o?.leadId, defaults: o?.defaults }),
    openActivity: (o) => setAct({ open: true, ...o }),
    openComplete: setComp,
    moveLead,
  };

  return (
    <Ctx.Provider value={ui}>
      {children}
      <LeadFormDialog open={lead.open} onOpenChange={(o) => setLead((s) => ({ ...s, open: o }))} leadId={lead.leadId} defaults={lead.defaults} />
      <ActivityFormDialog open={act.open} onOpenChange={(o) => setAct((s) => ({ ...s, open: o }))} leadId={act.leadId} activityId={act.activityId} projectId={act.projectId} startDone={act.done} />
      <CompleteDialog target={comp} onClose={() => setComp(null)} />
      <OutcomeDialog target={outcome} onClose={() => setOutcome(null)} />
    </Ctx.Provider>
  );
}

// ---------------------------------------------------------------- activity form

function ActivityFormDialog({
  open,
  onOpenChange,
  leadId,
  activityId,
  projectId,
  startDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leadId?: string;
  activityId?: string;
  projectId?: string;
  startDone?: boolean;
}) {
  const { t, name } = useI18n();
  const { db, commit, notify } = useStore();
  const lk = useLookups();
  const existing = activityId ? db.activities.find((a) => a.id === activityId) : undefined;
  const [f, setF] = useState({ leadId: "", typeId: "", dateTime: "", description: "", outcome: "", nextAction: "", nextFollowUp: "", done: false });
  const [err, setErr] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErr({});
    if (existing) {
      setF({ leadId: existing.leadId, typeId: existing.typeId, dateTime: existing.dateTime, description: existing.description, outcome: existing.outcome, nextAction: existing.nextAction, nextFollowUp: existing.nextFollowUp, done: existing.done });
    } else {
      const call = lk.opts("activityType").find((o) => o.key === "call");
      const d = new Date();
      d.setMinutes(0, 0, 0);
      d.setHours(d.getHours() + 1);
      const local = `${today()}T${String(d.getHours()).padStart(2, "0")}:00`;
      setF({ leadId: leadId ?? "", typeId: call?.id ?? "", dateTime: d.getDate() === new Date().getDate() ? local : addDays(today(), 1) + "T09:00", description: "", outcome: "", nextAction: "", nextFollowUp: "", done: !!startDone });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activityId, leadId]);

  const set = (k: keyof typeof f, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    const e: Record<string, string> = {};
    if (!f.leadId) e.leadId = t("errRequired");
    if (!f.typeId) e.typeId = t("errRequired");
    if (!f.dateTime) e.dateTime = t("errRequired");
    if (f.description.length > 3000) e.description = t("errTooLong");
    setErr(e);
    if (Object.keys(e).length) return;
    const lead = lk.leadById.get(f.leadId);
    const a: Omit<Activity, "createdAt" | "updatedAt"> = {
      id: existing?.id ?? uid(),
      leadId: f.leadId,
      companyId: lead?.companyId ?? "",
      projectId: existing?.projectId ?? projectId ?? "",
      typeId: f.typeId,
      dateTime: f.dateTime,
      description: f.description,
      outcome: f.done ? f.outcome : "",
      nextAction: f.nextAction,
      nextFollowUp: f.nextFollowUp,
      done: f.done,
      completedAt: f.done ? (existing?.completedAt || new Date().toISOString()) : "",
      system: false,
      isDemo: existing?.isDemo ?? false,
    };
    let ch = planSaveActivity(db, a);
    if (f.done && lead) {
      ch = mergeChanges(ch, { upsert: { leads: [{ ...lead, lastContact: a.dateTime.slice(0, 10) > (lead.lastContact || "") ? a.dateTime.slice(0, 10) : lead.lastContact, nextFollowUp: f.nextFollowUp || lead.nextFollowUp, updatedAt: new Date().toISOString() }] } });
    }
    if (await commit(ch)) {
      notify(t("activitySaved"));
      onOpenChange(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={existing ? t("editActivity") : f.done ? t("logActivity") : t("scheduleActivity")}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button variant="bronze" onClick={save}>
            {t("save")}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("lead")} required error={err.leadId} className="sm:col-span-2">
          <Select value={f.leadId} onChange={(e) => set("leadId", e.target.value)} disabled={!!leadId && !existing} aria-invalid={!!err.leadId}>
            <option value="" />
            {db.leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.code} — {l.companyName}
                {l.projectName ? ` · ${l.projectName}` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("activityType")} required error={err.typeId}>
          <Select value={f.typeId} onChange={(e) => set("typeId", e.target.value)}>
            <option value="" />
            {lk.opts("activityType").filter((o) => o.key !== "system").map((o) => (
              <option key={o.id} value={o.id}>
                {name(o)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("dateTime")} required error={err.dateTime}>
          <Input type="datetime-local" value={f.dateTime} onChange={(e) => set("dateTime", e.target.value)} />
        </Field>
        <Field label={t("description")} className="sm:col-span-2" error={err.description}>
          <Textarea rows={2} value={f.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={f.done} onChange={(e) => set("done", e.target.checked)} className="size-4 accent-[hsl(var(--bronze))]" />
          {t("alreadyCompleted")}
        </label>
        {f.done && (
          <Field label={t("outcome")} className="sm:col-span-2">
            <Textarea rows={2} value={f.outcome} onChange={(e) => set("outcome", e.target.value)} />
          </Field>
        )}
        <Field label={t("nextAction")}>
          <Input value={f.nextAction} onChange={(e) => set("nextAction", e.target.value)} />
        </Field>
        <Field label={t("nextFollowUp")}>
          <Input type="date" value={f.nextFollowUp} onChange={(e) => set("nextFollowUp", e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- complete dialog

function CompleteDialog({ target, onClose }: { target: { activityId: string } | { leadId: string; date: string } | null; onClose: () => void }) {
  const { t, name } = useI18n();
  const { db, commit, notify } = useStore();
  const lk = useLookups();
  const [f, setF] = useState({ outcome: "", nextAction: "", nextFollowUp: "", nextTypeId: "" });

  const act = target && "activityId" in target ? db.activities.find((a) => a.id === target.activityId) : undefined;
  const lead = lk.leadById.get(act ? act.leadId : target && "leadId" in target ? target.leadId : "");

  useEffect(() => {
    if (target) setF({ outcome: "", nextAction: "", nextFollowUp: "", nextTypeId: act?.typeId ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const save = async () => {
    if (!target) return;
    let ch;
    if ("activityId" in target) {
      ch = planCompleteActivity(db, target.activityId, f);
    } else {
      const call = lk.opts("activityType").find((o) => o.key === "call");
      const id = uid();
      const c1 = planSaveActivity(db, {
        id,
        leadId: target.leadId,
        companyId: lead?.companyId ?? "",
        projectId: "",
        typeId: call?.id ?? "",
        dateTime: target.date + "T10:00",
        description: t("followUp"),
        outcome: "",
        nextAction: "",
        nextFollowUp: "",
        done: false,
        completedAt: "",
        system: false,
        isDemo: lead?.isDemo ?? false,
      });
      const c2 = planCompleteActivity(applyChanges(db, c1), id, f);
      ch = mergeChanges(c1, c2);
    }
    if (await commit(ch)) {
      notify(t("activityCompleted"));
      onClose();
    }
  };

  return (
    <Modal
      open={!!target}
      onOpenChange={(o) => !o && onClose()}
      title={t("completeActivity")}
      description={lead ? `${lead.code} — ${lead.companyName}${act?.description ? " · " + act.description : ""}` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="bronze" onClick={save}>
            {t("markDone")}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("outcome")} className="sm:col-span-2">
          <Textarea rows={3} autoFocus value={f.outcome} onChange={(e) => setF({ ...f, outcome: e.target.value })} placeholder={t("outcomePlaceholder")} />
        </Field>
        <h4 className="col-span-full border-b pb-1 text-xs font-semibold uppercase tracking-wide text-bronze">{t("scheduleNext")}</h4>
        <Field label={t("nextAction")}>
          <Input value={f.nextAction} onChange={(e) => setF({ ...f, nextAction: e.target.value })} />
        </Field>
        <Field label={t("nextFollowUp")}>
          <Input type="date" min={today()} value={f.nextFollowUp} onChange={(e) => setF({ ...f, nextFollowUp: e.target.value })} />
        </Field>
        <Field label={t("activityType")}>
          <Select value={f.nextTypeId} onChange={(e) => setF({ ...f, nextTypeId: e.target.value })}>
            {lk.opts("activityType").filter((o) => o.key !== "system").map((o) => (
              <option key={o.id} value={o.id}>
                {name(o)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- outcome dialog (Kanban drop on Won / Lost)

function OutcomeDialog({ target, onClose }: { target: { leadId: string; stageId: string } | null; onClose: () => void }) {
  const { t, name } = useI18n();
  const { db, commit, notify } = useStore();
  const lk = useLookups();
  const lead = target ? lk.leadById.get(target.leadId) : undefined;
  const stage = target ? lk.stageById.get(target.stageId) : undefined;
  const won = stage?.kind === "won";
  const [f, setF] = useState({ finalValue: "", reasonId: "", reason: "", notes: "", date: today() });
  const [err, setErr] = useState("");

  useEffect(() => {
    if (target && lead) {
      setF({ finalValue: lead.value != null ? String(lead.value) : "", reasonId: "", reason: "", notes: "", date: today() });
      setErr("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const save = async () => {
    if (!target || !stage) return;
    const fv = f.finalValue.trim() ? Number(f.finalValue.replace(/,/g, "")) : null;
    if (fv !== null && (isNaN(fv) || fv < 0)) return setErr(t("errNumber"));
    const ch = planMoveLead(db, target.leadId, target.stageId, {
      result: won ? "won" : "lost",
      finalValue: won ? fv : null,
      reasonId: won ? "" : f.reasonId,
      reason: f.reason,
      notes: f.notes,
      date: f.date || today(),
    });
    if (await commit(ch)) {
      notify(t("movedTo", { stage: stage.name }));
      onClose();
    }
  };

  return (
    <Modal
      open={!!target}
      onOpenChange={(o) => !o && onClose()}
      title={won ? t("outcomeWon") : t("outcomeLost")}
      description={lead ? `${lead.code} — ${lead.companyName}` : undefined}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant={won ? "bronze" : "destructive"} onClick={save}>
            {t("confirm")}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        {won ? (
          <Field label={t("finalContractValue") + ` (${lk.currency})`} error={err}>
            <Input inputMode="decimal" dir="ltr" value={f.finalValue} onChange={(e) => setF({ ...f, finalValue: e.target.value })} />
          </Field>
        ) : (
          <Field label={t("lossReason")}>
            <Select value={f.reasonId} onChange={(e) => setF({ ...f, reasonId: e.target.value })}>
              <option value="" />
              {lk.opts("lossReason").map((o) => (
                <option key={o.id} value={o.id}>
                  {name(o)}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={t("outcomeDate")}>
          <Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        </Field>
        <Field label={t("reason")}>
          <Input value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
        </Field>
        <Field label={t("outcomeNotes")}>
          <Textarea rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}
