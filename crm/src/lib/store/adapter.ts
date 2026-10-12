import type { DB, TableName } from "../types";

export type StorageMode = "supabase" | "local";

export interface Adapter {
  mode: StorageMode;
  /** Load every table. */
  load(): Promise<DB>;
  upsert<T extends TableName>(table: T, rows: DB[T]): Promise<void>;
  remove(table: TableName, ids: string[]): Promise<void>;
  /** Danger: wipes everything (used by restore-from-backup). */
  wipe(): Promise<void>;
}

export const emptyDB = (): DB => ({
  categories: [],
  stages: [],
  options: [],
  customFields: [],
  companies: [],
  contacts: [],
  leads: [],
  projects: [],
  activities: [],
  settings: [],
});

export function supabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
