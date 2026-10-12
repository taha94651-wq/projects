"use client";
import { useEffect, useMemo } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { CategoryPicker } from "@/components/ui/pickers";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { useLookups } from "@/lib/store/hooks";
import type { Company } from "@/lib/types";
import { canonPhone, canonUrl, isEmail, isUrl, isValidPhone, normName, nowIso, uid } from "@/lib/utils";

interface V {
  name: string; industryId: string; sizeId: string; city: string; regions: string; website: string; linkedin: string; instagram: string;
  phone: string; email: string; categoryIds: string[]; relationshipId: string; notes: string;
}
const blank: V = { name: "", industryId: "", sizeId: "", city: "", regions: "", website: "", linkedin: "", instagram: "", phone: "", email: "", categoryIds: [], relationshipId: "", notes: "" };

export function CompanyFormDialog({ open, onOpenChange, companyId, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; companyId?: string; onSaved?: (c: Company) => void }) {
  const { t, name } = useI18n();
  const { db, commit, notify } = useStore();
  const lk = useLookups();
  const existing = companyId ? db.companies.find((c) => c.id === companyId) : undefined;

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().trim().min(1, t("errRequired")).max(200),
          industryId: z.string(), sizeId: z.string(), city: z.string().max(80), regions: z.string().max(300),
          website: z.string().refine(isUrl, t("errUrl")), linkedin: z.string().refine(isUrl, t("errUrl")), instagram: z.string().max(200),
          phone: z.string().refine(isValidPhone, t("errPhone")), email: z.string().refine(isEmail, t("errEmail")),
          categoryIds: z.array(z.string()), relationshipId: z.string(), notes: z.string().max(5000),
        })
        .superRefine((v, ctx) => {
          const n = normName(v.name);
          const dup = db.companies.find((c) => c.id !== companyId && normName(c.name) === n);
          if (n && dup) ctx.addIssue({ code: "custom", path: ["name"], message: t("errDuplicateCompany", { name: dup.name }) });
        }),
    [t, db.companies, companyId],
  );

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<V>({ resolver: zodResolver(schema) as unknown as Resolver<V>, defaultValues: blank });
  useEffect(() => {
    if (!open) return;
    if (existing) reset({ ...blank, ...existing });
    else reset({ ...blank, relationshipId: lk.opts("relationship").find((o) => o.key === "prospect")?.id ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, companyId]);

  const submit = handleSubmit(async (v) => {
    const n = nowIso();
    const row: Company = {
      ...(existing ?? { id: uid(), isDemo: false, createdAt: n }),
      ...v,
      name: v.name.trim(),
      website: canonUrl(v.website),
      linkedin: canonUrl(v.linkedin),
      phone: canonPhone(v.phone),
      updatedAt: n,
    } as Company;
    const upsert: Parameters<typeof commit>[0]["upsert"] = { companies: [row] };
    // keep denormalised name on linked leads in sync
    if (existing && existing.name !== row.name) upsert.leads = db.leads.filter((l) => l.companyId === row.id).map((l) => ({ ...l, companyName: row.name, updatedAt: n }));
    if (await commit({ upsert })) {
      notify(t("saved"));
      onSaved?.(row);
      onOpenChange(false);
    }
  });
  const e = (k: keyof V) => (errors[k] as { message?: string } | undefined)?.message;
  const opt = (list: Parameters<typeof lk.opts>[0]) => (
    <>
      <option value="" />
      {lk.opts(list).map((o) => <option key={o.id} value={o.id}>{name(o)}</option>)}
    </>
  );

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="lg" title={companyId ? t("editCompany") : t("newCompany")}
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button><Button variant="bronze" onClick={submit} disabled={isSubmitting}>{t("save")}</Button></>}>
      <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2">
        <Field label={t("companyName")} required error={e("name")} className="sm:col-span-2"><Input aria-invalid={!!errors.name} {...register("name")} /></Field>
        <Field label={t("industry")}><Select {...register("industryId")}>{opt("industry")}</Select></Field>
        <Field label={t("companySize")}><Select {...register("sizeId")}>{opt("companySize")}</Select></Field>
        <Field label={t("city")}><Input list="city-list2" {...register("city")} /><datalist id="city-list2">{lk.opts("city").map((c) => <option key={c.id} value={c.name} />)}</datalist></Field>
        <Field label={t("operatingRegions")}><Input {...register("regions")} /></Field>
        <Field label={t("website")} error={e("website")}><Input dir="ltr" {...register("website")} /></Field>
        <Field label={t("linkedin")} error={e("linkedin")}><Input dir="ltr" {...register("linkedin")} /></Field>
        <Field label={t("instagram")}><Input dir="ltr" {...register("instagram")} /></Field>
        <Field label={t("relationshipStatus")}><Select {...register("relationshipId")}>{opt("relationship")}</Select></Field>
        <Field label={t("mainPhone")} error={e("phone")}><Input dir="ltr" type="tel" {...register("phone")} /></Field>
        <Field label={t("mainEmail")} error={e("email")}><Input dir="ltr" type="email" {...register("email")} /></Field>
        <Field label={t("categories")} className="sm:col-span-2"><Controller control={control} name="categoryIds" render={({ field }) => <CategoryPicker value={field.value} onChange={field.onChange} />} /></Field>
        <Field label={t("notes")} className="sm:col-span-2"><Textarea rows={3} {...register("notes")} /></Field>
      </form>
    </Modal>
  );
}
