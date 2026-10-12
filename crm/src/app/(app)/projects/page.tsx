"use client";
import { useMemo, useState } from "react";
import { CalendarPlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Menu } from "@/components/ui/menu";
import { Modal } from "@/components/ui/dialog";
import { useConfirm } from "@/components/ui/confirm";
import { Timeline } from "@/components/timeline";
import { ProjectFormDialog } from "@/components/forms/project-form";
import { useUI } from "@/components/dialogs";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { useLookups } from "@/lib/store/hooks";
import { planDeleteProject } from "@/lib/store/logic";
import { projectOpportunityValue, weightedValue } from "@/lib/store/selectors";
import type { Project } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

export default function ProjectsPage() {
  const { t, name, locale } = useI18n();
  const { db, commit, notify, settings } = useStore();
  const lk = useLookups();
  const confirm = useConfirm();
  const { openActivity } = useUI();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [cat, setCat] = useState("");
  const [form, setForm] = useState<{ open: boolean; id?: string; defaults?: Partial<Project> }>({ open: false });
  const [view, setView] = useState<string | null>(null);

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return db.projects.filter((p) => (!status || p.statusId === status) && (!cat || p.categoryIds.includes(cat)) && (!ql || p.name.toLowerCase().includes(ql) || (lk.companyById.get(p.companyId)?.name ?? "").toLowerCase().includes(ql) || p.location.toLowerCase().includes(ql)));
  }, [db.projects, q, status, cat, lk.companyById]);

  const closedStatus = (p: Project) => ["lost", "completed"].includes(lk.optById.get(p.statusId)?.key ?? "");
  const totals = useMemo(() => {
    const live = rows.filter((p) => !closedStatus(p));
    return { count: rows.length, opp: live.reduce((a, p) => a + projectOpportunityValue(p), 0), weighted: live.reduce((a, p) => a + weightedValue(p), 0), profit: live.reduce((a, p) => a + (p.expectedProfit ?? 0) * (p.probability / 100), 0) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, lk.optById]);

  const remove = async (p: Project) => {
    if (!(await confirm({ title: t("deleteProject"), message: t("deleteProjectConfirm", { name: p.name }) }))) return;
    if (await commit(planDeleteProject(db, p.id))) notify(t("deleted"));
  };

  const cols: Column<Project>[] = [
    { key: "name", header: t("projectName"), sort: (p) => p.name.toLowerCase(), cell: (p) => <span className="font-medium">{p.name}{p.isDemo && <Badge className="ms-1.5 bg-accent text-accent-foreground">{t("demo")}</Badge>}</span> },
    { key: "company", header: t("clientCompany"), sort: (p) => lk.companyById.get(p.companyId)?.name ?? "", cell: (p) => lk.companyById.get(p.companyId)?.name ?? "—" },
    { key: "type", header: t("projectType"), sort: (p) => lk.optName(p.typeId), cell: (p) => lk.optName(p.typeId) || "—" },
    { key: "location", header: t("projectLocation"), sort: (p) => p.location, cell: (p) => p.location || "—" },
    { key: "status", header: t("projectStatus"), sort: (p) => lk.optById.get(p.statusId)?.sort ?? "", cell: (p) => { const o = lk.optById.get(p.statusId); return o ? <Badge color={o.color || "#64748b"}>{name(o)}</Badge> : "—"; } },
    { key: "budget", header: t("estimatedBudget"), sort: (p) => p.estimatedBudget ?? "", className: "text-end", cell: (p) => <span className="ltr-num tabular-nums">{p.estimatedBudget ? formatMoney(p.estimatedBudget, lk.currency) : "—"}</span> },
    { key: "quote", header: t("quotationValue"), sort: (p) => p.quotationValue ?? "", className: "text-end", cell: (p) => <span className="ltr-num tabular-nums">{p.quotationValue ? formatMoney(p.quotationValue, lk.currency) : "—"}</span> },
    { key: "prob", header: t("probability"), sort: (p) => p.probability, className: "text-end", cell: (p) => <span className="ltr-num">{p.probability}%</span> },
    { key: "weighted", header: t("weightedValue"), sort: (p) => weightedValue(p), className: "text-end", cell: (p) => <span className="ltr-num font-medium tabular-nums">{formatMoney(weightedValue(p), lk.currency)}</span> },
    { key: "award", header: t("expectedAwardDate"), sort: (p) => p.awardDate, cell: (p) => formatDate(p.awardDate, locale) },
    {
      key: "actions", header: "", className: "w-10",
      cell: (p) => (
        <Menu items={[
          { label: t("edit"), icon: <Pencil />, onSelect: () => setForm({ open: true, id: p.id }) },
          { label: t("scheduleActivity"), icon: <CalendarPlus />, hidden: !p.leadId, onSelect: () => openActivity({ leadId: p.leadId, projectId: p.id }) },
          { label: t("delete"), icon: <Trash2 />, destructive: true, onSelect: () => remove(p) },
        ]} />
      ),
    },
  ];

  const viewing = view ? db.projects.find((p) => p.id === view) : undefined;
  const related = viewing ? db.activities.filter((a) => a.projectId === viewing.id || (viewing.leadId && a.leadId === viewing.leadId)) : [];

  return (
    <div className="space-y-4">
      <PageHeader title={t("navProjects")} subtitle={t("projectsCount", { n: rows.length })} actions={<Button variant="bronze" onClick={() => setForm({ open: true })}><Plus /> {t("newProject")}</Button>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [t("openOpportunities"), String(rows.filter((p) => !closedStatus(p)).length)],
          [t("opportunityValue"), formatMoney(totals.opp, lk.currency)],
          [t("weightedPipeline"), formatMoney(totals.weighted, lk.currency)],
          [t("weightedProfit"), formatMoney(totals.profit, lk.currency)],
        ].map(([k, v]) => (
          <Card key={k}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 text-lg font-semibold tracking-tight" dir="ltr" style={{ textAlign: "start" }}>{v}</p></CardContent></Card>
        ))}
      </div>
      <Card className="p-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="relative"><Search className="pointer-events-none absolute start-2.5 top-2.5 size-4 text-muted-foreground" /><Input className="ps-8" placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("search")} /></div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t("projectStatus")}><option value="">{t("allStatuses")}</option>{lk.opts("projectStatus").map((o) => <option key={o.id} value={o.id}>{name(o)}</option>)}</Select>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label={t("category")}><option value="">{t("allCategories")}</option>{db.categories.filter((c) => c.parentId).map((c) => <option key={c.id} value={c.id}>{name(c)}</option>)}</Select>
        </div>
      </Card>
      <Card><DataTable rows={rows} columns={cols} pageSize={settings.pageSize || 25} onRowClick={(p) => setView(p.id)} initialSort={{ key: "award", dir: "asc" }} /></Card>

      <ProjectFormDialog open={form.open} onOpenChange={(o) => setForm((s) => ({ ...s, open: o }))} projectId={form.id} defaults={form.defaults} />
      <Modal open={!!viewing} onOpenChange={(o) => !o && setView(null)} size="lg" title={viewing?.name ?? ""} description={viewing ? lk.companyById.get(viewing.companyId)?.name : undefined}
        footer={viewing && <><Button variant="outline" onClick={() => { setView(null); setForm({ open: true, id: viewing.id }); }}><Pencil /> {t("edit")}</Button>{viewing.leadId && <Button variant="bronze" onClick={() => openActivity({ leadId: viewing.leadId, projectId: viewing.id })}><CalendarPlus /> {t("scheduleActivity")}</Button>}</>}>
        {viewing && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[[t("estimatedBudget"), formatMoney(viewing.estimatedBudget, lk.currency)], [t("quotationValue"), formatMoney(viewing.quotationValue, lk.currency)], [t("probability"), viewing.probability + "%"], [t("weightedValue"), formatMoney(weightedValue(viewing), lk.currency)]].map(([k, v]) => (
                <div key={k} className="rounded-md border p-2.5"><p className="text-xs text-muted-foreground">{k}</p><p className="font-semibold" dir="ltr" style={{ textAlign: "start" }}>{v}</p></div>
              ))}
            </div>
            {viewing.scope && <p className="whitespace-pre-wrap">{viewing.scope}</p>}
            <div className="flex flex-wrap gap-1">{viewing.categoryIds.map((i) => <Badge key={i} className="bg-secondary">{lk.catName(i)}</Badge>)}</div>
            <p className="text-muted-foreground">{t("expectedStart")}: {formatDate(viewing.startDate, locale)} · {t("expectedCompletion")}: {formatDate(viewing.endDate, locale)}</p>
            {viewing.notes && <p className="whitespace-pre-wrap rounded-md bg-muted p-3">{viewing.notes}</p>}
            <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-bronze">{t("relatedActivities")}</h4><Timeline activities={related} /></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
