"use client";
import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, PALETTE, axisProps, tooltipStyle } from "@/components/charts";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { useLookups } from "@/lib/store/hooks";
import { exportLeadsCSV, exportLeadsXLSX, exportTableCSV, exportTableXLSX } from "@/lib/io";
import { groupOf, sorted, weightedValue } from "@/lib/store/selectors";
import { addDays, formatCompact, formatMoney, sum, today, toDateStr } from "@/lib/utils";
import type { Lead } from "@/lib/types";

interface F { from: string; to: string; categoryId: string; sourceId: string; stageId: string; city: string; result: "" | "open" | "won" | "lost" }

export default function ReportsPage() {
  const { t, name, locale } = useI18n();
  const { db, notify } = useStore();
  const lk = useLookups();
  const [f, setF] = useState<F>({ from: addDays(today(), -365), to: today(), categoryId: "", sourceId: "", stageId: "", city: "", result: "" });
  const set = <K extends keyof F>(k: K, v: F[K]) => setF((s) => ({ ...s, [k]: v }));
  const preset = (days: number | "ytd" | "all") => {
    if (days === "all") return setF((s) => ({ ...s, from: "", to: "" }));
    if (days === "ytd") return setF((s) => ({ ...s, from: `${new Date().getFullYear()}-01-01`, to: today() }));
    setF((s) => ({ ...s, from: addDays(today(), -days), to: today() }));
  };

  const kind = (l: Lead) => lk.stageById.get(l.stageId)?.kind ?? "open";
  const leads = useMemo(
    () =>
      db.leads.filter((l) => {
        const d = l.createdAt.slice(0, 10);
        if (f.from && d < f.from) return false;
        if (f.to && d > f.to) return false;
        if (f.categoryId && !l.categoryIds.some((id) => id === f.categoryId || groupOf(lk.catById, id) === f.categoryId)) return false;
        if (f.sourceId && l.sourceId !== f.sourceId) return false;
        if (f.stageId && l.stageId !== f.stageId) return false;
        if (f.city && l.city !== f.city) return false;
        if (f.result) { const k = kind(l); if (f.result === "open" ? k !== "open" && k !== "hold" : k !== f.result) return false; }
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db.leads, f, lk.catById, lk.stageById],
  );

  const m = useMemo(() => {
    const won = leads.filter((l) => kind(l) === "won");
    const lost = leads.filter((l) => kind(l) === "lost");
    const open = leads.filter((l) => kind(l) === "open");
    const decided = won.length + lost.length;
    const ids = new Set(leads.map((l) => l.id));
    const acts = db.activities.filter((a) => !a.system && ids.has(a.leadId));
    const done = acts.filter((a) => a.done);
    const onTime = done.filter((a) => a.completedAt.slice(0, 10) <= a.dateTime.slice(0, 10) || !a.completedAt);
    const overdue = acts.filter((a) => !a.done && a.dateTime.slice(0, 10) < today());
    const projects = db.projects.filter((p) => p.leadId && ids.has(p.leadId));
    return {
      total: leads.length, won: won.length, lost: lost.length, open: open.length,
      conversion: decided ? won.length / decided : 0, winRate: leads.length ? won.length / leads.length : 0,
      estAll: sum(leads, (l) => l.value ?? 0), estOpen: sum(open, (l) => l.value ?? 0),
      estWon: sum(won, (l) => l.value ?? 0), actualWon: sum(won, (l) => l.outcome?.finalValue ?? l.value ?? 0), estLost: sum(lost, (l) => l.value ?? 0),
      avgDeal: won.length ? sum(won, (l) => l.outcome?.finalValue ?? l.value ?? 0) / won.length : 0,
      weighted: sum(projects, (p) => weightedValue(p)),
      acts: acts.length, done: done.length, onTime: onTime.length, overdue: overdue.length,
      completion: acts.length ? done.length / acts.length : 0, onTimeRate: done.length ? onTime.length / done.length : 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, db.activities, db.projects, lk.stageById]);

  const breakdown = (key: (l: Lead) => string[], label: (k: string) => string) => {
    const map = new Map<string, Lead[]>();
    for (const l of leads) for (const k of key(l)) { if (!k) continue; (map.get(k) ?? map.set(k, []).get(k)!).push(l); }
    return [...map.entries()].map(([k, ls]) => {
      const won = ls.filter((l) => kind(l) === "won"), lost = ls.filter((l) => kind(l) === "lost");
      return { key: k, label: label(k), leads: ls.length, won: won.length, lost: lost.length, est: sum(ls, (l) => l.value ?? 0), actual: sum(won, (l) => l.outcome?.finalValue ?? l.value ?? 0), conv: won.length + lost.length ? won.length / (won.length + lost.length) : 0 };
    }).sort((a, b) => b.leads - a.leads);
  };
  const bySource = useMemo(() => breakdown((l) => [l.sourceId], (k) => lk.optName(k)), [leads, lk]); // eslint-disable-line react-hooks/exhaustive-deps
  const byCategory = useMemo(() => breakdown((l) => [...new Set(l.categoryIds.map((c) => groupOf(lk.catById, c)))], (k) => name(lk.catById.get(k))), [leads, lk]); // eslint-disable-line react-hooks/exhaustive-deps
  const byStage = useMemo(() => sorted(db.stages).map((s) => { const ls = leads.filter((l) => l.stageId === s.id); return { key: s.id, label: name(s), leads: ls.length, won: 0, lost: 0, est: sum(ls, (l) => l.value ?? 0), actual: 0, conv: 0 }; }), [leads, db.stages, name]);
  const byCity = useMemo(() => breakdown((l) => [l.city], (k) => k), [leads, lk]); // eslint-disable-line react-hooks/exhaustive-deps
  const byMonth = useMemo(() => breakdown((l) => [l.createdAt.slice(0, 7)], (k) => k).sort((a, b) => a.key.localeCompare(b.key)), [leads, lk]); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = (n: number) => Math.round(n * 100) + "%";
  const money = (n: number) => formatMoney(n, lk.currency);

  const summaryRows = (): (string | number)[][] => [
    [t("repTotalLeads"), m.total], [t("won"), m.won], [t("lost"), m.lost], [t("repOpen"), m.open], [t("conversionRate"), pct(m.conversion)], [t("repWinRate"), pct(m.winRate)],
    [t("repEstimatedAll"), m.estAll], [t("repEstimatedWon"), m.estWon], [t("repActualWon"), m.actualWon], [t("repEstimatedLost"), m.estLost], [t("repWeighted"), Math.round(m.weighted)],
    [t("repActivities"), m.acts], [t("repCompleted"), m.done], [t("repOnTime"), pct(m.onTimeRate)], [t("repOverdue"), m.overdue],
  ];
  const tables: [string, typeof bySource][] = [[t("bySource"), bySource], [t("byCategory"), byCategory], [t("byStage"), byStage], [t("byCity"), byCity], [t("byMonth"), byMonth]];
  const hdr = [t("repGroup"), t("leads"), t("won"), t("lost"), t("conversionRate"), t("repEstimated"), t("repActual")];
  const rowsOf = (rows: typeof bySource) => rows.map((r) => [r.label, r.leads, r.won, r.lost, Math.round(r.conv * 100) + "%", Math.round(r.est), Math.round(r.actual)] as (string | number)[]);

  const exportReport = async (kindOf: "csv" | "xlsx") => {
    const all: (string | number)[][] = [[t("repReportTitle"), `${f.from || "…"} → ${f.to || "…"}`], [], ...summaryRows(), []];
    for (const [title, rows] of tables) { all.push([title], hdr, ...rowsOf(rows), []); }
    const width = Math.max(...all.map((r) => r.length));
    const padded = all.map((r) => [...r, ...Array(width - r.length).fill("")]);
    const fn = `report-${toDateStr()}.${kindOf}`;
    if (kindOf === "csv") exportTableCSV(padded[0].map(String), padded.slice(1), fn);
    else await exportTableXLSX(padded[0].map(String), padded.slice(1), fn);
  };

  const kpis: [string, string][] = [
    [t("repTotalLeads"), String(m.total)], [t("won"), String(m.won)], [t("lost"), String(m.lost)], [t("conversionRate"), pct(m.conversion)],
    [t("repEstimatedAll"), money(m.estAll)], [t("repEstimatedWon"), money(m.estWon)], [t("repActualWon"), money(m.actualWon)], [t("repAvgDeal"), money(m.avgDeal)],
    [t("repWeighted"), money(m.weighted)], [t("repCompletion"), pct(m.completion)], [t("repOnTime"), pct(m.onTimeRate)], [t("repOverdue"), String(m.overdue)],
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t("navReports")} subtitle={t("reportsSubtitle")}
        actions={<>
          <Button variant="outline" onClick={() => exportReport("csv")}><Download /> {t("reportCsv")}</Button>
          <Button variant="outline" onClick={() => exportReport("xlsx").catch((e) => notify(String(e), "error"))}><FileSpreadsheet /> {t("reportXlsx")}</Button>
          <Button variant="outline" onClick={() => window.print()}><Printer /> {t("print")}</Button>
        </>} />

      <Card className="no-print p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <Field label={t("dateFrom")}><Input type="date" value={f.from} onChange={(e) => set("from", e.target.value)} /></Field>
          <Field label={t("dateTo")}><Input type="date" value={f.to} onChange={(e) => set("to", e.target.value)} /></Field>
          <Field label={t("category")}><Select value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}><option value="">{t("allCategories")}</option>{lk.groups.map((g) => <option key={g.id} value={g.id}>{name(g)}</option>)}</Select></Field>
          <Field label={t("leadSource")}><Select value={f.sourceId} onChange={(e) => set("sourceId", e.target.value)}><option value="">{t("allSources")}</option>{lk.opts("source").map((o) => <option key={o.id} value={o.id}>{name(o)}</option>)}</Select></Field>
          <Field label={t("stage")}><Select value={f.stageId} onChange={(e) => set("stageId", e.target.value)}><option value="">{t("allStages")}</option>{lk.stages.map((s) => <option key={s.id} value={s.id}>{name(s)}</option>)}</Select></Field>
          <Field label={t("city")}><Select value={f.city} onChange={(e) => set("city", e.target.value)}><option value="">{t("allCities")}</option>{[...new Set(db.leads.map((l) => l.city).filter(Boolean))].sort().map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label={t("repResult")}><Select value={f.result} onChange={(e) => set("result", e.target.value as F["result"])}><option value="">{t("repAll")}</option><option value="open">{t("repOpen")}</option><option value="won">{t("won")}</option><option value="lost">{t("lost")}</option></Select></Field>
          <div className="flex items-end gap-1 text-xs">
            <Button variant="outline" size="sm" onClick={() => preset(30)}>30d</Button><Button variant="outline" size="sm" onClick={() => preset(90)}>90d</Button>
            <Button variant="outline" size="sm" onClick={() => preset("ytd")}>YTD</Button><Button variant="outline" size="sm" onClick={() => preset("all")}>{t("repAll")}</Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t("reportDateNote")}</p>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map(([k, v]) => (
          <Card key={k}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 truncate text-lg font-semibold tracking-tight" dir="ltr" style={{ textAlign: "start" }}>{v}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("estimatedVsActual")} subtitle={t("bySource")} empty={!bySource.length}>
          <ResponsiveContainer><BarChart data={bySource.slice(0, 8).map((r) => ({ name: r.label, est: Math.round(r.est), actual: Math.round(r.actual) }))}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={55} {...axisProps} /><YAxis tickFormatter={(v) => formatCompact(v)} {...axisProps} />
            <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--accent))" }} formatter={(v) => money(Number(v))} /><Legend wrapperStyle={{ fontSize: 11 }} verticalAlign="top" />
            <Bar dataKey="est" name={t("repEstimated")} fill={PALETTE[1]} radius={[3, 3, 0, 0]} /><Bar dataKey="actual" name={t("repActual")} fill="#2f9e5f" radius={[3, 3, 0, 0]} />
          </BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title={t("conversionRate")} subtitle={t("byCategory")} empty={!byCategory.length}>
          <ResponsiveContainer><BarChart data={byCategory.map((r) => ({ name: r.label, rate: Math.round(r.conv * 100), won: r.won, lost: r.lost }))} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid horizontal={false} stroke="hsl(var(--border))" /><XAxis type="number" unit="%" domain={[0, 100]} {...axisProps} /><YAxis type="category" dataKey="name" width={170} {...axisProps} />
            <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--accent))" }} /><Bar dataKey="rate" name={t("conversionRate") + " %"} fill={PALETTE[0]} radius={[0, 4, 4, 0]} />
          </BarChart></ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {tables.map(([title, rows]) => (
          <Card key={title}>
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto p-0 pt-2">
              <table className="w-full min-w-max text-sm">
                <thead><tr className="border-b text-xs text-muted-foreground">{hdr.map((h, i) => <th key={h} className={`px-3 py-2 font-medium ${i ? "text-end" : "text-start"}`}>{h}</th>)}</tr></thead>
                <tbody>
                  {rows.length === 0 && <tr><td colSpan={hdr.length} className="px-3 py-6 text-center text-muted-foreground">—</td></tr>}
                  {rowsOf(rows).map((r, i) => <tr key={i} className="border-b last:border-0">{r.map((c, j) => <td key={j} className={`px-3 py-2 ${j ? "text-end tabular-nums" : ""}`} dir={j ? "ltr" : undefined}>{j >= 5 ? formatCompact(Number(c), locale) : c}</td>)}</tr>)}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="no-print flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => leads.length ? exportLeadsCSV(db, leads, `report-leads-${toDateStr()}.csv`) : notify(t("nothingToExport"), "error")}><Download /> {t("exportReportLeadsCsv", { n: leads.length })}</Button>
        <Button variant="outline" onClick={() => leads.length ? exportLeadsXLSX(db, leads, `report-leads-${toDateStr()}.xlsx`) : notify(t("nothingToExport"), "error")}><FileSpreadsheet /> {t("exportReportLeadsXlsx")}</Button>
      </div>
    </div>
  );
}
