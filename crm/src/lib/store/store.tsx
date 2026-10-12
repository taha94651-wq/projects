"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { TABLE_ORDER, type DB, type Settings, type TableName } from "../types";
import { nowIso } from "../utils";
import { emptyDB, supabaseConfigured, type Adapter, type StorageMode } from "./adapter";
import { createLocalAdapter } from "./local";
import { createSupabaseAdapter } from "./supabase";
import { useI18n } from "../i18n";
import {
  applyChanges,
  changesFromDB,
  planBootstrap,
  planLoadDemo,
  planMigrateClientTypes,
  planRemoveDemo,
  validateBackup,
  type Changes,
} from "./logic";

interface StoreValue {
  db: DB;
  settings: Settings;
  ready: boolean;
  loadError: string;
  mode: StorageMode;
  pending: number;
  /** Apply changes optimistically, persist them, roll back (reload) on failure. */
  commit: (ch: Changes) => Promise<boolean>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  loadDemo: () => Promise<void>;
  removeDemo: () => Promise<void>;
  restore: (raw: unknown) => Promise<void>;
  wipeAll: () => Promise<void>;
  reload: () => Promise<void>;
  notify: (msg: string, kind?: "success" | "error") => void;
}

const Ctx = createContext<StoreValue | null>(null);
export const useStore = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside <StoreProvider>");
  return v;
};

// ------------------------------------------------------------ toasts
export interface Toast {
  id: number;
  msg: string;
  kind: "success" | "error";
}
const ToastCtx = createContext<{ toasts: Toast[]; push: (m: string, k?: "success" | "error") => void; dismiss: (id: number) => void }>({
  toasts: [],
  push: () => {},
  dismiss: () => {},
});
export const useToasts = () => useContext(ToastCtx);

let bootstrapping: Promise<DB> | null = null;

/** Used only until the real settings row has loaded. */
const FALLBACK_SETTINGS: Settings = {
  id: "",
  language: "en",
  currency: "SAR",
  leadColumns: ["code", "company", "stage"],
  defaultLeadFilters: {},
  reminders: { enabled: false, daysBefore: 1, showOverdueBadge: true },
  pageSize: 25,
  demoLoaded: false,
  createdAt: "",
  updatedAt: "",
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const { setLang, lang } = useI18n();
  const [db, setDb] = useState<DB>(emptyDB());
  const dbRef = useRef(db);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [pending, setPending] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const adapterRef = useRef<Adapter | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const toastId = useRef(0);
  const mode: StorageMode = supabaseConfigured() ? "supabase" : "local";

  const setBoth = useCallback((next: DB) => {
    dbRef.current = next;
    setDb(next);
  }, []);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (msg: string, kind: "success" | "error" = "success") => {
      const id = ++toastId.current;
      setToasts((t) => [...t.slice(-3), { id, msg, kind }]);
      setTimeout(() => dismiss(id), kind === "error" ? 8000 : 3500);
    },
    [dismiss],
  );

  const adapter = () => {
    if (!adapterRef.current) adapterRef.current = mode === "supabase" ? createSupabaseAdapter() : createLocalAdapter();
    return adapterRef.current;
  };

  const persist = useCallback(async (ch: Changes) => {
    const a = adapter();
    for (const t of TABLE_ORDER) {
      const rows = ch.upsert?.[t];
      if (rows?.length) await a.upsert(t as TableName, rows as never);
    }
    for (const t of [...TABLE_ORDER].reverse()) {
      const ids = ch.remove?.[t];
      if (ids?.length) await a.remove(t, ids);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    try {
      setLoadError("");
      const a = adapter();
      let data = await a.load();
      if (!data.settings.length) {
        // first run: create the default configuration only (categories, stages, lists).
        // No companies/leads are created — demo data is opt-in from Settings → Data & backup.
        bootstrapping ||= (async () => {
          const boot = planBootstrap();
          await persist(boot);
          return applyChanges(await a.load(), boot);
        })();
        try {
          data = await bootstrapping;
        } finally {
          bootstrapping = null;
        }
        data = await a.load();
      }
      const mig = planMigrateClientTypes(data);
      if (mig) {
        await persist(mig);
        data = applyChanges(data, mig);
      }
      setBoth(data);
      setReady(true);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // settings language -> UI language
  const settings = db.settings[0];
  useEffect(() => {
    if (settings && settings.language !== lang) setLang(settings.language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.language]);

  const commit = useCallback(
    (ch: Changes) => {
      const before = dbRef.current;
      setBoth(applyChanges(before, ch));
      setPending((n) => n + 1);
      const run = queue.current.then(async () => {
        try {
          await persist(ch);
          return true;
        } catch (e) {
          push(`Save failed: ${e instanceof Error ? e.message : String(e)}`, "error");
          try {
            setBoth(await adapter().load()); // restore truth
          } catch {
            setBoth(before);
          }
          return false;
        } finally {
          setPending((n) => n - 1);
        }
      });
      queue.current = run;
      return run as Promise<boolean>;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persist, push, setBoth],
  );

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const cur = dbRef.current.settings[0];
      if (!cur) return;
      if (patch.language) setLang(patch.language);
      await commit({ upsert: { settings: [{ ...cur, ...patch, updatedAt: nowIso() }] } });
    },
    [commit, setLang],
  );

  const loadDemo = useCallback(async () => {
    if (await commit(planLoadDemo(dbRef.current))) push("Demo data loaded");
  }, [commit, push]);
  const removeDemo = useCallback(async () => {
    if (await commit(planRemoveDemo(dbRef.current))) push("Demo data removed");
  }, [commit, push]);

  const restore = useCallback(
    async (raw: unknown) => {
      const data = validateBackup(raw);
      const a = adapter();
      await queue.current;
      await a.wipe();
      await persist(changesFromDB(data));
      setBoth(await a.load());
      push("Backup restored");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persist, push, setBoth],
  );

  const wipeAll = useCallback(async () => {
    const a = adapter();
    await queue.current;
    await a.wipe();
    const boot = planBootstrap();
    await persist(boot);
    setBoth(await a.load());
    push("All data erased; defaults restored");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persist, push, setBoth]);

  const value = useMemo<StoreValue>(
    () => ({
      db,
      settings: settings ?? FALLBACK_SETTINGS,
      ready,
      loadError,
      mode,
      pending,
      commit,
      updateSettings,
      loadDemo,
      removeDemo,
      restore,
      wipeAll,
      reload: load,
      notify: push,
    }),
    [db, settings, ready, loadError, mode, pending, commit, updateSettings, loadDemo, removeDemo, restore, wipeAll, load, push],
  );

  return (
    <ToastCtx.Provider value={{ toasts, push, dismiss }}>
      <Ctx.Provider value={value}>{children}</Ctx.Provider>
    </ToastCtx.Provider>
  );
}
