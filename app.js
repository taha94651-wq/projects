(function () {
  "use strict";

  let D;

  /* Saudi Arabia outline (Natural Earth 1:50m), lon/lat projected to an 800×680 box */
  const KSA_PATH = "M657.0,560.2 648.3,561.4 640.0,562.7 630.7,564.0 619.4,565.7 610.6,567.0 597.7,568.9 586.1,570.6 575.3,572.2 564.4,573.8 555.2,575.2 549.6,576.8 543.2,580.2 533.2,585.5 523.1,590.9 517.9,593.7 512.4,600.9 509.7,604.5 504.5,611.1 500.7,616.1 496.2,622.0 494.3,627.4 491.2,635.5 488.6,637.6 484.3,640.2 480.3,642.1 474.1,641.9 470.7,636.8 466.9,631.5 465.1,629.4 463.5,629.3 457.3,629.9 449.8,630.8 441.1,629.9 431.0,628.8 421.5,627.9 416.8,627.2 410.6,623.8 409.0,623.1 407.3,622.9 400.1,622.8 392.7,622.7 385.3,623.8 378.4,623.4 371.1,624.0 368.5,625.4 365.7,625.3 363.9,626.5 362.4,627.0 360.5,626.0 358.2,626.3 354.9,625.4 352.7,623.1 350.7,621.1 348.6,620.0 346.3,619.4 344.2,619.3 341.5,620.6 339.9,621.8 335.9,625.6 335.7,627.0 337.6,629.3 336.9,630.4 334.6,631.8 333.9,635.5 333.5,637.5 333.1,642.3 334.2,646.1 335.6,647.5 335.7,649.2 335.0,652.4 332.7,653.4 331.1,656.5 330.1,658.0 328.4,659.7 321.5,665.2 321.1,662.0 319.0,657.2 318.9,653.8 317.8,650.5 316.0,647.9 312.6,645.3 312.2,641.6 309.7,638.0 306.4,635.1 304.4,629.7 303.1,622.6 294.3,613.2 283.3,604.6 279.8,599.7 274.3,589.7 271.5,581.9 264.2,572.9 263.9,569.4 262.7,565.2 261.0,560.4 260.1,556.7 252.6,540.4 250.2,537.8 248.1,534.1 247.6,531.3 246.9,529.8 241.8,527.1 236.8,520.2 222.2,509.3 215.0,508.3 209.3,504.4 205.1,499.3 200.6,490.5 192.7,481.1 186.2,467.6 188.3,462.7 188.1,459.3 186.0,453.4 183.8,449.0 182.2,444.8 183.5,438.6 183.9,431.8 185.2,428.2 186.2,424.3 185.0,416.3 182.7,412.0 183.0,409.2 180.5,407.8 178.4,404.7 180.5,404.8 176.7,400.4 175.2,398.1 173.8,392.3 172.0,387.8 166.0,377.7 163.1,371.5 156.7,363.6 149.7,357.7 145.4,355.0 143.3,352.6 139.6,352.5 135.6,349.0 132.9,348.9 129.5,348.4 125.4,341.6 122.0,335.4 116.2,327.2 117.6,325.0 119.3,321.6 118.5,317.1 117.6,314.0 115.1,308.4 106.7,294.3 104.5,292.3 100.9,290.0 98.8,283.9 97.8,278.4 92.0,275.8 82.2,256.2 76.5,249.3 74.2,244.8 67.6,237.2 64.5,229.6 57.8,222.7 52.0,210.7 43.2,198.6 39.4,196.5 30.3,195.7 26.3,194.8 22.8,197.4 22.5,194.1 25.0,189.4 28.4,179.7 29.2,171.2 34.7,145.9 42.5,147.1 49.0,148.2 58.3,149.8 68.0,151.4 73.7,152.4 75.5,152.0 83.4,145.8 90.5,140.2 94.7,133.4 98.8,126.7 100.7,125.3 107.0,124.1 117.0,122.1 126.8,120.2 129.9,114.2 132.8,107.5 134.1,106.1 141.2,102.3 145.4,100.0 139.3,93.2 133.5,86.9 127.1,79.7 121.7,74.1 113.4,65.8 108.2,60.3 117.5,57.8 127.6,55.0 137.9,52.1 150.3,48.7 159.9,46.1 174.3,42.1 181.3,40.2 182.6,39.7 188.0,35.0 196.2,36.3 208.4,38.3 220.2,40.2 232.7,42.4 236.8,44.3 248.8,51.0 256.7,55.3 265.8,60.5 277.2,66.8 285.0,71.2 295.1,76.8 302.9,83.2 312.9,91.3 323.6,100.2 332.6,107.1 344.9,116.6 357.2,126.0 369.0,135.3 378.6,142.6 390.6,151.9 403.8,153.3 420.2,154.8 436.6,156.2 451.5,157.5 458.0,156.2 464.9,157.0 474.4,158.2 480.1,158.9 490.8,160.4 494.1,166.5 495.3,170.7 496.4,174.9 499.5,178.7 506.9,178.6 513.3,178.5 521.4,178.4 527.8,178.3 529.8,182.1 530.7,185.8 534.5,194.7 539.9,201.6 541.1,204.1 542.0,208.0 541.1,209.4 540.7,211.0 544.6,214.8 551.4,218.0 553.9,218.9 556.7,220.3 554.5,222.5 558.5,227.6 562.9,232.8 567.8,233.9 574.4,241.8 584.1,246.8 590.2,253.5 587.8,253.0 585.7,252.1 585.0,255.7 585.7,258.9 588.7,261.8 591.5,263.8 592.5,267.7 590.3,276.0 588.2,275.2 586.6,275.1 587.7,281.6 589.4,286.2 591.6,289.8 593.5,295.1 594.9,297.3 601.3,303.0 603.2,307.7 605.0,316.6 609.0,321.4 611.2,325.2 614.1,328.4 615.9,332.8 618.6,336.2 620.0,337.0 622.0,337.4 624.6,337.4 627.7,336.6 630.9,335.7 633.6,337.4 636.2,337.2 636.5,338.8 634.8,340.9 632.5,346.4 635.7,347.3 638.6,347.7 640.8,348.6 642.0,349.7 642.1,354.9 642.9,356.8 644.2,358.6 646.2,361.2 648.2,363.9 650.3,366.5 652.3,369.1 654.2,371.7 656.3,374.3 658.3,376.9 660.3,379.5 662.3,382.2 664.4,384.8 666.3,387.4 668.3,390.0 670.4,392.7 672.4,395.3 674.4,397.9 676.3,400.5 678.0,402.7 681.1,403.1 684.9,403.6 689.1,404.2 694.7,404.9 701.3,405.8 708.7,406.8 716.6,407.8 724.7,408.9 732.9,410.0 740.7,411.1 748.0,412.0 754.7,412.9 760.3,413.7 764.6,414.3 767.4,414.6 771.2,415.2 774.2,411.8 776.8,416.4 779.1,420.1 782.1,425.3 785.4,430.8 788.5,436.0 790.8,440.0 789.6,444.0 788.3,448.4 787.0,452.8 785.5,457.3 784.2,461.7 782.9,466.1 781.6,470.6 780.3,475.0 778.8,479.4 777.5,483.8 776.2,488.3 774.9,492.7 773.5,497.1 772.2,501.6 770.8,506.0 769.5,510.4 768.2,514.8 766.6,520.2 762.6,521.6 756.4,523.8 750.1,526.1 743.8,528.4 737.5,530.8 731.2,533.1 725.0,535.4 718.7,537.7 712.4,540.0 706.1,542.2 699.7,544.5 693.6,546.8 687.2,549.1 680.9,551.4 674.6,553.7 668.4,556.0 662.1,558.3 657.0,560.2ZM291.9,651.4 294.7,651.6 293.5,650.3 294.6,647.9 298.5,651.7 298.4,656.1 297.1,656.2 296.0,654.3 295.0,653.1 291.0,653.8 288.6,652.7 285.1,648.8 284.2,646.1 285.6,645.6 287.2,644.3 288.1,642.1 287.2,639.9 289.3,640.2 290.5,642.5 290.6,647.7 290.4,650.0 291.9,651.4ZM106.1,304.7 102.5,302.0 101.1,300.0 99.5,298.6 92.5,295.9 91.4,294.2 92.6,292.5 93.3,294.2 94.6,295.2 100.4,297.7 106.8,303.0 108.0,303.4 106.1,304.7ZM94.9,291.5 92.9,290.6 93.0,287.5 94.3,285.8 94.2,288.2 94.9,290.6Z";

  /* Fixed vocabularies — keys must match the select values in .pages.yml */
  const VOCAB = {
    cities: {
      riyadh: { en: "Riyadh", ar: "الرياض", xy: [465, 332], side: "r" },
      jeddah: { en: "Jeddah", ar: "جدة", xy: [189, 458], side: "l" },
      makkah: { en: "Makkah", ar: "مكة المكرمة", xy: [213, 463], side: "l" },
      madinah: { en: "Madinah", ar: "المدينة المنورة", xy: [205, 341], side: "l" },
      taif: { en: "Taif", ar: "الطائف", xy: [235, 469], side: "r" },
      hail: { en: "Hail", ar: "حائل", xy: [281, 219], side: "r" },
      buraydah: { en: "Buraydah", ar: "بريدة", xy: [367, 260], side: "r", dy: -4 },
      unaizah: { en: "Unaizah", ar: "عنيزة", xy: [363, 284], side: "l", dy: 6 },
      tabuk: { en: "Tabuk", ar: "تبوك", xy: [94, 185], side: "r" },
      dammam: { en: "Dammam", ar: "الدمام", xy: [588, 263], side: "r" },
      khobar: { en: "Al Khobar", ar: "الخبر", xy: [592, 269], side: "r", dy: 22 },
      abha: { en: "Abha", ar: "أبها", xy: [311, 591], side: "r" },
      najran: { en: "Najran", ar: "نجران", xy: [370, 620], side: "r" },
      jazan: { en: "Jazan", ar: "جازان", xy: [312, 644], side: "l" },
    },
    types: {
      retail: { ar: "متاجر", en: "Retail" },
      booths: { ar: "أجنحة وأكشاك", en: "Booths & Kiosks" },
      gym: { ar: "صالات رياضية", en: "Gyms" },
      residential: { ar: "سكني", en: "Residential" },
      offices: { ar: "مكاتب", en: "Offices" },
      hospitality: { ar: "ضيافة ومطاعم", en: "F&B & Hospitality" },
      events: { ar: "فعاليات", en: "Events" },
      urban: { ar: "عمراني وإسكان", en: "Urban & housing" },
      furniture: { ar: "أثاث", en: "Furniture" },
    },
    aiKinds: {
      images: { ar: "صور مولّدة", en: "Generated Images" },
      sheets: { ar: "شيتات", en: "Sheets" },
      workflows: { ar: "هيكلة المشاريع", en: "Project Structuring" },
    },
    results: {
      winner: { ar: "فوز", en: "Winner" },
      shortlisted: { ar: "ضمن القائمة القصيرة", en: "Shortlisted" },
      mention: { ar: "تنويه", en: "Honourable mention" },
      participation: { ar: "مشاركة", en: "Participation" },
    },
    status: {
      built: { ar: "تم التنفيذ", en: "Built" },
      progress: { ar: "قيد التنفيذ", en: "In progress" },
      concept: { ar: "تصميم فقط", en: "Design only" },
    },
    phases: [
      ["brief", { ar: "متطلبات العميل", en: "Client brief" }],
      ["moodboard", { ar: "لوحة المزاج", en: "Mood board" }],
      ["concept", { ar: "التصميم المبدئي", en: "Concept design" }],
      ["render", { ar: "3D وإظهار", en: "3D & Render" }],
      ["drawings", { ar: "رسومات تنفيذية", en: "Construction drawings" }],
      ["materials", { ar: "اختيار المواد", en: "Material selection" }],
      ["sampleboard", { ar: "السامبل بورد", en: "Sample board" }],
      ["pricing", { ar: "التسعير", en: "Pricing" }],
      ["supervision", { ar: "الإشراف على التنفيذ", en: "Site supervision" }],
      ["handover", { ar: "التسليم", en: "Handover" }],
    ],
  };
  const app = document.getElementById("app");
  const html = document.documentElement;

  /* ---------- UI strings ---------- */
  const UI = {
    en: {
      nav: { execution: "Execution", design: "Design", competition: "Competitions", photography: "Photography", ai: "AI Work", profile: "Profile", contact: "Contact" },
      all: "All", index: "Index", profile: "Profile", viewWork: "View work", downloadCv: "Download CV",
      execIntro: "Projects delivered on site — my role, the scope I owned and the time it took.",
      designIntro: "Design work — project type, year and my exact role in each.",
      compIntro: "Architecture competitions I entered, from student years onward.",
      photoIntro: "Architectural photography — how I read spaces, light and material through the lens.",
      aiIntro: "How I use AI in practice: generated visuals, automated sheets and structured project workflows.",
      experience: "Experience", about: "About", clients: "Key clients", skills: "Skills", software: "Software", languages: "Languages", education: "Education",
      client: "Client", location: "Location", year: "Year", duration: "Duration", role: "Role", type: "Type", discipline: "Discipline",
      scope: "Scope of work", branches: "Branches", branchMap: "Branch locations", company: "Firm", designer: "Design office", status: "Status", area: "Area", tools: "Tools", myRole: "My role — phases", overview: "Overview", backTo: "Back to index", next: "Next project", related: "Related",
      contactEyebrow: "Contact", letsTalk: "Let’s work together", email: "Email", phone: "Phone", whatsapp: "WhatsApp",
      based: "Based in", online: "Online", empty: "Projects coming soon.", open: "Open", placeholder: "Image placeholder",
      rights: "All rights reserved.", execution: "Execution", design: "Design", competition: "Competition", result: "Result",
    },
    ar: {
      nav: { execution: "التنفيذ", design: "التصميم", competition: "المسابقات", photography: "التصوير", ai: "الذكاء الاصطناعي", profile: "السيرة", contact: "تواصل" },
      all: "الكل", index: "الفهرس", profile: "نبذة", viewWork: "شاهد الأعمال", downloadCv: "تحميل السيرة الذاتية",
      execIntro: "مشاريع تم تنفيذها في الموقع — دوري، ونطاق العمل الذي توليته، والمدة.",
      designIntro: "أعمال التصميم — نوع المشروع وسنته ودوري بالتحديد في كل مشروع.",
      compIntro: "مسابقات معمارية شاركت فيها منذ سنوات الدراسة.",
      photoIntro: "التصوير المعماري — كيف أقرأ الفراغ والضوء والخامة من خلال العدسة.",
      aiIntro: "كيف أستخدم الذكاء الاصطناعي عمليًا: صور مولّدة، وشيتات مؤتمتة، وهيكلة سير عمل المشاريع.",
      experience: "الخبرات", about: "نبذة", clients: "أهم العملاء", skills: "المهارات", software: "البرامج", languages: "اللغات", education: "التعليم",
      client: "العميل", location: "الموقع", year: "السنة", duration: "المدة", role: "الدور", type: "النوع", discipline: "المجال",
      scope: "نطاق العمل", branches: "الفروع", branchMap: "مواقع الفروع", company: "الشركة", designer: "مكتب التصميم", status: "الحالة", area: "المساحة", tools: "البرامج", myRole: "دوري — المراحل", overview: "نظرة عامة", backTo: "العودة للفهرس", next: "المشروع التالي", related: "ذو صلة",
      contactEyebrow: "تواصل", letsTalk: "لنعمل معًا", email: "البريد", phone: "الهاتف", whatsapp: "واتساب",
      based: "المقر", online: "حسابات", empty: "المشاريع قريبًا.", open: "فتح", placeholder: "صورة مؤقتة",
      rights: "جميع الحقوق محفوظة.", execution: "التنفيذ", design: "التصميم", competition: "مسابقة", result: "النتيجة",
    },
  };

  /* ---------- State ---------- */
  const state = {
    lang: pickLang(),
    filters: { execution: "all", design: "all", competition: "all", ai: "all" },
    view: null,
    from: "execution",
  };

  function pickLang() {
    const q = new URLSearchParams(location.search).get("lang");
    if (q === "ar" || q === "en") return q;
    try {
      const s = localStorage.getItem("lang");
      if (s === "ar" || s === "en") return s;
    } catch (e) {}
    return (D && D.defaultLang) || "en";
  }

  /* ---------- Helpers ---------- */
  const t = (v) => (v == null ? "" : typeof v === "object" ? v[state.lang] || v.en || v.ar || "" : String(v));
  const u = () => UI[state.lang];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const T = (v) => esc(t(v));
  const pad = (n) => String(n).padStart(2, "0");
  const arrow = "→";

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  /* Architectural one-point-perspective placeholder */
  function placeholder(seed, label) {
    const r = hash(seed);
    const W = 1600, H = 1200;
    const bw = 520 + (r % 360), bh = 360 + ((r >> 8) % 260);
    const bx = 260 + ((r >> 4) % (W - bw - 520)), by = 260 + ((r >> 12) % (H - bh - 520));
    const g = "rgba(184,150,90,.55)", l = "rgba(239,235,228,.10)";
    let lines = "";
    const corners = [[0, 0, bx, by], [W, 0, bx + bw, by], [0, H, bx, by + bh], [W, H, bx + bw, by + bh]];
    corners.forEach(([x1, y1, x2, y2]) => (lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${g}" stroke-width="1.4"/>`));
    for (let i = 1; i < 8; i++) {
      const k = i / 8;
      const fx = bx + bw * k;
      lines += `<line x1="${W * k}" y1="${H}" x2="${fx}" y2="${by + bh}" stroke="${l}"/>`;
    }
    for (let i = 1; i < 5; i++) {
      const k = Math.pow(i / 5, 1.6);
      const y = by + bh + (H - by - bh) * k;
      const xl = bx - bx * k, xr = bx + bw + (W - bx - bw) * k;
      lines += `<line x1="${xl}" y1="${y}" x2="${xr}" y2="${y}" stroke="${l}"/>`;
    }
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
      `<defs><radialGradient id="g" cx="${(bx + bw / 2) / W}" cy="${(by + bh / 2) / H}" r=".9"><stop offset="0" stop-color="#262420"/><stop offset="1" stop-color="#0d0d0c"/></radialGradient></defs>` +
      `<rect width="${W}" height="${H}" fill="url(#g)"/>${lines}` +
      `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="rgba(239,235,228,.035)" stroke="${g}" stroke-width="1.4"/>` +
      `<text x="48" y="${H - 48}" fill="rgba(239,235,228,.45)" font-family="Helvetica, Arial, sans-serif" font-size="26" letter-spacing="4">${esc(label).toUpperCase()}</text>` +
      `</svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  const img = (src, seed, label) => src || placeholder(seed, label || u().placeholder);
  const cover = (p) => img(p.cover || (p.media.find((m) => m.type === "image" && m.src) || {}).src, p.id, t(p.title));

  const projectsIn = (disc) => D.projects.filter((p) => p.disciplines.includes(disc));

  /* ---------- Nav & menu ---------- */
  const sections = ["execution", "design", "competition", "photography", "ai", "profile", "contact"];

  function renderChrome() {
    html.lang = state.lang;
    html.dir = state.lang === "ar" ? "rtl" : "ltr";
    document.querySelector(".nav__brand").textContent = t(D.profile.name);
    document.getElementById("navLinks").innerHTML = sections.map((s) => `<a href="#${s}">${esc(u().nav[s])}</a>`).join("");
    document.getElementById("langBtn").textContent = state.lang === "ar" ? "EN" : "عربي";

    let menu = document.querySelector(".menu");
    if (!menu) {
      menu = document.createElement("div");
      menu.className = "menu";
      document.body.appendChild(menu);
      menu.addEventListener("click", (e) => e.target.closest("a") && document.body.classList.remove("menu-open"));
    }
    menu.innerHTML = sections.map((s, i) => `<a href="#${s}"><small>${pad(i + 1)}</small>${esc(u().nav[s])}</a>`).join("");
  }

  document.getElementById("langBtn").addEventListener("click", () => {
    state.lang = state.lang === "ar" ? "en" : "ar";
    try { localStorage.setItem("lang", state.lang); } catch (e) {}
    const url = new URL(location.href);
    url.searchParams.set("lang", state.lang);
    history.replaceState(null, "", url);
    const y = window.scrollY;
    state.view = null;
    route(true);
    window.scrollTo(0, y);
  });
  document.getElementById("menuBtn").addEventListener("click", () => document.body.classList.toggle("menu-open"));

  /* ---------- Home ---------- */
  function heroHTML() {
    const P = D.profile;
    const name = t(P.name).split(" ");
    // two lines in both languages so the name keeps the same proportion
    const nameHTML = `<span>${esc(name[0])}</span><span class="line-2">${esc(name.slice(1).join(" "))}</span>`;
    const [role, rest] = t(P.title).split("|").map((s) => s.trim());
    const portrait = P.photoLarge
      ? `<figure class="hero__portrait--edge" aria-hidden="true"><img src="${esc(P.photoLarge)}" alt="" /></figure>`
      : "";
    return `
    <section class="hero${portrait ? " hero--portrait" : ""}" id="top">
      <div class="wrap hero__text">
        <div class="hero__meta eyebrow reveal"><span>${T(P.title)}</span><span>${T(P.location)}</span></div>
        <h1 class="hero__name reveal">${nameHTML}</h1>
        <div class="hero__role reveal">
          <p class="hero__title">${esc(role)}${rest ? ` <em>/ ${esc(rest)}</em>` : ""}</p>
          <p class="hero__summary">${T(P.summary)}</p>
          <div class="hero__cta">
            <a class="btn btn--solid" href="#execution">${esc(u().viewWork)} <span>${arrow}</span></a>
            ${P.cv ? `<a class="btn" href="${esc(P.cv)}" download>${esc(u().downloadCv)}</a>` : ""}
          </div>
        </div>
      </div>
      ${portrait}
      ${P.heroImage ? `<figure class="bleed" style="margin:0; grid-column: 1 / -1"><img data-parallax src="${esc(P.heroImage)}" alt="" /></figure>` : ""}
    </section>`;
  }


  function sectionHead(no, id, title, count, intro) {
    return `
      <header class="section-head reveal">
        <span class="eyebrow">${pad(no)} — ${esc(u().index)}</span>
        <h2>${esc(title)}${count != null ? `<sup>(${count})</sup>` : ""}</h2>
        ${intro ? `<p class="section-intro">${esc(intro)}</p>` : ""}
      </header>`;
  }

  function filtersHTML(key, options) {
    return `<div class="filters" data-filter="${key}">${options
      .map((o) => `<button type="button" data-val="${o.id}" aria-pressed="${state.filters[key] === o.id}">${esc(o.label)}<sup>${o.count}</sup></button>`)
      .join("")}</div>`;
  }

  function typeOptions(list) {
    const opts = [{ id: "all", label: u().all, count: list.length }];
    Object.keys(D.types).forEach((k) => {
      const c = list.filter((p) => p.type === k).length;
      if (c) opts.push({ id: k, label: t(D.types[k]), count: c });
    });
    return opts;
  }

  function rowsHTML(disc) {
    const list = projectsIn(disc).filter((p) => state.filters[disc] === "all" || p.type === state.filters[disc]);
    if (!list.length) return `<li class="empty">${esc(u().empty)}</li>`;
    return list
      .map((p, i) => {
        const c3 = disc === "execution" ? t(p.duration) || t(p.year) : t(p.year);
        if (disc === "competition") {
          const res = t(D.results[p.result]);
          const hi = p.result && p.result !== "participation";
          return `
        <li>
          <a class="row" href="#/p/${esc(p.id)}" data-img="${esc(cover(p))}" data-from="${disc}">
            <span class="row__no">${pad(i + 1)}</span>
            <span class="row__thumb"><img loading="lazy" src="${esc(cover(p))}" alt="" /></span>
            <span class="row__title"><bdi>${T(p.title)}</bdi></span>
            <span class="row__cell${hi ? " row__cell--hi" : ""}">${esc(res) || "—"}</span>
            <span class="row__cell row__cell--loc">${T(p.location) || "—"}</span>
            <span class="row__cell">${esc(t(p.year))}</span>
            <span class="row__sub">${esc(res)}${t(p.year) ? ` · ${esc(t(p.year))}` : ""}</span>
            <span class="row__arrow">${arrow}</span>
          </a>
        </li>`;
        }
        return `
        <li>
          <a class="row" href="#/p/${esc(p.id)}" data-img="${esc(cover(p))}" data-from="${disc}">
            <span class="row__no">${pad(i + 1)}</span>
            <span class="row__thumb"><img loading="lazy" src="${esc(cover(p))}" alt="" /></span>
            <span class="row__title"><bdi>${T(p.title)}</bdi></span>
            <span class="row__cell">${T(D.types[p.type])}</span>
            <span class="row__cell row__cell--loc">${T(p.location) || "—"}</span>
            <span class="row__cell">${T(p.role)}${c3 ? ` · ${esc(c3)}` : ""}</span>
            <span class="row__sub">${T(D.types[p.type])} · ${T(p.role)}</span>
            <span class="row__arrow">${arrow}</span>
          </a>
        </li>`;
      })
      .join("");
  }

  function workSection(no, disc, intro) {
    const list = projectsIn(disc);
    return `
    <section class="section wrap" id="${disc}">
      ${sectionHead(no, disc, disc === "competition" ? u().nav.competition : u()[disc], list.length, intro)}
      ${disc === "competition" ? "" : filtersHTML(disc, typeOptions(list))}
      <ol class="index" data-list="${disc}">${rowsHTML(disc)}</ol>
    </section>`;
  }

  function aiCards() {
    const list = D.ai.filter((a) => state.filters.ai === "all" || a.kind === state.filters.ai);
    if (!list.length) return `<div class="ai-card"><p>${esc(u().empty)}</p></div>`;
    return list
      .map((a, i) => {
        const src = img(a.src, "ai-" + i + a.kind, t(D.aiKinds[a.kind]));
        const series = (a.gallery || []).filter(Boolean);
        const media = series.length
          ? `<div class="ai-series">${series.map((g, k) => `<figure class="ai-series__item" data-zoom="${esc(g)}" data-cap="${T(a.title)} — ${pad(k + 1)}"><img loading="lazy" src="${esc(g)}" alt="${T(a.title)} — ${pad(k + 1)}" /></figure>`).join("")}</div>`
          : `<div class="ai-card__media" data-zoom="${esc(src)}"><img loading="lazy" src="${esc(src)}" alt="${T(a.title)}" /></div>`;
        return `
      <article class="ai-card reveal${series.length ? " ai-card--series" : ""}">
        ${media}
        <span class="eyebrow gold">${T(D.aiKinds[a.kind])}</span>
        <h3>${T(a.title)}</h3>
        <p>${T(a.desc)}</p>
        <div class="ai-card__foot">
          <div class="tags">${(a.tools || []).map((x) => `<span class="tag">${esc(x)}</span>`).join("")}</div>
          ${a.link ? `<a href="${esc(a.link)}" target="_blank" rel="noopener">${esc(u().open)} ↗</a>` : ""}
        </div>
      </article>`;
      })
      .join("");
  }

  function photoSection(no) {
    const list = D.photos || [];
    // editorial rhythm: wide + tall, three squares, tall + wide
    const pattern = ["w7", "t5", "s4", "s4", "s4", "t5", "w7"];
    const items = (list.length ? list : [{}, {}, {}, {}, {}, {}, {}])
      .map((ph, i) => {
        const src = img(ph.src, "photo-" + i, u().nav.photography + " " + pad(i + 1));
        const label = [T(ph.title), [T(ph.location), esc(ph.year || "")].filter(Boolean).join(", ")].filter(Boolean).join(" — ");
        return `<figure class="ph ph--${pattern[i % pattern.length]} unveil">
          <div class="frame" data-zoom="${esc(src)}" data-cap="${label}"><div class="zoom"><img loading="lazy" src="${esc(src)}" alt="${label || esc(u().nav.photography)}" /></div></div>
          ${label ? `<figcaption><span>${pad(i + 1)}</span>${label}</figcaption>` : ""}
        </figure>`;
      })
      .join("");
    return `
    <section class="section wrap" id="photography">
      ${sectionHead(no, "photography", u().nav.photography, list.length || null, u().photoIntro)}
      <div class="photo-grid">${items}</div>
    </section>`;
  }

  function aiSection(no) {
    const opts = [{ id: "all", label: u().all, count: D.ai.length }].concat(
      Object.keys(D.aiKinds)
        .map((k) => ({ id: k, label: t(D.aiKinds[k]), count: D.ai.filter((a) => a.kind === k).length }))
        .filter((o) => o.count)
    );
    return `
    <section class="section wrap" id="ai">
      ${sectionHead(no, "ai", u().nav.ai, D.ai.length, u().aiIntro)}
      ${filtersHTML("ai", opts)}
      <div class="ai-grid" data-list="ai">${aiCards()}</div>
    </section>`;
  }

  function profileSection(no) {
    const exp = D.experience
      .map(
        (e, i) => `
      <details class="exp"${i === 0 ? " open" : ""}>
        <summary>
          <span class="exp__period">${T(e.period)}</span>
          <span class="exp__role">${T(e.role)}<small>${T(e.company)}</small></span>
          <span class="exp__toggle" aria-hidden="true"></span>
        </summary>
        <ul>${e.points.map((p) => `<li>${T(p)}</li>`).join("")}</ul>
      </details>`
      )
      .join("");
    const skills = D.skills.map((g) => `<div class="col"><h3>${T(g.group)}</h3><ul class="plain">${g.items.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>`).join("");
    const soft = D.software
      .map((g) => `<div class="col"><h3>${T(g.group)}</h3><div class="chips">${g.items.map((s) => `<span${/claude|chatgpt/i.test(s) ? ' class="ai"' : ""}>${esc(s)}</span>`).join("")}</div></div>`)
      .join("");
    const clients = (D.clients || [])
      .map((c) => `<li><span class="client__name"><bdi>${T(c.name)}</bdi></span>${T(c.sector) ? `<span class="client__sector">${T(c.sector)}</span>` : ""}</li>`)
      .join("");
    const langs = D.languages.map((l) => `<li class="kv"><span>${T(l.name)}</span><span>${T(l.level)}</span></li>`).join("");
    const edu = D.education.map((e) => `<li class="kv"><span>${T(e.title)}</span><span>${esc(e.period || "")}</span></li>`).join("");

    return `
    <section class="section light" id="profile">
      <div class="wrap">
        ${sectionHead(no, "profile", u().nav.profile, null, null)}
        <div class="profile-grid">
          ${D.profile.photo ? `<div class="block reveal"><span class="eyebrow">${esc(u().about)}</span><div class="block__body about">
            <img class="about__photo" src="${esc(D.profile.photo)}" alt="${T(D.profile.name)}" width="164" height="164" />
            <div><p class="about__name">${T(D.profile.name)}</p><p class="about__meta">${T(D.profile.title)} · ${T(D.profile.location)}</p></div>
          </div></div>` : ""}
          ${clients ? `<div class="block reveal"><span class="eyebrow">${esc(u().clients)}</span><div class="block__body"><ul class="clients">${clients}</ul></div></div>` : ""}
          <div class="block reveal"><span class="eyebrow">${esc(u().experience)}</span><div class="block__body exp-list">${exp}</div></div>
          <div class="block reveal"><span class="eyebrow">${esc(u().skills)}</span><div class="block__body cols">${skills}</div></div>
          <div class="block reveal"><span class="eyebrow">${esc(u().software)}</span><div class="block__body cols">${soft}</div></div>
          <div class="block reveal"><span class="eyebrow">${esc(u().languages)} / ${esc(u().education)}</span>
            <div class="block__body cols"><ul class="plain">${langs}</ul><ul class="plain">${edu}</ul></div></div>
        </div>
      </div>
    </section>`;
  }

  function contactSection() {
    const P = D.profile;
    return `
    <section class="contact wrap" id="contact">
      <span class="eyebrow">${esc(u().contactEyebrow)}</span>
      <a class="contact__big reveal" href="mailto:${esc(P.email)}"><span>${esc(u().letsTalk)}</span>${esc(P.email)}</a>
      <div class="contact__grid">
        <div><span class="eyebrow">${esc(u().phone)}</span><a href="tel:${esc(P.phone.replace(/\s/g, ""))}" dir="ltr">${esc(P.phone)}</a></div>
        <div><span class="eyebrow">${esc(u().whatsapp)}</span><a href="https://wa.me/${esc(P.whatsapp)}" target="_blank" rel="noopener">wa.me/${esc(P.whatsapp)} ↗</a></div>
        <div><span class="eyebrow">${esc(u().based)}</span><span>${T(P.location)}</span></div>
        <div><span class="eyebrow">${esc(u().online)}</span>${P.socials.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join("")}</div>
      </div>
      ${P.cv ? `<p style="margin-top:32px"><a class="btn btn--solid" href="${esc(P.cv)}" download>${esc(u().downloadCv)} ↓</a></p>` : ""}
      <footer class="footer" style="background:none"><span>© ${new Date().getFullYear()} ${T(P.name)}. ${esc(u().rights)}</span><a href="#top">↑</a></footer>
    </section>`;
  }

  function renderHome() {
    document.title = `${t(D.profile.name)} — ${t(D.profile.title).split("|")[0].trim()}`;
    app.innerHTML =
      heroHTML() +
      workSection(1, "execution", u().execIntro) +
      workSection(2, "design", u().designIntro) +
      workSection(3, "competition", u().compIntro) +
      photoSection(4) +
      aiSection(5) +
      profileSection(6) +
      contactSection();
    state.view = "home";
  }

  /* ---------- Project page ---------- */
  function renderProject(id) {
    const p = D.projects.find((x) => x.id === id);
    if (!p) return (location.hash = "#execution");
    const from = p.disciplines.includes(state.from) ? state.from : p.disciplines[0];
    const pool = projectsIn(from);
    const next = pool[(pool.indexOf(p) + 1) % pool.length];

    const meta = [
      [u().discipline, p.disciplines.map((d) => u()[d]).join(" + ")],
      [u().type, t(D.types[p.type])],
      [u().client, t(p.client)],
      [u().designer, t(p.designer)],
      [u().company, t(p.company)],
      [u().location, t(p.location)],
      [u().year, t(p.year)],
      [u().duration, t(p.duration)],
      [u().role, t(p.role)],
      [u().result, t(D.results[p.result])],
      [u().status, t(D.status[p.status])],
      [u().area, t(p.area)],
      [u().tools, (p.tools || []).join(" · ")],
    ].filter((m) => m[1]);

    const done = new Set(p.phases || []);
    const phases = done.size
      ? `<span class="eyebrow">${esc(u().myRole)}</span>
        <ol class="phases reveal">${VOCAB.phases
          .map(([k, label], i) => `<li class="${done.has(k) ? "on" : ""}"><span>${pad(i + 1)}</span>${esc(t(label))}</li>`)
          .join("")}</ol>`
      : "";

    const media = p.media.length ? p.media : [{ type: "image", src: "" }];
    let chapter = 0, halves = 0, thirds = 0, shot = 0;
    const gallery = media
      .map((m, i) => {
        // full = edge-to-edge cinematic, wide = contained, half = paired & staggered
        const size = m.size || (i === 0 ? "full" : (media.length - 1) % 2 === 1 && i === media.length - 1 ? "wide" : "half");
        let head = "";
        if (T(m.section)) {
          halves = 0;
          thirds = 0;
          head = `<header class="chapter reveal"><span class="chapter__no">${pad(++chapter)}</span><h2>${T(m.section)}</h2></header>`;
        }
        halves = size === "half" ? halves + 1 : 0;
        thirds = size === "third" ? thirds + 1 : 0;
        const offset = (size === "half" && halves % 2 === 0) || (size === "third" && thirds % 3 === 2);
        const capText = T(m.caption);
        const cap = capText ? `<figcaption><span>${pad(++shot)}</span>${capText}</figcaption>` : "";
        let inner;
        if (m.type === "video")
          inner = `<div class="frame frame--video"><video src="${esc(m.src)}"${m.poster ? ` poster="${esc(m.poster)}"` : ""} autoplay muted loop playsinline controls preload="metadata"></video></div>`;
        else if (m.type === "link")
          return `${head}<div class="shot shot--link"><a class="btn" href="${esc(m.src)}">${capText} <span>${state.lang === "ar" ? "←" : "→"}</span></a></div>`;
        else if (m.type === "pdf")
          inner = `<a class="frame frame--pdf" href="${esc(m.src)}" target="_blank" rel="noopener"><div class="zoom"><img loading="lazy" src="${esc(m.poster || "")}" alt="${capText || T(p.title)}" /></div><span class="pdf-badge">PDF ↗</span></a>`;
        else if (m.type === "youtube") inner = `<iframe src="https://www.youtube-nocookie.com/embed/${esc(m.youtube || m.id)}" title="${T(p.title)}" allowfullscreen loading="lazy"></iframe>`;
        else {
          const src = img(m.src, p.id + "-" + i, t(p.title) + " — " + pad(i + 1));
          inner = `<div class="frame" data-zoom="${esc(src)}" data-cap="${capText}"><div class="zoom"><img loading="lazy" ${size === "full" ? "data-parallax " : ""}src="${esc(src)}" alt="${capText || T(p.title)}" /></div></div>`;
        }
        return `${head}<figure class="shot shot--${size}${offset ? " shot--offset" : ""} unveil">${inner}${cap}</figure>`;
      })
      .join("");

    const kicker = [p.disciplines.map((d) => u()[d]).join(" + "), t(D.types[p.type]), t(p.year)].filter(Boolean).join(" · ");
    const back = `<a class="pj__back" href="#${from}"><span>${state.lang === "ar" ? "→" : "←"}</span>${esc(u().backTo)}</a>`;
    const nextHTML =
      next && next !== p
        ? `<a class="next" href="#/p/${esc(next.id)}">
            <span class="next__media"><img loading="lazy" data-parallax src="${esc(cover(next))}" alt="" /></span>
            <span class="next__text wrap"><span class="eyebrow">${esc(u().next)}</span><strong><bdi>${T(next.title)}</bdi> ${state.lang === "ar" ? "←" : "→"}</strong></span>
          </a>`
        : "";

    // optional companion page (e.g. design page <-> design & build page)
    const rel = p.related && D.projects.find((x) => x.id === p.related);
    const relHTML = rel
      ? `<a class="next next--related" href="#/p/${esc(rel.id)}">
            <span class="next__media"><img loading="lazy" data-parallax src="${esc(cover(rel))}" alt="" /></span>
            <span class="next__text wrap"><span class="eyebrow">${esc(t(p.relatedLabel) || u().related)}</span><strong><bdi>${T(rel.title)}</bdi> ${state.lang === "ar" ? "←" : "→"}</strong></span>
          </a>`
      : "";

    document.title = `${t(p.title)} — ${t(D.profile.name)}`;
    app.innerHTML = `
    <article class="pj">
      <header class="pj-hero">
        <div class="pj-hero__media">${
          p.coverVideo
            ? `<video data-parallax src="${esc(p.coverVideo)}" poster="${esc(cover(p))}" autoplay muted loop playsinline preload="metadata"></video>`
            : `<img data-parallax src="${esc(cover(p))}" alt="${T(p.title)}" />`
        }</div>
        <div class="pj-hero__text wrap">
          ${back}
          <span class="eyebrow">${esc(kicker)}</span>
          <h1 class="pj__title"><bdi>${T(p.title)}</bdi></h1>
        </div>
      </header>
      <div class="wrap">
        <dl class="titleblock reveal">${meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd><bdi>${esc(v)}</bdi></dd></div>`).join("")}</dl>
      </div>
      <div class="wrap pj__body">
        ${T(p.summary) ? `<span class="eyebrow">${esc(u().overview)}</span><p class="pj__summary reveal">${T(p.summary)}</p>` : ""}
        ${p.scope && p.scope.length ? `<span class="eyebrow">${esc(u().scope)}</span><div class="pj__scope reveal"><ul>${p.scope.map((s) => `<li>${T(s)}</li>`).join("")}</ul></div>` : ""}
        ${branchesHTML(p)}
        ${phases}
      </div>
      <div class="gallery">${gallery}</div>
      ${relHTML}
      ${nextHTML}
      ${contactSection()}
    </article>`;
    state.view = "project:" + id;
  }

  /* Branch list + line map of Saudi Arabia with each city's branches */
  function branchesHTML(p) {
    const list = (p.branches || []).filter((b) => t(b.name));
    if (!list.length) return "";
    const cityName = (c) => (VOCAB.cities[c] ? t(VOCAB.cities[c]) : "");
    const items = list.map((b) => {
      const where = [t(b.place), cityName(b.city)].filter(Boolean).join(state.lang === "ar" ? "، " : ", ");
      return `<li><bdi>${esc(t(b.name))}${where ? ` <span class="muted">— ${esc(where)}</span>` : ""}</bdi></li>`;
    }).join("");
    const groups = {};
    list.forEach((b) => { if (VOCAB.cities[b.city]) (groups[b.city] = groups[b.city] || []).push(b); });
    const keys = Object.keys(groups);
    let map = "";
    if (keys.length) {
      const pins = keys.map((c) => {
        const C = VOCAB.cities[c], [x, y] = C.xy, n = groups[c].length;
        const left = C.side === "l", tx = left ? x - 22 : x + 22, ty = y + (C.dy || 0) + 5;
        const anchor = left ? "end" : "start";
        const names = groups[c].map((b, i) => `<text class="smap__name" x="${tx}" y="${ty + 19 + i * 17}" text-anchor="${anchor}">${esc(t(b.place) || t(b.name))}</text>`).join("");
        return `<g class="smap__city">
          <circle class="smap__halo" cx="${x}" cy="${y}" r="${15 + n * 2}" />
          <circle class="smap__dot" cx="${x}" cy="${y}" r="${9 + n}" />
          <text class="smap__count" x="${x}" y="${y + 4.5}" text-anchor="middle">${n}</text>
          <text class="smap__label" x="${tx}" y="${ty}" text-anchor="${anchor}">${esc(cityName(c))}</text>
          ${names}
        </g>`;
      }).join("");
      map = `<span class="eyebrow">${esc(u().branchMap)}</span>
        <figure class="smap reveal" aria-label="${esc(u().branchMap)}">
          <svg viewBox="-60 10 900 680" role="img"><path class="smap__land" d="${KSA_PATH}" /><text class="smap__sea" x="70" y="560" transform="rotate(52 70 560)">${state.lang === "ar" ? "البحر الأحمر" : "RED SEA"}</text><text class="smap__sea" x="640" y="190" transform="rotate(38 640 190)">${state.lang === "ar" ? "الخليج العربي" : "ARABIAN GULF"}</text>${pins}</svg>
        </figure>`;
    }
    return `<span class="eyebrow">${esc(u().branches)}</span><div class="pj__scope reveal"><ul>${items}</ul></div>${map}`;
  }

  /* ---------- Router ---------- */
  function route(force) {
    const h = location.hash;
    if (h === "#/admin") return location.replace("https://app.pagescms.org/");
    renderChrome();
    if (h.startsWith("#/p/")) {
      const id = decodeURIComponent(h.slice(4));
      if (force || state.view !== "project:" + id) {
        renderProject(id);
        window.scrollTo(0, 0);
      }
    } else {
      const wasHome = state.view === "home";
      if (force || !wasHome) renderHome();
      const target = h.length > 1 && document.getElementById(h.slice(1));
      if (target && !force) target.scrollIntoView({ behavior: wasHome ? "smooth" : "auto" });
      else if (!wasHome && !target) window.scrollTo(0, 0);
    }
    enhance();
  }
  window.addEventListener("hashchange", () => route(false));

  /* ---------- Interactions ---------- */
  let io;
  function enhance() {
    if (io) io.disconnect();
    io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
      { rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".reveal:not(.in), .unveil:not(.in)").forEach((el) => io.observe(el));
  }

  // filters (delegated)
  app.addEventListener("click", (e) => {
    const b = e.target.closest(".filters button");
    if (b) {
      const key = b.parentElement.dataset.filter;
      state.filters[key] = b.dataset.val;
      b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
      const list = app.querySelector(`[data-list="${key}"]`);
      list.innerHTML = key === "ai" ? aiCards() : rowsHTML(key);
      enhance();
      return;
    }
    const row = e.target.closest(".row");
    if (row) state.from = row.dataset.from;
    const z = e.target.closest("[data-zoom]");
    if (z) openLightbox(z);
  });

  // hover image that follows cursor
  const ci = document.getElementById("cursorImg");
  const ciImg = ci.querySelector("img");
  let mx = 0, my = 0, cx = 0, cy = 0, raf = 0;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine) {
    app.addEventListener("mouseover", (e) => {
      const row = e.target.closest(".row");
      if (row) {
        if (ciImg.getAttribute("src") !== row.dataset.img) ciImg.src = row.dataset.img;
        ci.classList.add("on");
      }
    });
    app.addEventListener("mouseout", (e) => {
      const row = e.target.closest(".row");
      if (row && !row.contains(e.relatedTarget)) ci.classList.remove("on");
    });
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    });
  }
  function loop() {
    cx += (mx - cx) * 0.18;
    cy += (my - cy) * 0.18;
    const side = cx > innerWidth * 0.55 ? "calc(-100% - 32px)" : "32px";
    ci.style.transform = `translate(${cx}px, ${cy}px) translate(${side}, -50%) scale(${ci.classList.contains("on") ? 1 : 0.9})`;
    raf = Math.abs(mx - cx) + Math.abs(my - cy) > 0.5 ? requestAnimationFrame(loop) : 0;
  }

  // parallax on full-bleed images
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) {
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        document.querySelectorAll("[data-parallax]").forEach((el) => {
          const r = el.parentElement.getBoundingClientRect();
          if (r.bottom < 0 || r.top > innerHeight) return;
          const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
          el.style.transform = `translateY(${-6 + p * -8}%)`;
        });
        ticking = false;
      });
    }, { passive: true });
  }

  // lightbox — full-screen viewer with previous / next
  const lb = document.getElementById("lightbox");
  const lbImg = lb.querySelector("img");
  lb.insertAdjacentHTML(
    "beforeend",
    `<button class="lightbox__nav lightbox__prev" type="button" aria-label="Previous">‹</button>
     <button class="lightbox__nav lightbox__next" type="button" aria-label="Next">›</button>
     <div class="lightbox__bar"><span class="lightbox__count"></span><span class="lightbox__cap"></span></div>`
  );
  let lbItems = [], lbIndex = 0;
  function showLightbox(i) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    const it = lbItems[lbIndex];
    lbImg.classList.add("swap");
    setTimeout(() => {
      lbImg.src = it.dataset.zoom;
      lbImg.onload = () => lbImg.classList.remove("swap");
    }, 180);
    lb.querySelector(".lightbox__count").textContent = lbItems.length > 1 ? `${pad(lbIndex + 1)} / ${pad(lbItems.length)}` : "";
    lb.querySelector(".lightbox__cap").textContent = it.dataset.cap || "";
    lb.classList.toggle("single", lbItems.length < 2);
  }
  function openLightbox(el) {
    const scope = el.closest(".gallery, .ai-grid, .photo-grid") || app;
    lbItems = [...scope.querySelectorAll("[data-zoom]")];
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    showLightbox(Math.max(0, lbItems.indexOf(el)));
  }
  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = "";
  }
  lb.querySelector(".lightbox__prev").addEventListener("click", (e) => { e.stopPropagation(); showLightbox(lbIndex - 1); });
  lb.querySelector(".lightbox__next").addEventListener("click", (e) => { e.stopPropagation(); showLightbox(lbIndex + 1); });
  lbImg.addEventListener("click", (e) => { e.stopPropagation(); showLightbox(lbIndex + 1); });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    const fwd = html.dir === "rtl" ? "ArrowLeft" : "ArrowRight";
    const bwd = html.dir === "rtl" ? "ArrowRight" : "ArrowLeft";
    if (e.key === fwd) showLightbox(lbIndex + 1);
    if (e.key === bwd) showLightbox(lbIndex - 1);
  });
  lb.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeLightbox(); document.body.classList.remove("menu-open"); }
  });

  function boot() {
    route(true);
    // honour an initial section hash (e.g. #contact)
    if (location.hash.length > 1 && !location.hash.startsWith("#/")) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView();
    }
  }

  const load = (f) => fetch(f, { cache: "no-cache" }).then((r) => {
    if (!r.ok) throw new Error(f + " " + r.status);
    return r.json();
  });
  Promise.all([load("content/site.json"), load("content/projects.json"), load("content/ai.json"), load("content/photos.json").catch(() => ({}))])
    .then(([site, pj, ai, ph]) => {
      D = Object.assign({}, site, VOCAB, { projects: pj.projects || [], ai: ai.items || [], photos: ph.items || [] });
      state.lang = pickLang();
      boot();
    })
    .catch((err) => {
      console.error(err);
      app.innerHTML = '<p style="padding:120px 24px">Content failed to load. Please refresh.</p>';
    });
})();
