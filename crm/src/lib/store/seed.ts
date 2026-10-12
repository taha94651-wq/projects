import type {
  Activity,
  Category,
  Company,
  Contact,
  DB,
  Lead,
  Option,
  OptionList,
  Project,
  Settings,
  Stage,
  StageKind,
  StageRole,
} from "../types";
import { addDays, nowIso, today, uid } from "../utils";

const ts = () => nowIso();

// ---------------------------------------------------------------------------------------------
// DEFAULT CONFIGURATION (real, editable data — created on first run; NOT demo records)
// ---------------------------------------------------------------------------------------------

type CatSeed = { name: string; ar: string; subs: [string, string][] };
const CATEGORY_SEED: CatSeed[] = [
  {
    name: "Fit-Out & Interior Construction",
    ar: "التجهيزات والإنشاءات الداخلية",
    subs: [
      ["Commercial Fit-Out", "تجهيزات تجارية"],
      ["Retail Fit-Out", "تجهيز متاجر التجزئة"],
      ["Office Fit-Out", "تجهيز مكاتب"],
      ["Restaurant & Café Fit-Out", "تجهيز مطاعم ومقاهي"],
      ["Showroom Fit-Out", "تجهيز معارض"],
      ["Mall Shops & Kiosks", "محلات وأكشاك المولات"],
      ["Turnkey Fit-Out Projects", "مشاريع تسليم مفتاح"],
      ["Renovation & Refurbishment", "التجديد والترميم"],
      ["General Interior Construction", "إنشاءات داخلية عامة"],
    ],
  },
  {
    name: "Execution & Contracting",
    ar: "التنفيذ والمقاولات",
    subs: [
      ["General Execution Works", "أعمال التنفيذ العامة"],
      ["Finishing Works", "أعمال التشطيبات"],
      ["Site Execution & Supervision", "التنفيذ والإشراف الموقعي"],
      ["Civil & Architectural Works", "الأعمال المدنية والمعمارية"],
      ["MEP Coordination & Execution", "تنسيق وتنفيذ الأعمال الكهروميكانيكية"],
      ["Flooring & Wall Finishes", "الأرضيات وتشطيبات الجدران"],
      ["Ceiling & Partition Works", "الأسقف والقواطع"],
      ["Painting & Decorative Finishes", "الدهانات والتشطيبات الديكورية"],
      ["Marble, Stone & Porcelain Installation", "تركيب الرخام والحجر والبورسلان"],
    ],
  },
  {
    name: "Joinery, Furniture & Manufacturing",
    ar: "النجارة والأثاث والتصنيع",
    subs: [
      ["Custom Furniture Manufacturing", "تصنيع أثاث مخصص"],
      ["Retail Display Units", "وحدات عرض للتجزئة"],
      ["Perfume Store Units", "وحدات متاجر العطور"],
      ["Shelving & Display Systems", "أنظمة الأرفف والعرض"],
      ["Custom Joinery & Woodworks", "نجارة وأعمال خشبية مخصصة"],
      ["Reception Desks & Counters", "مكاتب الاستقبال والكاونترات"],
      ["Decorative Panels & Wall Cladding", "ألواح ديكورية وكسوة جدران"],
      ["FF&E Supply & Installation", "توريد وتركيب الأثاث والتجهيزات"],
    ],
  },
  {
    name: "Design, Supply & Installation",
    ar: "التصميم والتوريد والتركيب",
    subs: [
      ["Shop Drawings & Technical Documentation", "مخططات تنفيذية ووثائق فنية"],
      ["Material Supply", "توريد المواد"],
      ["Furniture Supply", "توريد الأثاث"],
      ["Lighting & Decorative Elements", "الإضاءة والعناصر الديكورية"],
      ["Custom Manufacturing", "تصنيع مخصص"],
      ["Design-to-Execution Services", "خدمات من التصميم إلى التنفيذ"],
    ],
  },
];

const STAGE_SEED: [string, string, StageKind, string, number, StageRole?][] = [
  ["New Lead", "عميل جديد", "open", "#64748b", 5, "new"],
  ["Researching", "قيد البحث", "open", "#6366f1", 10],
  ["Contacted", "تم التواصل", "open", "#0ea5e9", 15, "contacted"],
  ["Interested", "مهتم", "open", "#06b6d4", 25],
  ["Meeting Scheduled", "اجتماع مجدول", "open", "#14b8a6", 35, "meeting"],
  ["Site Visit / Requirements Gathering", "زيارة موقع / جمع المتطلبات", "open", "#84cc16", 45],
  ["Quotation in Preparation", "عرض سعر قيد الإعداد", "open", "#eab308", 55],
  ["Quotation Submitted", "تم تقديم عرض السعر", "open", "#f59e0b", 60, "quotation"],
  ["Negotiation", "تفاوض", "open", "#f97316", 75],
  ["Won", "تم الفوز", "won", "#16a34a", 100],
  ["Lost", "خسارة", "lost", "#dc2626", 0],
  ["On Hold", "معلّق", "hold", "#94a3b8", 10],
];

type OptSeed = [string, string, string?, string?]; // name, ar, key, color
const OPTION_SEED: Record<OptionList, OptSeed[]> = {
  source: [
    ["LinkedIn", "لينكدإن", "linkedin"],
    ["Instagram", "إنستغرام", "instagram"],
    ["Website", "الموقع الإلكتروني", "website"],
    ["WhatsApp", "واتساب", "whatsapp"],
    ["Referrals", "توصيات", "referrals"],
    ["Direct Outreach", "تواصل مباشر", "direct"],
    ["Existing Contacts", "عملاء حاليون", "existing"],
    ["Site Visits", "زيارات ميدانية", "sitevisit"],
    ["Contractors", "مقاولون", "contractors"],
    ["Consultants", "استشاريون", "consultants"],
    ["Developers", "مطورون", "developers"],
    ["Mall Management", "إدارة المولات", "mall"],
    ["Cold Calling", "اتصال بارد", "cold"],
    ["Other", "أخرى", "other"],
  ],
  priority: [
    ["Low", "منخفضة", "low", "#64748b"],
    ["Medium", "متوسطة", "medium", "#0ea5e9"],
    ["High", "عالية", "high", "#f59e0b"],
    ["Urgent", "عاجلة", "urgent", "#dc2626"],
  ],
  clientType: [
    ["Retail Brand", "علامة تجارية للتجزئة", "retail"],
    ["Developer", "مطور عقاري", "developer"],
    ["Corporate / Office", "شركة / مكاتب", "corporate"],
    ["Hospitality / F&B", "ضيافة / مطاعم", "hospitality"],
    ["Mall / Landlord", "مول / مالك", "mall"],
    ["Contractor (Main)", "مقاول رئيسي", "contractor"],
    ["Consultant / Designer", "استشاري / مصمم", "consultant"],
    ["Government / Semi-Gov", "جهة حكومية / شبه حكومية", "gov"],
    ["Individual", "فرد", "individual"],
  ],
  assignee: [["Owner", "المالك", "owner"]],
  companySize: [
    ["1-10 employees", "١-١٠ موظفين"],
    ["11-50 employees", "١١-٥٠ موظف"],
    ["51-200 employees", "٥١-٢٠٠ موظف"],
    ["201-1000 employees", "٢٠١-١٠٠٠ موظف"],
    ["1000+ employees", "أكثر من ١٠٠٠ موظف"],
  ],
  industry: [
    ["Retail", "تجزئة"],
    ["Food & Beverage", "أغذية ومشروبات"],
    ["Real Estate", "عقارات"],
    ["Hospitality", "ضيافة"],
    ["Healthcare", "رعاية صحية"],
    ["Corporate / Services", "خدمات وشركات"],
    ["Construction", "إنشاءات"],
    ["Beauty & Fragrance", "تجميل وعطور"],
    ["Education", "تعليم"],
  ],
  relationship: [
    ["Prospect", "عميل محتمل", "prospect", "#64748b"],
    ["Engaged", "قيد التواصل", "engaged", "#0ea5e9"],
    ["Active Client", "عميل نشط", "active", "#16a34a"],
    ["Past Client", "عميل سابق", "past", "#8b5cf6"],
    ["Inactive", "غير نشط", "inactive", "#94a3b8"],
  ],
  projectType: [
    ["Fit-Out", "تجهيزات داخلية"],
    ["Retail Store", "متجر تجزئة"],
    ["Office", "مكتب"],
    ["Restaurant / Café", "مطعم / مقهى"],
    ["Showroom", "معرض"],
    ["Joinery Package", "حزمة نجارة"],
    ["Renovation", "تجديد"],
    ["Supply Only", "توريد فقط"],
  ],
  projectStatus: [
    ["Opportunity", "فرصة", "opportunity", "#64748b"],
    ["Tendering / Quoting", "مناقصة / تسعير", "quoting", "#f59e0b"],
    ["Negotiation", "تفاوض", "negotiation", "#f97316"],
    ["Awarded", "تمت الترسية", "awarded", "#16a34a"],
    ["In Execution", "قيد التنفيذ", "execution", "#0ea5e9"],
    ["Completed", "مكتمل", "completed", "#15803d"],
    ["Lost", "خسارة", "lost", "#dc2626"],
    ["On Hold", "معلّق", "hold", "#94a3b8"],
  ],
  activityType: [
    ["Call", "اتصال", "call", "#0ea5e9"],
    ["WhatsApp", "واتساب", "whatsapp", "#16a34a"],
    ["Email", "بريد إلكتروني", "email", "#6366f1"],
    ["Meeting", "اجتماع", "meeting", "#14b8a6"],
    ["Site Visit", "زيارة موقع", "site_visit", "#84cc16"],
    ["Quotation", "عرض سعر", "quotation", "#f59e0b"],
    ["Note", "ملاحظة", "note", "#64748b"],
    ["Task", "مهمة", "task", "#a16207"],
    ["System", "نظام", "system", "#94a3b8"],
  ],
  lossReason: [
    ["Price too high", "السعر مرتفع"],
    ["Chose another contractor", "اختاروا مقاولاً آخر"],
    ["Project cancelled", "تم إلغاء المشروع"],
    ["Timeline mismatch", "عدم توافق الجدول الزمني"],
    ["No response", "لا يوجد رد"],
    ["Scope outside our services", "النطاق خارج خدماتنا"],
  ],
  city: ["Riyadh", "Jeddah", "Dammam", "Khobar", "Makkah", "Madinah", "Tabuk", "Abha", "Jubail", "Taif", "Hail", "Buraidah", "Yanbu", "NEOM"].map(
    (c) => [c, c] as OptSeed,
  ),
};
const CITY_AR: Record<string, string> = {
  Riyadh: "الرياض",
  Jeddah: "جدة",
  Dammam: "الدمام",
  Khobar: "الخبر",
  Makkah: "مكة المكرمة",
  Madinah: "المدينة المنورة",
  Tabuk: "تبوك",
  Abha: "أبها",
  Jubail: "الجبيل",
  Taif: "الطائف",
  Hail: "حائل",
  Buraidah: "بريدة",
  Yanbu: "ينبع",
  NEOM: "نيوم",
};

export function buildDefaults(): Pick<DB, "categories" | "stages" | "options" | "settings"> {
  const categories: Category[] = [];
  let g = 0;
  for (const grp of CATEGORY_SEED) {
    const gid = uid();
    categories.push({ id: gid, parentId: "", name: grp.name, nameAr: grp.ar, sort: g++, createdAt: ts(), updatedAt: ts() });
    grp.subs.forEach(([n, ar], i) =>
      categories.push({ id: uid(), parentId: gid, name: n, nameAr: ar, sort: i, createdAt: ts(), updatedAt: ts() }),
    );
  }
  const stages: Stage[] = STAGE_SEED.map(([name, nameAr, kind, color, probability, role], i) => ({
    role: role ?? "",
    id: uid(),
    name,
    nameAr,
    kind,
    color,
    probability,
    sort: i,
    createdAt: ts(),
    updatedAt: ts(),
  }));
  const options: Option[] = [];
  (Object.keys(OPTION_SEED) as OptionList[]).forEach((list) => {
    OPTION_SEED[list].forEach(([name, ar, key, color], i) =>
      options.push({
        id: uid(),
        list,
        name,
        nameAr: list === "city" ? CITY_AR[name] || ar : ar,
        key: key || "",
        color: color || "",
        sort: i,
        createdAt: ts(),
        updatedAt: ts(),
      }),
    );
  });
  const settings: Settings = {
    id: uid(),
    language: "en",
    currency: "SAR",
    leadColumns: ["code", "company", "contact", "phone", "city", "categories", "value", "stage", "priority", "nextFollowUp", "assignee"],
    defaultLeadFilters: {},
    reminders: { enabled: true, daysBefore: 1, showOverdueBadge: true },
    pageSize: 25,
    demoLoaded: false,
    createdAt: ts(),
    updatedAt: ts(),
  };
  return { categories, stages, options, settings: [settings] };
}

// ---------------------------------------------------------------------------------------------
// DEMO DATA — fictional companies, flagged isDemo=true so it can be removed in one click.
// ---------------------------------------------------------------------------------------------

type CompanySeed = {
  name: string;
  city: string;
  industry: string;
  size: string;
  site: string;
  rel: string;
  cats: string[];
  contacts: [string, string, string][]; // name, title, phone
};

const COMPANIES: CompanySeed[] = [
  { name: "Al Rawabi Retail Group", city: "Riyadh", industry: "Retail", size: "201-1000 employees", site: "alrawabi-retail.example", rel: "active", cats: ["Retail Fit-Out", "Retail Display Units"], contacts: [["Faisal Al-Otaibi", "Head of Store Development", "0551234501"], ["Noura Al-Harbi", "Procurement Manager", "0551234502"]] },
  { name: "Najd Hospitality Co.", city: "Riyadh", industry: "Hospitality", size: "51-200 employees", site: "najdhospitality.example", rel: "engaged", cats: ["Restaurant & Café Fit-Out", "Turnkey Fit-Out Projects"], contacts: [["Abdullah Al-Qahtani", "Operations Director", "0562345601"]] },
  { name: "Tamkeen Real Estate Development", city: "Jeddah", industry: "Real Estate", size: "201-1000 employees", site: "tamkeen-dev.example", rel: "prospect", cats: ["Commercial Fit-Out", "Civil & Architectural Works"], contacts: [["Khalid Al-Ghamdi", "Project Director", "0503456701"], ["Reem Bakhsh", "Design Coordinator", "0503456702"]] },
  { name: "Oud & Musk Perfumes", city: "Jeddah", industry: "Beauty & Fragrance", size: "51-200 employees", site: "oudmusk.example", rel: "active", cats: ["Perfume Store Units", "Retail Fit-Out"], contacts: [["Sultan Al-Zahrani", "Founder", "0554567801"]] },
  { name: "Eastern Bay Cafés", city: "Khobar", industry: "Food & Beverage", size: "11-50 employees", site: "easternbay.example", rel: "engaged", cats: ["Restaurant & Café Fit-Out"], contacts: [["Mona Al-Dossary", "Owner", "0545678901"]] },
  { name: "Skyline Corporate Offices", city: "Riyadh", industry: "Corporate / Services", size: "1000+ employees", site: "skyline-corp.example", rel: "prospect", cats: ["Office Fit-Out", "Ceiling & Partition Works"], contacts: [["Majed Al-Shehri", "Facilities Manager", "0556789012"]] },
  { name: "Red Sands Mall Management", city: "Dammam", industry: "Real Estate", size: "51-200 employees", site: "redsandsmall.example", rel: "engaged", cats: ["Mall Shops & Kiosks"], contacts: [["Hessa Al-Mutairi", "Tenant Coordination Lead", "0567890123"]] },
  { name: "Lamsa Beauty Boutiques", city: "Riyadh", industry: "Beauty & Fragrance", size: "11-50 employees", site: "lamsa-beauty.example", rel: "prospect", cats: ["Retail Fit-Out", "Reception Desks & Counters"], contacts: [["Dalal Al-Anazi", "Brand Manager", "0558901234"]] },
  { name: "Waha Medical Clinics", city: "Madinah", industry: "Healthcare", size: "51-200 employees", site: "waha-clinics.example", rel: "prospect", cats: ["Renovation & Refurbishment", "Finishing Works"], contacts: [["Dr. Yousef Al-Juhani", "Medical Director", "0509012345"]] },
  { name: "Hijaz Motors Showrooms", city: "Jeddah", industry: "Retail", size: "201-1000 employees", site: "hijazmotors.example", rel: "past", cats: ["Showroom Fit-Out"], contacts: [["Tariq Al-Sulami", "Facilities Head", "0550123456"]] },
  { name: "Bayan Contracting Est.", city: "Riyadh", industry: "Construction", size: "51-200 employees", site: "bayan-contracting.example", rel: "engaged", cats: ["MEP Coordination & Execution", "General Execution Works"], contacts: [["Ibrahim Al-Rashid", "Contracts Manager", "0561239876"]] },
  { name: "Masaar Design Studio", city: "Riyadh", industry: "Corporate / Services", size: "11-50 employees", site: "masaar-design.example", rel: "active", cats: ["Design-to-Execution Services", "Custom Joinery & Woodworks"], contacts: [["Lama Al-Saud", "Principal Architect", "0507654321"]] },
  { name: "Sahari Fashion House", city: "Riyadh", industry: "Retail", size: "51-200 employees", site: "sahari-fashion.example", rel: "prospect", cats: ["Retail Fit-Out", "Shelving & Display Systems"], contacts: [["Ghada Al-Mansour", "Retail Operations", "0552348765"]] },
  { name: "Gulf Horizon Developers", city: "Khobar", industry: "Real Estate", size: "201-1000 employees", site: "gulfhorizon.example", rel: "prospect", cats: ["Turnkey Fit-Out Projects", "Flooring & Wall Finishes"], contacts: [["Nasser Al-Yami", "Development Manager", "0543217890"]] },
];

// company idx, project name, [cats], value, stage, priority key, source key, createdDaysAgo, followOffset|null, assignee
type LeadSeed = [number, string, string[], number, string, string, string, number, number | null];
const LEADS: LeadSeed[] = [
  [0, "Al Rawabi — Granada Mall Flagship", ["Retail Fit-Out", "Retail Display Units"], 1850000, "Negotiation", "urgent", "referrals", 70, 1],
  [0, "Al Rawabi — Riyadh Park Kiosk x4", ["Mall Shops & Kiosks"], 420000, "Quotation Submitted", "high", "existing", 40, -2],
  [1, "Najd Steakhouse — Olaya", ["Restaurant & Café Fit-Out"], 1250000, "Quotation in Preparation", "high", "linkedin", 32, 3],
  [1, "Najd Café Chain — 3 branches", ["Restaurant & Café Fit-Out", "Turnkey Fit-Out Projects"], 2900000, "Meeting Scheduled", "medium", "direct", 18, 0],
  [2, "Tamkeen Tower — Lobby & Retail Podium", ["Commercial Fit-Out", "Civil & Architectural Works"], 4600000, "Site Visit / Requirements Gathering", "urgent", "developers", 25, 2],
  [2, "Tamkeen Sales Gallery", ["Showroom Fit-Out"], 980000, "Interested", "medium", "developers", 12, 5],
  [3, "Oud & Musk — Red Sea Mall Store", ["Perfume Store Units", "Retail Fit-Out"], 760000, "Won", "high", "referrals", 95, null],
  [3, "Oud & Musk — Riyadh Front Boutique", ["Perfume Store Units"], 540000, "Quotation Submitted", "high", "existing", 20, -1],
  [3, "Oud & Musk — Display Units Refresh", ["Retail Display Units", "Shelving & Display Systems"], 210000, "Won", "medium", "existing", 60, null],
  [4, "Eastern Bay — Corniche Café", ["Restaurant & Café Fit-Out"], 640000, "Contacted", "medium", "instagram", 8, -3],
  [4, "Eastern Bay — Express Kiosk", ["Mall Shops & Kiosks"], 180000, "On Hold", "low", "instagram", 50, null],
  [5, "Skyline HQ — Floors 12-14 Fit-Out", ["Office Fit-Out", "Ceiling & Partition Works"], 3300000, "Researching", "high", "consultants", 6, 4],
  [5, "Skyline — Executive Lounge", ["Office Fit-Out", "Custom Furniture Manufacturing"], 520000, "Lost", "medium", "linkedin", 85, null],
  [6, "Red Sands Mall — 6 Tenant Units", ["Mall Shops & Kiosks", "Finishing Works"], 1100000, "Meeting Scheduled", "high", "mall", 15, 1],
  [6, "Red Sands — Food Court Kiosks", ["Mall Shops & Kiosks"], 390000, "New Lead", "medium", "mall", 2, 0],
  [7, "Lamsa — Al Nakheel Boutique", ["Retail Fit-Out", "Reception Desks & Counters"], 460000, "Interested", "medium", "instagram", 14, 2],
  [7, "Lamsa — Counter & Mirror Units", ["Reception Desks & Counters", "Custom Joinery & Woodworks"], 130000, "Contacted", "low", "whatsapp", 5, -5],
  [8, "Waha Clinic — Branch Renovation", ["Renovation & Refurbishment", "Finishing Works"], 880000, "Quotation Submitted", "high", "cold", 38, -4],
  [8, "Waha — Reception & Waiting Area", ["Reception Desks & Counters"], 150000, "Researching", "low", "website", 4, 6],
  [9, "Hijaz Motors — New Showroom", ["Showroom Fit-Out", "Flooring & Wall Finishes"], 2200000, "Lost", "high", "existing", 110, null],
  [9, "Hijaz Motors — Service Lounge", ["Commercial Fit-Out"], 410000, "New Lead", "medium", "existing", 1, 1],
  [10, "Bayan — Subcontract: Ceiling & Partitions", ["Ceiling & Partition Works", "Painting & Decorative Finishes"], 690000, "Negotiation", "high", "contractors", 29, 0],
  [10, "Bayan — MEP Coordination Package", ["MEP Coordination & Execution"], 950000, "Contacted", "medium", "contractors", 9, 7],
  [11, "Masaar — Boutique Hotel Joinery Package", ["Custom Joinery & Woodworks", "Decorative Panels & Wall Cladding"], 1450000, "Quotation in Preparation", "high", "consultants", 21, 2],
  [11, "Masaar — Villa Walk-in Wardrobes", ["Custom Furniture Manufacturing"], 320000, "Won", "medium", "consultants", 75, null],
  [12, "Sahari — Boulevard Flagship", ["Retail Fit-Out", "Shelving & Display Systems"], 1320000, "Site Visit / Requirements Gathering", "high", "linkedin", 16, -1],
  [12, "Sahari — 5 Store Rollout (Phase 1)", ["Retail Fit-Out", "Retail Display Units"], 3800000, "Interested", "urgent", "direct", 11, 3],
  [13, "Gulf Horizon — Marina Offices", ["Turnkey Fit-Out Projects", "Flooring & Wall Finishes"], 2750000, "Researching", "medium", "developers", 7, 8],
  [13, "Gulf Horizon — Sales Center Marble Works", ["Marble, Stone & Porcelain Installation"], 610000, "On Hold", "low", "developers", 44, null],
];

const PROJECTS: [number, string, string, string, number, number | null, number, number, number | null][] = [
  // leadIdx, name, status key, type, budget, quotation, probability, awardOffsetDays, profit
  [0, "Granada Mall Flagship Store", "negotiation", "Retail Store", 1900000, 1850000, 75, 21, 296000],
  [2, "Najd Steakhouse Olaya", "quoting", "Restaurant / Café", 1300000, null, 55, 45, null],
  [4, "Tamkeen Tower Podium", "opportunity", "Fit-Out", 4800000, null, 35, 90, 690000],
  [6, "Red Sea Mall Perfume Store", "execution", "Retail Store", 760000, 760000, 100, -50, 129200],
  [7, "Riyadh Front Boutique", "quoting", "Retail Store", 560000, 540000, 60, 14, 86400],
  [8, "Display Units Refresh", "completed", "Joinery Package", 210000, 210000, 100, -45, 37800],
  [17, "Waha Clinic Renovation", "quoting", "Renovation", 900000, 880000, 50, 20, 123200],
  [21, "Bayan Ceiling & Partitions", "negotiation", "Fit-Out", 700000, 690000, 70, 10, 96600],
  [23, "Boutique Hotel Joinery", "quoting", "Joinery Package", 1500000, null, 55, 35, 255000],
  [24, "Villa Walk-in Wardrobes", "completed", "Joinery Package", 320000, 320000, 100, -30, 64000],
  [27, "Sahari Rollout Phase 1", "opportunity", "Retail Store", 3900000, null, 30, 80, 585000],
];

/** Creates demo companies/contacts/leads/projects/activities on top of an existing configuration. */
export function buildDemo(base: Pick<DB, "categories" | "stages" | "options">, startCode: number) {
  const cat = (n: string) => base.categories.find((c) => c.name === n)?.id ?? "";
  const stage = (n: string) => base.stages.find((s) => s.name === n);
  const opt = (list: OptionList, keyOrName: string) =>
    base.options.find((o) => o.list === list && (o.key === keyOrName || o.name === keyOrName))?.id ?? "";
  const owner = opt("assignee", "owner");
  const t = today();

  const companies: Company[] = [];
  const contacts: Contact[] = [];
  COMPANIES.forEach((c) => {
    const id = uid();
    companies.push({
      id,
      name: c.name,
      industryId: opt("industry", c.industry),
      sizeId: opt("companySize", c.size),
      city: c.city,
      regions: c.city === "Riyadh" ? "Riyadh, Qassim" : c.city === "Jeddah" ? "Makkah Region" : "Eastern Province",
      website: "https://" + c.site,
      linkedin: "",
      instagram: "",
      phone: "",
      email: "info@" + c.site,
      categoryIds: c.cats.map(cat),
      relationshipId: opt("relationship", c.rel),
      notes: "",
      isDemo: true,
      createdAt: ts(),
      updatedAt: ts(),
    });
    c.contacts.forEach(([name, title, phone], i) =>
      contacts.push({
        id: uid(),
        companyId: id,
        name,
        jobTitle: title,
        phone,
        whatsapp: phone,
        email: name.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "") + "@" + c.site,
        isPrimary: i === 0,
        notes: "",
        isDemo: true,
        createdAt: ts(),
        updatedAt: ts(),
      }),
    );
  });

  const leads: Lead[] = [];
  const activities: Activity[] = [];
  let code = startCode;
  LEADS.forEach(([ci, project, cats, value, stageName, prio, src, ago, follow], idx) => {
    const company = companies[ci];
    const contact = contacts.find((k) => k.companyId === company.id)!;
    const st = stage(stageName)!;
    const created = addDays(t, -ago);
    const id = uid();
    const closed = st.kind === "won" || st.kind === "lost";
    const lead: Lead = {
      id,
      code: "LD-" + String(code++).padStart(4, "0"),
      companyId: company.id,
      companyName: company.name,
      contactName: contact.name,
      jobTitle: contact.jobTitle,
      phone: contact.phone,
      whatsapp: contact.whatsapp,
      email: contact.email,
      website: company.website,
      linkedin: "",
      instagram: "",
      city: company.city,
      clientTypeId: opt("clientType", ["retail", "hospitality", "developer", "retail", "hospitality", "corporate", "mall", "retail", "corporate", "retail", "contractor", "consultant", "retail", "developer"][ci]),
      categoryIds: cats.map(cat),
      projectName: project,
      projectLocation: company.city,
      description: `Demo record — ${project}. Scope to be confirmed after site visit and drawings review.`,
      value,
      expectedStart: addDays(t, 30 + ((idx * 7) % 90)),
      sourceId: opt("source", src),
      priorityId: opt("priority", prio),
      stageId: st.id,
      lastContact: st.name === "New Lead" ? "" : addDays(t, -Math.max(1, Math.min(ago, 3 + (idx % 9)))),
      nextFollowUp: follow === null || closed ? "" : addDays(t, follow),
      assigneeId: owner,
      notes: "",
      outcome: closed
        ? {
            result: st.kind as "won" | "lost",
            finalValue: st.kind === "won" ? Math.round(value * 0.97) : null,
            reasonId: st.kind === "lost" ? opt("lossReason", idx % 2 ? "Price too high" : "Chose another contractor") : "",
            reason: "",
            notes: st.kind === "won" ? "Contract signed after final negotiation." : "Client went with a competing bid.",
            date: addDays(t, -Math.floor(ago / 3)),
          }
        : null,
      custom: {},
      isDemo: true,
      createdAt: new Date(addDays(t, -ago) + "T09:00:00").toISOString(),
      updatedAt: ts(),
    };
    leads.push(lead);

    // timeline
    const mk = (typeKey: string, daysAgo: number, desc: string, outcome: string, done: boolean, next = "", nextFU = ""): Activity => ({
      id: uid(),
      leadId: id,
      companyId: company.id,
      projectId: "",
      typeId: opt("activityType", typeKey),
      dateTime: addDays(t, -daysAgo) + "T" + (done ? "11:00" : "10:00"),
      description: desc,
      outcome,
      nextAction: next,
      nextFollowUp: nextFU,
      done,
      completedAt: done ? new Date(addDays(t, -daysAgo) + "T12:00:00").toISOString() : "",
      system: false,
      isDemo: true,
      createdAt: ts(),
      updatedAt: ts(),
    });
    activities.push({ ...mk("note", ago, "Lead created from " + src, "", true), system: true, typeId: opt("activityType", "system") });
    if (st.name !== "New Lead" && ago > 3) {
      activities.push(mk("call", Math.min(ago - 1, 3 + (idx % 6)), "Intro call with " + contact.name, "Interested in a proposal", true, "Send company profile", ""));
    }
    if (["Meeting Scheduled", "Site Visit / Requirements Gathering", "Quotation in Preparation", "Quotation Submitted", "Negotiation", "Won"].includes(stageName) && ago > 8) {
      activities.push(mk("whatsapp", 4 + (idx % 4), "Shared portfolio and past projects", "Positive feedback", true));
    }
    if (stageName === "Meeting Scheduled") {
      activities.push(mk("meeting", -(follow ?? 1), "Requirements meeting at client office", "", false, "Prepare presentation"));
    }
    if (stageName === "Site Visit / Requirements Gathering") {
      activities.push(mk("site_visit", -(follow ?? 1), "Site measurement & requirements walkthrough", "", false, "Prepare BOQ"));
    }
    if (stageName === "Quotation Submitted") {
      activities.push(mk("quotation", 6 + (idx % 5), "Quotation submitted: " + new Intl.NumberFormat("en").format(value) + " SAR", "Awaiting client response", false, "Follow up on quotation", lead.nextFollowUp));
    }
    if (follow !== null && !closed && !["Meeting Scheduled", "Site Visit / Requirements Gathering", "Quotation Submitted"].includes(stageName)) {
      activities.push(mk(follow < 0 ? "call" : idx % 2 ? "whatsapp" : "email", -follow, "Follow-up: " + project, "", false, "Confirm next steps", ""));
    }
  });

  const projects: Project[] = PROJECTS.map(([li, name, status, type, budget, quotation, prob, awardOffset, profit]) => {
    const lead = leads[li];
    return {
      id: uid(),
      name,
      companyId: lead.companyId,
      leadId: lead.id,
      typeId: opt("projectType", type),
      location: lead.projectLocation,
      scope: lead.description,
      categoryIds: lead.categoryIds,
      estimatedBudget: budget,
      quotationValue: quotation,
      expectedProfit: profit,
      probability: prob,
      statusId: opt("projectStatus", status),
      awardDate: addDays(t, awardOffset),
      startDate: addDays(t, awardOffset + 14),
      endDate: addDays(t, awardOffset + 14 + 75),
      notes: "",
      isDemo: true,
      createdAt: ts(),
      updatedAt: ts(),
    };
  });

  return { companies, contacts, leads, projects, activities };
}
