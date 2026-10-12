import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDefaults, buildDemo } from "./seed";
import { applyChanges, planDeleteCategory, planDeleteOption, planMoveLead, planRemoveDemo, planSaveLead, planLoadDemo, validateBackup } from "./logic";
import { dashboardStats, weightedValue } from "./selectors";
import { emptyDB } from "./adapter";
import { en } from "../i18n/en";
import { isValidPhone, canonPhone, normName } from "../utils";
import type { DB } from "../types";

function seeded(): DB {
  let db = applyChanges(emptyDB(), { upsert: buildDefaults() });
  db = applyChanges(db, planLoadDemo(db));
  return db;
}

test("demo seed is consistent and dashboard stats follow stage changes", () => {
  const db = seeded();
  assert.ok(db.leads.length >= 25 && db.leads.every((l) => l.isDemo));
  assert.ok(db.leads.every((l) => db.stages.some((s) => s.id === l.stageId)));
  const before = dashboardStats(db);
  const lead = db.leads.find((l) => db.stages.find((s) => s.id === l.stageId)?.role === "new")!;
  const won = db.stages.find((s) => s.kind === "won")!;
  const after = dashboardStats(applyChanges(db, planMoveLead(db, lead.id, won.id, { result: "won", finalValue: 1000, reasonId: "", reason: "", notes: "", date: "2026-01-01" })));
  assert.equal(after.won, before.won + 1);
  assert.equal(after.newLeads, before.newLeads - 1);
  assert.equal(after.wonValue, before.wonValue + 1000);
});

test("saving a lead links an existing company instead of duplicating it", () => {
  const db = seeded();
  const name = db.companies[0].name;
  const { changes, lead } = planSaveLead(db, { companyName: name.toUpperCase() });
  assert.equal(lead.companyId, db.companies[0].id);
  assert.equal(changes.upsert?.companies, undefined);
  const r = planSaveLead(db, { companyName: "Brand New Co" });
  assert.equal(r.changes.upsert?.companies?.length, 1);
  assert.match(r.lead.code, /^LD-\d{4}$/);
});

test("removing demo data keeps real records and detaches references", () => {
  let db = seeded();
  const real = planSaveLead(db, { companyName: "My Real Client" });
  db = applyChanges(db, real.changes);
  db = applyChanges(db, planRemoveDemo(db));
  assert.equal(db.leads.length, 1);
  assert.equal(db.companies.length, 1);
  assert.equal(db.projects.length, 0);
  assert.ok(db.categories.length > 0 && db.stages.length === 12);
});

test("deleting an in-use option reassigns records, nothing is orphaned", () => {
  const db = seeded();
  const src = db.options.find((o) => o.list === "source" && o.key === "linkedin")!;
  const rep = db.options.find((o) => o.list === "source" && o.key === "other")!;
  const next = applyChanges(db, planDeleteOption(db, src.id, rep.id));
  assert.ok(!next.options.some((o) => o.id === src.id));
  assert.ok(next.leads.every((l) => l.sourceId !== src.id));
});

test("deleting a category group removes children and cleans references", () => {
  const db = seeded();
  const g = db.categories.find((c) => !c.parentId)!;
  const next = applyChanges(db, planDeleteCategory(db, g.id, ""));
  const gone = new Set(db.categories.filter((c) => c.id === g.id || c.parentId === g.id).map((c) => c.id));
  assert.ok(next.categories.every((c) => !gone.has(c.id)));
  assert.ok(next.leads.every((l) => l.categoryIds.every((i) => !gone.has(i))));
});

test("weighted pipeline value = opportunity value x probability", () => {
  assert.equal(weightedValue({ quotationValue: 1000000, estimatedBudget: 900000, probability: 25 }), 250000);
  assert.equal(weightedValue({ quotationValue: null, estimatedBudget: 800000, probability: 50 }), 400000);
});

test("Saudi phone validation / normalisation", () => {
  assert.ok(isValidPhone("0551234567") && isValidPhone("+966 55 123 4567") && isValidPhone("") && isValidPhone("+971501234567"));
  assert.ok(!isValidPhone("12345") && !isValidPhone("abc"));
  assert.equal(canonPhone("055 123 4567"), "+966551234567");
  assert.equal(normName("Al Rawabi Co."), normName("al rawabi"));
});

test("backup validation rejects malformed files", () => {
  assert.throws(() => validateBackup({}));
  assert.throws(() => validateBackup({ leads: [{}] }));
  const db = seeded();
  assert.doesNotThrow(() => validateBackup({ data: db }));
});

test("every i18n key used in source exists in en and ar", async () => {
  const { readdirSync, readFileSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { ar } = await import("../i18n/ar");
  const files: string[] = [];
  const walk = (d: string) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) && files.push(p); });
  walk(join(process.cwd(), "src"));
  const used = new Set<string>();
  for (const f of files) for (const m of readFileSync(f, "utf8").matchAll(/\bt\("([A-Za-z0-9_]+)"/g)) used.add(m[1]);
  for (const k of used) { if (k.endsWith("_")) continue; // dynamic prefix e.g. t("type_" + x)
    assert.ok(k in en, "missing en key " + k); assert.ok(k in ar, "missing ar key " + k); }
});

test("site role migration adds the list once; backups without sites still validate", async () => {
  const { planMigrateSiteRoles } = await import("./logic");
  const db = seeded();
  assert.equal(planMigrateSiteRoles(db), null); // defaults already include site roles
  const old = { ...db, options: db.options.filter((o) => o.list !== "siteRole") };
  const ch = planMigrateSiteRoles(old);
  assert.ok(ch?.upsert?.options?.some((o) => o.key === "guard"));
  const { sites: _s, ...noSites } = db;
  void _s;
  assert.equal(validateBackup({ data: noSites }).sites.length, 0);
});
