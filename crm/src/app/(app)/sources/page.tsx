"use client";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ChartCard, PALETTE, axisProps, tooltipStyle } from "@/components/charts";
import { OptionManager } from "@/components/settings/option-manager";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { useLookups } from "@/lib/store/hooks";
import { sourcePerformance } from "@/lib/store/selectors";
import { formatCompact, formatMoney } from "@/lib/utils";

export default function SourcesPage() {
  const { t, name } = useI18n();
  const { db } = useStore();
  const lk = useLookups();
  const perf = useMemo(() => sourcePerformance(db), [db]);
  const active = perf.filter((p) => p.leads > 0);
  type Row = (typeof perf)[number] & { id: string };
  const cols: Column<Row>[] = [
    { key: "src", header: t("leadSource"), sort: (r) => name(r.source), cell: (r) => <span className="font-medium">{name(r.source)}</span> },
    { key: "leads", header: t("leads"), sort: (r) => r.leads, className: "text-end", cell: (r) => r.leads },
    { key: "won", header: t("won"), sort: (r) => r.won, className: "text-end", cell: (r) => r.won },
    { key: "lost", header: t("lost"), sort: (r) => r.lost, className: "text-end", cell: (r) => r.lost },
    { key: "conv", header: t("conversionRate"), sort: (r) => r.conversion, className: "text-end", cell: (r) => <span dir="ltr">{Math.round(r.conversion * 100)}%</span> },
    { key: "pipe", header: t("openPipeline"), sort: (r) => r.pipelineValue, className: "text-end", cell: (r) => <span className="ltr-num tabular-nums">{formatMoney(r.pipelineValue, lk.currency)}</span> },
    { key: "wonv", header: t("wonValue"), sort: (r) => r.wonValue, className: "text-end", cell: (r) => <span className="ltr-num tabular-nums">{formatMoney(r.wonValue, lk.currency)}</span> },
  ];
  return (
    <div className="space-y-4">
      <PageHeader title={t("navSources")} subtitle={t("sourcesSubtitle")} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("leadsBySource")} empty={!active.length}>
          <ResponsiveContainer><PieChart>
            <Pie data={active.map((a) => ({ name: name(a.source), value: a.leads }))} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2} label={({ value }) => value}>
              {active.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Pie><Tooltip {...tooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title={t("sourceWinLoss")} empty={!active.length}>
          <ResponsiveContainer><BarChart data={active.map((a) => ({ name: name(a.source), won: a.won, lost: a.lost }))}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={60} {...axisProps} /><YAxis allowDecimals={false} {...axisProps} />
            <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--accent))" }} /><Legend wrapperStyle={{ fontSize: 11 }} verticalAlign="top" />
            <Bar dataKey="won" name={t("won")} fill="#2f9e5f" radius={[3, 3, 0, 0]} /><Bar dataKey="lost" name={t("lost")} fill="#c9553d" radius={[3, 3, 0, 0]} />
          </BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title={t("sourceValue")} empty={!active.length}>
          <ResponsiveContainer><BarChart data={active.map((a) => ({ name: name(a.source), pipeline: Math.round(a.pipelineValue), won: Math.round(a.wonValue) }))} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid horizontal={false} stroke="hsl(var(--border))" /><XAxis type="number" tickFormatter={(v) => formatCompact(v)} {...axisProps} /><YAxis type="category" dataKey="name" width={120} {...axisProps} />
            <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--accent))" }} formatter={(v) => formatMoney(Number(v), lk.currency)} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="pipeline" name={t("openPipeline")} fill={PALETTE[1]} radius={[0, 3, 3, 0]} /><Bar dataKey="won" name={t("wonValue")} fill="#2f9e5f" radius={[0, 3, 3, 0]} />
          </BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title={t("sourceConversion")} subtitle={t("conversionNote")} empty={!active.length}>
          <ResponsiveContainer><BarChart data={active.map((a) => ({ name: name(a.source), rate: Math.round(a.conversion * 100) }))}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={60} {...axisProps} /><YAxis unit="%" domain={[0, 100]} {...axisProps} />
            <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--accent))" }} /><Bar dataKey="rate" name={t("conversionRate") + " %"} fill={PALETTE[0]} radius={[3, 3, 0, 0]} />
          </BarChart></ResponsiveContainer>
        </ChartCard>
      </div>
      <Card><DataTable rows={perf as Row[]} columns={cols} pageSize={20} initialSort={{ key: "leads", dir: "desc" }} /></Card>
      <div><h2 className="mb-2 text-sm font-semibold">{t("manageSources")}</h2><OptionManager list="source" /></div>
    </div>
  );
}
