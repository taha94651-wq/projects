"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Download, Eye, FileSpreadsheet, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Menu } from "@/components/ui/menu";
import { Modal } from "@/components/ui/dialog";
import { useConfirm } from "@/components/ui/confirm";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { useLookups } from "@/lib/store/hooks";
import { applyChanges, mergeChanges, planDeleteLeads, planDuplicateLead, planMoveLead, type Changes } from "@/lib/store/logic";
import { leadColumns } from "@/components/leads/columns";
import { emptyFilters, filterLeads, type LeadFilters } from "@/components/leads/filters";
import { ImportDialog } from "@/components/leads/import-dialog";
import { useUI } from "@/components/dialogs";
import { exportLeadsCSV, exportLeadsXLSX } from "@/lib/io";
import { sorted } from "@/lib/store/selectors";
import type { Lead } from "@/lib/types";

export default function LeadsPage() {
  const { t, name, locale } = useI18n();
  const { db, settings, commit, notify } = useStore();
  const lk = useLookups();
  const router = useRouter();
  const confirm = useConfirm();
  const { openLeadForm } = useUI();
  const [f, setF] = useState<LeadFilters>(() => ({ ...emptyFilters, ...(settings.defaultLeadFilters ?? {}) }));
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [bulk, setBulk] = useState<null | "stage" | "priority" | "assignee" | "source">(null);
  const [bulkValue, setBulkValue] = useState("");

  const filtered = useMemo(() => filterLeads(db.leads, f, lk), [db.leads, f, lk]);
  const cols = useMemo(
    () => [
      ...leadColumns(settings.leadColumns?.length ? settings.leadColumns : ["code", "company", "stage"], lk, { t, name: name as never, locale }),
      {
        key: "actions",
        header: "",
        className: "w-10",
        cell: (l: Lead) => (
          <Menu
            items={[
              { label: t("view"), icon: <Eye />, onSelect: () => router.push(`/leads/${l.id}`) },
              { label: t("edit"), icon: <Pencil />, onSelect: () => openLeadForm({ leadId: l.id }) },
              { label: t("duplicate"), icon: <Copy />, onSelect: () => duplicate(l.id) },
              { label: t("delete"), icon: <Trash2 />, destructive: true, onSelect: () => remove([l.id]) },
            ]}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings.leadColumns, lk, t, name, locale],
  );

  const duplicate = async (id: string) => {
    const r = planDuplicateLead(db, id);
    if (r && (await commit(r.changes))) notify(t("leadDuplicated", { code: r.lead.code }));
  };
  const remove = async (ids: string[]) => {
    if (!(await confirm({ title: t("deleteLeads", { n: ids.length }), message: t("deleteLeadsConfirm", { n: ids.length }) }))) return;
    if (await commit(planDeleteLeads(db, ids))) {
      setSel((s) => {
        const n = new Set(s);
        ids.forEach((i) => n.delete(i));
        return n;
      });
      notify(t("deleted"));
    }
  };

  const applyBulk = async () => {
    if (!bulk || !bulkValue) return;
    let work = db;
    let all: Changes = {};
    for (const id of sel) {
      const l = work.leads.find((x) => x.id === id);
      if (!l) continue;
      let ch: Changes;
      if (bulk === "stage") ch = planMoveLead(work, id, bulkValue);
      else {
        const patch = { priority: { priorityId: bulkValue }, assignee: { assigneeId: bulkValue }, source: { sourceId: bulkValue } }[bulk];
        ch = { upsert: { leads: [{ ...l, ...patch, updatedAt: new Date().toISOString() }] } };
      }
      work = applyChanges(work, ch);
      all = mergeChanges(all, ch);
    }
    if (await commit(all)) {
      notify(t("bulkUpdated", { n: sel.size }));
      setBulk(null);
      setBulkValue("");
    }
  };

  const exportRows = (kind: "csv" | "xlsx", scope: "filtered" | "selected") => {
    const rows = scope === "selected" ? db.leads.filter((l) => sel.has(l.id)) : filtered;
    if (!rows.length) return notify(t("nothingToExport"), "error");
    if (kind === "csv") exportLeadsCSV(db, rows);
    else exportLeadsXLSX(db, rows).catch((e) => notify(String(e), "error"));
  };

  const set = <K extends keyof LeadFilters>(k: K, v: LeadFilters[K]) => setF((s) => ({ ...s, [k]: v }));
  const activeFilters = Object.entries(f).filter(([, v]) => v).length;
  const bulkOptions = bulk === "stage" ? lk.stages : bulk ? lk.opts(bulk) : [];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("navLeads")}
        subtitle={t("leadsCount", { n: filtered.length, total: db.leads.length })}
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload /> {t("import")}
            </Button>
            <Menu
              trigger={
                <Button variant="outline">
                  <Download /> {t("export")}
                </Button>
              }
              items={[
                { label: `${t("exportFiltered")} · CSV`, icon: <Download />, onSelect: () => exportRows("csv", "filtered") },
                { label: `${t("exportFiltered")} · Excel`, icon: <FileSpreadsheet />, onSelect: () => exportRows("xlsx", "filtered") },
                { label: `${t("exportSelected")} · CSV`, icon: <Download />, hidden: sel.size === 0, onSelect: () => exportRows("csv", "selected") },
                { label: `${t("exportSelected")} · Excel`, icon: <FileSpreadsheet />, hidden: sel.size === 0, onSelect: () => exportRows("xlsx", "selected") },
              ]}
            />
            <Button variant="bronze" onClick={() => openLeadForm()}>
              <Plus /> {t("newLead")}
            </Button>
          </>
        }
      />

      <Card className="p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <div className="relative sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <Search className="pointer-events-none absolute start-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input className="ps-8" placeholder={t("searchLeads")} value={f.q} onChange={(e) => set("q", e.target.value)} aria-label={t("search")} />
          </div>
          <Select value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)} aria-label={t("category")}>
            <option value="">{t("allCategories")}</option>
            {lk.groups.map((g) => (
              <optgroup key={g.id} label={name(g)}>
                <option value={g.id}>{t("allIn", { name: name(g) })}</option>
                {sorted(db.categories.filter((c) => c.parentId === g.id)).map((c) => (
                  <option key={c.id} value={c.id}>
                    {name(c)}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
          <Select value={f.stageId} onChange={(e) => set("stageId", e.target.value)} aria-label={t("stage")}>
            <option value="">{t("allStages")}</option>
            {lk.stages.map((s) => (
              <option key={s.id} value={s.id}>
                {name(s)}
              </option>
            ))}
          </Select>
          <Select value={f.priorityId} onChange={(e) => set("priorityId", e.target.value)} aria-label={t("priority")}>
            <option value="">{t("allPriorities")}</option>
            {lk.opts("priority").map((o) => (
              <option key={o.id} value={o.id}>
                {name(o)}
              </option>
            ))}
          </Select>
          <Select value={f.sourceId} onChange={(e) => set("sourceId", e.target.value)} aria-label={t("leadSource")}>
            <option value="">{t("allSources")}</option>
            {lk.opts("source").map((o) => (
              <option key={o.id} value={o.id}>
                {name(o)}
              </option>
            ))}
          </Select>
          <Select value={f.city} onChange={(e) => set("city", e.target.value)} aria-label={t("city")}>
            <option value="">{t("allCities")}</option>
            {[...new Set(db.leads.map((l) => l.city).filter(Boolean))].sort().map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select value={f.follow} onChange={(e) => set("follow", e.target.value as LeadFilters["follow"])} aria-label={t("followUpDate")}>
            <option value="">{t("anyFollowUp")}</option>
            <option value="overdue">{t("overdue")}</option>
            <option value="today">{t("today")}</option>
            <option value="week">{t("next7Days")}</option>
            <option value="none">{t("noFollowUp")}</option>
          </Select>
          {activeFilters > 0 && (
            <Button variant="ghost" onClick={() => setF({ ...emptyFilters })}>
              <X /> {t("clearFilters")}
            </Button>
          )}
        </div>
      </Card>

      {sel.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-bronze/40 bg-accent px-3 py-2 text-sm">
          <span className="font-medium">{t("selectedN", { n: sel.size })}</span>
          <Button size="sm" variant="outline" onClick={() => { setBulk("stage"); setBulkValue(""); }}>{t("changeStage")}</Button>
          <Button size="sm" variant="outline" onClick={() => { setBulk("priority"); setBulkValue(""); }}>{t("changePriority")}</Button>
          <Button size="sm" variant="outline" onClick={() => { setBulk("assignee"); setBulkValue(""); }}>{t("changeAssignee")}</Button>
          <Button size="sm" variant="outline" onClick={() => { setBulk("source"); setBulkValue(""); }}>{t("changeSource")}</Button>
          <Button size="sm" variant="destructive" onClick={() => remove([...sel])}>
            <Trash2 /> {t("delete")}
          </Button>
          <Button size="sm" variant="ghost" className="ms-auto" onClick={() => setSel(new Set())}>
            {t("clearSelection")}
          </Button>
        </div>
      )}

      <Card>
        <DataTable
          rows={filtered}
          columns={cols}
          pageSize={settings.pageSize || 25}
          selectable
          selected={sel}
          onSelectedChange={setSel}
          onRowClick={(l) => router.push(`/leads/${l.id}`)}
          initialSort={{ key: "code", dir: "desc" }}
          empty={
            <EmptyState
              title={db.leads.length ? t("noMatchingLeads") : t("noLeadsYet")}
              hint={db.leads.length ? t("tryClearFilters") : t("noLeadsHint")}
              action={
                db.leads.length ? (
                  <Button variant="outline" onClick={() => setF({ ...emptyFilters })}>{t("clearFilters")}</Button>
                ) : (
                  <Button variant="bronze" onClick={() => openLeadForm()}><Plus /> {t("newLead")}</Button>
                )
              }
            />
          }
        />
      </Card>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <Modal
        open={!!bulk}
        onOpenChange={(o) => !o && setBulk(null)}
        size="sm"
        title={t("bulkUpdate")}
        description={t("selectedN", { n: sel.size })}
        footer={
          <>
            <Button variant="outline" onClick={() => setBulk(null)}>{t("cancel")}</Button>
            <Button variant="bronze" disabled={!bulkValue} onClick={applyBulk}>{t("apply")}</Button>
          </>
        }
      >
        <Select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} aria-label={t("select")}>
          <option value="">{t("select")}</option>
          {bulkOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {name(o)}
            </option>
          ))}
        </Select>
        {bulk === "stage" && lk.stageById.get(bulkValue)?.kind && ["won", "lost"].includes(lk.stageById.get(bulkValue)!.kind) && (
          <p className="mt-2 text-xs text-muted-foreground">{t("bulkClosedNote")}</p>
        )}
      </Modal>
    </div>
  );
}
