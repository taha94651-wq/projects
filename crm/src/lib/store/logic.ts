// Pure business logic: every function takes the current DB and returns the changes to apply.
// No React / IO here, so it is unit-testable and shared by the Supabase and local backends.
import type {
  Activity,
  Category,
  Company,
  Contact,
  CustomField,
  DB,
  Lead,
  Option,
  Outcome,
  Project,
  Settings,
  Stage,
  TableName,
} from "../types";
import { TABLE_ORDER } from "../types";
import { addDays, normName, nowIso, today, uid } from "../utils";
import { buildDefaults, buildDemo } from "./seed";
import { nextLeadCode, optKey, usageCount } from "./selectors";

export type Changes = {
  upsert?: { [K in TableName]?: DB[K] };
  remove?: { [K in TableName]?: string[] };
};

export function applyChanges(db: DB, ch: Changes): DB {
  const next: DB = { ...db };
  for (const t of TABLE_ORDER) {
    const up = ch.upsert?.[t] as { id: string }[] | undefined;
    const rm = ch.remove?.[t];
    if (!up?.length && !rm?.length) continue;
    const map = new Map((next[t] as { id: string }[]).map((r) => [r.id, r]));
    for (const id of rm ?? []) map.delete(id);
    for (const r of up ?? []) map.set(r.id, r);
    (next as unknown as Record<string, unknown>)[t] = [...map.values()];
  }
  return next;
}

export function mergeChanges(a: Changes, b: Changes): Changes {
  const out: Changes = { upsert: {}, remove: {} };
  for (const src of [a, b]) {
    for (const t of TABLE_ORDER) {
      const up = src.upsert?.[t] as { id: string }[] | undefined;
      if (up?.length) {
        const cur = new Map(((out.upsert as Record<string, { id: string }[]>)[t] ?? []).map((r) => [r.id, r]));
        for (const r of up) cur.set(r.id, r);
        (out.upsert as Record<string, unknown>)[t] = [...cur.values()];
      }
      const rm = src.remove?.[t];
      if (rm?.length) {
        const cur = new Set((out.remove as Record<string, string[]>)[t] ?? []);
        rm.forEach((x) => cur.add(x));
        (out.remove as Record<string, unknown>)[t] = [...cur];
        // a removed row must not also be upserted
        const u = (out.upsert as Record<string, { id: string }[]>)[t];
        if (u) (out.upsert as Record<string, unknown>)[t] = u.filter((r) => !cur.has(r.id));
      }
    }
  }
  return out;
}

const stamp = <T extends { updatedAt: string }>(x: T): T => ({ ...x, updatedAt: nowIso() });

// ------------------------------------------------------------------ leads

export type LeadInput = Partial<Omit<Lead, "id" | "code" | "createdAt" | "updatedAt">> & { companyName: string };

export function emptyLead(db: DB): Omit<Lead, "id" | "code" | "createdAt" | "updatedAt"> {
  const first = [...db.stages].sort((a, b) => a.sort - b.sort).find((s) => s.role === "new") ?? [...db.stages].sort((a, b) => a.sort - b.sort)[0];
  const medium = db.options.find((o) => o.list === "priority" && o.key === "medium");
  return {
    companyId: "",
    companyName: "",
    contactName: "",
    jobTitle: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    linkedin: "",
    instagram: "",
    city: "",
    clientTypeId: "",
    categoryIds: [],
    projectName: "",
    projectLocation: "",
    description: "",
    value: null,
    expectedStart: "",
    sourceId: "",
    priorityId: medium?.id ?? "",
    stageId: first?.id ?? "",
    lastContact: "",
    nextFollowUp: "",
    assigneeId: db.options.find((o) => o.list === "assignee")?.id ?? "",
    notes: "",
    outcome: null,
    custom: {},
    isDemo: false,
  };
}

export function findCompany(db: DB, name: string): Company | undefined {
  const n = normName(name);
  if (!n) return undefined;
  return db.companies.find((c) => normName(c.name) === n);
}

function systemType(db: DB): string {
  return db.options.find((o) => o.list === "activityType" && o.key === "system")?.id ?? "";
}

export function systemLog(db: DB, lead: Lead, text: string): Activity {
  const n = nowIso();
  return {
    id: uid(),
    leadId: lead.id,
    companyId: lead.companyId,
    projectId: "",
    typeId: systemType(db),
    dateTime: new Date().toISOString().slice(0, 16),
    description: text,
    outcome: "",
    nextAction: "",
    nextFollowUp: "",
    done: true,
    completedAt: n,
    system: true,
    isDemo: false,
    createdAt: n,
    updatedAt: n,
  };
}

const stageName = (db: DB, id: string) => db.stages.find((s) => s.id === id)?.name ?? "—";

/**
 * Create or update a lead. Links (or creates) the company so duplicates are avoided,
 * creates the contact if new, and logs stage transitions on the timeline.
 */
export function planSaveLead(db: DB, input: LeadInput, existingId?: string): { lead: Lead; changes: Changes } {
  const prev = existingId ? db.leads.find((l) => l.id === existingId) : undefined;
  const n = nowIso();
  const changes: Changes = { upsert: {} };
  const up = changes.upsert!;
  const companyName = input.companyName.trim();

  let company = (input.companyId && db.companies.find((c) => c.id === input.companyId)) || findCompany(db, companyName);
  if (!company && companyName) {
    const rel = db.options.find((o) => o.list === "relationship" && o.key === "prospect");
    company = {
      id: uid(),
      name: companyName,
      clientTypeId: input.clientTypeId ?? "",
      industryId: "",
      sizeId: "",
      city: input.city ?? "",
      regions: "",
      website: input.website ?? "",
      linkedin: input.linkedin ?? "",
      instagram: input.instagram ?? "",
      phone: input.phone ?? "",
      email: input.email ?? "",
      categoryIds: [],
      relationshipId: rel?.id ?? "",
      notes: "",
      isDemo: false,
      createdAt: n,
      updatedAt: n,
    };
    up.companies = [company];
  }

  const base = prev ?? { ...emptyLead(db), id: uid(), code: nextLeadCode(db.leads), createdAt: n, updatedAt: n };
  const lead: Lead = {
    ...base,
    ...input,
    companyName: company?.name ?? companyName,
    companyId: company?.id ?? "",
    custom: { ...base.custom, ...(input.custom ?? {}) },
    id: base.id,
    code: base.code,
    createdAt: base.createdAt,
    updatedAt: n,
    isDemo: prev?.isDemo ?? false,
  };

  // contact
  if (company && lead.contactName.trim()) {
    const cn = normName(lead.contactName);
    const siblings = db.contacts.filter((c) => c.companyId === company!.id);
    if (!siblings.some((c) => normName(c.name) === cn)) {
      up.contacts = [
        {
          id: uid(),
          companyId: company.id,
          name: lead.contactName.trim(),
          jobTitle: lead.jobTitle,
          phone: lead.phone,
          whatsapp: lead.whatsapp,
          email: lead.email,
          isPrimary: siblings.length === 0,
          notes: "",
          isDemo: false,
          createdAt: n,
          updatedAt: n,
        },
      ];
    }
  }

  // stage transition handling
  const stage = db.stages.find((s) => s.id === lead.stageId);
  const acts: Activity[] = [];
  if (!prev) {
    acts.push(systemLog(db, lead, "Lead created"));
  } else if (prev.stageId !== lead.stageId) {
    acts.push(systemLog(db, lead, `Stage: ${stageName(db, prev.stageId)} → ${stageName(db, lead.stageId)}`));
  }
  if (stage?.kind === "won" || stage?.kind === "lost") {
    if (!lead.outcome || lead.outcome.result !== stage.kind) {
      lead.outcome = {
        result: stage.kind,
        finalValue: stage.kind === "won" ? lead.value : null,
        reasonId: "",
        reason: "",
        notes: "",
        date: today(),
      };
    }
  } else {
    lead.outcome = null;
  }
  if (acts.length) up.activities = acts;
  up.leads = [lead];
  // keep activity.companyId in sync if the company link changed
  if (prev && prev.companyId !== lead.companyId) {
    const moved = db.activities.filter((a) => a.leadId === lead.id).map((a) => ({ ...a, companyId: lead.companyId }));
    up.activities = [...(up.activities ?? []), ...moved];
  }
  return { lead, changes };
}

export function planMoveLead(db: DB, id: string, stageId: string, outcome?: Outcome | null): Changes {
  const lead = db.leads.find((l) => l.id === id);
  const stage = db.stages.find((s) => s.id === stageId);
  if (!lead || !stage || lead.stageId === stageId) return {};
  const next: Lead = { ...lead, stageId, updatedAt: nowIso() };
  if (stage.kind === "won" || stage.kind === "lost") {
    next.outcome = outcome ?? {
      result: stage.kind,
      finalValue: stage.kind === "won" ? lead.value : null,
      reasonId: "",
      reason: "",
      notes: "",
      date: today(),
    };
    next.nextFollowUp = "";
  } else {
    next.outcome = null;
  }
  return { upsert: { leads: [next], activities: [systemLog(db, lead, `Stage: ${stageName(db, lead.stageId)} → ${stage.name}`)] } };
}

export function planDeleteLeads(db: DB, ids: string[]): Changes {
  const set = new Set(ids);
  const projects = db.projects.filter((p) => set.has(p.leadId)).map((p) => stamp({ ...p, leadId: "" }));
  return {
    upsert: projects.length ? { projects } : {},
    remove: { leads: ids, activities: db.activities.filter((a) => set.has(a.leadId)).map((a) => a.id) },
  };
}

export function planDuplicateLead(db: DB, id: string): { lead: Lead; changes: Changes } | null {
  const src = db.leads.find((l) => l.id === id);
  if (!src) return null;
  const { id: _i, code: _c, createdAt: _ca, updatedAt: _u, ...rest } = src;
  void _i; void _c; void _ca; void _u;
  const first = [...db.stages].sort((a, b) => a.sort - b.sort).find((s) => s.role === "new") ?? db.stages[0];
  return planSaveLead(db, {
    ...rest,
    projectName: src.projectName ? src.projectName + " (copy)" : "",
    stageId: first?.id ?? src.stageId,
    outcome: null,
    lastContact: "",
    nextFollowUp: "",
  });
}

// ------------------------------------------------------------------ activities

export function planSaveActivity(db: DB, a: Omit<Activity, "createdAt" | "updatedAt"> & Partial<Pick<Activity, "createdAt">>): Changes {
  const n = nowIso();
  const prev = db.activities.find((x) => x.id === a.id);
  const lead = db.leads.find((l) => l.id === a.leadId);
  const act: Activity = { ...a, companyId: lead?.companyId ?? a.companyId, createdAt: prev?.createdAt ?? a.createdAt ?? n, updatedAt: n };
  const ch: Changes = { upsert: { activities: [act] } };
  if (lead && !act.done && act.dateTime && !prev) {
    const d = act.dateTime.slice(0, 10);
    if (!lead.nextFollowUp || lead.nextFollowUp > d) ch.upsert!.leads = [{ ...lead, nextFollowUp: d, updatedAt: n }];
  }
  return ch;
}

export interface CompleteInput {
  outcome: string;
  nextAction: string;
  nextFollowUp: string;
  nextTypeId: string;
}

export function planCompleteActivity(db: DB, activityId: string, input: CompleteInput): Changes {
  const a = db.activities.find((x) => x.id === activityId);
  if (!a) return {};
  const n = nowIso();
  const done: Activity = {
    ...a,
    done: true,
    completedAt: n,
    outcome: input.outcome,
    nextAction: input.nextAction,
    nextFollowUp: input.nextFollowUp,
    updatedAt: n,
  };
  const ch: Changes = { upsert: { activities: [done] } };
  const lead = db.leads.find((l) => l.id === a.leadId);
  if (lead) {
    const nextLead: Lead = { ...lead, lastContact: today(), updatedAt: n };
    if (input.nextFollowUp) nextLead.nextFollowUp = input.nextFollowUp;
    else if (lead.nextFollowUp === a.dateTime.slice(0, 10)) nextLead.nextFollowUp = "";
    ch.upsert!.leads = [nextLead];
  }
  if (input.nextFollowUp && (input.nextAction || input.nextTypeId)) {
    ch.upsert!.activities!.push({
      id: uid(),
      leadId: a.leadId,
      companyId: a.companyId,
      projectId: a.projectId,
      typeId: input.nextTypeId || a.typeId,
      dateTime: input.nextFollowUp + "T10:00",
      description: input.nextAction || "Follow-up",
      outcome: "",
      nextAction: "",
      nextFollowUp: "",
      done: false,
      completedAt: "",
      system: false,
      isDemo: a.isDemo,
      createdAt: n,
      updatedAt: n,
    });
  }
  return ch;
}

// ------------------------------------------------------------------ companies / contacts / projects

export function planDeleteCompany(db: DB, id: string): Changes {
  const leads = db.leads.filter((l) => l.companyId === id).map((l) => stamp({ ...l, companyId: "" }));
  const projects = db.projects.filter((p) => p.companyId === id).map((p) => stamp({ ...p, companyId: "" }));
  const acts = db.activities.filter((a) => a.companyId === id).map((a) => stamp({ ...a, companyId: "" }));
  const sites = db.sites.filter((s) => s.companyId === id).map((s) => stamp({ ...s, companyId: "" }));
  return {
    upsert: { leads, projects, activities: acts, sites },
    remove: { contacts: db.contacts.filter((c) => c.companyId === id).map((c) => c.id), companies: [id] },
  };
}

export function planDeleteProject(db: DB, id: string): Changes {
  const acts = db.activities.filter((a) => a.projectId === id).map((a) => stamp({ ...a, projectId: "" }));
  return { upsert: { activities: acts }, remove: { projects: [id] } };
}

// ------------------------------------------------------------------ configuration (reassign-safe deletes)

export function planDeleteOption(db: DB, id: string, replacementId: string): Changes {
  const o = db.options.find((x) => x.id === id);
  if (!o) return {};
  const used = usageCount(db, "option", id);
  if (used > 0 && replacementId === id) throw new Error("Replacement must be a different item");
  const r = replacementId;
  const up: NonNullable<Changes["upsert"]> = {};
  const swap = <T extends { id: string }>(rows: T[], test: (x: T) => boolean, fix: (x: T) => T): T[] =>
    rows.filter(test).map((x) => stamp(fix(x) as T & { updatedAt: string }) as T);
  switch (o.list) {
    case "source": up.leads = swap(db.leads, (l) => l.sourceId === id, (l) => ({ ...l, sourceId: r })); break;
    case "priority": up.leads = swap(db.leads, (l) => l.priorityId === id, (l) => ({ ...l, priorityId: r })); break;
    case "clientType":
      up.leads = swap(db.leads, (l) => l.clientTypeId === id, (l) => ({ ...l, clientTypeId: r }));
      up.companies = swap(db.companies, (c) => c.clientTypeId === id, (c) => ({ ...c, clientTypeId: r }));
      break;
    case "assignee": up.leads = swap(db.leads, (l) => l.assigneeId === id, (l) => ({ ...l, assigneeId: r })); break;
    case "companySize": up.companies = swap(db.companies, (c) => c.sizeId === id, (c) => ({ ...c, sizeId: r })); break;
    case "industry": up.companies = swap(db.companies, (c) => c.industryId === id, (c) => ({ ...c, industryId: r })); break;
    case "relationship": up.companies = swap(db.companies, (c) => c.relationshipId === id, (c) => ({ ...c, relationshipId: r })); break;
    case "projectType": up.projects = swap(db.projects, (p) => p.typeId === id, (p) => ({ ...p, typeId: r })); break;
    case "projectStatus": up.projects = swap(db.projects, (p) => p.statusId === id, (p) => ({ ...p, statusId: r })); break;
    case "activityType": up.activities = swap(db.activities, (a) => a.typeId === id, (a) => ({ ...a, typeId: r })); break;
    case "lossReason":
      up.leads = swap(db.leads, (l) => l.outcome?.reasonId === id, (l) => ({ ...l, outcome: l.outcome ? { ...l.outcome, reasonId: r } : null }));
      break;
    case "siteRole":
      up.sites = swap(db.sites, (s) => s.contacts.some((c) => c.roleId === id), (s) => ({ ...s, contacts: s.contacts.map((c) => (c.roleId === id ? { ...c, roleId: r } : c)) }));
      break;
    case "city": {
      const rep = db.options.find((x) => x.id === r)?.name ?? "";
      up.leads = swap(db.leads, (l) => l.city === o.name, (l) => ({ ...l, city: rep }));
      up.companies = swap(db.companies, (c) => c.city === o.name, (c) => ({ ...c, city: rep }));
      break;
    }
  }
  return { upsert: up, remove: { options: [id] } };
}

export function planDeleteStage(db: DB, id: string, replacementId: string): Changes {
  const target = db.stages.find((s) => s.id === replacementId);
  const leads = db.leads
    .filter((l) => l.stageId === id)
    .map((l) => {
      const n: Lead = { ...l, stageId: replacementId, updatedAt: nowIso() };
      if (target?.kind !== "won" && target?.kind !== "lost") n.outcome = null;
      else if (!n.outcome || n.outcome.result !== target.kind)
        n.outcome = { result: target.kind, finalValue: target.kind === "won" ? l.value : null, reasonId: "", reason: "", notes: "", date: today() };
      return n;
    });
  return { upsert: { leads }, remove: { stages: [id] } };
}

export function planDeleteCategory(db: DB, id: string, replacementId: string): Changes {
  const kids = db.categories.filter((c) => c.parentId === id).map((c) => c.id);
  const gone = new Set([id, ...kids]);
  const fix = (ids: string[]) => {
    const had = ids.some((x) => gone.has(x));
    if (!had) return null;
    const out = ids.filter((x) => !gone.has(x));
    if (replacementId && !out.includes(replacementId)) out.push(replacementId);
    return out;
  };
  const leads: Lead[] = [];
  for (const l of db.leads) { const c = fix(l.categoryIds); if (c) leads.push(stamp({ ...l, categoryIds: c })); }
  const projects: Project[] = [];
  for (const p of db.projects) { const c = fix(p.categoryIds); if (c) projects.push(stamp({ ...p, categoryIds: c })); }
  const companies: Company[] = [];
  for (const co of db.companies) { const c = fix(co.categoryIds); if (c) companies.push(stamp({ ...co, categoryIds: c })); }
  return { upsert: { leads, projects, companies }, remove: { categories: [...kids, id] } };
}

export function planDeleteCustomField(db: DB, id: string): Changes {
  const leads = db.leads
    .filter((l) => id in l.custom)
    .map((l) => {
      const c = { ...l.custom };
      delete c[id];
      return stamp({ ...l, custom: c });
    });
  return { upsert: { leads }, remove: { customFields: [id] } };
}

// ------------------------------------------------------------------ demo / bootstrap

export function planLoadDemo(db: DB): Changes {
  const maxCode = db.leads.reduce((m, l) => Math.max(m, parseInt(l.code.replace(/\D/g, ""), 10) || 0), 0);
  const demo = buildDemo(db, maxCode + 1);
  const settings = db.settings[0] ? [{ ...db.settings[0], demoLoaded: true, updatedAt: nowIso() }] : [];
  return { upsert: { ...demo, settings } };
}

export function planRemoveDemo(db: DB): Changes {
  const demoCompanies = new Set(db.companies.filter((c) => c.isDemo).map((c) => c.id));
  const demoLeads = new Set(db.leads.filter((l) => l.isDemo).map((l) => l.id));
  const demoProjects = new Set(db.projects.filter((p) => p.isDemo).map((p) => p.id));
  // real records that point at demo records are detached, never deleted
  const leads = db.leads.filter((l) => !l.isDemo && demoCompanies.has(l.companyId)).map((l) => stamp({ ...l, companyId: "" }));
  const projects = db.projects
    .filter((p) => !p.isDemo && (demoCompanies.has(p.companyId) || demoLeads.has(p.leadId)))
    .map((p) => stamp({ ...p, companyId: demoCompanies.has(p.companyId) ? "" : p.companyId, leadId: demoLeads.has(p.leadId) ? "" : p.leadId }));
  const realActs = db.activities
    .filter((a) => !a.isDemo && (demoCompanies.has(a.companyId) || demoLeads.has(a.leadId) || demoProjects.has(a.projectId)))
    .map((a) => stamp({ ...a, companyId: demoCompanies.has(a.companyId) ? "" : a.companyId }));
  const settings = db.settings[0] ? [{ ...db.settings[0], demoLoaded: false, updatedAt: nowIso() }] : [];
  return {
    upsert: { leads, projects, activities: realActs.filter((a) => !demoLeads.has(a.leadId)), settings },
    remove: {
      activities: db.activities.filter((a) => a.isDemo || demoLeads.has(a.leadId)).map((a) => a.id),
      projects: [...demoProjects],
      leads: [...demoLeads],
      contacts: db.contacts.filter((c) => c.isDemo || demoCompanies.has(c.companyId)).map((c) => c.id),
      companies: [...demoCompanies],
    },
  };
}

/** Old builds shipped 9 generic client types. If none is in use, swap them for the two main company types. */
export function planMigrateClientTypes(db: DB): Changes | null {
  const OLD = new Set(["retail", "developer", "corporate", "hospitality", "mall", "contractor", "consultant", "gov", "individual"]);
  const cur = db.options.filter((o) => o.list === "clientType");
  if (!cur.length || cur.some((o) => !OLD.has(o.key))) return null;
  if (cur.some((o) => usageCount(db, "option", o.id) > 0)) return null;
  const fresh = buildDefaults().options.filter((o) => o.list === "clientType");
  return { upsert: { options: fresh }, remove: { options: cur.map((o) => o.id) } };
}

/** Adds the "site role" list (guard, engineer, owner…) to workspaces created before sites existed. */
export function planMigrateSiteRoles(db: DB): Changes | null {
  if (db.options.some((o) => o.list === "siteRole")) return null;
  return { upsert: { options: buildDefaults().options.filter((o) => o.list === "siteRole") } };
}

export function planBootstrap(): Changes {
  const d = buildDefaults();
  return { upsert: d };
}

/** Everything in `db` as Changes (used for restore-from-backup). */
export function changesFromDB(db: DB): Changes {
  return { upsert: Object.fromEntries(TABLE_ORDER.map((t) => [t, db[t] ?? []])) as Changes["upsert"] };
}

export function validateBackup(x: unknown): DB {
  if (!x || typeof x !== "object") throw new Error("Not a valid backup file");
  const obj = ((x as { data?: unknown }).data ?? x) as Record<string, unknown>;
  const out = {} as Record<string, unknown[]>;
  for (const t of TABLE_ORDER) {
    const v = obj[t] ?? (t === "sites" ? [] : undefined); // backups made before sites existed
    if (!Array.isArray(v)) throw new Error(`Backup is missing table "${t}"`);
    if (!v.every((r) => r && typeof r === "object" && typeof (r as { id?: unknown }).id === "string"))
      throw new Error(`Backup table "${t}" contains invalid rows`);
    out[t] = v;
  }
  return out as unknown as DB;
}

export type { Category, Contact, CustomField, Option, Settings, Stage };
export { addDays, optKey };
