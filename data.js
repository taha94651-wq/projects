/* =====================================================================
   ملف البيانات — ده الملف الوحيد اللي هتعدّل فيه.

   • كل نص ليه نسختين: ar و en.
   • الصور حطها في assets/images والفيديوهات في assets/videos
     وبعدين اكتب المسار هنا، مثال: "assets/images/assaf-1.jpg"
   • لو سبت أي صورة "" الموقع هيحط صورة مؤقتة لوحده.
   • لو سبت أي خانة نصية "" مش هتظهر في الموقع.
   • لينك مباشر لأي مشروع:  yoursite/#/p/<id>
   • لينك الموقع بالإنجليزي: yoursite/?lang=en
   ===================================================================== */

window.PORTFOLIO = {
  defaultLang: "en",

  profile: {
    name: { ar: "مصطفى طه", en: "Mostafa Taha" },
    title: { ar: "Fit-Out Manager | معماري", en: "Fit-Out Manager | Architect" },
    summary: {
      en: "Fit-Out Manager with an architectural background, experienced in commercial and residential fit-out projects, including offices, retail stores, gyms and residential spaces. Manages projects end to end, from client brief and design coordination through material selection, cost estimation and pricing, to site execution and handover. Specialised in joinery and furniture, from shop drawings and factory production to final finishing. Backed by a strong network of designers, contractors, suppliers and company decision-makers in the Riyadh market.",
      ar: "Fit-Out Manager بخلفية معمارية، وخبرة في مشاريع التشطيب التجارية والسكنية، تشمل المكاتب والمتاجر والصالات الرياضية والمساحات السكنية. أدير المشاريع من البداية إلى النهاية: من متطلبات العميل وتنسيق التصميم، مرورًا باختيار المواد وتقدير التكلفة والتسعير، وصولًا إلى التنفيذ في الموقع والتسليم. متخصص في أعمال النجارة والأثاث، من الرسومات التنفيذية والإنتاج في المصنع حتى التشطيب النهائي. أمتلك شبكة علاقات قوية مع المصممين والمقاولين والموردين وصنّاع القرار في سوق الرياض.",
    },
    heroImage: "", // صورة الواجهة الكبيرة — أقوى صورة مشروع عندك
    photo: "",     // صورتك الشخصية
    cv: "",        // مثال: "assets/cv/Mostafa_Taha_CV.pdf"
    location: { ar: "العارض، الرياض", en: "Al Arid, Riyadh" },
    email: "taha94651@gmail.com",
    phone: "+966 54 697 3343",
    whatsapp: "966546973343",
    socials: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/mostafa-taha-4b1198167" },
      { label: "Behance", url: "https://www.behance.net/mostafataha20" },
      { label: "Instagram", url: "https://www.instagram.com/mostafataha34_" },
    ],
  },

  /* أنواع المشاريع (التصنيف الفرعي جوه التصميم والتنفيذ) */
  types: {
    retail: { ar: "متاجر", en: "Retail" },
    gym: { ar: "صالات رياضية", en: "Gyms" },
    residential: { ar: "سكني", en: "Residential" },
    offices: { ar: "مكاتب", en: "Offices" },
    events: { ar: "فعاليات", en: "Events" },
  },

  /* ===================== المشاريع =====================
     disciplines: ["execution"] أو ["design"] أو الاتنين
       → المشروع بيظهر في القسم (أو القسمين) دول.
     type: واحد من الأنواع اللي فوق.
     role: دورك بالظبط.   duration: المدة.   year: السنة.
     scope: نطاق شغلك — قائمة نقط.
     media: { type: "image", src: "", caption: {ar,en} }
            { type: "video", src: "assets/videos/x.mp4" }
            { type: "youtube", id: "VIDEO_ID" }
  ====================================================== */
  projects: [
    {
      id: "makhazen-al-enaya",
      disciplines: ["design", "execution"],
      type: "retail",
      title: { ar: "مخازن العناية", en: "Makhazen Al Enaya" },
      client: { ar: "مخازن العناية", en: "Makhazen Al Enaya" },
      location: { ar: "المملكة العربية السعودية", en: "Saudi Arabia" },
      year: "",
      duration: { ar: "", en: "" },
      role: { ar: "التصميم والتنفيذ", en: "Design & Execution" },
      summary: {
        ar: "7 فروع جديدة مصممة وفق الهوية الجديدة للعلامة، وتجديد 7 فروع قائمة مع إعادة تصميم قسم المكياج.",
        en: "7 new branches designed to the new brand identity, and 7 existing branches renovated with a redesigned makeup section.",
      },
      scope: [
        { ar: "تصميم الفروع الجديدة وفق الهوية الجديدة", en: "Branch design to the new brand identity" },
        { ar: "إعادة تصميم قسم المكياج", en: "Makeup section redesign" },
        { ar: "تنفيذ وتسليم 14 فرعًا", en: "Execution and handover of 14 branches" },
      ],
      cover: "",
      media: [{ type: "image", src: "" }, { type: "image", src: "" }, { type: "image", src: "" }],
    },
    {
      id: "assaf-perfumes",
      disciplines: ["execution"],
      type: "retail",
      title: { ar: "عساف للعطور", en: "Assaf Perfumes" },
      client: { ar: "عساف للعطور", en: "Assaf Perfumes" },
      location: { ar: "المملكة العربية السعودية", en: "Across KSA" },
      year: "",
      duration: { ar: "", en: "" },
      role: { ar: "التنفيذ", en: "Execution" },
      summary: {
        ar: "11 متجرًا في أنحاء المملكة: وحدات عرض وأكشاك داخل المولات.",
        en: "11 stores across KSA: display units and in-mall booths.",
      },
      scope: [
        { ar: "وحدات العرض", en: "Display units" },
        { ar: "أكشاك داخل المولات", en: "In-mall booths" },
      ],
      cover: "",
      media: [{ type: "image", src: "" }, { type: "image", src: "" }],
    },
    {
      id: "fitness-time-ladies",
      disciplines: ["execution"],
      type: "gym",
      title: { ar: "فتنس تايم للسيدات", en: "Fitness Time Ladies" },
      client: { ar: "فتنس تايم", en: "Fitness Time" },
      location: { ar: "خريص، الرياض", en: "Khurais, Riyadh" },
      year: "",
      duration: { ar: "", en: "" },
      role: { ar: "التنفيذ", en: "Execution" },
      summary: { ar: "تنفيذ أعمال تشطيب صالة رياضية.", en: "Gym fit-out execution." },
      scope: [],
      cover: "",
      media: [{ type: "image", src: "" }, { type: "image", src: "" }],
    },
    {
      id: "old-school-gym",
      disciplines: ["execution"],
      type: "gym",
      title: { ar: "أولد سكول جيم", en: "Old School Gym" },
      client: { ar: "أولد سكول جيم", en: "Old School Gym" },
      location: { ar: "", en: "" },
      year: "",
      duration: { ar: "", en: "" },
      role: { ar: "التنفيذ", en: "Execution" },
      summary: { ar: "تنفيذ أعمال تشطيب صالة رياضية.", en: "Gym fit-out execution." },
      scope: [],
      cover: "",
      media: [{ type: "image", src: "" }],
    },
    {
      id: "laverne-perfumes",
      disciplines: ["execution"],
      type: "retail",
      title: { ar: "لافيرن للعطور", en: "Laverne Perfumes" },
      client: { ar: "لافيرن للعطور", en: "Laverne Perfumes" },
      location: { ar: "", en: "" },
      year: "",
      duration: { ar: "", en: "" },
      role: { ar: "التنفيذ", en: "Execution" },
      summary: { ar: "أكشاك عرض داخل المولات.", en: "In-mall display booths." },
      scope: [],
      cover: "",
      media: [{ type: "image", src: "" }],
    },
    {
      id: "private-villa",
      disciplines: ["execution"],
      type: "residential",
      title: { ar: "فيلا خاصة", en: "Private Villa" },
      client: { ar: "عميل رفيع المستوى", en: "High-profile client" },
      location: { ar: "الرياض", en: "Riyadh" },
      year: "",
      duration: { ar: "", en: "" },
      role: { ar: "التنفيذ", en: "Execution" },
      summary: { ar: "تنفيذ أعمال التشطيب لفيلا خاصة لعميل رفيع المستوى.", en: "Fit-out execution of a private villa for a high-profile client." },
      scope: [],
      cover: "",
      media: [{ type: "image", src: "" }],
    },
    {
      id: "chadel-chalet",
      disciplines: ["execution"],
      type: "residential",
      title: { ar: "شاليه شادل", en: "Chadel Chalet" },
      client: { ar: "", en: "" },
      location: { ar: "الرياض", en: "Riyadh" },
      year: "",
      duration: { ar: "", en: "" },
      role: { ar: "التنفيذ", en: "Execution" },
      summary: { ar: "تنفيذ أعمال التشطيب لشاليه.", en: "Chalet fit-out execution." },
      scope: [],
      cover: "",
      media: [{ type: "image", src: "" }],
    },
    {
      id: "rasees-beluar",
      disciplines: ["execution"],
      type: "events",
      title: { ar: "رسيس وبلوار", en: "Rasees & Beluar" },
      client: { ar: "رسيس وبلوار", en: "Rasees & Beluar" },
      location: { ar: "", en: "" },
      year: "",
      duration: { ar: "", en: "" },
      role: { ar: "التنفيذ", en: "Execution" },
      summary: { ar: "تنفيذ فعاليات لعلامات تجارية.", en: "Brand events execution." },
      scope: [],
      cover: "",
      media: [{ type: "image", src: "" }],
    },

    /* ---- مشاريع تصميم (أمثلة — بدّلها بمشاريعك) ---- */
    {
      id: "design-project-01",
      disciplines: ["design"],
      type: "offices",
      title: { ar: "مشروع تصميم 01", en: "Design Project 01" },
      client: { ar: "", en: "" },
      location: { ar: "", en: "" },
      year: "",
      duration: { ar: "", en: "" },
      role: { ar: "دورك في المشروع", en: "Your role" },
      summary: { ar: "وصف المشروع.", en: "Project description." },
      scope: [],
      cover: "",
      media: [{ type: "image", src: "" }, { type: "image", src: "" }],
    },
    {
      id: "design-project-02",
      disciplines: ["design"],
      type: "residential",
      title: { ar: "مشروع تصميم 02", en: "Design Project 02" },
      client: { ar: "", en: "" },
      location: { ar: "", en: "" },
      year: "",
      duration: { ar: "", en: "" },
      role: { ar: "دورك في المشروع", en: "Your role" },
      summary: { ar: "وصف المشروع.", en: "Project description." },
      scope: [],
      cover: "",
      media: [{ type: "image", src: "" }],
    },
  ],

  /* ===================== شغل الذكاء الاصطناعي =====================
     kind: "images" (صور مولّدة) | "sheets" (شيتات) | "workflows" (هيكلة مشاريع)
     src: صورة للعرض — link: لينك خارجي اختياري (شيت، ملف…)
  ================================================================= */
  aiKinds: {
    images: { ar: "صور مولّدة", en: "Generated Images" },
    sheets: { ar: "شيتات", en: "Sheets" },
    workflows: { ar: "هيكلة المشاريع", en: "Project Structuring" },
  },
  ai: [
    {
      kind: "images",
      title: { ar: "صور مولّدة — مثال", en: "Generated visuals — sample" },
      desc: { ar: "وصف قصير: الأداة المستخدمة والهدف.", en: "Short note: tool used and purpose." },
      tools: ["Claude"],
      src: "",
      link: "",
    },
    {
      kind: "sheets",
      title: { ar: "شيت تسعير — مثال", en: "Pricing sheet — sample" },
      desc: { ar: "وصف قصير لما يوفره الشيت.", en: "Short note on what the sheet automates." },
      tools: ["Claude in Excel"],
      src: "",
      link: "",
    },
    {
      kind: "workflows",
      title: { ar: "هيكلة مشروع — مثال", en: "Project structure — sample" },
      desc: { ar: "وصف قصير لطريقة التنظيم.", en: "Short note on the structure." },
      tools: ["Claude Code"],
      src: "",
      link: "",
    },
  ],

  /* ===================== الخبرات ===================== */
  experience: [
    {
      role: { ar: "Fit-Out Manager", en: "Fit-Out Manager" },
      company: { ar: "VIVID Design / PHZYN Construction", en: "VIVID Design / PHZYN Construction" },
      period: { ar: "2025 — الآن", en: "2025 — Present" },
      points: [
        { ar: "تحويل متطلبات العميل إلى موجز تصميمي ومراجعة مخرجات فريق التصميم.", en: "Translating client requirements into design briefs and reviewing the design team's output." },
        { ar: "إعداد لوحات عينات فعلية، وتطبيق هندسة القيمة، والحصول على اعتماد العميل للمواد.", en: "Building physical sample boards, running value engineering and securing client approval on materials." },
        { ar: "إعداد تقديرات التكلفة في مرحلة المفهوم، والتفاوض مع المقاولين والموردين، وإصدار العروض المسعّرة بهوامش الربح المستهدفة، ثم التفاوض مع العملاء لإغلاق الصفقات.", en: "Preparing concept-stage cost estimates, negotiating with subcontractors and suppliers, and issuing final priced proposals with target margins, then negotiating with clients to close deals." },
        { ar: "إدارة المقاولين والموردين في الموقع، ووضع ومتابعة الجداول الزمنية، واعتماد الرسومات التنفيذية، ومراقبة جودة التشطيب، وقيادة أعمال الملاحظات والتسليم.", en: "Managing subcontractors and suppliers on site, setting and tracking programmes, approving shop drawings, controlling finishing quality, and leading snagging and handover." },
      ],
    },
    {
      role: { ar: "معماري ومشرف (تطوير أعمال وتسعير)", en: "Architect & Supervisor (Business Development & Pricing)" },
      company: { ar: "سفانة للعمارة", en: "Safana Architects" },
      period: { ar: "2023 — 2025", en: "2023 — 2025" },
      points: [
        { ar: "جلب مشاريع جديدة عبر شبكة علاقات شخصية مع العملاء والمكاتب الهندسية والمطورين، وتقديم العروض وإغلاق الصفقات مباشرة.", en: "Sourced new projects through a personal network of clients, design offices and developers, then presented proposals and closed deals directly." },
        { ar: "الحفاظ على العلاقة مع العملاء بعد التسليم، مما أدى إلى مشاريع متكررة.", en: "Maintained client relationships after handover, generating repeat projects." },
        { ar: "الإشراف على فريق التصميم في المشاريع الجديدة وإعداد لوحات المزاج التصميمية.", en: "Supervised the design team on incoming projects and developed design mood boards." },
        { ar: "إعداد التسعير والمناقصات لأعمال التشطيب.", en: "Prepared pricing and tender submissions for fit-out and finishing works." },
        { ar: "مراجعة الرسومات المعمارية والتنفيذية ضمن المكتب الفني.", en: "Reviewed architectural drawings and shop drawings within the technical office." },
        { ar: "الإشراف على تنفيذ أعمال التشطيب في الموقع.", en: "Supervised site execution of fit-out works." },
      ],
    },
    {
      role: { ar: "مهندس إنتاج وتشطيبات", en: "Production & Fit-Out Engineer" },
      company: { ar: "فاليرو للأثاث", en: "Valero Furniture" },
      period: { ar: "2023", en: "2023" },
      points: [
        { ar: "مراجعة وتطوير الرسومات التنفيذية وتفاصيل النجارة لعلامة أثاث فاخرة.", en: "Reviewed and developed joinery shop drawings and details for a premium-quality furniture brand." },
        { ar: "الإشراف على الإنتاج في المصنع: القص والتجميع والدهان.", en: "Supervised production on the factory floor across cutting, assembly and paint finishing." },
        { ar: "إدارة التركيب والتسليم في مواقع العملاء.", en: "Managed installation and handover at client sites." },
      ],
    },
    {
      role: { ar: "مهندس عسكري", en: "Military Engineer" },
      company: { ar: "القوات البحرية المصرية — قاعدة بورسعيد", en: "Egyptian Navy — Port Said Naval Base" },
      period: { ar: "2022 — 2023", en: "2022 — 2023" },
      points: [
        { ar: "الإشراف على إنشاء مبانٍ جديدة، وأعمال التجديد والتشطيب للمباني القائمة داخل القاعدة.", en: "Supervised construction of new buildings and managed renovation and finishing works within the base." },
        { ar: "متابعة المقاولين واستلام الأعمال المنجزة، وقيادة فرق العمالة والأفراد في الموقع.", en: "Followed up contractors, inspected and accepted works, and led on-site labour and personnel teams." },
      ],
    },
    {
      role: { ar: "معماري ومشرف", en: "Architect & Supervisor" },
      company: { ar: "صديق ديزاينز", en: "Sedeeq Designs" },
      period: { ar: "2021 — 2022", en: "2021 — 2022" },
      points: [
        { ar: "تطوير مفاهيم التصميم الداخلي والرسومات التنفيذية.", en: "Developed interior design concepts and construction drawings." },
        { ar: "إعداد النماذج ثلاثية الأبعاد والصور الواقعية لعروض العملاء.", en: "Produced 3D models and renders for client presentations." },
        { ar: "الإشراف على التنفيذ في الموقع بما يطابق التصميم المعتمد.", en: "Supervised site execution to match the approved designs." },
      ],
    },
  ],

  education: [
    { title: { ar: "بكالوريوس العمارة — جامعة المنصورة", en: "Bachelor of Architecture — Mansoura University" }, period: "2016 — 2021" },
    { title: { ar: "الهيئة السعودية للمهندسين — العضوية قيد الإجراء", en: "Saudi Council of Engineers (SCE) — Membership in progress" }, period: "" },
  ],

  skills: [
    {
      group: { ar: "الإدارة والشق التجاري", en: "Management & Commercial" },
      items: [
        "Fit-Out Project Management", "Team Leadership", "Cost Estimation & Pricing", "Negotiation",
        "Value Engineering", "Variation Orders & Claims", "Progress Billing & Collections",
        "Client Acquisition & Business Development", "Subcontractor & Supplier Management",
        "Procurement & Material Delivery Scheduling", "Tendering", "Applying AI to Develop & Streamline Workflows",
      ],
    },
    {
      group: { ar: "الشق الفني", en: "Technical" },
      items: [
        "Woodwork, Joinery & Furniture Production", "Client Brief Development", "Design Coordination & Mood Boards",
        "Architectural Design & Construction Drawings", "Shop Drawing Review", "Material Submittals",
        "Specification Compliance & Disputes", "Mall Fit-Out Guidelines & Landlord Approvals",
        "MEP Coordination with Finishes", "Finishing Materials (Veneer, Acrylic, Paint, Hardware)",
        "QA/QC & Works Inspection", "Site Execution & Handover", "3D Modeling & Visualization",
        "Manual Sketching", "Architectural Photography",
      ],
    },
  ],

  software: [
    { group: { ar: "الإدارة والذكاء الاصطناعي", en: "Management & AI" }, items: ["Microsoft Excel", "Claude", "Claude in Excel", "Claude Code", "ChatGPT", "TickTick"] },
    { group: { ar: "التصميم والإظهار", en: "Design & Visualization" }, items: ["AutoCAD", "Revit", "3ds Max", "Photoshop", "Canva", "SketchUp", "V-Ray", "Corona", "Lumion", "Rhino", "Grasshopper"] },
  ],

  languages: [
    { name: { ar: "العربية", en: "Arabic" }, level: { ar: "اللغة الأم", en: "Native" } },
    { name: { ar: "الإنجليزية", en: "English" }, level: { ar: "بطلاقة", en: "Fluent" } },
    { name: { ar: "الإسبانية", en: "Spanish" }, level: { ar: "متوسط", en: "Intermediate" } },
  ],
};
