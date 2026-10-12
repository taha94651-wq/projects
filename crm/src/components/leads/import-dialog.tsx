"use client";
import { useMemo, useRef, useState } from "react";
import { FileUp, Download } from "lucide-react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { buildImportPreview, importTemplateCSV, readFileRows, type ImportPreview } from "@/lib/io";
import { applyChanges, mergeChanges, planSaveLead, type Changes } from "@/lib/store/logic";
import { download } from "@/lib/utils";

export function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useI18n();
  const { db, commit, notify } = useStore();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [fileName, setFileName] = useState("");
  const [err, setErr] = useState("");
  const [skipDup, setSkipDup] = useState(true);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPreview(null);
    setFileName("");
    setErr("");
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    reset();
    setFileName(f.name);
    if (f.size > 10 * 1024 * 1024) return setErr(t("fileTooLarge"));
    try {
      const rows = await readFileRows(f);
      const p = buildImportPreview(db, rows);
      if (!p.rows.length) setErr(t("importEmpty"));
      else if (!p.mapped.companyName) setErr(t("importNoCompanyColumn"));
      else setPreview(p);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const stats = useMemo(() => {
    if (!preview) return null;
    const ok = preview.rows.filter((r) => r.input && !(skipDup && r.dup));
    return { ok: ok.length, errors: preview.rows.filter((r) => r.errors.length).length, dups: preview.rows.filter((r) => r.dup).length };
  }, [preview, skipDup]);

  const run = async () => {
    if (!preview) return;
    setBusy(true);
    let work = db;
    let all: Changes = {};
    let n = 0;
    for (const r of preview.rows) {
      if (!r.input || (skipDup && r.dup)) continue;
      const { changes } = planSaveLead(work, r.input);
      work = applyChanges(work, changes);
      all = mergeChanges(all, changes);
      n++;
    }
    const ok = await commit(all);
    setBusy(false);
    if (ok) {
      notify(t("importDone", { n }));
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}
      title={t("importLeads")}
      description={t("importHint")}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button variant="bronze" disabled={!stats || stats.ok === 0 || busy} onClick={run}>
            {t("importN", { n: stats?.ok ?? 0 })}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <input ref={input} type="file" accept=".csv,.xlsx,.tsv,.txt" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
          <Button variant="outline" onClick={() => input.current?.click()}>
            <FileUp /> {t("chooseFile")}
          </Button>
          <Button variant="ghost" onClick={() => download("leads-import-template.csv", importTemplateCSV(), "text/csv;charset=utf-8")}>
            <Download /> {t("downloadTemplate")}
          </Button>
          {fileName && <span className="text-sm text-muted-foreground" dir="ltr">{fileName}</span>}
        </div>
        {err && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</p>}
        {preview && stats && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge className="bg-success/10 text-success">{t("rowsReady", { n: stats.ok })}</Badge>
              {stats.errors > 0 && <Badge className="bg-destructive/10 text-destructive">{t("rowsWithErrors", { n: stats.errors })}</Badge>}
              {stats.dups > 0 && (
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={skipDup} onChange={(e) => setSkipDup(e.target.checked)} className="size-4 accent-[hsl(var(--bronze))]" />
                  {t("skipDuplicates", { n: stats.dups })}
                </label>
              )}
            </div>
            {preview.unmapped.length > 0 && (
              <p className="text-xs text-muted-foreground">{t("ignoredColumns")}: {preview.unmapped.join(", ")}</p>
            )}
            <div className="max-h-72 overflow-auto rounded-md border scroll-thin">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-2 py-1.5 text-start">#</th>
                    <th className="px-2 py-1.5 text-start">{t("company")}</th>
                    <th className="px-2 py-1.5 text-start">{t("projectName")}</th>
                    <th className="px-2 py-1.5 text-start">{t("status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 200).map((r) => (
                    <tr key={r.line} className="border-t align-top">
                      <td className="px-2 py-1.5">{r.line}</td>
                      <td className="px-2 py-1.5">{r.input?.companyName ?? "—"}</td>
                      <td className="px-2 py-1.5">{r.input?.projectName}</td>
                      <td className="px-2 py-1.5">
                        {r.errors.map((e, i) => <div key={i} className="text-destructive">✕ {e}</div>)}
                        {r.warnings.map((e, i) => <div key={i} className="text-warning">! {e}</div>)}
                        {!r.errors.length && !r.warnings.length && <span className="text-success">✓</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.rows.length > 200 && <p className="text-xs text-muted-foreground">{t("previewLimited", { n: 200 })}</p>}
          </>
        )}
      </div>
    </Modal>
  );
}
