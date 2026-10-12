"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor, closestCorners, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { CalendarClock, GripVertical, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { useLookups, type Lookups } from "@/lib/store/hooks";
import { useUI } from "@/components/dialogs";
import { cn, formatCompact, formatDate, formatMoney, today } from "@/lib/utils";
import type { Lead, Stage } from "@/lib/types";

function LeadCard({ lead, lk, dragging, overlay }: { lead: Lead; lk: Lookups; dragging?: boolean; overlay?: boolean }) {
  const { t, name, locale } = useI18n();
  const { moveLead, openLeadForm } = useUI();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id, disabled: overlay });
  const prio = lk.optById.get(lead.priorityId);
  const closed = ["won", "lost"].includes(lk.stageById.get(lead.stageId)?.kind ?? "");
  const od = !closed && lead.nextFollowUp && lead.nextFollowUp < today();
  const cats = lead.categoryIds.map((c) => lk.catName(c)).filter(Boolean);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group rounded-md border bg-card p-3 text-sm shadow-sm transition-shadow hover:shadow-md",
        (isDragging || dragging) && !overlay && "opacity-30",
        overlay && "rotate-1 shadow-xl",
      )}
      style={{ borderInlineStartWidth: 3, borderInlineStartColor: prio?.color || undefined }}
    >
      <div className="flex items-start gap-1.5">
        <button {...listeners} {...attributes} aria-label={t("drag")} className="mt-0.5 cursor-grab touch-none text-muted-foreground active:cursor-grabbing">
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <Link href={`/leads/view?id=${lead.id}`} className="block truncate font-semibold hover:text-bronze hover:underline">
            {lead.companyName}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{lead.projectName || "—"}</p>
        </div>
        {lead.isDemo && <Badge className="bg-accent text-[10px] text-accent-foreground">{t("demo")}</Badge>}
      </div>
      {cats.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {cats.slice(0, 2).map((c) => (
            <Badge key={c} className="bg-secondary text-[10px]">{c}</Badge>
          ))}
          {cats.length > 2 && <Badge className="bg-secondary text-[10px]">+{cats.length - 2}</Badge>}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="font-semibold tabular-nums" dir="ltr">{lead.value ? formatMoney(lead.value, lk.currency) : "—"}</span>
        {prio && <Badge color={prio.color || "#64748b"}>{name(prio)}</Badge>}
      </div>
      <div className={cn("mt-2 flex items-center gap-1 text-xs", od ? "font-medium text-destructive" : "text-muted-foreground")}>
        <CalendarClock className="size-3.5" />
        {lead.nextFollowUp ? formatDate(lead.nextFollowUp, locale) : t("noFollowUp")}
      </div>
      {!overlay && (
        <div className="mt-2 flex gap-1.5 border-t pt-2 sm:hidden sm:group-hover:flex sm:group-focus-within:flex">
          <Select className="h-7 flex-1 text-xs" value={lead.stageId} onChange={(e) => moveLead(lead.id, e.target.value)} aria-label={t("moveTo")}>
            {lk.stages.map((s) => (
              <option key={s.id} value={s.id}>{name(s)}</option>
            ))}
          </Select>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => openLeadForm({ leadId: lead.id })}>{t("edit")}</Button>
        </div>
      )}
    </div>
  );
}

function Column({ stage, leads, lk }: { stage: Stage; leads: Lead[]; lk: Lookups }) {
  const { t, name } = useI18n();
  const { openLeadForm } = useUI();
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = leads.reduce((a, l) => a + (l.value ?? 0), 0);
  return (
    <div className={cn("flex w-72 shrink-0 flex-col rounded-lg border bg-muted/40 transition-colors", isOver && "border-bronze bg-accent/50")}>
      <div className="flex items-center gap-2 border-b px-3 py-2.5">
        <span className="size-2.5 rounded-full" style={{ background: stage.color }} />
        <h3 className="flex-1 truncate text-sm font-semibold">{name(stage)}</h3>
        <Badge className="bg-card">{leads.length}</Badge>
        <Button size="iconSm" variant="ghost" className="size-6" aria-label={t("newLead")} onClick={() => openLeadForm({ defaults: { stageId: stage.id } })}>
          <Plus />
        </Button>
      </div>
      <p className="px-3 pt-1.5 text-xs text-muted-foreground" dir="ltr" style={{ textAlign: "start" }}>
        {total ? formatCompact(total) + " " + lk.currency : "—"}
      </p>
      <div ref={setNodeRef} className="scroll-thin flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 17rem)" }}>
        {leads.map((l) => (
          <LeadCard key={l.id} lead={l} lk={lk} />
        ))}
        {leads.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">{t("dropHere")}</p>}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { t, name } = useI18n();
  const { db } = useStore();
  const lk = useLookups();
  const { moveLead, openLeadForm } = useUI();
  const [q, setQ] = useState("");
  const [prio, setPrio] = useState("");
  const [active, setActive] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const leads = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return db.leads.filter((l) => (!prio || l.priorityId === prio) && (!ql || l.companyName.toLowerCase().includes(ql) || l.projectName.toLowerCase().includes(ql) || l.code.toLowerCase().includes(ql)));
  }, [db.leads, q, prio]);

  const byStage = useMemo(() => {
    const m = new Map<string, Lead[]>();
    for (const s of lk.stages) m.set(s.id, []);
    for (const l of leads) m.get(l.stageId)?.push(l);
    m.forEach((arr) => arr.sort((a, b) => (a.nextFollowUp || "9999").localeCompare(b.nextFollowUp || "9999")));
    return m;
  }, [leads, lk.stages]);

  const onEnd = (e: DragEndEvent) => {
    setActive(null);
    if (e.over && e.active.id !== e.over.id) moveLead(String(e.active.id), String(e.over.id));
  };
  const activeLead = active ? db.leads.find((l) => l.id === active) : undefined;
  const open = lk.stages.filter((s) => s.kind === "open");
  const pipelineValue = db.leads.filter((l) => lk.stageById.get(l.stageId)?.kind === "open").reduce((a, l) => a + (l.value ?? 0), 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("navPipeline")}
        subtitle={t("pipelineSubtitle", { n: open.length, value: formatMoney(pipelineValue, lk.currency) })}
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute start-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input className="w-48 ps-8" placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("search")} />
            </div>
            <Select className="w-36" value={prio} onChange={(e) => setPrio(e.target.value)} aria-label={t("priority")}>
              <option value="">{t("allPriorities")}</option>
              {lk.opts("priority").map((o) => <option key={o.id} value={o.id}>{name(o)}</option>)}
            </Select>
            <Button variant="bronze" onClick={() => openLeadForm()}><Plus /> {t("newLead")}</Button>
          </>
        }
      />
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={(e: DragStartEvent) => setActive(String(e.active.id))} onDragEnd={onEnd} onDragCancel={() => setActive(null)}>
        <div className="scroll-thin -mx-3 flex gap-3 overflow-x-auto px-3 pb-4 sm:-mx-5 sm:px-5">
          {lk.stages.map((s) => (
            <Column key={s.id} stage={s} leads={byStage.get(s.id) ?? []} lk={lk} />
          ))}
        </div>
        <DragOverlay>{activeLead ? <div className="w-72"><LeadCard lead={activeLead} lk={lk} overlay /></div> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
