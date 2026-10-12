"use client";
import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { CategoryPicker } from "@/components/ui/pickers";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { useLookups } from "@/lib/store/hooks";
import { weightedValue } from "@/lib/store/selectors";
import type { Project } from "@/lib/types";
import { formatMoney, nowIso, uid } from "@/lib/utils";

interface V {
  name: string; companyId: string; leadId: string; typeId: string; location: string; scope: string; categoryIds: string[];
  estimatedBudget: string; quotationValue: string; expectedProfit: string; probability: string; statusId: string;
  awardDate: string; startDate: string; endDate: string; notes: string;
}
const num = (s: string) => (s.trim() ? Number(s.replace(/,/g, "")) : null);
const numOk = (s: string) => !s.trim() || (!isNaN(Number(s.replace(/,/g, ""))) && Number(s.replace(/,/g, "")) >= 0);
const s = (n: number | null) => (n === null || n === undefined ? "" : String(n));

export function ProjectFormDialog({ open, onOpenChange, projectId, defaults }: { open: boolean; onOpenChange: (o: boolean) => void; projectId?: string; defaults?: Partial<Project> }) {
  const { t, name } = useI18n();
  const { db, commit, notify } = useStore();
  const lk = useLookups();
  const existing = projectId ? db.projects.find((p) => p.id === projectId) : undefined;

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("errRequired")).max(200),
        companyId: z.string(), leadId: z.string(), typeId: z.string(), location: z.string().max(200), scope: z.string().max(5000), categoryIds: z.array(z.string()),
        estimatedBudget: z.string().refine(numOk, t("errNumber")), quotationValue: z.string().refine(numOk, t("errNumber")), expectedProfit: z.string().refine(numOk, t("errNumber")),
        probability: z.string().refine((v) => !v.trim() || (!isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100), t("errProbability")),
        statusId: z.string(), awardDate: z.string(), startDate: z.string(), endDate: z.string(), notes: z.string().max(5000),
      }).superRefine((v, ctx) => {
        if (v.startDate && v.endDate && v.endDate < v.startDate) ctx.addIssue({ code: "custom", path: ["endDate"], message: t("errEndBeforeStart") });
      }),
    [t],
  );
  const blank = (): V => ({
    name: "", companyId: "", leadId: "", typeId: "", location: "", scope: "", categoryIds: [], estimatedBudget: "", quotationValue: "", expectedProfit: "",
    probability: "50", statusId: lk.opts("projectStatus")[0]?.id ?? "", awardDate: "", startDate: "", endDate: "", notes: "",
  });
  const toV = (p: Partial<Project>): V => ({ ...blank(), ...p, estimatedBudget: s(p.estimatedBudget ?? null), quotationValue: s(p.quotationValue ?? null), expectedProfit: s(p.expectedProfit ?? null), probability: p.probability === undefined ? "50" : String(p.probability) } as V);

  const { register, control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<V>({ resolver: zodResolver(schema) as unknown as Resolver<V>, defaultValues: blank() });
  useEffect(() => {
    if (open) reset(toV(existing ?? defaults ?? {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId]);

  const w = useWatch({ control });
  const companyId = w.companyId ?? "";
  const live = weightedValue({ quotationValue: num(w.quotationValue ?? ""), estimatedBudget: num(w.estimatedBudget ?? ""), probability: Number(w.probability) || 0 });
  const leadsOfCompany = db.leads.filter((l) => !companyId || l.companyId === companyId);

  const submit = handleSubmit(async (v) => {
    const n = nowIso();
    const row: Project = {
      ...(existing ?? { id: uid(), isDemo: false, createdAt: n }),
      name: v.name.trim(), companyId: v.companyId, leadId: v.leadId, typeId: v.typeId, location: v.location, scope: v.scope, categoryIds: v.categoryIds,
      estimatedBudget: num(v.estimatedBudget), quotationValue: num(v.quotationValue), expectedProfit: num(v.expectedProfit),
      probability: v.probability.trim() ? Number(v.probability) : 0, statusId: v.statusId, awardDate: v.awardDate, startDate: v.startDate, endDate: v.endDate, notes: v.notes, updatedAt: n,
    } as Project;
    if (await commit({ upsert: { projects: [row] } })) { notify(t("saved")); onOpenChange(false); }
  });
  const e = (k: keyof V) => (errors[k] as { message?: string } | undefined)?.message;
  const sel = (list: Parameters<typeof lk.opts>[0]) => (<><option value="" />{lk.opts(list).map((o) => <option key={o.id} value={o.id}>{name(o)}</option>)}</>);

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="xl" title={projectId ? t("editProject") : t("newProject")}
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button><Button variant="bronze" onClick={submit} disabled={isSubmitting}>{t("save")}</Button></>}>
      <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={t("projectName")} required error={e("name")} className="lg:col-span-2"><Input aria-invalid={!!errors.name} {...register("name")} /></Field>
        <Field label={t("projectType")}><Select {...register("typeId")}>{sel("projectType")}</Select></Field>
        <Field label={t("clientCompany")}>
          <Select {...register("companyId", { onChange: () => setValue("leadId", "") })}><option value="" />{db.companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        </Field>
        <Field label={t("relatedLead")}><Select {...register("leadId")}><option value="" />{leadsOfCompany.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.projectName || l.companyName}</option>)}</Select></Field>
        <Field label={t("projectLocation")}><Input {...register("location")} /></Field>
        <Field label={t("scopeOfWork")} className="sm:col-span-2 lg:col-span-3"><Textarea rows={3} {...register("scope")} /></Field>
        <Field label={t("serviceCategories")} className="sm:col-span-2 lg:col-span-3"><Controller control={control} name="categoryIds" render={({ field }) => <CategoryPicker value={field.value} onChange={field.onChange} />} /></Field>
        <Field label={t("estimatedBudget") + ` (${lk.currency})`} error={e("estimatedBudget")}><Input dir="ltr" inputMode="decimal" {...register("estimatedBudget")} /></Field>
        <Field label={t("quotationValue") + ` (${lk.currency})`} error={e("quotationValue")}><Input dir="ltr" inputMode="decimal" {...register("quotationValue")} /></Field>
        <Field label={t("expectedProfit") + ` (${lk.currency})`} error={e("expectedProfit")}><Input dir="ltr" inputMode="decimal" {...register("expectedProfit")} /></Field>
        <Field label={t("probability") + " (%)"} error={e("probability")}><Input dir="ltr" inputMode="numeric" {...register("probability")} /></Field>
        <div className="rounded-md border border-bronze/40 bg-accent px-3 py-2 sm:col-span-1 lg:col-span-2">
          <p className="text-xs text-muted-foreground">{t("weightedValue")} = {t("opportunityValue")} × {t("probability")}</p>
          <p className="text-lg font-semibold" dir="ltr" style={{ textAlign: "start" }}>{formatMoney(live, lk.currency)}</p>
        </div>
        <Field label={t("projectStatus")}><Select {...register("statusId")}>{sel("projectStatus")}</Select></Field>
        <Field label={t("expectedAwardDate")}><Input type="date" {...register("awardDate")} /></Field>
        <Field label={t("expectedStart")}><Input type="date" {...register("startDate")} /></Field>
        <Field label={t("expectedCompletion")} error={e("endDate")}><Input type="date" {...register("endDate")} /></Field>
        <Field label={t("notes")} className="sm:col-span-2 lg:col-span-3"><Textarea rows={3} {...register("notes")} /></Field>
      </form>
    </Modal>
  );
}
