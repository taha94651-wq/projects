"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Menu } from "@/components/ui/menu";
import { useConfirm } from "@/components/ui/confirm";
import { CompanyFormDialog } from "@/components/forms/company-form";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { useLookups } from "@/lib/store/hooks";
import { planDeleteCompany } from "@/lib/store/logic";
import { groupOf } from "@/lib/store/selectors";
import type { Company } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

function AddTypeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { db, commit, notify } = useStore();
  const [f, setF] = useState({ name: "", nameAr: "" });
  const [err, setErr] = useState("");
  const save = async () => {
    const nm = f.name.trim();
    if (!nm) return setErr(t("errRequired"));
    if (db.options.some((o) => o.list === "clientType" && o.name.toLowerCase() === nm.toLowerCase())) return setErr(t("errDuplicateName"));
    const n = new Date().toISOString();
    const row = { id: crypto.randomUUID(), list: "clientType" as const, name: nm, nameAr: f.nameAr.trim(), key: "", color: "", sort: db.options.filter((o) => o.list === "clientType").length, createdAt: n, updatedAt: n };
    if (await commit({ upsert: { options: [row] } })) { notify(t("saved")); setF({ name: "", nameAr: "" }); setErr(""); onClose(); }
  };
  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()} size="sm" title={t("addCompanyType")} description={t("addCompanyTypeHint")}
      footer={<><Button variant="outline" onClick={onClose}>{t("cancel")}</Button><Button variant="bronze" onClick={save}>{t("save")}</Button></>}>
      <div className="grid gap-3">
        <Field label={t("nameEn")} required error={err}><Input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && save()} /></Field>
        <Field label={t("nameAr")}><Input dir="rtl" value={f.nameAr} onChange={(e) => setF({ ...f, nameAr: e.target.value })} onKeyDown={(e) => e.key === "Enter" && save()} /></Field>
      </div>
    </Modal>
  );
}

export default function CompaniesPage() {
  const { t, name } = useI18n();
  const { db, commit, notify, settings } = useStore();
  const lk = useLookups();
  const router = useRouter();
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [rel, setRel] = useState("");
  const [ind, setInd] = useState("");
  const [city, setCity] = useState("");
  const [cat, setCat] = useState("");
  const [type, setType] = useState("");
  const [addType, setAddType] = useState(false);
  const [form, setForm] = useState<{ open: boolean; id?: string }>({ open: false });

  const stats = useMemo(() => {
    const m = new Map<string, { leads: number; contacts: number; value: number }>();
    for (const c of db.companies) m.set(c.id, { leads: 0, contacts: 0, value: 0 });
    for (const l of db.leads) {
      const s = m.get(l.companyId);
      if (s) {
        s.leads++;
        if (lk.stageById.get(l.stageId)?.kind === "open") s.value += l.value ?? 0;
      }
    }
    for (const c of db.contacts) {
      const s = m.get(c.companyId);
      if (s) s.contacts++;
    }
    return m;
  }, [db, lk.stageById]);

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return db.companies.filter(
      (c) =>
        (!ql || c.name.toLowerCase().includes(ql) || c.city.toLowerCase().includes(ql) || c.email.toLowerCase().includes(ql)) &&
        (!type || (type === "none" ? !c.clientTypeId : c.clientTypeId === type)) && (!rel || c.relationshipId === rel) && (!ind || c.industryId === ind) && (!city || c.city === city) &&
        (!cat || c.categoryIds.some((id) => id === cat || groupOf(lk.catById, id) === cat)),
    );
  }, [db.companies, q, type, rel, ind, city, cat, lk.catById]);

  const remove = async (c: Company) => {
    const s = stats.get(c.id);
    if (!(await confirm({ title: t("deleteCompany"), message: t("deleteCompanyConfirm", { name: c.name, leads: s?.leads ?? 0, contacts: s?.contacts ?? 0 }) }))) return;
    if (await commit(planDeleteCompany(db, c.id))) notify(t("deleted"));
  };

  const cols: Column<Company>[] = [
    { key: "name", header: t("companyName"), sort: (c) => c.name.toLowerCase(), cell: (c) => <span className="font-medium">{c.name}{c.isDemo && <Badge className="ms-1.5 bg-accent text-accent-foreground">{t("demo")}</Badge>}</span> },
    { key: "type", header: t("companyType"), sort: (c) => lk.optName(c.clientTypeId), cell: (c) => lk.optName(c.clientTypeId) || "—" },
    { key: "industry", header: t("industry"), sort: (c) => lk.optName(c.industryId), cell: (c) => lk.optName(c.industryId) || "—" },
    { key: "size", header: t("companySize"), sort: (c) => lk.optById.get(c.sizeId)?.sort ?? "", cell: (c) => lk.optName(c.sizeId) || "—" },
    { key: "city", header: t("city"), sort: (c) => c.city, cell: (c) => c.city || "—" },
    { key: "cats", header: t("categories"), cell: (c) => <div className="flex max-w-[14rem] flex-wrap gap-1">{c.categoryIds.slice(0, 2).map((i) => <Badge key={i} className="bg-secondary">{lk.catName(i)}</Badge>)}{c.categoryIds.length > 2 && <Badge className="bg-secondary">+{c.categoryIds.length - 2}</Badge>}</div> },
    { key: "rel", header: t("relationshipStatus"), sort: (c) => lk.optById.get(c.relationshipId)?.sort ?? "", cell: (c) => { const o = lk.optById.get(c.relationshipId); return o ? <Badge color={o.color || "#64748b"}>{name(o)}</Badge> : "—"; } },
    { key: "contacts", header: t("contacts"), sort: (c) => stats.get(c.id)?.contacts ?? 0, className: "text-end", cell: (c) => stats.get(c.id)?.contacts ?? 0 },
    { key: "leads", header: t("leads"), sort: (c) => stats.get(c.id)?.leads ?? 0, className: "text-end", cell: (c) => stats.get(c.id)?.leads ?? 0 },
    { key: "value", header: t("openPipeline"), sort: (c) => stats.get(c.id)?.value ?? 0, className: "text-end", cell: (c) => <span className="ltr-num tabular-nums">{formatMoney(stats.get(c.id)?.value ?? 0, lk.currency)}</span> },
    {
      key: "actions", header: "", className: "w-10",
      cell: (c) => (
        <Menu items={[
          { label: t("view"), icon: <Eye />, onSelect: () => router.push(`/companies/view?id=${c.id}`) },
          { label: t("edit"), icon: <Pencil />, onSelect: () => setForm({ open: true, id: c.id }) },
          { label: t("delete"), icon: <Trash2 />, destructive: true, onSelect: () => remove(c) },
        ]} />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t("navCompanies")} subtitle={t("companiesCount", { n: rows.length })} actions={<Button variant="bronze" onClick={() => setForm({ open: true })}><Plus /> {t("newCompany")}</Button>} />
      <div className="scroll-thin flex items-center gap-1 overflow-x-auto border-b" role="tablist">
        {[{ id: "", label: t("allTypes"), n: db.companies.length }, ...lk.opts("clientType").map((o) => ({ id: o.id, label: name(o), n: db.companies.filter((c) => c.clientTypeId === o.id).length })), ...(db.companies.some((c) => !c.clientTypeId) ? [{ id: "none", label: t("unassigned"), n: db.companies.filter((c) => !c.clientTypeId).length }] : [])].map((x) => (
          <button key={x.id} role="tab" aria-selected={type === x.id} onClick={() => setType(x.id)} className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm ${type === x.id ? "border-bronze font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {x.label}<span className="rounded-full bg-secondary px-1.5 text-[11px]">{x.n}</span>
          </button>
        ))}
        <Button size="sm" variant="ghost" className="shrink-0" onClick={() => setAddType(true)}><Plus /> {t("addCompanyType")}</Button>
      </div>
      <Card className="p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative"><Search className="pointer-events-none absolute start-2.5 top-2.5 size-4 text-muted-foreground" /><Input className="ps-8" placeholder={t("searchCompanies")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("search")} /></div>
          <Select value={rel} onChange={(e) => setRel(e.target.value)} aria-label={t("relationshipStatus")}><option value="">{t("allRelationships")}</option>{lk.opts("relationship").map((o) => <option key={o.id} value={o.id}>{name(o)}</option>)}</Select>
          <Select value={ind} onChange={(e) => setInd(e.target.value)} aria-label={t("industry")}><option value="">{t("allIndustries")}</option>{lk.opts("industry").map((o) => <option key={o.id} value={o.id}>{name(o)}</option>)}</Select>
          <Select value={city} onChange={(e) => setCity(e.target.value)} aria-label={t("city")}><option value="">{t("allCities")}</option>{[...new Set(db.companies.map((c) => c.city).filter(Boolean))].sort().map((c) => <option key={c}>{c}</option>)}</Select>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label={t("category")}><option value="">{t("allCategories")}</option>{lk.groups.map((g) => <option key={g.id} value={g.id}>{name(g)}</option>)}</Select>
        </div>
      </Card>
      <Card>
        <DataTable rows={rows} columns={cols} pageSize={settings.pageSize || 25} onRowClick={(c) => router.push(`/companies/view?id=${c.id}`)} initialSort={{ key: "name", dir: "asc" }} />
      </Card>
      <AddTypeDialog open={addType} onClose={() => setAddType(false)} />
      <CompanyFormDialog open={form.open} onOpenChange={(o) => setForm((s) => ({ ...s, open: o }))} companyId={form.id} />
    </div>
  );
}
