import Papa from "papaparse";
import type { DB, Lead } from "./types";
import { canonPhone, canonUrl, download, isEmail, isUrl, isValidPhone, normName, toDateStr } from "./utils";
import type { LeadInput } from "./store/logic";

// ------------------------------------------------------------------ export

export interface Col {
  header: string;
  get: (l: Lead) => string | number;
}

/** Export column set (labels are English so files stay portable between systems). */
export function leadExportColumns(db: DB): Col[] {
  const opt = (id: string) => db.options.find((o) => o.id === id)?.name ?? "";
  const stage = (id: string) => db.stages.find((s) => s.id === id)?.name ?? "";
  const cats = (ids: string[]) => ids.map((i) => db.categories.find((c) => c.id === i)?.name ?? "").filter(Boolean).join("; ");
  const cols: Col[] = [
    { header: "Lead ID", get: (l) => l.code },
    { header: "Company", get: (l) => l.companyName },
    { header: "Contact Person", get: (l) => l.contactName },
    { header: "Job Title", get: (l) => l.jobTitle },
    { header: "Phone", get: (l) => l.phone },
    { header: "WhatsApp", get: (l) => l.whatsapp },
    { header: "Email", get: (l) => l.email },
    { header: "Website", get: (l) => l.website },
    { header: "LinkedIn", get: (l) => l.linkedin },
    { header: "Instagram", get: (l) => l.instagram },
    { header: "City", get: (l) => l.city },
    { header: "Client Type", get: (l) => opt(l.clientTypeId) },
    { header: "Categories / Services", get: (l) => cats(l.categoryIds) },
    { header: "Project Name", get: (l) => l.projectName },
    { header: "Project Location", get: (l) => l.projectLocation },
    { header: "Description", get: (l) => l.description },
    { header: "Estimated Value (SAR)", get: (l) => l.value ?? "" },
    { header: "Expected Start", get: (l) => l.expectedStart },
    { header: "Source", get: (l) => opt(l.sourceId) },
    { header: "Priority", get: (l) => opt(l.priorityId) },
    { header: "Stage", get: (l) => stage(l.stageId) },
    { header: "Last Contact", get: (l) => l.lastContact },
    { header: "Next Follow-Up", get: (l) => l.nextFollowUp },
    { header: "Assigned To", get: (l) => opt(l.assigneeId) },
    { header: "Final Contract Value (SAR)", get: (l) => l.outcome?.finalValue ?? "" },
    { header: "Outcome Reason", get: (l) => (l.outcome ? opt(l.outcome.reasonId) || l.outcome.reason : "") },
    { header: "Notes", get: (l) => l.notes },
    { header: "Date Created", get: (l) => l.createdAt.slice(0, 10) },
    { header: "Last Updated", get: (l) => l.updatedAt.slice(0, 10) },
  ];
  for (const f of [...db.customFields].sort((a, b) => a.sort - b.sort)) {
    cols.push({
      header: f.label,
      get: (l) => {
        const v = l.custom[f.id];
        return Array.isArray(v) ? v.join("; ") : (v ?? "");
      },
    });
  }
  return cols;
}

/** Guard against CSV/Excel formula injection when the file is opened in a spreadsheet app. */
const safe = (v: string | number): string | number =>
  typeof v === "string" && (/^[=@\t\r]/.test(v) || (/^[+-]/.test(v) && !/^[+-][\d\s.]+$/.test(v))) ? "'" + v : v;

export function exportLeadsCSV(db: DB, leads: Lead[], filename?: string) {
  const cols = leadExportColumns(db);
  const csv = Papa.unparse({ fields: cols.map((c) => c.header), data: leads.map((l) => cols.map((c) => safe(c.get(l)))) });
  download(filename ?? `leads-${toDateStr()}.csv`, "﻿" + csv, "text/csv;charset=utf-8");
}

export async function exportLeadsXLSX(db: DB, leads: Lead[], filename?: string) {
  const { default: writeExcelFile } = await import("write-excel-file/browser");
  const cols = leadExportColumns(db);
  const data = [
    cols.map((c) => ({ value: c.header, fontWeight: "bold" as const })),
    ...leads.map((l) => cols.map((c) => { const v = safe(c.get(l)); return v === "" ? null : v; })),
  ];
  await writeExcelFile(data as never).toFile(filename ?? `leads-${toDateStr()}.xlsx`);
}

export function exportTableCSV(headers: string[], rows: (string | number)[][], filename: string) {
  download(filename, "﻿" + Papa.unparse({ fields: headers, data: rows.map((r) => r.map(safe)) }), "text/csv;charset=utf-8");
}

export async function exportTableXLSX(headers: string[], rows: (string | number)[][], filename: string) {
  const { default: writeExcelFile } = await import("write-excel-file/browser");
  const data = [headers.map((h) => ({ value: h, fontWeight: "bold" as const })), ...rows.map((r) => r.map((v) => { const s = safe(v); return s === "" ? null : s; }))];
  await writeExcelFile(data as never).toFile(filename);
}

export function downloadJSON(filename: string, obj: unknown) {
  download(filename, JSON.stringify(obj, null, 2), "application/json");
}

// ------------------------------------------------------------------ import

const ALIASES: Record<string, string[]> = {
  companyName: ["company", "company name", "client", "client name", "company / client name", "الشركة", "اسم الشركة", "العميل"],
  contactName: ["contact", "contact person", "contact name", "name", "person", "جهة الاتصال", "الاسم", "اسم المسؤول"],
  jobTitle: ["job title", "title", "position", "role", "المسمى الوظيفي"],
  phone: ["phone", "mobile", "telephone", "tel", "phone number", "الهاتف", "الجوال", "رقم الجوال"],
  whatsapp: ["whatsapp", "whatsapp number", "واتساب", "واتس اب"],
  email: ["email", "e-mail", "email address", "البريد", "البريد الإلكتروني"],
  website: ["website", "web", "site", "url", "الموقع"],
  linkedin: ["linkedin", "linkedin profile"],
  instagram: ["instagram", "instagram profile", "insta"],
  city: ["city", "location", "company location", "المدينة"],
  clientType: ["client type", "type", "نوع العميل"],
  categories: ["categories", "category", "categories / services", "business category", "services", "required services", "الفئة", "الخدمات"],
  projectName: ["project", "project name", "اسم المشروع", "المشروع"],
  projectLocation: ["project location", "موقع المشروع"],
  description: ["description", "project description", "scope", "الوصف"],
  value: ["value", "estimated value", "estimated value (sar)", "estimated project value", "budget", "القيمة", "القيمة التقديرية"],
  expectedStart: ["expected start", "start date", "expected start date", "تاريخ البدء"],
  source: ["source", "lead source", "المصدر"],
  priority: ["priority", "الأولوية"],
  stage: ["stage", "status", "pipeline stage", "المرحلة", "الحالة"],
  lastContact: ["last contact", "last contact date", "آخر تواصل"],
  nextFollowUp: ["next follow-up", "next follow up", "next follow-up date", "follow up", "المتابعة القادمة"],
  assignee: ["assigned to", "assignee", "owner", "assigned person", "المسؤول"],
  notes: ["notes", "note", "comments", "ملاحظات"],
};

export interface ImportRow {
  line: number;
  input: LeadInput | null;
  errors: string[];
  warnings: string[];
  dup: boolean;
}

export interface ImportPreview {
  rows: ImportRow[];
  unmapped: string[];
  mapped: Record<string, string>;
}

export async function readFileRows(file: File): Promise<string[][]> {
  const ext = file.name.toLowerCase().split(".").pop();
  if (ext === "xlsx") {
    const { readSheet } = await import("read-excel-file/browser");
    const rows = (await readSheet(file)) as unknown[][];
    return rows.map((r) =>
      r.map((c) => {
        if (c === null || c === undefined) return "";
        if (c instanceof Date) return toDateStr(c);
        return String(c);
      }),
    );
  }
  if (ext === "csv" || ext === "txt" || ext === "tsv") {
    const text = await file.text();
    const res = Papa.parse<string[]>(text.replace(/^﻿/, ""), { skipEmptyLines: "greedy" });
    return res.data;
  }
  throw new Error("Unsupported file type. Use .csv or .xlsx");
}

function parseDate(s: string): string | null {
  const v = s.trim();
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/); // dd/mm/yyyy (Saudi/UK order)
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

export function buildImportPreview(db: DB, table: string[][]): ImportPreview {
  if (table.length < 2) return { rows: [], unmapped: [], mapped: {} };
  const headers = table[0].map((h) => h.trim().toLowerCase());
  const idx: Record<string, number> = {};
  const mapped: Record<string, string> = {};
  for (const [field, aliases] of Object.entries(ALIASES)) {
    const i = headers.findIndex((h) => aliases.includes(h));
    if (i >= 0) {
      idx[field] = i;
      mapped[field] = table[0][i];
    }
  }
  const customIdx = db.customFields.map((f) => ({ f, i: headers.indexOf(f.label.trim().toLowerCase()) })).filter((x) => x.i >= 0);
  const used = new Set([...Object.values(idx), ...customIdx.map((c) => c.i)]);
  const unmapped = table[0].filter((_, i) => !used.has(i) && table[0][i].trim() && !["lead id", "date created", "last updated"].includes(headers[i]));

  const byName = <T extends { name: string; nameAr?: string }>(arr: T[], v: string): T | undefined => {
    const n = normName(v);
    return n ? arr.find((x) => normName(x.name) === n || (x.nameAr && normName(x.nameAr) === n)) : undefined;
  };
  const get = (r: string[], f: string) => (idx[f] !== undefined ? (r[idx[f]] ?? "").trim() : "");
  const existingKeys = new Set(db.leads.map((l) => normName(l.companyName) + "|" + normName(l.projectName)));
  const seen = new Set<string>();

  const rows: ImportRow[] = table.slice(1).map((r, n) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const company = get(r, "companyName");
    if (!company) errors.push("Company is required");
    const phone = get(r, "phone");
    if (phone && !isValidPhone(phone)) errors.push(`Invalid phone "${phone}"`);
    const wa = get(r, "whatsapp");
    if (wa && !isValidPhone(wa)) errors.push(`Invalid WhatsApp "${wa}"`);
    const email = get(r, "email");
    if (email && !isEmail(email)) errors.push(`Invalid email "${email}"`);
    const website = get(r, "website");
    if (website && !isUrl(website)) errors.push(`Invalid website "${website}"`);
    const linkedin = get(r, "linkedin");
    if (linkedin && !isUrl(linkedin)) errors.push(`Invalid LinkedIn URL`);

    const rawVal = get(r, "value").replace(/[,\s]|SAR|ر\.س/gi, "");
    let value: number | null = null;
    if (rawVal) {
      value = Number(rawVal);
      if (isNaN(value) || value < 0) {
        errors.push(`Invalid value "${get(r, "value")}"`);
        value = null;
      }
    }
    const dates: Record<string, string> = {};
    for (const f of ["expectedStart", "lastContact", "nextFollowUp"]) {
      const d = parseDate(get(r, f));
      if (d === null) {
        errors.push(`Invalid date in "${f}": ${get(r, f)}`);
        dates[f] = "";
      } else dates[f] = d;
    }

    const stageName = get(r, "stage");
    const stage = stageName ? byName(db.stages, stageName) : undefined;
    if (stageName && !stage) warnings.push(`Unknown stage "${stageName}" — will use the first stage`);
    const src = get(r, "source");
    const source = src ? byName(db.options.filter((o) => o.list === "source"), src) : undefined;
    if (src && !source) warnings.push(`Unknown source "${src}" — left empty`);
    const pr = get(r, "priority");
    const priority = pr ? byName(db.options.filter((o) => o.list === "priority"), pr) : undefined;
    if (pr && !priority) warnings.push(`Unknown priority "${pr}" — default used`);
    const ct = get(r, "clientType");
    const clientType = ct ? byName(db.options.filter((o) => o.list === "clientType"), ct) : undefined;
    const asg = get(r, "assignee");
    const assignee = asg ? byName(db.options.filter((o) => o.list === "assignee"), asg) : undefined;
    const catNames = get(r, "categories").split(/[;|،]/).map((s) => s.trim()).filter(Boolean);
    const categoryIds: string[] = [];
    for (const cn of catNames) {
      const c = byName(db.categories, cn);
      if (c) categoryIds.push(c.id);
      else warnings.push(`Unknown category "${cn}" — skipped`);
    }

    const custom: LeadInput["custom"] = {};
    for (const { f, i } of customIdx) {
      const raw = (r[i] ?? "").trim();
      if (!raw) continue;
      if (f.type === "number") custom[f.id] = isNaN(Number(raw)) ? null : Number(raw);
      else if (f.type === "multiselect") custom[f.id] = raw.split(/[;|]/).map((s) => s.trim()).filter((s) => f.options.includes(s));
      else if (f.type === "dropdown") custom[f.id] = f.options.includes(raw) ? raw : "";
      else custom[f.id] = raw;
    }

    const key = normName(company) + "|" + normName(get(r, "projectName"));
    const dup = existingKeys.has(key) || seen.has(key);
    seen.add(key);
    if (dup) warnings.push("Possible duplicate (same company + project)");

    const input: LeadInput | null = errors.length
      ? null
      : {
          companyName: company,
          contactName: get(r, "contactName"),
          jobTitle: get(r, "jobTitle"),
          phone: canonPhone(phone),
          whatsapp: canonPhone(wa),
          email,
          website: canonUrl(website),
          linkedin: canonUrl(linkedin),
          instagram: get(r, "instagram"),
          city: get(r, "city"),
          clientTypeId: clientType?.id ?? "",
          categoryIds,
          projectName: get(r, "projectName"),
          projectLocation: get(r, "projectLocation"),
          description: get(r, "description"),
          value,
          expectedStart: dates.expectedStart,
          sourceId: source?.id ?? "",
          ...(priority ? { priorityId: priority.id } : {}),
          ...(stage ? { stageId: stage.id } : {}),
          lastContact: dates.lastContact,
          nextFollowUp: dates.nextFollowUp,
          assigneeId: assignee?.id ?? "",
          notes: get(r, "notes"),
          custom,
        };
    return { line: n + 2, input, errors, warnings, dup };
  });
  return { rows, unmapped, mapped };
}

export function importTemplateCSV(): string {
  const headers = ["Company", "Contact Person", "Job Title", "Phone", "WhatsApp", "Email", "Website", "City", "Categories / Services", "Project Name", "Estimated Value (SAR)", "Source", "Priority", "Stage", "Next Follow-Up", "Notes"];
  const sample = ["Example Trading Co.", "Ahmed Al-Salem", "Procurement Manager", "0551234567", "0551234567", "ahmed@example.com", "example.com", "Riyadh", "Retail Fit-Out; Retail Display Units", "Olaya Flagship Store", "850000", "LinkedIn", "High", "New Lead", "2026-11-01", "Met at trade show"];
  return "﻿" + Papa.unparse({ fields: headers, data: [sample] });
}
