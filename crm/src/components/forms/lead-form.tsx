"use client";
import { useEffect, useMemo } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { CategoryPicker, GroupedMultiSelect } from "@/components/ui/pickers";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { useLookups, type Lookups } from "@/lib/store/hooks";
import { emptyLead, findCompany, planSaveLead } from "@/lib/store/logic";
import type { CustomField, Lead, Outcome } from "@/lib/types";
import { canonPhone, canonUrl, isEmail, isUrl, isValidPhone, today } from "@/lib/utils";

export interface LeadFormValues {
  companyName: string;
  contactName: string;
  jobTitle: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  linkedin: string;
  instagram: string;
  city: string;
  clientTypeId: string;
  categoryIds: string[];
  projectName: string;
  projectLocation: string;
  description: string;
  value: string;
  expectedStart: string;
  sourceId: string;
  priorityId: string;
  stageId: string;
  lastContact: string;
  nextFollowUp: string;
  assigneeId: string;
  notes: string;
  custom: Record<string, string | string[]>;
  outFinal: string;
  outReasonId: string;
  outReason: string;
  outNotes: string;
  outDate: string;
}

const numOk = (s: string) => !s.trim() || (!isNaN(Number(s.replace(/,/g, ""))) && Number(s.replace(/,/g, "")) >= 0);
const toNum = (s: string): number | null => (s.trim() ? Number(s.replace(/,/g, "")) : null);

export function customValidator(f: CustomField, v: unknown, t: (k: string) => string): string | null {
  const empty = v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length);
  if (empty) return f.required ? t("errRequired") : null;
  const s = String(v);
  switch (f.type) {
    case "number":
      return isNaN(Number(s)) ? t("errNumber") : null;
    case "email":
      return isEmail(s) ? null : t("errEmail");
    case "url":
      return isUrl(s) ? null : t("errUrl");
    case "phone":
      return isValidPhone(s) ? null : t("errPhone");
    case "date":
      return /^\d{4}-\d{2}-\d{2}$/.test(s) ? null : t("errDate");
    case "dropdown":
      return f.options.includes(s) ? null : t("errOption");
    case "multiselect":
      return Array.isArray(v) && v.every((x) => f.options.includes(x)) ? null : t("errOption");
    default:
      return null;
  }
}

function buildSchema(t: (k: string) => string, fields: CustomField[]) {
  return z
    .object({
      companyName: z.string().trim().min(1, t("errRequired")).max(200),
      contactName: z.string().trim().max(120),
      jobTitle: z.string().trim().max(120),
      phone: z.string().refine(isValidPhone, t("errPhone")),
      whatsapp: z.string().refine(isValidPhone, t("errPhone")),
      email: z.string().refine(isEmail, t("errEmail")),
      website: z.string().refine(isUrl, t("errUrl")),
      linkedin: z.string().refine(isUrl, t("errUrl")),
      instagram: z.string().max(200),
      city: z.string().trim().max(80),
      clientTypeId: z.string(),
      categoryIds: z.array(z.string()),
      projectName: z.string().trim().max(200),
      projectLocation: z.string().trim().max(200),
      description: z.string().max(5000),
      value: z.string().refine(numOk, t("errNumber")),
      expectedStart: z.string(),
      sourceId: z.string(),
      priorityId: z.string(),
      stageId: z.string().min(1, t("errRequired")),
      lastContact: z.string(),
      nextFollowUp: z.string(),
      assigneeId: z.string(),
      notes: z.string().max(5000),
      custom: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
      outFinal: z.string().refine(numOk, t("errNumber")),
      outReasonId: z.string(),
      outReason: z.string().max(2000),
      outNotes: z.string().max(5000),
      outDate: z.string(),
    })
    .superRefine((v, ctx) => {
      for (const f of fields) {
        const err = customValidator(f, v.custom[f.id], t);
        if (err) ctx.addIssue({ code: "custom", path: ["custom", f.id], message: err });
      }
      if (v.lastContact && v.nextFollowUp && v.nextFollowUp < v.lastContact)
        ctx.addIssue({ code: "custom", path: ["nextFollowUp"], message: t("errFollowBeforeContact") });
    });
}

export function toFormValues(lead: Partial<Lead> & { companyName?: string }, lk: Lookups, base: Omit<Lead, "id" | "code" | "createdAt" | "updatedAt">): LeadFormValues {
  const l = { ...base, ...lead };
  const custom: Record<string, string | string[]> = {};
  for (const f of lk.customFields) {
    const v = l.custom?.[f.id];
    custom[f.id] = f.type === "multiselect" ? (Array.isArray(v) ? v : []) : v === undefined || v === null ? "" : String(v);
  }
  return {
    companyName: l.companyName ?? "",
    contactName: l.contactName,
    jobTitle: l.jobTitle,
    phone: l.phone,
    whatsapp: l.whatsapp,
    email: l.email,
    website: l.website,
    linkedin: l.linkedin,
    instagram: l.instagram,
    city: l.city,
    clientTypeId: l.clientTypeId,
    categoryIds: l.categoryIds,
    projectName: l.projectName,
    projectLocation: l.projectLocation,
    description: l.description,
    value: l.value === null ? "" : String(l.value),
    expectedStart: l.expectedStart,
    sourceId: l.sourceId,
    priorityId: l.priorityId,
    stageId: l.stageId,
    lastContact: l.lastContact,
    nextFollowUp: l.nextFollowUp,
    assigneeId: l.assigneeId,
    notes: l.notes,
    custom,
    outFinal: l.outcome?.finalValue != null ? String(l.outcome.finalValue) : "",
    outReasonId: l.outcome?.reasonId ?? "",
    outReason: l.outcome?.reason ?? "",
    outNotes: l.outcome?.notes ?? "",
    outDate: l.outcome?.date ?? today(),
  };
}

export function CustomFieldInput({
  f,
  value,
  onChange,
  error,
}: {
  f: CustomField;
  value: string | string[];
  onChange: (v: string | string[]) => void;
  error?: string;
}) {
  const { label } = useI18n();
  const common = { "aria-invalid": !!error } as const;
  let input: React.ReactNode;
  switch (f.type) {
    case "dropdown":
      input = (
        <Select {...common} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          <option value="" />
          {f.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </Select>
      );
      break;
    case "multiselect":
      input = <GroupedMultiSelect groups={[{ id: f.id, label: "", items: f.options.map((o) => ({ id: o, label: o })) }]} value={Array.isArray(value) ? value : []} onChange={onChange} invalid={!!error} />;
      break;
    case "date":
      input = <Input {...common} type="date" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "number":
      input = <Input {...common} type="number" inputMode="decimal" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "email":
      input = <Input {...common} type="email" dir="ltr" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "phone":
      input = <Input {...common} type="tel" dir="ltr" placeholder="+966 5X XXX XXXX" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "url":
      input = <Input {...common} dir="ltr" placeholder="https://" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
      break;
    default:
      input = <Input {...common} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
  }
  return (
    <Field label={label(f)} error={error} required={f.required}>
      {input}
    </Field>
  );
}

export function LeadFormDialog({
  open,
  onOpenChange,
  leadId,
  defaults,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leadId?: string;
  defaults?: Partial<Lead>;
  onSaved?: (lead: Lead) => void;
}) {
  const { t, name } = useI18n();
  const { db, commit, notify } = useStore();
  const lk = useLookups();
  const existing = leadId ? db.leads.find((l) => l.id === leadId) : undefined;
  const schema = useMemo(() => buildSchema(t, lk.customFields), [t, lk.customFields]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<LeadFormValues>,
    defaultValues: toFormValues({}, lk, emptyLead(db)),
  });

  useEffect(() => {
    if (open) reset(toFormValues(existing ?? defaults ?? {}, lk, emptyLead(db)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leadId]);

  const stageId = watch("stageId");
  const stageKind = lk.stageById.get(stageId)?.kind;
  const companyName = watch("companyName");
  const matched = useMemo(() => findCompany(db, companyName), [db, companyName]);

  const fillFromCompany = () => {
    if (!matched) return;
    const c = db.contacts.find((x) => x.companyId === matched.id && x.isPrimary) ?? db.contacts.find((x) => x.companyId === matched.id);
    const v = getValues();
    const set = (k: keyof LeadFormValues, val: string) => !v[k] && val && setValue(k, val as never);
    set("city", matched.city);
    set("website", matched.website);
    set("linkedin", matched.linkedin);
    set("instagram", matched.instagram);
    if (c) {
      set("contactName", c.name);
      set("jobTitle", c.jobTitle);
      set("phone", c.phone);
      set("whatsapp", c.whatsapp);
      set("email", c.email);
    }
  };

  const submit = handleSubmit(async (v) => {
    const kind = lk.stageById.get(v.stageId)?.kind;
    const closed = kind === "won" || kind === "lost";
    const value = toNum(v.value);
    const outcome: Outcome | null = closed
      ? {
          result: kind as "won" | "lost",
          finalValue: kind === "won" ? (toNum(v.outFinal) ?? value) : null,
          reasonId: kind === "lost" ? v.outReasonId : "",
          reason: v.outReason,
          notes: v.outNotes,
          date: v.outDate || today(),
        }
      : null;
    const custom: Lead["custom"] = {};
    for (const f of lk.customFields) {
      const raw = v.custom[f.id];
      if (f.type === "number") custom[f.id] = raw === "" || raw === undefined ? null : Number(raw);
      else if (f.type === "phone") custom[f.id] = canonPhone(String(raw ?? ""));
      else if (f.type === "url") custom[f.id] = canonUrl(String(raw ?? ""));
      else custom[f.id] = (raw ?? (f.type === "multiselect" ? [] : "")) as string | string[];
    }
    const { changes, lead } = planSaveLead(
      db,
      {
        companyName: v.companyName,
        contactName: v.contactName.trim(),
        jobTitle: v.jobTitle.trim(),
        phone: canonPhone(v.phone),
        whatsapp: canonPhone(v.whatsapp),
        email: v.email.trim(),
        website: canonUrl(v.website),
        linkedin: canonUrl(v.linkedin),
        instagram: v.instagram.trim(),
        city: v.city.trim(),
        clientTypeId: v.clientTypeId,
        categoryIds: v.categoryIds,
        projectName: v.projectName.trim(),
        projectLocation: v.projectLocation.trim(),
        description: v.description,
        value,
        expectedStart: v.expectedStart,
        sourceId: v.sourceId,
        priorityId: v.priorityId,
        stageId: v.stageId,
        lastContact: v.lastContact,
        nextFollowUp: closed ? "" : v.nextFollowUp,
        assigneeId: v.assigneeId,
        notes: v.notes,
        custom,
      },
      leadId,
    );
    if (outcome) lead.outcome = outcome;
    if (await commit(changes)) {
      notify(leadId ? t("leadUpdated") : t("leadCreated"));
      onSaved?.(lead);
      onOpenChange(false);
    }
  });

  const e = (k: keyof LeadFormValues) => (errors[k] as { message?: string } | undefined)?.message;
  const sec = "col-span-full mt-2 border-b pb-1 text-xs font-semibold uppercase tracking-wide text-bronze";

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      title={leadId ? t("editLead") + (existing ? ` — ${existing.code}` : "") : t("newLead")}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button variant="bronze" onClick={submit} disabled={isSubmitting}>
            {t("save")}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3" noValidate>
        <h4 className={sec}>{t("secCompanyContact")}</h4>
        <Field label={t("companyName")} required error={e("companyName")} hint={matched ? t("companyMatched", { name: matched.name }) : undefined}>
          <Input list="company-list" aria-invalid={!!errors.companyName} {...register("companyName", { onBlur: fillFromCompany })} />
          <datalist id="company-list">
            {db.companies.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </Field>
        <Field label={t("contactPerson")} error={e("contactName")}>
          <Input {...register("contactName")} />
        </Field>
        <Field label={t("jobTitle")}>
          <Input {...register("jobTitle")} />
        </Field>
        <Field label={t("phone")} error={e("phone")} hint="+966 5X XXX XXXX">
          <Input type="tel" dir="ltr" aria-invalid={!!errors.phone} {...register("phone")} />
        </Field>
        <Field label={t("whatsapp")} error={e("whatsapp")}>
          <div className="flex gap-1">
            <Input type="tel" dir="ltr" aria-invalid={!!errors.whatsapp} {...register("whatsapp")} />
            <Button size="sm" variant="outline" className="h-9" onClick={() => setValue("whatsapp", getValues("phone"))} title={t("sameAsPhone")}>
              =
            </Button>
          </div>
        </Field>
        <Field label={t("email")} error={e("email")}>
          <Input type="email" dir="ltr" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label={t("website")} error={e("website")}>
          <Input dir="ltr" placeholder="example.com" aria-invalid={!!errors.website} {...register("website")} />
        </Field>
        <Field label={t("linkedin")} error={e("linkedin")}>
          <Input dir="ltr" aria-invalid={!!errors.linkedin} {...register("linkedin")} />
        </Field>
        <Field label={t("instagram")}>
          <Input dir="ltr" placeholder="@handle" {...register("instagram")} />
        </Field>
        <Field label={t("city")}>
          <Input list="city-list" {...register("city")} />
          <datalist id="city-list">
            {lk.opts("city").map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </Field>
        <Field label={t("clientType")}>
          <Select {...register("clientTypeId")}>
            <option value="" />
            {lk.opts("clientType").map((o) => (
              <option key={o.id} value={o.id}>
                {name(o)}
              </option>
            ))}
          </Select>
        </Field>

        <h4 className={sec}>{t("secProject")}</h4>
        <Field label={t("projectName")} className="lg:col-span-2">
          <Input {...register("projectName")} />
        </Field>
        <Field label={t("projectLocation")}>
          <Input {...register("projectLocation")} />
        </Field>
        <Field label={t("businessCategory") + " / " + t("requiredServices")} className="sm:col-span-2 lg:col-span-3">
          <Controller control={control} name="categoryIds" render={({ field }) => <CategoryPicker value={field.value} onChange={field.onChange} />} />
        </Field>
        <Field label={t("estimatedValue") + ` (${lk.currency})`} error={e("value")}>
          <Input inputMode="decimal" dir="ltr" aria-invalid={!!errors.value} {...register("value")} />
        </Field>
        <Field label={t("expectedStart")}>
          <Input type="date" {...register("expectedStart")} />
        </Field>
        <Field label={t("description")} className="sm:col-span-2 lg:col-span-3">
          <Textarea rows={3} {...register("description")} />
        </Field>

        <h4 className={sec}>{t("secPipeline")}</h4>
        <Field label={t("leadSource")}>
          <Select {...register("sourceId")}>
            <option value="" />
            {lk.opts("source").map((o) => (
              <option key={o.id} value={o.id}>
                {name(o)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("priority")}>
          <Select {...register("priorityId")}>
            <option value="" />
            {lk.opts("priority").map((o) => (
              <option key={o.id} value={o.id}>
                {name(o)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("stage")} required error={e("stageId")}>
          <Select {...register("stageId")}>
            {lk.stages.map((s) => (
              <option key={s.id} value={s.id}>
                {name(s)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("assignedTo")}>
          <Select {...register("assigneeId")}>
            <option value="" />
            {lk.opts("assignee").map((o) => (
              <option key={o.id} value={o.id}>
                {name(o)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("lastContact")}>
          <Input type="date" {...register("lastContact")} />
        </Field>
        <Field label={t("nextFollowUp")} error={e("nextFollowUp")}>
          <Input type="date" disabled={stageKind === "won" || stageKind === "lost"} aria-invalid={!!errors.nextFollowUp} {...register("nextFollowUp")} />
        </Field>

        {(stageKind === "won" || stageKind === "lost") && (
          <>
            <h4 className={sec}>{stageKind === "won" ? t("outcomeWon") : t("outcomeLost")}</h4>
            {stageKind === "won" ? (
              <Field label={t("finalContractValue") + ` (${lk.currency})`} error={e("outFinal")}>
                <Input inputMode="decimal" dir="ltr" {...register("outFinal")} />
              </Field>
            ) : (
              <Field label={t("lossReason")}>
                <Select {...register("outReasonId")}>
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
              <Input type="date" {...register("outDate")} />
            </Field>
            <Field label={t("reason")}>
              <Input {...register("outReason")} />
            </Field>
            <Field label={t("outcomeNotes")} className="sm:col-span-2 lg:col-span-3">
              <Textarea rows={2} {...register("outNotes")} />
            </Field>
          </>
        )}

        {lk.customFields.length > 0 && (
          <>
            <h4 className={sec}>{t("customFields")}</h4>
            {lk.customFields.map((f) => (
              <Controller
                key={f.id}
                control={control}
                name={`custom.${f.id}` as `custom.${string}`}
                render={({ field }) => (
                  <CustomFieldInput f={f} value={field.value as string | string[]} onChange={field.onChange} error={(errors.custom as Record<string, { message?: string }> | undefined)?.[f.id]?.message} />
                )}
              />
            ))}
          </>
        )}

        <h4 className={sec}>{t("notes")}</h4>
        <Field label={t("notes")} className="sm:col-span-2 lg:col-span-3">
          <Textarea rows={3} {...register("notes")} />
        </Field>
      </form>
    </Modal>
  );
}
