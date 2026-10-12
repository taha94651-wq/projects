"use client";
import { useRef, useState } from "react";
import { Download, FileSpreadsheet, RotateCcw, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm";
import { RowActions } from "./common";
import { ALL_LEAD_COLUMNS, COLUMN_LABEL_KEY } from "@/components/leads/columns";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { useLookups } from "@/lib/store/hooks";
import { downloadJSON, exportLeadsCSV, exportLeadsXLSX } from "@/lib/io";
import { sorted } from "@/lib/store/selectors";
import { toDateStr } from "@/lib/utils";

export const CURRENCIES = ["SAR", "AED", "KWD", "QAR", "BHD", "OMR", "EGP", "JOD", "USD", "EUR", "GBP"];

export function GeneralPanel() {
  const { t } = useI18n();
  const { settings, updateSettings, notify } = useStore();
  return (
    <Card>
      <CardHeader><CardTitle>{t("generalSettings")}</CardTitle></CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={t("language")}>
          <Select value={settings.language} onChange={(e) => updateSettings({ language: e.target.value as "en" | "ar" })}>
            <option value="en">English</option><option value="ar">العربية (RTL)</option>
          </Select>
        </Field>
        <Field label={t("currency")} hint={t("currencyHint")}>
          <Select value={settings.currency} onChange={(e) => { updateSettings({ currency: e.target.value }); notify(t("saved")); }}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label={t("rowsPerPage")}>
          <Select value={settings.pageSize} onChange={(e) => updateSettings({ pageSize: +e.target.value })}>
            {[10, 25, 50, 100].map((n) => <option key={n}>{n}</option>)}
          </Select>
        </Field>
      </CardContent>
    </Card>
  );
}

export function RemindersPanel() {
  const { t } = useI18n();
  const { settings, updateSettings } = useStore();
  const r = settings.reminders ?? { enabled: true, daysBefore: 1, showOverdueBadge: true };
  const set = (p: Partial<typeof r>) => updateSettings({ reminders: { ...r, ...p } });
  return (
    <Card>
      <CardHeader><CardTitle>{t("reminders")}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("remindersHelp")}</p>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={r.enabled} onChange={(e) => set({ enabled: e.target.checked })} className="size-4 accent-[hsl(var(--bronze))]" />{t("enableReminders")}</label>
        <Field label={t("remindDaysBefore")} className="max-w-xs">
          <Select value={r.daysBefore} disabled={!r.enabled} onChange={(e) => set({ daysBefore: +e.target.value })}>
            {[0, 1, 2, 3, 5, 7].map((n) => <option key={n} value={n}>{n === 0 ? t("onTheDay") : t("daysBeforeN", { n })}</option>)}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={r.showOverdueBadge} onChange={(e) => set({ showOverdueBadge: e.target.checked })} className="size-4 accent-[hsl(var(--bronze))]" />{t("showOverdueBadge")}</label>
      </CardContent>
    </Card>
  );
}

export function ColumnsPanel() {
  const { t, label } = useI18n();
  const { settings, updateSettings, db } = useStore();
  const lk = useLookups();
  const all = [...ALL_LEAD_COLUMNS.map(String), ...sorted(db.customFields).map((f) => "cf:" + f.id)];
  const visible = settings.leadColumns.filter((c) => all.includes(c));
  const hidden = all.filter((c) => !visible.includes(c));
  const nameOf = (c: string) => (c.startsWith("cf:") ? label(lk.customFields.find((f) => f.id === c.slice(3))) : t(COLUMN_LABEL_KEY[c]));
  const move = (i: number, d: -1 | 1) => {
    const arr = [...visible];
    [arr[i], arr[i + d]] = [arr[i + d], arr[i]];
    updateSettings({ leadColumns: arr });
  };
  const df = settings.defaultLeadFilters ?? {};
  const setDf = (p: Record<string, string>) => updateSettings({ defaultLeadFilters: { ...df, ...p } });
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>{t("tableColumns")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("tableColumnsHelp")}</p>
          <ul className="divide-y rounded-md border">
            {visible.map((c, i) => (
              <li key={c} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                <input type="checkbox" checked aria-label={nameOf(c)} disabled={visible.length <= 1} onChange={() => updateSettings({ leadColumns: visible.filter((x) => x !== c) })} className="size-4 accent-[hsl(var(--bronze))]" />
                <span className="flex-1">{nameOf(c)}</span>
                <RowActions first={i === 0} last={i === visible.length - 1} onUp={() => move(i, -1)} onDown={() => move(i, 1)} />
              </li>
            ))}
            {hidden.map((c) => (
              <li key={c} className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground">
                <input type="checkbox" checked={false} aria-label={nameOf(c)} onChange={() => updateSettings({ leadColumns: [...visible, c] })} className="size-4 accent-[hsl(var(--bronze))]" />
                <span className="flex-1">{nameOf(c)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card className="self-start">
        <CardHeader><CardTitle>{t("defaultFilters")}</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm text-muted-foreground">{t("defaultFiltersHelp")}</p>
          <Field label={t("stage")}><Select value={df.stageId ?? ""} onChange={(e) => setDf({ stageId: e.target.value })}><option value="">{t("allStages")}</option>{lk.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
          <Field label={t("priority")}><Select value={df.priorityId ?? ""} onChange={(e) => setDf({ priorityId: e.target.value })}><option value="">{t("allPriorities")}</option>{lk.opts("priority").map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
          <Field label={t("leadSource")}><Select value={df.sourceId ?? ""} onChange={(e) => setDf({ sourceId: e.target.value })}><option value="">{t("allSources")}</option>{lk.opts("source").map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
          <Field label={t("category")}><Select value={df.categoryId ?? ""} onChange={(e) => setDf({ categoryId: e.target.value })}><option value="">{t("allCategories")}</option>{lk.groups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
        </CardContent>
      </Card>
    </div>
  );
}

export function DataPanel() {
  const { t } = useI18n();
  const { db, mode, restore, wipeAll, loadDemo, removeDemo, notify } = useStore();
  const confirm = useConfirm();
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const hasDemo = db.leads.some((l) => l.isDemo) || db.companies.some((c) => c.isDemo);

  const backup = () => {
    const { settings: _s, ...rest } = db;
    void _s;
    downloadJSON(`fitout-crm-backup-${toDateStr()}.json`, { app: "fitout-crm", version: 1, exportedAt: new Date().toISOString(), storage: mode, data: { ...rest, settings: db.settings } });
    notify(t("backupDownloaded"));
  };
  const onRestore = async (f?: File) => {
    if (!f) return;
    try {
      const raw = JSON.parse(await f.text());
      if (!(await confirm({ title: t("restoreBackup"), message: t("restoreConfirm"), confirmLabel: t("restore") }))) return;
      setBusy(true);
      await restore(raw);
    } catch (e) {
      notify(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4" id="backup">
      <Card>
        <CardHeader><CardTitle>{t("storage")}</CardTitle></CardHeader>
        <CardContent className="text-sm">
          {mode === "supabase" ? <p>{t("storageSupabaseLong")}</p> : <p className="text-warning-foreground"><strong>{t("storageLocal")}.</strong> {t("storageLocalLong")}</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t("backupRestore")}</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="bronze" onClick={backup}><Download /> {t("downloadBackup")}</Button>
          <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { onRestore(e.target.files?.[0]); e.target.value = ""; }} />
          <Button variant="outline" disabled={busy} onClick={() => file.current?.click()}><Upload /> {t("restoreBackup")}</Button>
          <Button variant="outline" onClick={() => exportLeadsCSV(db, db.leads)}><FileSpreadsheet /> {t("exportAllLeadsCsv")}</Button>
          <Button variant="outline" onClick={() => exportLeadsXLSX(db, db.leads).catch((e) => notify(String(e), "error"))}><FileSpreadsheet /> {t("exportAllLeadsXlsx")}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t("demoData")}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">{t("demoDataHelp")}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={loadDemo}><RotateCcw /> {t("loadDemo")}</Button>
            <Button variant="outline" disabled={!hasDemo} onClick={async () => { if (await confirm({ title: t("removeDemo"), message: t("removeDemoConfirm"), confirmLabel: t("removeDemo") })) removeDemo(); }}><Trash2 /> {t("removeDemo")}</Button>
          </div>
        </CardContent>
      </Card>
      <Card className="border-destructive/40">
        <CardHeader><CardTitle className="text-destructive">{t("dangerZone")}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">{t("eraseHelp")}</p>
          <Button variant="destructive" onClick={async () => { if (await confirm({ title: t("eraseAll"), message: t("eraseConfirm"), confirmLabel: t("eraseAll") })) wipeAll(); }}><Trash2 /> {t("eraseAll")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
