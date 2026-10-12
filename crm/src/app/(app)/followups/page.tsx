"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarPlus, CheckCircle2, Pencil } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, Card, CardContent, EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timeline } from "@/components/timeline";
import { useUI } from "@/components/dialogs";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { useLookups } from "@/lib/store/hooks";
import { formatDate, formatDateTime, formatMoney, today, cn, daysBetween } from "@/lib/utils";
import type { Activity } from "@/lib/types";

interface Item {
  key: string;
  date: string;
  dateTime: string;
  leadId: string;
  typeId: string;
  description: string;
  nextAction: string;
  activity?: Activity;
}

type Tab = "today" | "overdue" | "upcoming" | "meetings" | "visits" | "calls" | "emails" | "quotations" | "completed";
const TABS: Tab[] = ["today", "overdue", "upcoming", "meetings", "visits", "calls", "emails", "quotations", "completed"];
const TAB_LABEL: Record<Tab, string> = { today: "todaysFollowUps", overdue: "overdueFollowUps", upcoming: "upcomingFollowUps", meetings: "scheduledMeetings", visits: "siteVisits", calls: "callsWhatsApp", emails: "emailsSent", quotations: "quotationsAwaiting", completed: "completed" };

export default function FollowUpsPage() {
  const { t, name, locale } = useI18n();
  const { db } = useStore();
  const lk = useLookups();
  const { openActivity, openComplete } = useUI();
  const [tab, setTab] = useState<Tab>("today");
  const t0 = today();

  const keyOf = (id: string) => lk.optById.get(id)?.key ?? "";

  const { items, sets } = useMemo(() => {
    const items: Item[] = db.activities
      .filter((a) => !a.done && !a.system)
      .map((a) => ({ key: a.id, date: a.dateTime.slice(0, 10), dateTime: a.dateTime, leadId: a.leadId, typeId: a.typeId, description: a.description, nextAction: a.nextAction, activity: a }));
    // lead-level follow-up dates that have no pending activity on that date
    const call = db.options.find((o) => o.list === "activityType" && o.key === "call");
    for (const l of db.leads) {
      const kind = lk.stageById.get(l.stageId)?.kind;
      if (!l.nextFollowUp || kind === "won" || kind === "lost") continue;
      if (items.some((i) => i.leadId === l.id && i.date === l.nextFollowUp)) continue;
      items.push({ key: "lead-" + l.id, date: l.nextFollowUp, dateTime: l.nextFollowUp + "T09:00", leadId: l.id, typeId: call?.id ?? "", description: l.projectName || t("followUp"), nextAction: "" });
    }
    items.sort((a, b) => a.dateTime.localeCompare(b.dateTime));
    const pendingOnly = (f: (i: Item) => boolean) => items.filter(f);
    const done = db.activities.filter((a) => a.done && !a.system);
    const sets: Record<Tab, Item[] | null> = {
      today: pendingOnly((i) => i.date === t0),
      overdue: pendingOnly((i) => i.date < t0),
      upcoming: pendingOnly((i) => i.date > t0),
      meetings: pendingOnly((i) => keyOf(i.typeId) === "meeting" && i.date >= t0),
      visits: pendingOnly((i) => keyOf(i.typeId) === "site_visit" && i.date >= t0),
      calls: pendingOnly((i) => ["call", "whatsapp"].includes(keyOf(i.typeId))),
      emails: done.filter((a) => keyOf(a.typeId) === "email").sort((a, b) => b.dateTime.localeCompare(a.dateTime)).map((a) => ({ key: a.id, date: a.dateTime.slice(0, 10), dateTime: a.dateTime, leadId: a.leadId, typeId: a.typeId, description: a.description, nextAction: a.nextAction, activity: a })),
      quotations: null,
      completed: null,
    };
    return { items, sets };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, t0, lk.optById, lk.stageById]);

  const awaiting = useMemo(() => db.leads.filter((l) => lk.stageById.get(l.stageId)?.role === "quotation" && lk.stageById.get(l.stageId)?.kind === "open").sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)), [db.leads, lk.stageById]);
  const completed = useMemo(() => db.activities.filter((a) => a.done && !a.system), [db.activities]);
  const count = (k: Tab) => (k === "quotations" ? awaiting.length : k === "completed" ? completed.length : (sets[k] ?? []).length);
  const overdueCount = (sets.overdue ?? []).length;

  const typeBadge = (typeId: string) => { const o = lk.optById.get(typeId); return o ? <Badge color={o.color || "#64748b"}>{name(o)}</Badge> : null; };

  return (
    <div className="space-y-4">
      <PageHeader title={t("navFollowUps")} subtitle={t("followUpsSubtitle")}
        actions={<><Button variant="outline" onClick={() => openActivity({ done: true })}>{t("logActivity")}</Button><Button variant="bronze" onClick={() => openActivity()}><CalendarPlus /> {t("scheduleActivity")}</Button></>} />

      {overdueCount > 0 && (
        <button onClick={() => setTab("overdue")} className="flex w-full items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-start text-sm text-destructive">
          <AlertTriangle className="size-4" /> {t("overdueAlert", { n: overdueCount })}
        </button>
      )}

      <div className="scroll-thin flex gap-1 overflow-x-auto border-b" role="tablist">
        {TABS.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={cn("flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm", tab === k ? "border-bronze font-medium" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t(TAB_LABEL[k])}
            <span className={cn("rounded-full px-1.5 text-[11px]", k === "overdue" && count(k) > 0 ? "bg-destructive text-white" : "bg-secondary")}>{count(k)}</span>
          </button>
        ))}
      </div>

      {tab === "quotations" ? (
        <div className="space-y-2">
          {awaiting.length === 0 && <Card><EmptyState title={t("nothingHere")} /></Card>}
          {awaiting.map((l) => (
            <Card key={l.id}><CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/leads/${l.id}`} className="font-medium hover:text-bronze hover:underline">{l.companyName}</Link>
                <p className="text-xs text-muted-foreground">{l.projectName}</p>
              </div>
              <span className="tabular-nums" dir="ltr">{formatMoney(l.value, lk.currency)}</span>
              <span className="text-xs text-muted-foreground">{t("waitingDays", { n: Math.max(0, daysBetween(l.updatedAt.slice(0, 10), t0)) })}</span>
              <Button size="sm" variant="outline" onClick={() => openComplete({ leadId: l.id, date: t0 })}><CheckCircle2 /> {t("logFollowUp")}</Button>
              <Button size="sm" variant="outline" onClick={() => openActivity({ leadId: l.id })}><CalendarPlus /> {t("scheduleActivity")}</Button>
            </CardContent></Card>
          ))}
        </div>
      ) : tab === "completed" ? (
        <Card><CardContent><Timeline activities={completed} showLead /></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {(sets[tab] ?? []).length === 0 && <Card><EmptyState title={t("nothingHere")} hint={tab === "today" ? t("nothingTodayHint") : undefined} /></Card>}
          {(sets[tab] ?? []).map((i) => {
            const lead = lk.leadById.get(i.leadId);
            const od = !i.activity?.done && i.date < t0;
            const isDone = !!i.activity?.done;
            return (
              <Card key={i.key} className={cn(od && "border-destructive/50 bg-destructive/5")}>
                <CardContent className="flex flex-wrap items-center gap-3 p-4">
                  {od && <AlertTriangle className="size-5 shrink-0 text-destructive" aria-label={t("overdue")} />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {lead ? <Link href={`/leads/${lead.id}`} className="font-medium hover:text-bronze hover:underline">{lead.companyName}</Link> : <span className="font-medium">—</span>}
                      {typeBadge(i.typeId)}
                      <span className={cn("text-xs", od ? "font-medium text-destructive" : "text-muted-foreground")}>{od && `${t("overdue")} · `}{i.activity ? formatDateTime(i.dateTime, locale) : formatDate(i.date, locale)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{i.description}{lead?.projectName && i.description !== lead.projectName ? ` · ${lead.projectName}` : ""}</p>
                    {i.nextAction && <p className="text-xs text-muted-foreground">→ {i.nextAction}</p>}
                  </div>
                  {!isDone && (
                    <Button size="sm" variant="bronze" onClick={() => openComplete(i.activity ? { activityId: i.activity.id } : { leadId: i.leadId, date: i.date })}>
                      <CheckCircle2 /> {t("markDone")}
                    </Button>
                  )}
                  {i.activity && <Button size="iconSm" variant="ghost" aria-label={t("edit")} onClick={() => openActivity({ activityId: i.activity!.id })}><Pencil /></Button>}
                  {!i.activity && lead && <Button size="iconSm" variant="ghost" aria-label={t("edit")} onClick={() => openActivity({ leadId: lead.id })}><CalendarPlus /></Button>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <span className="hidden">{items.length}</span>
    </div>
  );
}
