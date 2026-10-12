import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { TABLE_ORDER, type DB, type TableName } from "../types";
import { emptyDB, type Adapter } from "./adapter";

let client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase is not configured");
    client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
  }
  return client;
}

const SQL_TABLE: Record<TableName, string> = {
  categories: "categories",
  stages: "stages",
  options: "options",
  customFields: "custom_fields",
  companies: "companies",
  contacts: "contacts",
  sites: "sites",
  leads: "leads",
  projects: "projects",
  activities: "activities",
  settings: "settings",
};

const nz = (v: unknown) => (v === "" || v === undefined ? null : v);

/**
 * Each row = real, indexed/foreign-key columns (for integrity, filtering and reporting in SQL)
 * + the full record in `data` (jsonb), which is the source of truth the app reads back.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRow(table: TableName, o: any): Record<string, unknown> {
  const base = { id: o.id, data: o };
  switch (table) {
    case "categories":
      return { ...base, parent_id: nz(o.parentId), sort: o.sort };
    case "stages":
      return { ...base, sort: o.sort, kind: o.kind };
    case "options":
      return { ...base, list: o.list, sort: o.sort };
    case "customFields":
      return { ...base, entity: o.entity, sort: o.sort };
    case "companies":
      return { ...base, name: o.name, is_demo: o.isDemo };
    case "contacts":
      return { ...base, company_id: nz(o.companyId), is_demo: o.isDemo };
    case "sites":
      return { ...base, company_id: nz(o.companyId), city: nz(o.city) };
    case "leads":
      return {
        ...base,
        code: o.code,
        company_id: nz(o.companyId),
        stage_id: nz(o.stageId),
        priority_id: nz(o.priorityId),
        source_id: nz(o.sourceId),
        assignee_id: nz(o.assigneeId),
        next_follow_up: nz(o.nextFollowUp),
        est_value: o.value ?? null,
        is_demo: o.isDemo,
      };
    case "projects":
      return {
        ...base,
        company_id: nz(o.companyId),
        lead_id: nz(o.leadId),
        status_id: nz(o.statusId),
        probability: o.probability,
        is_demo: o.isDemo,
      };
    case "activities":
      return {
        ...base,
        lead_id: nz(o.leadId),
        company_id: nz(o.companyId),
        due_at: o.dateTime ? new Date(o.dateTime).toISOString() : null,
        done: o.done,
        is_demo: o.isDemo,
      };
    default:
      return base;
  }
}

const PAGE = 1000;

export function createSupabaseAdapter(): Adapter {
  const sb = getSupabase();
  return {
    mode: "supabase",
    async load() {
      const out = emptyDB();
      for (const t of TABLE_ORDER) {
        const rows: unknown[] = [];
        for (let from = 0; ; from += PAGE) {
          const { data, error } = await sb
            .from(SQL_TABLE[t])
            .select("data")
            .order("id")
            .range(from, from + PAGE - 1);
          if (error) throw new Error(`${SQL_TABLE[t]}: ${error.message}`);
          rows.push(...(data ?? []).map((r: { data: unknown }) => r.data));
          if (!data || data.length < PAGE) break;
        }
        (out as unknown as Record<string, unknown[]>)[t] = rows;
      }
      return out;
    },
    async upsert<T extends TableName>(table: T, rows: DB[T]) {
      if (!rows.length) return;
      const payload = (rows as unknown[]).map((r) => toRow(table, r));
      for (let i = 0; i < payload.length; i += 500) {
        const { error } = await sb.from(SQL_TABLE[table]).upsert(payload.slice(i, i + 500), { onConflict: "id" });
        if (error) throw new Error(error.message);
      }
    },
    async remove(table, ids) {
      if (!ids.length) return;
      for (let i = 0; i < ids.length; i += 200) {
        const { error } = await sb.from(SQL_TABLE[table]).delete().in("id", ids.slice(i, i + 200));
        if (error) throw new Error(error.message);
      }
    },
    async wipe() {
      for (const t of [...TABLE_ORDER].reverse()) {
        const { error } = await sb.from(SQL_TABLE[t]).delete().not("id", "is", null);
        if (error) throw new Error(error.message);
      }
    },
  };
}
