"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { ContactsPanel } from "@/components/contacts-panel";
import { Timeline } from "@/components/timeline";
import { CompanyFormDialog } from "@/components/forms/company-form";
import { StageBadge } from "@/components/leads/columns";
import { useUI } from "@/components/dialogs";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { useLookups } from "@/lib/store/hooks";
import { planDeleteCompany } from "@/lib/store/logic";
import { formatMoney } from "@/lib/utils";

function Inner() {
  const id = useSearchParams().get("id") ?? "";
  const { t, name } = useI18n();
  const { db, commit, notify } = useStore();
  const lk = useLookups();
  const router = useRouter();
  const confirm = useConfirm();
  const { openLeadForm } = useUI();
  const [edit, setEdit] = useState(false);
  const c = db.companies.find((x) => x.id === id);
  const leads = useMemo(() => db.leads.filter((l) => l.companyId === id), [db.leads, id]);
  const projects = useMemo(() => db.projects.filter((p) => p.companyId === id), [db.projects, id]);
  const acts = useMemo(() => db.activities.filter((a) => a.companyId === id || leads.some((l) => l.id === a.leadId)), [db.activities, id, leads]);

  if (!c) return <Card><EmptyState title={t("companyNotFound")} action={<Button onClick={() => router.push("/companies")}>{t("navCompanies")}</Button>} /></Card>;
  const rel = lk.optById.get(c.relationshipId);

  const del = async () => {
    if (!(await confirm({ title: t("deleteCompany"), message: t("deleteCompanyConfirm", { name: c.name, leads: leads.length, contacts: db.contacts.filter((x) => x.companyId === id).length }) }))) return;
    if (await commit(planDeleteCompany(db, c.id))) { notify(t("deleted")); router.push("/companies"); }
  };
  const info = (k: string, v: React.ReactNode) => v ? <div className="grid grid-cols-[8rem_1fr] gap-2 py-1.5 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="min-w-0 break-words">{v}</dd></div> : null;
  const link = (u: string) => u ? <a href={u} target="_blank" rel="noreferrer" dir="ltr" className="inline-flex items-center gap-1 hover:underline">{u.replace(/^https?:\/\/(www\.)?/, "")}<ExternalLink className="size-3" /></a> : null;

  return (
    <div className="space-y-4">
      <Link href="/companies" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4 rtl-flip" /> {t("navCompanies")}</Link>
      <Card><CardContent className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">{rel && <Badge color={rel.color || "#64748b"}>{name(rel)}</Badge>}{c.isDemo && <Badge className="bg-accent text-accent-foreground">{t("demo")}</Badge>}</div>
          <h1 className="mt-1 text-xl font-semibold">{c.name}</h1>
          <p className="text-sm text-muted-foreground">{[lk.optName(c.clientTypeId), lk.optName(c.industryId), lk.optName(c.sizeId), c.city].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openLeadForm({ defaults: { companyId: c.id, companyName: c.name, city: c.city, website: c.website } })}><Plus /> {t("newLead")}</Button>
          <Button variant="outline" onClick={() => setEdit(true)}><Pencil /> {t("edit")}</Button>
          <Button variant="outline" size="icon" aria-label={t("delete")} className="text-destructive" onClick={del}><Trash2 /></Button>
        </div>
      </CardContent></Card>

      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-4">
          <Card><CardHeader><CardTitle>{t("details")}</CardTitle></CardHeader><CardContent className="pt-2"><dl className="divide-y">
            {info(t("operatingRegions"), c.regions)}
            {info(t("website"), link(c.website))}
            {info(t("linkedin"), link(c.linkedin))}
            {info(t("instagram"), c.instagram && <span dir="ltr">{c.instagram}</span>)}
            {info(t("mainPhone"), c.phone && <span className="ltr-num">{c.phone}</span>)}
            {info(t("mainEmail"), c.email && <a href={`mailto:${c.email}`} dir="ltr" className="hover:underline">{c.email}</a>)}
            {info(t("categories"), c.categoryIds.length > 0 && <div className="flex flex-wrap gap-1">{c.categoryIds.map((i) => <Badge key={i} className="bg-secondary">{lk.catName(i)}</Badge>)}</div>)}
            {info(t("notes"), c.notes && <span className="whitespace-pre-wrap">{c.notes}</span>)}
          </dl></CardContent></Card>
          <Card><CardContent><ContactsPanel companyId={c.id} /></CardContent></Card>
        </div>
        <div className="space-y-4">
          <Card><CardHeader><CardTitle>{t("opportunities")} ({leads.length})</CardTitle></CardHeader><CardContent className="space-y-2 pt-3">
            {leads.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">{t("noLeadsYet")}</p>}
            {leads.map((l) => (
              <Link key={l.id} href={`/leads/view?id=${l.id}`} className="flex flex-wrap items-center gap-2 rounded-md border p-3 text-sm hover:bg-accent/50">
                <span className="font-mono text-xs text-muted-foreground">{l.code}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{l.projectName || l.companyName}</span>
                <span className="tabular-nums" dir="ltr">{l.value ? formatMoney(l.value, lk.currency) : ""}</span>
                <StageBadge lead={l} lk={lk} name={name as never} />
              </Link>
            ))}
          </CardContent></Card>
          {projects.length > 0 && <Card><CardHeader><CardTitle>{t("existingProjects")} ({projects.length})</CardTitle></CardHeader><CardContent className="space-y-2 pt-3">
            {projects.map((p) => <div key={p.id} className="flex justify-between rounded-md border p-3 text-sm"><span className="font-medium">{p.name}</span><span className="text-muted-foreground">{lk.optName(p.statusId)}</span></div>)}
          </CardContent></Card>}
          <Card><CardHeader><CardTitle>{t("previousInteractions")}</CardTitle></CardHeader><CardContent className="pt-3"><Timeline activities={acts} showLead /></CardContent></Card>
        </div>
      </div>
      <CompanyFormDialog open={edit} onOpenChange={setEdit} companyId={c.id} />
    </div>
  );
}

export default function CompanyDetailPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
