"use client";
import { useMemo } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  FileText,
  Handshake,
  Phone,
  Sparkles,
  Trophy,
  Wallet,
  XCircle,
  Banknote,
} from "lucide-react";
import { useStore } from "@/lib/store/store";
import { useI18n } from "@/lib/i18n";
import { useLookups } from "@/lib/store/hooks";
import { dashboardStats, leadsByGroup, leadsByStage, monthlyAcquisition, revenueByService, sourcePerformance, wonVsLostMonthly, isOverdue } from "@/lib/store/selectors";
import { ChartCard, PALETTE, axisProps, monthLabel, tooltipStyle } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui/card";
import { formatCompact, formatDate, formatMoney, today } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { useUI } from "@/components/dialogs";

export default function DashboardPage() {
  const { db } = useStore();
  const { t, name, locale, lang } = useI18n();
  const lk = useLookups();
  const { openComplete } = useUI();
  const s = useMemo(() => dashboardStats(db), [db]);
  const byGroup = useMemo(() => leadsByGroup(db), [db]);
  const byStage = useMemo(() => leadsByStage(db), [db]);
  const monthly = useMemo(() => monthlyAcquisition(db, 12), [db]);
  const wl = useMemo(() => wonVsLostMonthly(db, 12), [db]);
  const rev = useMemo(() => revenueByService(db).slice(0, 8), [db]);
  const src = useMemo(() => sourcePerformance(db).filter((x) => x.leads > 0), [db]);
  const money = (n: number) => formatMoney(n, lk.currency, locale.startsWith("ar") ? "en-US" : "en-US");

  const cards = [
    { key: "kpiTotalClients", v: s.totalClients, icon: Building2, href: "/companies" },
    { key: "kpiNewLeads", v: s.newLeads, icon: Sparkles, href: "/leads" },
    { key: "kpiContacted", v: s.contacted, icon: Phone, href: "/leads" },
    { key: "kpiFollowUp", v: s.followUp, icon: CalendarClock, href: "/followups", warn: s.followUp > 0 },
    { key: "kpiMeetings", v: s.meetings, icon: Handshake, href: "/followups" },
    { key: "kpiQuotations", v: s.quotations, icon: FileText, href: "/pipeline" },
    { key: "kpiWon", v: s.won, icon: Trophy, href: "/leads" },
    { key: "kpiLost", v: s.lost, icon: XCircle, href: "/leads" },
    { key: "kpiPotentialValue", v: money(s.potentialValue), icon: Wallet, href: "/pipeline", wide: true },
    { key: "kpiWonValue", v: money(s.wonValue), icon: Banknote, href: "/reports", wide: true },
  ];

  const upcoming = useMemo(
    () =>
      db.activities
        .filter((a) => !a.done)
        .sort((a, b) => a.dateTime.localeCompare(b.dateTime))
        .slice(0, 6),
    [db.activities],
  );
  const recent = useMemo(() => [...db.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6), [db.leads]);

  return (
    <div className="space-y-5">
      <PageHeader title={t("navDashboard")} subtitle={t("dashboardSubtitle")} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <Link key={c.key} href={c.href} className={c.wide ? "col-span-2 md:col-span-1 xl:col-span-1" : ""}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex items-start justify-between gap-2 p-4">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t(c.key)}</p>
                  <p className={`mt-1 break-words font-semibold tracking-tight ${c.wide ? "text-lg sm:text-xl" : "text-2xl"} ${c.warn ? "text-destructive" : ""}`} dir="ltr" style={{ textAlign: lang === "ar" ? "end" : "start" }}>
                    {c.v}
                  </p>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
                  <c.icon className="size-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("chartLeadsByCategory")} empty={byGroup.every((g) => !g.count)}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={byGroup.map((g) => ({ name: name(g.cat), value: g.count }))} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2} label={({ value }) => value}>
                {byGroup.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("chartLeadsByStage")} empty={byStage.every((g) => !g.count)}>
          <ResponsiveContainer>
            <BarChart data={byStage.map((x) => ({ name: name(x.stage), count: x.count, color: x.stage.color }))} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" allowDecimals={false} {...axisProps} />
              <YAxis type="category" dataKey="name" width={150} interval={0} {...axisProps} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--accent))" }} />
              <Bar dataKey="count" name={t("leads")} radius={[0, 4, 4, 0]}>
                {byStage.map((x) => (
                  <Cell key={x.id} fill={x.stage.color || PALETTE[0]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("chartMonthly")} subtitle={t("last12Months")} empty={monthly.every((m) => !m.leads)}>
          <ResponsiveContainer>
            <AreaChart data={monthly.map((m) => ({ ...m, label: monthLabel(m.month, locale) }))}>
              <defs>
                <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PALETTE[0]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={PALETTE[0]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis allowDecimals={false} {...axisProps} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="leads" name={t("leads")} stroke={PALETTE[0]} strokeWidth={2} fill="url(#gLeads)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("chartWonLost")} subtitle={t("last12Months")} empty={wl.every((m) => !m.won && !m.lost)}>
          <ResponsiveContainer>
            <BarChart data={wl.map((m) => ({ ...m, label: monthLabel(m.month, locale) }))}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis allowDecimals={false} {...axisProps} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--accent))" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="won" name={t("won")} fill="#2f9e5f" radius={[3, 3, 0, 0]} />
              <Bar dataKey="lost" name={t("lost")} fill="#c9553d" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("chartRevenueByService")} subtitle={t("revenueSplitNote")} empty={!rev.length}>
          <ResponsiveContainer>
            <BarChart data={rev.map((r) => ({ name: name(r.cat), value: Math.round(r.value) }))} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" tickFormatter={(v) => formatCompact(v)} {...axisProps} />
              <YAxis type="category" dataKey="name" width={170} interval={0} {...axisProps} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--accent))" }} formatter={(v) => money(Number(v))} />
              <Bar dataKey="value" name={t("potentialRevenue")} fill={PALETTE[1]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("chartSources")} empty={!src.length}>
          <ResponsiveContainer>
            <ComposedChart data={src.map((x) => ({ name: name(x.source), leads: x.leads, won: x.won, rate: Math.round(x.conversion * 100) }))}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={60} {...axisProps} />
              <YAxis yAxisId="l" allowDecimals={false} {...axisProps} />
              <YAxis yAxisId="r" orientation="right" unit="%" domain={[0, 100]} {...axisProps} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--accent))" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} verticalAlign="top" />
              <Bar yAxisId="l" dataKey="leads" name={t("leads")} fill={PALETTE[1]} radius={[3, 3, 0, 0]} />
              <Bar yAxisId="l" dataKey="won" name={t("won")} fill="#2f9e5f" radius={[3, 3, 0, 0]} />
              <Line yAxisId="r" dataKey="rate" name={t("conversionRate") + " %"} stroke={PALETTE[0]} strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("upcomingActivities")}</CardTitle>
            <Link href="/followups" className="text-xs text-bronze hover:underline">
              {t("viewAll")}
            </Link>
          </CardHeader>
          <CardContent className="space-y-1 pt-3">
            {upcoming.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{t("nothingScheduled")}</p>}
            {upcoming.map((a) => {
              const lead = lk.leadById.get(a.leadId);
              const od = isOverdue(a);
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{lead?.companyName ?? "—"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {lk.optName(a.typeId)} · {a.description}
                    </p>
                  </div>
                  <Badge className={od ? "border-destructive/40 bg-destructive/10 text-destructive" : "bg-secondary"}>{formatDate(a.dateTime.slice(0, 10), locale)}</Badge>
                  <button className="text-success" aria-label={t("markDone")} title={t("markDone")} onClick={() => openComplete({ activityId: a.id })}>
                    <CheckCircle2 className="size-5" />
                  </button>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("recentLeads")}</CardTitle>
            <Link href="/leads" className="text-xs text-bronze hover:underline">
              {t("viewAll")}
            </Link>
          </CardHeader>
          <CardContent className="space-y-1 pt-3">
            {recent.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{t("noLeadsYet")}</p>}
            {recent.map((l) => {
              const st = lk.stageById.get(l.stageId);
              return (
                <Link key={l.id} href={`/leads/${l.id}`} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.companyName}</p>
                    <p className="truncate text-xs text-muted-foreground">{l.projectName}</p>
                  </div>
                  <span className="text-xs text-muted-foreground" dir="ltr">
                    {l.value ? formatCompact(l.value) : ""}
                  </span>
                  {st && <Badge color={st.color}>{name(st)}</Badge>}
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">{today() && t("kpiNote")}</p>
    </div>
  );
}
