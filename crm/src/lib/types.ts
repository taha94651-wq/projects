// Domain model. Every configurable list (categories, stages, sources, priorities, ...) is DATA,
// never hard-coded in UI logic — see Settings.

export type ID = string;

export interface Base {
  id: ID;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** Business categories: parent === "" -> group (A,B,C,D...), otherwise subcategory/service. */
export interface Category extends Base {
  parentId: ID | "";
  name: string;
  nameAr: string;
  sort: number;
}

export type StageKind = "open" | "won" | "lost" | "hold";
/** Which dashboard KPI card a stage feeds. Lets stages be renamed freely without breaking statistics. */
export type StageRole = "" | "new" | "contacted" | "meeting" | "quotation";
export interface Stage extends Base {
  name: string;
  nameAr: string;
  sort: number;
  kind: StageKind;
  role: StageRole;
  color: string;
  /** Default win probability (0-100) suggested for opportunities in this stage. */
  probability: number;
}

/** Generic editable dropdown lists. */
export const OPTION_LISTS = [
  "source",
  "priority",
  "clientType",
  "assignee",
  "companySize",
  "industry",
  "relationship",
  "projectType",
  "projectStatus",
  "activityType",
  "lossReason",
  "city",
] as const;
export type OptionList = (typeof OPTION_LISTS)[number];

export interface Option extends Base {
  list: OptionList;
  name: string;
  nameAr: string;
  sort: number;
  color: string;
  /** Optional semantic key used by built-in logic (e.g. activityType "meeting"). Not required for custom entries. */
  key: string;
}

export type CustomFieldType = "text" | "number" | "date" | "dropdown" | "multiselect" | "url" | "email" | "phone";
export interface CustomField extends Base {
  entity: "lead";
  label: string;
  labelAr: string;
  type: CustomFieldType;
  options: string[];
  required: boolean;
  sort: number;
}

export interface Company extends Base {
  name: string;
  /** Company / client type (editable "clientType" list), e.g. Real Estate Development, Design & Execution. */
  clientTypeId: ID | "";
  industryId: ID | "";
  sizeId: ID | "";
  city: string;
  regions: string;
  website: string;
  linkedin: string;
  instagram: string;
  phone: string;
  email: string;
  categoryIds: ID[];
  relationshipId: ID | "";
  notes: string;
  isDemo: boolean;
}

export interface Contact extends Base {
  companyId: ID;
  name: string;
  jobTitle: string;
  phone: string;
  whatsapp: string;
  email: string;
  isPrimary: boolean;
  notes: string;
  isDemo: boolean;
}

export interface Outcome {
  result: "won" | "lost";
  finalValue: number | null;
  reasonId: ID | "";
  reason: string;
  notes: string;
  date: string;
}

export interface Lead extends Base {
  code: string; // LD-0001
  companyId: ID | "";
  companyName: string;
  contactName: string;
  jobTitle: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  linkedin: string;
  instagram: string;
  city: string;
  clientTypeId: ID | "";
  categoryIds: ID[]; // business category + required services (any category nodes)
  projectName: string;
  projectLocation: string;
  description: string;
  value: number | null; // SAR estimate
  expectedStart: string;
  sourceId: ID | "";
  priorityId: ID | "";
  stageId: ID | "";
  lastContact: string;
  nextFollowUp: string;
  assigneeId: ID | "";
  notes: string;
  outcome: Outcome | null;
  custom: Record<string, string | number | string[] | null>;
  isDemo: boolean;
}

export interface Project extends Base {
  name: string;
  companyId: ID | "";
  leadId: ID | "";
  typeId: ID | "";
  location: string;
  scope: string;
  categoryIds: ID[];
  estimatedBudget: number | null;
  quotationValue: number | null;
  expectedProfit: number | null;
  probability: number; // 0-100
  statusId: ID | "";
  awardDate: string;
  startDate: string;
  endDate: string;
  notes: string;
  isDemo: boolean;
}

export interface Activity extends Base {
  leadId: ID | "";
  companyId: ID | "";
  projectId: ID | "";
  typeId: ID | "";
  dateTime: string; // local "YYYY-MM-DDTHH:mm"
  description: string;
  outcome: string;
  nextAction: string;
  nextFollowUp: string; // date
  done: boolean;
  completedAt: string;
  system: boolean; // auto-generated log entry (stage change etc.)
  isDemo: boolean;
}

export interface Settings extends Base {
  language: "en" | "ar";
  currency: string; // ISO code, default SAR
  /** Visible lead table columns in order. */
  leadColumns: string[];
  defaultLeadFilters: { stageId?: string; priorityId?: string; sourceId?: string; city?: string; categoryId?: string };
  reminders: { enabled: boolean; daysBefore: number; showOverdueBadge: boolean };
  pageSize: number;
  demoLoaded: boolean;
}

export interface DB {
  categories: Category[];
  stages: Stage[];
  options: Option[];
  customFields: CustomField[];
  companies: Company[];
  contacts: Contact[];
  leads: Lead[];
  projects: Project[];
  activities: Activity[];
  settings: Settings[];
}
export type TableName = keyof DB;

/** Dependency order (parents first) — used for inserts; reverse for deletes. */
export const TABLE_ORDER: TableName[] = [
  "settings",
  "categories",
  "stages",
  "options",
  "customFields",
  "companies",
  "contacts",
  "leads",
  "projects",
  "activities",
];
