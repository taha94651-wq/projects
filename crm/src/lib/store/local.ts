import { TABLE_ORDER, type DB, type TableName } from "../types";
import { emptyDB, type Adapter } from "./adapter";

const DB_NAME = "fitout-crm";
const VERSION = 1;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB is not available in this browser"));
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const t of TABLE_ORDER) if (!db.objectStoreNames.contains(t)) db.createObjectStore(t, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Could not open local database"));
  });
}

const done = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Local transaction aborted"));
  });

/**
 * Local-only persistence using IndexedDB. Survives refresh / closing the browser, but lives ONLY in this
 * browser profile — it is not a server database, is not shared between devices and is lost if the user
 * clears site data. The UI says so explicitly and offers backup export.
 */
export function createLocalAdapter(): Adapter {
  let dbp: Promise<IDBDatabase> | null = null;
  const db = () => (dbp ||= open());
  return {
    mode: "local",
    async load() {
      const d = await db();
      const out = emptyDB();
      const tx = d.transaction(TABLE_ORDER, "readonly");
      await Promise.all(
        TABLE_ORDER.map(
          (t) =>
            new Promise<void>((resolve, reject) => {
              const r = tx.objectStore(t).getAll();
              r.onsuccess = () => {
                (out as unknown as Record<string, unknown[]>)[t] = r.result;
                resolve();
              };
              r.onerror = () => reject(r.error);
            }),
        ),
      );
      return out;
    },
    async upsert<T extends TableName>(table: T, rows: DB[T]) {
      if (!rows.length) return;
      const d = await db();
      const tx = d.transaction(table, "readwrite");
      const st = tx.objectStore(table);
      for (const r of rows) st.put(r);
      await done(tx);
    },
    async remove(table, ids) {
      if (!ids.length) return;
      const d = await db();
      const tx = d.transaction(table, "readwrite");
      const st = tx.objectStore(table);
      for (const id of ids) st.delete(id);
      await done(tx);
    },
    async wipe() {
      const d = await db();
      const tx = d.transaction(TABLE_ORDER, "readwrite");
      for (const t of TABLE_ORDER) tx.objectStore(t).clear();
      await done(tx);
    },
  };
}
