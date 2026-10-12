import type { Activity, Category, DB, Lead, Option, OptionList, Stage } from "../types";
import { monthKey, sum, today } from "../utils";

export function sorted<T extends { sort: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => a.sort - b.sort);
}

export const optionsOf = (db: DB, list: OptionList): Option[] => sorted(db.options.filter((o) => o.list === list));

export function indexById<T extends { id: string }>(arr: T[]): Map<string, T> {
  return new Map(arr.map((x) => [x.id, x]));
}

export function stageOf(db: DB, lead: Lead): Stage | undefined {
  return db.stages.find((s) => s.id === lead.stageId);
}

export const isClosed = (s?: Stage) => s?.kind === "won" || s?.kind === "lost";
export const isOpen = (s?: Stage) => !s || s.kind === "open";

/** Group id for any category node (the node itself if it is a group). */
export function groupOf(cats: Map<string, Category>, id: string): string {
  const c = cats.get(id);
  return c ? c.parentId || c.id : "";
}

export function groupsOfLead(cats: Map<string, Category>, lead: { categoryIds: string[] }): string[] {
  return [...new Set(lead.categoryIds.map((id) => groupOf(cats, id)).filter(Boolean))];
}

export function optKey(db: DB, id: string): string {
  return db.options.find((o) => o.id === id)?.key ?? "";
}

export function nextLeadCode(leads: Lead[]): string {
  let max = 0;
  for (const l of leads) {
    const n = parseInt(l.code.replace(/\D/g, ""), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return "LD-" + String(max + 1).padStart(4, "0");
}

export function isOverdue(a: Activity, ref = today()): boolean {
  return !a.done && a.dateTime.slice(0, 10) < ref;
}

export function dashboardStats(db: DB, ref = today()) {
  const stages = indexById(db.stages);
  const kind = (l: Lead) => stages.get(l.stageId)?.kind ?? "open";
  const role = (l: Lead) => stages.get(l.stageId)?.role ?? "";
  const open = db.leads.filter((l) => kind(l) === "open");
  const won = db.leads.filter((l) => kind(l) === "won");
  const lost = db.leads.filter((l) => kind(l) === "lost");

  const meetingTypeIds = new Set(db.options.filter((o) => o.list === "activityType" && o.key === "meeting").map((o) => o.id));
  const meetingLeads = new Set<string>();
  for (const l of open) if (role(l) === "meeting") meetingLeads.add(l.id);
  for (const a of db.activities)
    if (!a.done && meetingTypeIds.has(a.typeId) && a.dateTime.slice(0, 10) >= ref && a.leadId) meetingLeads.add(a.leadId);

  return {
    totalClients: db.companies.length,
    newLeads: open.filter((l) => role(l) === "new").length,
    contacted: open.filter((l) => role(l) === "contacted").length,
    followUp: open.filter((l) => l.nextFollowUp && l.nextFollowUp <= ref).length,
    meetings: meetingLeads.size,
    quotations: open.filter((l) => role(l) === "quotation").length,
    won: won.length,
    lost: lost.length,
    potentialValue: sum(open, (l) => l.value ?? 0),
    wonValue: sum(won, (l) => l.outcome?.finalValue ?? l.value ?? 0),
  };
}

export function leadsByGroup(db: DB) {
  const cats = indexById(db.categories);
  const groups = sorted(db.categories.filter((c) => !c.parentId));
  const counts = new Map<string, number>();
  for (const l of db.leads) for (const g of groupsOfLead(cats, l)) counts.set(g, (counts.get(g) ?? 0) + 1);
  return groups.map((g) => ({ id: g.id, cat: g, count: counts.get(g.id) ?? 0 }));
}

export function leadsByStage(db: DB) {
  return sorted(db.stages).map((s) => {
    const ls = db.leads.filter((l) => l.stageId === s.id);
    return { id: s.id, stage: s, count: ls.length, value: sum(ls, (l) => l.value ?? 0) };
  });
}

/** Last `n` months (including current) keyed YYYY-MM. */
export function lastMonths(n: number, ref = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export function monthlyAcquisition(db: DB, n = 12) {
  const months = lastMonths(n);
  const c = new Map<string, number>();
  for (const l of db.leads) c.set(monthKey(l.createdAt), (c.get(monthKey(l.createdAt)) ?? 0) + 1);
  return months.map((m) => ({ month: m, leads: c.get(m) ?? 0 }));
}

export function wonVsLostMonthly(db: DB, n = 12) {
  const months = lastMonths(n);
  const stages = indexById(db.stages);
  return months.map((m) => {
    let won = 0;
    let lost = 0;
    for (const l of db.leads) {
      const k = stages.get(l.stageId)?.kind;
      if (k !== "won" && k !== "lost") continue;
      const when = l.outcome?.date || l.updatedAt;
      if (monthKey(when) !== m) continue;
      if (k === "won") won++;
      else lost++;
    }
    return { month: m, won, lost };
  });
}

/** Revenue potential per service category; a lead's value is split evenly across its categories (no double counting). */
export function revenueByService(db: DB) {
  const cats = indexById(db.categories);
  const stages = indexById(db.stages);
  const acc = new Map<string, number>();
  for (const l of db.leads) {
    if (stages.get(l.stageId)?.kind === "lost") continue;
    const ids = l.categoryIds.filter((id) => cats.has(id));
    if (!ids.length || !l.value) continue;
    const share = l.value / ids.length;
    for (const id of ids) acc.set(id, (acc.get(id) ?? 0) + share);
  }
  return [...acc.entries()]
    .map(([id, value]) => ({ id, cat: cats.get(id)!, value }))
    .sort((a, b) => b.value - a.value);
}

export function sourcePerformance(db: DB) {
  const stages = indexById(db.stages);
  return optionsOf(db, "source")
    .map((s) => {
      const ls = db.leads.filter((l) => l.sourceId === s.id);
      const won = ls.filter((l) => stages.get(l.stageId)?.kind === "won");
      const lost = ls.filter((l) => stages.get(l.stageId)?.kind === "lost");
      const decided = won.length + lost.length;
      return {
        id: s.id,
        source: s,
        leads: ls.length,
        won: won.length,
        lost: lost.length,
        pipelineValue: sum(ls.filter((l) => stages.get(l.stageId)?.kind === "open"), (l) => l.value ?? 0),
        wonValue: sum(won, (l) => l.outcome?.finalValue ?? l.value ?? 0),
        conversion: decided ? won.length / decided : 0,
        winRate: ls.length ? won.length / ls.length : 0,
      };
    })
    .filter((x) => x.leads > 0 || true);
}

export function projectOpportunityValue(p: { quotationValue: number | null; estimatedBudget: number | null }): number {
  return p.quotationValue && p.quotationValue > 0 ? p.quotationValue : (p.estimatedBudget ?? 0);
}

/** Weighted Pipeline Value = Estimated Opportunity Value × Probability of Winning. */
export function weightedValue(p: { quotationValue: number | null; estimatedBudget: number | null; probability: number }): number {
  return projectOpportunityValue(p) * (p.probability / 100);
}

/** How many records reference each id — drives "in use" protection when deleting config items. */
export function usageCount(db: DB, kind: "category" | "stage" | "option" | "customField", id: string): number {
  switch (kind) {
    case "category":
      return (
        db.leads.filter((l) => l.categoryIds.includes(id)).length +
        db.projects.filter((p) => p.categoryIds.includes(id)).length +
        db.companies.filter((c) => c.categoryIds.includes(id)).length
      );
    case "stage":
      return db.leads.filter((l) => l.stageId === id).length;
    case "customField":
      return db.leads.filter((l) => {
        const v = l.custom[id];
        return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length);
      }).length;
    case "option": {
      const o = db.options.find((x) => x.id === id);
      if (!o) return 0;
      switch (o.list) {
        case "source":
          return db.leads.filter((l) => l.sourceId === id).length;
        case "priority":
          return db.leads.filter((l) => l.priorityId === id).length;
        case "clientType":
          return db.leads.filter((l) => l.clientTypeId === id).length;
        case "assignee":
          return db.leads.filter((l) => l.assigneeId === id).length;
        case "companySize":
          return db.companies.filter((c) => c.sizeId === id).length;
        case "industry":
          return db.companies.filter((c) => c.industryId === id).length;
        case "relationship":
          return db.companies.filter((c) => c.relationshipId === id).length;
        case "projectType":
          return db.projects.filter((p) => p.typeId === id).length;
        case "projectStatus":
          return db.projects.filter((p) => p.statusId === id).length;
        case "activityType":
          return db.activities.filter((a) => a.typeId === id).length;
        case "lossReason":
          return db.leads.filter((l) => l.outcome?.reasonId === id).length;
        case "city":
          return db.leads.filter((l) => l.city === o.name).length + db.companies.filter((c) => c.city === o.name).length;
      }
    }
  }
}
