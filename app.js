(function () {
  "use strict";

  let D;

  /* Fixed vocabularies — keys must match the select values in .pages.yml */
  const VOCAB = {
    types: {
      retail: { ar: "متاجر", en: "Retail" },
      gym: { ar: "صالات رياضية", en: "Gyms" },
      residential: { ar: "سكني", en: "Residential" },
      offices: { ar: "مكاتب", en: "Offices" },
      hospitality: { ar: "ضيافة ومطاعم", en: "F&B & Hospitality" },
      events: { ar: "فعاليات", en: "Events" },
    },
    aiKinds: {
      images: { ar: "صور مولّدة", en: "Generated Images" },
      sheets: { ar: "شيتات", en: "Sheets" },
      workflows: { ar: "هيكلة المشاريع", en: "Project Structuring" },
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
      nav: { execution: "Execution", design: "Design", ai: "AI Work", profile: "Profile", contact: "Contact" },
      all: "All", index: "Index", profile: "Profile", viewWork: "View work", downloadCv: "Download CV",
      execIntro: "Projects delivered on site — my role, the scope I owned and the time it took.",
      designIntro: "Design work — project type, year and my exact role in each.",
      aiIntro: "How I use AI in practice: generated visuals, automated sheets and structured project workflows.",
      experience: "Experience", skills: "Skills", software: "Software", languages: "Languages", education: "Education",
      client: "Client", location: "Location", year: "Year", duration: "Duration", role: "Role", type: "Type", discipline: "Discipline",
      scope: "Scope of work", status: "Status", area: "Area", tools: "Tools", myRole: "My role — phases", overview: "Overview", backTo: "Back to index", next: "Next project",
      contactEyebrow: "Contact", letsTalk: "Let’s work together", email: "Email", phone: "Phone", whatsapp: "WhatsApp",
      based: "Based in", online: "Online", empty: "Projects coming soon.", open: "Open", placeholder: "Image placeholder",
      rights: "All rights reserved.", execution: "Execution", design: "Design",
    },
    ar: {
      nav: { execution: "التنفيذ", design: "التصميم", ai: "الذكاء الاصطناعي", profile: "السيرة", contact: "تواصل" },
      all: "الكل", index: "الفهرس", profile: "نبذة", viewWork: "شاهد الأعمال", downloadCv: "تحميل السيرة الذاتية",
      execIntro: "مشاريع تم تنفيذها في الموقع — دوري، ونطاق العمل الذي توليته، والمدة.",
      designIntro: "أعمال التصميم — نوع المشروع وسنته ودوري بالتحديد في كل مشروع.",
      aiIntro: "كيف أستخدم الذكاء الاصطناعي عمليًا: صور مولّدة، وشيتات مؤتمتة، وهيكلة سير عمل المشاريع.",
      experience: "الخبرات", skills: "المهارات", software: "البرامج", languages: "اللغات", education: "التعليم",
      client: "العميل", location: "الموقع", year: "السنة", duration: "المدة", role: "الدور", type: "النوع", discipline: "المجال",
      scope: "نطاق العمل", status: "الحالة", area: "المساحة", tools: "البرامج", myRole: "دوري — المراحل", overview: "نظرة عامة", backTo: "العودة للفهرس", next: "المشروع التالي",
      contactEyebrow: "تواصل", letsTalk: "لنعمل معًا", email: "البريد", phone: "الهاتف", whatsapp: "واتساب",
      based: "المقر", online: "حسابات", empty: "المشاريع قريبًا.", open: "فتح", placeholder: "صورة مؤقتة",
      rights: "جميع الحقوق محفوظة.", execution: "التنفيذ", design: "التصميم",
    },
  };

  /* ---------- State ---------- */
  const state = {
    lang: pickLang(),
    filters: { execution: "all", design: "all", ai: "all" },
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
  const sections = ["execution", "design", "ai", "profile", "contact"];

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
    const nameHTML = state.lang === "ar"
      ? `<span>${esc(name.join(" "))}</span>`
      : `<span>${esc(name[0])}</span><span class="line-2">${esc(name.slice(1).join(" "))}</span>`;
    const [role, rest] = t(P.title).split("|").map((s) => s.trim());
    return `
    <section class="hero" id="top">
      <div class="wrap">
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
      <figure class="bleed" style="margin:0"><img data-parallax src="${img(P.heroImage, "hero", t(P.name))}" alt="" /></figure>
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
        return `
        <li>
          <a class="row" href="#/p/${esc(p.id)}" data-img="${esc(cover(p))}" data-from="${disc}">
            <span class="row__no">${pad(i + 1)}</span>
            <span class="row__thumb"><img loading="lazy" src="${esc(cover(p))}" alt="" /></span>
            <span class="row__title">${T(p.title)}</span>
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
      ${sectionHead(no, disc, u()[disc], list.length, intro)}
      ${filtersHTML(disc, typeOptions(list))}
      <ol class="index" data-list="${disc}">${rowsHTML(disc)}</ol>
    </section>`;
  }

  function aiCards() {
    const list = D.ai.filter((a) => state.filters.ai === "all" || a.kind === state.filters.ai);
    if (!list.length) return `<div class="ai-card"><p>${esc(u().empty)}</p></div>`;
    return list
      .map((a, i) => {
        const src = img(a.src, "ai-" + i + a.kind, t(D.aiKinds[a.kind]));
        return `
      <article class="ai-card reveal">
        <div class="ai-card__media" data-zoom="${esc(src)}"><img loading="lazy" src="${esc(src)}" alt="${T(a.title)}" /></div>
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
    const langs = D.languages.map((l) => `<li class="kv"><span>${T(l.name)}</span><span>${T(l.level)}</span></li>`).join("");
    const edu = D.education.map((e) => `<li class="kv"><span>${T(e.title)}</span><span>${esc(e.period || "")}</span></li>`).join("");

    return `
    <section class="section light" id="profile">
      <div class="wrap">
        ${sectionHead(no, "profile", u().nav.profile, null, null)}
        <div class="profile-grid">
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
      aiSection(3) +
      profileSection(4) +
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
      [u().location, t(p.location)],
      [u().year, t(p.year)],
      [u().duration, t(p.duration)],
      [u().role, t(p.role)],
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
    const gallery = media
      .map((m, i) => {
        const wide = i === 0 || (media.length - 1) % 2 === 1 && i === media.length - 1;
        const cap = m.caption ? `<figcaption>${T(m.caption)}</figcaption>` : "";
        let inner;
        if (m.type === "video") inner = `<div class="frame"><video src="${esc(m.src)}" controls playsinline preload="metadata"></video></div>`;
        else if (m.type === "youtube") inner = `<iframe src="https://www.youtube-nocookie.com/embed/${esc(m.youtube || m.id)}" title="${T(p.title)}" allowfullscreen loading="lazy"></iframe>`;
        else {
          const src = img(m.src, p.id + "-" + i, t(p.title) + " — " + pad(i + 1));
          inner = `<div class="frame" data-zoom="${esc(src)}"><img loading="lazy" src="${esc(src)}" alt="${T(m.caption) || T(p.title)}" /></div>`;
        }
        return `<figure class="reveal${wide ? " wide" : ""}">${inner}${cap}</figure>`;
      })
      .join("");

    document.title = `${t(p.title)} — ${t(D.profile.name)}`;
    app.innerHTML = `
    <article class="pj">
      <div class="wrap">
        <a class="pj__back" href="#${from}"><span>${state.lang === "ar" ? "→" : "←"}</span>${esc(u().backTo)}</a>
        <h1 class="pj__title reveal">${T(p.title)}</h1>
        <dl class="titleblock reveal">${meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
      </div>
      <figure class="bleed" style="margin:0"><img data-parallax src="${esc(cover(p))}" alt="${T(p.title)}" /></figure>
      <div class="wrap pj__body">
        <span class="eyebrow">${esc(u().overview)}</span>
        <p class="pj__summary reveal">${T(p.summary)}</p>
        ${p.scope && p.scope.length ? `<span class="eyebrow">${esc(u().scope)}</span><div class="pj__scope reveal"><ul>${p.scope.map((s) => `<li>${T(s)}</li>`).join("")}</ul></div>` : ""}
        ${phases}
      </div>
      <div class="gallery">${gallery}</div>
      <div class="wrap">
        ${next && next !== p ? `<a class="next" href="#/p/${esc(next.id)}"><span class="eyebrow">${esc(u().next)}</span><strong>${T(next.title)} ${state.lang === "ar" ? "←" : "→"}</strong></a>` : ""}
      </div>
      ${contactSection()}
    </article>`;
    state.view = "project:" + id;
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
    document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
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
    if (z) openLightbox(z.dataset.zoom);
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

  // lightbox
  const lb = document.getElementById("lightbox");
  function openLightbox(src) {
    lb.querySelector("img").src = src;
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = "";
  }
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
  Promise.all([load("content/site.json"), load("content/projects.json"), load("content/ai.json")])
    .then(([site, pj, ai]) => {
      D = Object.assign({}, site, VOCAB, { projects: pj.projects || [], ai: ai.items || [] });
      state.lang = pickLang();
      boot();
    })
    .catch((err) => {
      console.error(err);
      app.innerHTML = '<p style="padding:120px 24px">Content failed to load. Please refresh.</p>';
    });
})();
