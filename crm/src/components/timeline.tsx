"use client";
import { CheckCircle2, Circle, Clock, Trash2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { useLookups } from "@/lib/store/hooks";
import { isOverdue } from "@/lib/store/selectors";
import { useUI } from "@/components/dialogs";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import type { Activity } from "@/lib/types";

/** Chronological activity timeline (pending/overdue first, then history newest-first). */
export function Timeline({ activities, showLead }: { activities: Activity[]; showLead?: boolean }) {
  const { t, name, locale } = useI18n();
  const { commit, notify } = useStore();
  const lk = useLookups();
  const { openComplete, openActivity } = useUI();
  const confirm = useConfirm();

  const pending = activities.filter((a) => !a.done).sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  const history = activities.filter((a) => a.done).sort((a, b) => b.dateTime.localeCompare(a.dateTime) || b.createdAt.localeCompare(a.createdAt));

  const del = async (a: Activity) => {
    if (!(await confirm({ title: t("deleteActivity"), message: t("deleteActivityConfirm") }))) return;
    if (await commit({ remove: { activities: [a.id] } })) notify(t("deleted"));
  };

  const row = (a: Activity) => {
    const type = lk.optById.get(a.typeId);
    const od = isOverdue(a);
    const lead = showLead ? lk.leadById.get(a.leadId) : undefined;
    return (
      <li key={a.id} className="relative flex gap-3 pb-4 ps-1">
        <span className="absolute bottom-0 start-[0.85rem] top-6 w-px bg-border" aria-hidden />
        <span className={cn("z-10 mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-card", a.system && "opacity-60")}>
          {a.done ? <CheckCircle2 className="size-5 text-success" /> : od ? <Clock className="size-5 text-destructive" /> : <Circle className="size-5 text-bronze" />}
        </span>
        <div className={cn("min-w-0 flex-1 rounded-md border p-2.5 text-sm", od && "border-destructive/50 bg-destructive/5", a.system && "border-dashed bg-muted/30")}>
          <div className="flex flex-wrap items-center gap-2">
            {type && !a.system && <Badge color={type.color || "#64748b"}>{name(type)}</Badge>}
            <span className="text-xs text-muted-foreground">{formatDateTime(a.dateTime, locale)}</span>
            {od && <Badge className="border-destructive/40 bg-destructive/10 text-destructive">{t("overdue")}</Badge>}
            {lead && <span className="text-xs font-medium">{lead.companyName}</span>}
            {!a.system && (
              <span className="ms-auto flex gap-0.5">
                {!a.done && <Button size="sm" variant="outline" className="h-7" onClick={() => openComplete({ activityId: a.id })}><CheckCircle2 /> {t("markDone")}</Button>}
                <Button size="iconSm" variant="ghost" aria-label={t("edit")} className="size-7" onClick={() => openActivity({ activityId: a.id })}><Pencil /></Button>
                <Button size="iconSm" variant="ghost" aria-label={t("delete")} className="size-7 text-destructive" onClick={() => del(a)}><Trash2 /></Button>
              </span>
            )}
          </div>
          {a.description && <p className={cn("mt-1 whitespace-pre-wrap", a.system && "text-xs text-muted-foreground")}>{a.description}</p>}
          {a.outcome && <p className="mt-1 text-xs"><span className="font-medium">{t("outcome")}:</span> {a.outcome}</p>}
          {(a.nextAction || a.nextFollowUp) && (
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium">{t("nextAction")}:</span> {a.nextAction || "—"}
              {a.nextFollowUp && <> · {formatDate(a.nextFollowUp, locale)}</>}
            </p>
          )}
        </div>
      </li>
    );
  };

  if (!activities.length) return <p className="py-6 text-center text-sm text-muted-foreground">{t("noActivities")}</p>;
  return (
    <div>
      {pending.length > 0 && (
        <>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-bronze">{t("upcoming")}</h4>
          <ul>{pending.map(row)}</ul>
        </>
      )}
      {history.length > 0 && (
        <>
          <h4 className="mb-2 mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("history")}</h4>
          <ul>{history.map(row)}</ul>
        </>
      )}
    </div>
  );
}
