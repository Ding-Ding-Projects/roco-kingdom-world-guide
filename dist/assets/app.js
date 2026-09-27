(() => {
  "use strict";

  const DB = { creatures: null, locations: null, articles: null, sources: null, creatureDetails: null, typeChart: null, trainingReference: null, creatureSearch: new Map() };
  let BUILD_INFO = null;
  let DESKTOP_STATUS = { desktop: false, configured: false, enabled: false, state: "checking", lastUpdated: null };
  const KEY = "roco-world-field-notes-v1";
  const NAV = [
    { id: "home", icon: "⌂", en: "Overview", zh: "总览", group: "Atlas" },
    { id: "dex", icon: "✳", en: "Creature Dex", zh: "精灵图鉴", group: "Atlas" },
    { id: "types", icon: "◎", en: "Type matchups", zh: "属性克制", group: "Atlas" },
    { id: "map", icon: "⌖", en: "World index", zh: "世界索引", group: "Atlas" },
    { id: "guides", icon: "▤", en: "Field articles", zh: "实用文章", group: "Field notes" },
    { id: "sources", icon: "↗", en: "Source desk", zh: "资料来源", group: "Field notes" },
    { id: "updates", icon: "◷", en: "Edition log", zh: "版本记录", group: "Tools" },
    { id: "settings", icon: "⚙", en: "Settings", zh: "设定", group: "Tools" }
  ];
  const LOCALES = {
    "en": { search: "Search", open: "Open", read: "Read article", saved: "Saved", save: "Save", all: "All", more: "Load more", empty: "No matches yet.", source: "Source", checked: "Checked", unknown: "Not documented in this index", local: "Stored on this device only", filter: "Filter", reset: "Reset local settings", export: "Export", clear: "Clear", close: "Close", records: "records", forms: "forms", locations: "locations", guides: "articles", official: "Official", community: "Community" },
    "zh": { search: "搜寻", open: "打开", read: "阅读文章", saved: "已储存", save: "储存", all: "全部", more: "继续载入", empty: "暂时搵唔到结果。", source: "资料来源", checked: "核对日期", unknown: "索引未有记录", local: "只储存在此装置", filter: "筛选", reset: "重设本机设定", export: "汇出", clear: "清除", close: "关闭", records: "条记录", forms: "个形态", locations: "个位置名称", guides: "篇文章", official: "官方", community: "社区" }
  };
  const DEFAULTS = {
    lang: "en", theme: "system", scale: 1, density: 1, radius: 16, accent: "gold", contrast: false,
    funnyEn: 1, funnyZh: 1, focusLabel: "Field school", focusMode: false, locked: {},
    order: NAV.map(x => x.id), pinned: ["dex", "map"], groups: {}, bookmarks: [], history: [], notifications: [],
    vocab: { valid: false, count: 0, notice: "" }, schedule: { enabled: false, time: "19:00", note: "Check one limited event and one creature source." },
    selected: [], dexLimit: 60, regex: {}, regexIgnoreCase: {}, regexPattern: {}, regexDisplay: {}, paletteMode: "pages", mapQuery: "", mapHabitat: "", articleQuery: "", typeQuery: ""
  };
  let state = loadState();
  let route = { page: "home", articleId: "" };
  let searchTimer = 0;
  let reminderTimer = 0;
  let visibleDex = [];
  let lastFilter = { type: "", form: "", sort: "number" };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(DEFAULTS);
      const parsed = JSON.parse(raw);
      const merged = { ...structuredClone(DEFAULTS), ...parsed };
      merged.order = Array.isArray(merged.order) ? [...new Set(merged.order.filter(id => NAV.some(n => n.id === id))), ...NAV.map(n => n.id).filter(id => !merged.order.includes(id))] : DEFAULTS.order;
      merged.bookmarks = Array.isArray(merged.bookmarks) ? merged.bookmarks.slice(0, 300) : [];
      merged.history = Array.isArray(merged.history) ? merged.history.slice(0, 40) : [];
      merged.notifications = Array.isArray(merged.notifications) ? merged.notifications.slice(0, 40) : [];
      return merged;
    } catch { return structuredClone(DEFAULTS); }
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch { toast("This browser could not save the local field kit. Export your notes before closing this tab.", "warning"); }
    applyAppearance();
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }
  function safeUrl(value) {
    try { const url = new URL(value, location.href); return url.protocol === "https:" ? url.href : "#"; }
    catch { return "#"; }
  }
  function local(en, zh) {
    if (state.lang === "zh") return zh || en;
    if (state.lang === "both") return `${en} · ${zh || en}`;
    return en;
  }
  function renderBuildProvenance() {
    const label = $("#build-provenance");
    if (!label) return;
    const validVersion = typeof BUILD_INFO?.version === "string" && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(BUILD_INFO.version);
    const builtAt = typeof BUILD_INFO?.builtAt === "string" ? new Date(BUILD_INFO.builtAt) : null;
    if (!validVersion || !builtAt || !Number.isFinite(builtAt.getTime())) {
      label.textContent = local("Version and update time unavailable", "版本和更新时间未有记录");
      return;
    }
    const updatedAt = formatLocalTimestamp(builtAt);
    label.textContent = local(`Version ${BUILD_INFO.version} · Updated ${updatedAt}`, `版本 ${BUILD_INFO.version} · 更新於 ${updatedAt}`);
  }
  function formatLocalTimestamp(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return local("time unavailable", "时间未有记录");
    try {
      return new Intl.DateTimeFormat(state.lang === "zh" ? "zh-HK" : "en-CA", {
        year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short"
      }).format(date);
    } catch {
      return date.toISOString();
    }
  }
  async function loadBuildProvenance() {
    try {
      const response = await fetch("data/build-info.json", { credentials: "omit", cache: "no-cache" });
      if (response.ok) {
        const candidate = await response.json();
        if (candidate?.schemaVersion === 1) BUILD_INFO = candidate;
      }
    } catch {}
    renderBuildProvenance();
  }
  function statusCount(value) { return new Intl.NumberFormat("en").format(value || 0); }
  function recordText(value) { return value === null || value === undefined || value === "" ? local("Not documented in this index", "索引未有记录") : value; }
  function rowLabel(row) { return `${row.name || ""} ${row.form || ""} ${row.types?.join(" ") || ""} ${row.catalogNumber || ""}`.trim(); }
  function titleForArticle(article) { return local(article.title, article.titleZh); }
  function introForArticle(article) { return local(article.summary, article.summaryZh); }
  function navTitle(entry) { return local(entry.en, entry.zh); }

  function applyAppearance() {
    const root = document.documentElement;
    root.dataset.theme = ["light", "dark", "system"].includes(state.theme) ? state.theme : "system";
    root.style.setProperty("--font-scale", Math.max(.9, Math.min(1.18, Number(state.scale) || 1)));
    root.style.setProperty("--density", Math.max(.82, Math.min(1.2, Number(state.density) || 1)));
    root.style.setProperty("--radius", `${Math.max(8, Math.min(28, Number(state.radius) || 16))}px`);
    const accent = { gold: "#c89d50", teal: "#3f7777", rose: "#a95f56", violet: "#7763a8" }[state.accent] || "#c89d50";
    root.style.setProperty("--accent", accent);
    root.dataset.contrast = state.contrast ? "high" : "normal";
  }

  function toast(message, kind = "success") {
    const region = $("#toast-region");
    if (!region) return;
    const item = document.createElement("div");
    item.className = `toast ${kind}`;
    item.setAttribute("role", "status");
    item.textContent = message;
    region.append(item);
    window.setTimeout(() => item.remove(), 4200);
  }

  function notify(title, body, source = "Field guide") {
    const record = { id: crypto.randomUUID?.() || String(Date.now()), title, body, source, at: new Date().toISOString(), read: false };
    state.notifications.unshift(record);
    state.notifications = state.notifications.slice(0, 40);
    persist();
    renderNotificationBadge();
  }

  function renderNotificationBadge() {
    const unread = state.notifications.filter(item => !item.read).length;
    const count = $("#notification-count");
    if (!count) return;
    count.hidden = !unread;
    count.textContent = statusCount(unread);
  }

  function remember(routeName) {
    const item = { route: routeName, at: new Date().toISOString() };
    state.history = [item, ...state.history.filter(entry => entry.route !== routeName)].slice(0, 40);
    persist();
  }

  function setRoute(value, addHistory = true) {
    const raw = String(value || "home").replace(/^#/, "");
    const [page, articleId = ""] = raw.split("/");
    const validPage = NAV.some(item => item.id === page);
    route = validPage ? { page, articleId } : { page: "home", articleId: "" };
    if (addHistory) remember(articleId ? `article:${articleId}` : page);
    if (location.hash !== `#${raw}`) history.pushState(null, "", `#${raw}`);
    renderApp();
    renderNav();
    $("#main")?.focus({ preventScroll: true });
  }

  function navigate(value) {
    if (value.startsWith("location:")) {
      state.mapQuery = value.slice(9);
      persist();
      setRoute("map");
      return;
    }
    const name = value.startsWith("article:") ? `guides/${value.slice(8)}` : value;
    if (name.startsWith("creature:")) {
      const record = DB.creatures?.records.find(item => item.recordId === name.slice(9));
      if (record) openCreature(record);
      return;
    }
    setRoute(name);
  }

  function renderNav() {
    const nav = $("#primary-nav");
    if (!nav) return;
    nav.classList.add("nav-bottom");
    const lookup = new Map(NAV.map(item => [item.id, item]));
    const groups = new Map();
    for (const id of state.order) {
      const item = lookup.get(id);
      if (!item) continue;
      const group = state.groups[id] || item.group;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(item);
    }
    nav.innerHTML = [...groups.entries()].map(([group, entries]) => `<div class="nav-group-label">${esc(local(group, group === "Atlas" ? "索引" : group === "Field notes" ? "实用笔记" : "工具"))}</div>${entries.map(item => `<button class="nav-item" type="button" data-route="${item.id}" ${route.page === item.id ? 'aria-current="page"' : ""}><span class="nav-icon" aria-hidden="true">${esc(item.icon)}</span><span>${esc(navTitle(item))}</span>${state.pinned.includes(item.id) ? '<span class="pin" aria-label="Pinned">◆</span>' : ""}</button>`).join("")}`).join("");
    renderNotificationBadge();
  }

  function sourceById(id) { return DB.sources?.find(item => item.id === id); }
  function sourceChips(ids = []) {
    return ids.map(id => {
      const source = sourceById(id);
      if (source) return `<a class="badge ${source.kind.startsWith("Official") ? "official" : "community"}" href="${esc(safeUrl(source.url))}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a>`;
      const article = DB.articles?.find(item => item.id === id);
      if (article) return `<a class="badge related" href="#guides/${encodeURIComponent(article.id)}" data-go="article:${esc(article.id)}">${esc(local("Related article: ", "相關文章："))}${esc(titleForArticle(article))} ↗</a>`;
      return `<span class="badge unavailable">${esc(local("Reference unavailable", "參考資料未能提供"))}</span>`;
    }).join("");
  }
  function referenceLabel(id) {
    const source = sourceById(id);
    if (source) return source.url;
    const article = DB.articles?.find(item => item.id === id);
    return article ? `[${titleForArticle(article)}](#guides/${encodeURIComponent(article.id)})` : null;
  }
  function articleCard(article) {
    return `<article class="card article-card"><div class="card-body"><span class="card-kicker">${esc(local(article.category, article.category))}</span><a class="card-link" href="#guides/${encodeURIComponent(article.id)}" data-go="article:${esc(article.id)}"><span><h3>${esc(titleForArticle(article))}</h3><p>${esc(introForArticle(article))}</p></span><span class="arrow" aria-hidden="true">↗</span></a></div></article>`;
  }

  function renderHome() {
    const article = DB.articles?.find(item => item.id === "current-events");
    return `<div class="view-content">
      <div class="section-heading"><div><span class="section-label">${esc(local("FIELD GUIDE / WORLD EDITION", "世界版实用指南"))}</span><h2>${esc(local("Welcome to the field desk.", "欢迎来到洛克世界资料站。"))}</h2><p>${esc(local("Search the sourced creature index, browse the habitat atlas, compare type matchups, or open a practical article. Each fact carries a source and review date.", "搜索有来源的精灵索引、浏览栖息地目录、比较属性克制，或打开实用文章。每项资料都会注明来源和核对日期。"))}</p></div><div class="section-actions"><button class="button-secondary" data-go="dex">${esc(local("Browse the full Dex", "浏览完整图鉴"))} <span>→</span></button></div></div>
      <div class="status-banner"><span class="mark" aria-hidden="true">✦</span><div><strong>${esc(local("Independent reference · checked 25 September 2026.", "独立资料 · 核对日期：2026年9月25日。"))}</strong><p>${esc(local("Community data is labeled. Unverified catch odds, complete S4 geography, and image-only patch details are not guessed.", "社区资料会清楚标明。未核实的捕捉概率、完整S4地理资料和只出现在图片里的更新内容，不会靠估计补上。"))} <a href="#sources" data-go="sources">${esc(local("Read the research notes", "阅读资料核对说明"))}</a>.</p></div></div>
      <section class="intro-layout home-section" aria-label="${esc(local("Field guide shortcuts", "指南快捷入口"))}">
        <article class="atlas-card"><span class="card-kicker">${esc(local("WORLD ATLAS", "世界目录"))}</span><h2>${esc(local("Named places, habitat labels, and an honest map limit.", "地名、栖息地标签，以及清楚说明的地图限制。"))}</h2><p>${esc(local("Search the 43 original S3 marker labels, 57 habitat labels, and three handbook index areas. The local sources do not provide verified coordinates or route geometry.", "搜索43个S3原始地图标签、57个栖息地标签和三个图鉴索引区域。本地资料没有已核实的坐标或路线几何数据。"))}</p><div class="section-actions"><button class="button-secondary" data-go="map">${esc(local("Open the location and habitat index", "打开地点与栖息地索引"))} <span>↗</span></button><a class="button-quiet" href="${esc(safeUrl(DB.locations?.externalMap || "https://rocokingdomworld.org/maps/"))}" target="_blank" rel="noopener noreferrer">${esc(local("Open the external coordinate map", "打开外部坐标地图"))} ↗</a></div></article>
        <div class="quick-stack"><div class="quick-stat"><strong>${statusCount(DB.creatures?.recordCount)}</strong><span>${esc(local("listed form rows", "条形态记录"))}</span><small>${esc(local("Across", "分属"))} ${statusCount(DB.creatures?.uniqueCatalogNumbers)} ${esc(local("catalog numbers", "个目录编号"))}</small></div><div class="quick-stat"><strong>${statusCount(Object.keys(DB.typeChart?.records || {}).length)}</strong><span>${esc(local("type combinations", "种属性组合"))}</span><small>${esc(local("Indexed from the dated snapshot", "来自注明日期的资料快照"))}</small></div><div class="quick-stat"><strong>${statusCount(DB.articles?.length)}</strong><span>${esc(local("field articles", "篇实用文章"))}</span><small>${esc(local("English and written Cantonese", "英文与书面粤语"))}</small></div></div>
      </section>
      <section class="home-section"><div class="inline-title"><h2>${esc(local("Start with a useful route", "从实用入口开始"))}</h2><a href="#guides" data-go="guides">${esc(local("All articles", "全部文章"))} ↗</a></div><div class="grid grid-3"><article class="card"><div class="card-body"><span class="card-kicker">${esc(local("625 FORM ROWS", "625条形态记录"))}</span><button class="card-link" type="button" data-go="dex"><span><h3>${esc(local("Find a creature", "查找精灵"))}</h3><p>${esc(local("Search catalog fields, handbook tasks, complete listed skills, evolutions, and habitat notes.", "搜索目录资料、图鉴任务、已收录技能、进化路线和栖息地说明。"))}</p></span><span class="arrow" aria-hidden="true">↗</span></button></div></article><article class="card"><div class="card-body"><span class="card-kicker">${esc(local("120 INDEXED COMBINATIONS", "120种已索引组合"))}</span><button class="card-link" type="button" data-go="types"><span><h3>${esc(local("Compare type matchups", "比较属性克制"))}</h3><p>${esc(local("Search listed weaknesses and resistances. The table is a reference, not a damage calculator.", "搜索已列出的弱点与抵抗。本表供查询，不是伤害计算器。"))}</p></span><span class="arrow" aria-hidden="true">↗</span></button></div></article>${articleCard(DB.articles.find(item => item.id === "starter-route") || DB.articles[0])}</div></section>
      <section class="home-section"><div class="inline-title"><h2>${esc(local("On the noticeboard", "公告栏"))}</h2><button class="button-quiet" data-go="article:current-events">${esc(local("Open event desk", "打开活动台"))} ↗</button></div><div class="panel"><div class="card-label-row"><span class="badge official">${esc(local("Official notices", "官方公告"))}</span><span class="update-chip">${esc(local("As checked", "核对日期"))} 24 Sep 2026</span></div><h3 style="margin:.65rem 0 .35rem">${esc(local("Cocoa Harvest Festival announced for 25 September", "可可丰收节定于9月25日开始"))}</h3><p class="copy-block">${esc(local("The official forum index advertises up to 480 free Cocoa Fruit Balls. The extracted notice did not establish the end date or every reward condition, so check the live event panel before planning around that total.", "官方论坛索引称活动期间最多可取得480个可可果球。提取到的公告文字未确认结束日期和所有奖励条件，计划前请查看游戏内活动页面。"))}</p>${sourceChips(article?.sections.find(section => section.heading.startsWith("Cocoa"))?.sources || ["cocoa"])}</div></section>
      <section class="home-section"><div class="inline-title"><h2>${esc(local("One small field note", "一条小提示"))}</h2><button class="button-secondary button-small" data-random-tip>${esc(local("Surprise me", "给我一条随机提示"))} ✦</button></div><div id="random-tip" class="panel"><p class="copy-block">${esc(local("A form row is not necessarily a separate base creature. This Dex reports the source's row count and catalog-number count separately.", "一条形态记录未必代表一种不同的基础精灵。本图鉴分别列出来源记录行数和目录编号数。"))}</p><div class="field-actions"><a href="#article/roster-snapshots" data-go="article:roster-snapshots">${esc(local("Why the indexes differ", "点解几个索引数量唔同"))} ↗</a></div></div></section>
    </div>`;
  }

  function typeOptions() {
    const values = [...new Set(DB.creatures.records.flatMap(row => row.types || []))].sort((a, b) => a.localeCompare(b));
    return `<option value="">${esc(local("All types", "全部属性"))}</option>${values.map(type => `<option value="${esc(type)}">${esc(type)}</option>`).join("")}`;
  }

  function searchableCreatureText(row) {
    const profile = DB.creatureDetails?.records?.[row.recordId];
    const attributes = profile ? DB.creatureDetails?.catalog?.[profile.dataId] : null;
    const handbook = profile?.handbookId ? DB.creatureDetails?.handbooks?.[profile.handbookId] : null;
    const learnset = profile?.learnsetId ? DB.creatureDetails?.learnsets?.[profile.learnsetId] : null;
    const skillIds = new Set([
      attributes?.feature_skill_id, learnset?.feature_skill,
      ...(learnset?.native_skills || []).map(item => item.skill),
      ...(learnset?.blood_skills || []).map(item => item.skill),
      ...(learnset?.skill_stones || []),
      ...(DB.creatureDetails?.skillStoneTopics?.[profile?.dataId] || []).map(item => item.topic)
    ].filter(Boolean));
    const skillText = [...skillIds].map(id => {
      const skill = DB.creatureDetails?.skills?.[id];
      return skill ? `${skill.name || ""} ${skill.desc || ""} ${skill.element || ""} ${skill.category || ""}` : id;
    }).join(" ");
    const handbookText = handbook ? `${handbook.title || ""} ${handbook.entry_name || ""} ${handbook.habitat || ""} ${(handbook.areas || []).join(" ")} ${(handbook.topics || []).map(item => item.text || "").join(" ")}` : "";
    const evolutionText = (profile?.evolutionIds || []).flatMap(id => (DB.creatureDetails?.evolutions?.[id] || []).map(item => `${item.name || ""} ${(item.chain || []).map(step => `${step.title || ""} ${step.cond || ""}`).join(" ")} ${(item.lord_branches || []).map(step => `${step.title || ""} ${step.cond || ""} ${step.item || ""}`).join(" ")}`)).join(" ");
    return [row.name, row.catalogNumber, row.recordId, row.form, row.trait, row.traitEffect, row.description, ...(row.types || []), JSON.stringify(attributes || {}), handbookText, skillText, evolutionText].join(" ");
  }

  function regexFor(query, scope) {
    if (!state.regex[scope]) return null;
    try {
      const display = String(query).slice(0, 100);
      const pattern = state.regexPattern?.[scope] && state.regexDisplay?.[scope] === display ? state.regexPattern[scope] : display;
      if (/\\[1-9]|\(\?[=!<]|\([^)]*[*+{][^)]*\)[*+{]|\.\*[+*{]|\.\+[+*{]/.test(pattern)) throw new Error("This pattern uses an unsupported high-cost construct. Try the pattern builder.");
      return new RegExp(pattern, `${state.regexIgnoreCase?.[scope] === false ? "" : "i"}u`);
    } catch (error) { return { error: error.message || "That pattern is not valid." }; }
  }

  function fieldMatches(text, query, regex) {
    const value = String(text ?? "");
    if (!query) return true;
    if (regex?.error) return false;
    if (regex) {
      for (let index = 0; index < value.length; index += 400) {
        if (regex.test(value.slice(index, index + 512))) return true;
      }
      return false;
    }
    return value.toLocaleLowerCase().includes(query.toLocaleLowerCase());
  }

  function getDexRows() {
    const q = $("#dex-query")?.value.trim() || "";
    const type = $("#dex-type")?.value || "";
    const form = $("#dex-form")?.value || "";
    const regex = regexFor(q, "dex");
    let rows = DB.creatures.records.filter(row => {
      const searchable = DB.creatureSearch.get(row.recordId) || searchableCreatureText(row);
      return fieldMatches(searchable, q, regex) && (!type || row.types?.includes(type)) && (!form || String(row.form || "").toLowerCase().includes(form.toLowerCase()));
    });
    const sort = $("#dex-sort")?.value || "number";
    rows.sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "total" ? (b.stats.total || 0) - (a.stats.total || 0) : Number(a.catalogNumber) - Number(b.catalogNumber) || a.recordId.localeCompare(b.recordId));
    lastFilter = { type, form, sort };
    return { rows, regex };
  }

  function renderDexRow(row) {
    const selected = state.selected.includes(row.recordId);
    const saved = state.bookmarks.includes(`creature:${row.recordId}`);
    const icon = row.types?.[0] ? row.types[0].slice(0, 1) : "✦";
    return `<div class="dex-row" role="button" tabindex="0" data-open-creature="${esc(row.recordId)}" aria-label="Open ${esc(row.name)}, catalog ${esc(row.catalogNumber)}">
      <input class="check-control" type="checkbox" data-select-creature="${esc(row.recordId)}" aria-label="Select ${esc(row.name)}" ${selected ? "checked" : ""}>
      <span class="dex-number">${esc(row.catalogNumber)}</span><span class="specimen-mark" aria-hidden="true">${esc(icon)}</span>
      <span><span class="creature-name">${esc(row.name)}</span><span class="creature-form">${esc(recordText(row.form))}</span></span>
      <span class="type-col type-stack">${(row.types || []).slice(0, 2).map(type => `<span class="type-pill">${esc(type)}</span>`).join("") || `<span class="type-pill">${esc(local("Unknown", "未知"))}</span>`}</span>
      <span class="total-col"><span class="card-kicker">TOTAL</span><br><span class="stat-total">${esc(recordText(row.stats.total))}</span></span>
      <span class="season-col">${esc(recordText(row.season))}</span>
      <span class="dex-actions"><button class="icon-button" type="button" data-bookmark="creature:${esc(row.recordId)}" aria-label="${saved ? "Remove saved record" : "Save record"}" title="${saved ? "Saved" : "Save this record"}">${saved ? "◆" : "◇"}</button></span>
    </div>`;
  }

  function renderDex() {
    if (!DB.creatures) return `<div class="empty-state">Creature data could not be loaded. Open <a href="data/creatures.json">the data file</a> to see whether this copy is available.</div>`;
    const detailSnapshot = DB.creatureDetails?.snapshot;
    const { rows, regex } = getDexRows();
    visibleDex = rows;
    const limit = Math.min(rows.length, Math.max(30, state.dexLimit));
    const types = [...new Set(DB.creatures.records.flatMap(row => row.types || []))].sort((a, b) => a.localeCompare(b));
    const forms = [...new Set(DB.creatures.records.map(row => row.form).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const regexError = regex?.error ? `<span class="badge community">${esc(regex.error)}</span>` : state.regex.dex ? `<span class="badge official">Pattern search on</span>` : "";
    return `<div class="view-content">
      <div class="section-heading"><div><span class="section-label">${esc(local("THE CREATURE AND FORM INDEX", "精灵与形态索引"))}</span><h2>${esc(local("Creature Dex", "精灵图鉴"))}</h2><p>${esc(local("Search names, skills, handbook tasks, habitats, evolution conditions, and every imported form. Open a record for its original catalog fields and fully joined references.", "搜索名称、技能、图鉴任务、栖息地、进化条件和全部已导入形态。打开记录可查看原始目录字段与完整关联资料。"))}</p></div><div class="section-actions"><button class="button-secondary button-small" data-export="filtered-json">${esc(local("Export detailed results", "导出完整资料"))} ↗</button></div></div>
      <div class="status-banner"><span class="mark">✳</span><div><strong>${esc(local("Community data, not an official game export.", "社区资料，并非游戏官方导出。"))}</strong><p>${statusCount(DB.creatures.recordCount)} ${esc(local("form rows across", "条形态记录，分属"))} ${statusCount(DB.creatures.uniqueCatalogNumbers)} ${esc(local("catalog numbers. Snapshot", "个目录编号。资料快照"))} ${esc(detailSnapshot?.version || "unavailable")} ${esc(local("adds 824 skills, 311 learnsets, 275 evolution groups, 466 handbook entries, 2,342 task topics, and 120 type combinations. No creature artwork is included.", "补充824项技能、311份学习表、275组进化路线、466条图鉴记录、2,342项任务主题和120种属性组合。本资料没有精灵美术。"))}</p></div></div>
      <div class="panel" style="margin:1rem 0"><h3>${esc(local("How other indexes count", "其他索引的计算方式"))}</h3><p class="copy-block">${esc(local("The current BiliWiki list page reports 621 results (page update: 13 September 2026). The independent Roco Kingdom World index reports 644 entries (checked 25 September 2026). Different snapshots and numbering rules mean these counts do not identify missing creatures.", "目前BiliWiki列表页显示621条结果（页面更新：2026年9月13日）。独立的Roco Kingdom World索引显示644条记录（核对日期：2026年9月25日）。由于快照日期和编号方式不同，这些数字不能用来判断有精灵缺失。"))}</p>${sourceChips(["creature-list-live", "roco-dex-index"])}<p class="field-hint">${esc(local("See the roster comparison article for the four local form keys and unresolved matches.", "四个本地形态编号同未解决配对，请看精灵数量比较文章。"))} <a href="#article/roster-snapshots" data-go="article:roster-snapshots">${esc(local("Open article", "打开文章"))} ↗</a></p></div>
      <div class="dex-toolbar">
        <label class="sr-only" for="dex-query">${esc(local("Search the creature Dex", "搜索精灵图鉴"))}</label><input id="dex-query" class="field-control dex-search" type="search" value="${esc($("#dex-query")?.value || "")}" placeholder="${esc(local("Name, skill, habitat, task, number…", "名称、技能、栖息地、任务或编号…"))}">
        <label class="sr-only" for="dex-type">${esc(local("Filter by type", "按属性筛选"))}</label><select id="dex-type" class="field-control">${typeOptions()}</select>
        <label class="sr-only" for="dex-form">${esc(local("Filter by listed form", "按已列出的形态筛选"))}</label><select id="dex-form" class="field-control"><option value="">${esc(local("All forms", "全部形态"))}</option>${forms.map(form => `<option value="${esc(form)}">${esc(form)}</option>`).join("")}</select>
        <label class="sr-only" for="dex-sort">Sort creature results</label><select id="dex-sort" class="field-control"><option value="number">${esc(local("Catalog order", "图鉴次序"))}</option><option value="name">${esc(local("Name", "名称"))}</option><option value="total">${esc(local("Base stat total", "基础总和"))}</option></select>
        <button class="button-secondary" data-open-regex="dex">${state.regex.dex ? ".* Pattern on" : ".* Pattern"}</button>
      </div>
      <div class="dex-summary"><span><strong>${statusCount(rows.length)}</strong> matching form records ${regexError}</span><span>Checked ${esc(DB.creatures.checkedOn)} · list date ${esc(DB.creatures.communityUpdatedOn)}</span></div>
      <div id="dex-bulk" class="dex-bulk" ${state.selected.length ? "" : "hidden"}><strong>${statusCount(state.selected.length)} selected</strong><button class="button-secondary button-small" data-bulk="save">Save selected</button><button class="button-secondary button-small" data-export="selected-csv">CSV</button><button class="button-secondary button-small" data-export="selected-md">Markdown</button><button class="button-quiet button-small" data-bulk="clear">Clear selection</button></div>
      <div class="dex-list" role="list" aria-label="Creature form records"><div class="dex-row dex-row-head" aria-hidden="true"><span></span><span>No.</span><span>Record</span><span class="type-col">Type</span><span class="total-col">Base stats</span><span class="season-col">Season</span><span></span></div>${rows.slice(0, limit).map(renderDexRow).join("") || `<div class="empty-state"><strong>No matching creature record.</strong>${esc(local("Adjust a filter or try a shorter name.", "试下放宽筛选条件或者缩短名称。"))}</div>`}</div>
      ${rows.length > limit ? `<div class="load-more"><button class="button-secondary" data-load-more>${esc(local("Load more", "继续载入"))} · ${statusCount(rows.length - limit)} ${esc(local("remaining", "条剩余"))}</button></div>` : ""}
      <p class="field-hint" style="margin-top:.75rem">List source: <a href="${esc(safeUrl(DB.creatures.source))}" target="_blank" rel="noopener noreferrer">BWiki creature list ↗</a> · Data licensed CC BY-NC-SA 4.0. See <a href="#sources" data-go="sources">attribution and reuse notes</a>.</p>
    </div>`;
  }

  function openCreature(row) {
    const dialog = $("#detail-dialog");
    if (!dialog || !row) return;
    const saved = state.bookmarks.includes(`creature:${row.recordId}`);
    const stats = [
      ["HP", row.stats.hp], ["Speed", row.stats.speed], ["Physical attack", row.stats.physicalAttack],
      ["Special attack", row.stats.specialAttack], ["Physical defense", row.stats.physicalDefense],
      ["Special defense", row.stats.specialDefense], ["Total", row.stats.total]
    ];
    const facts = [
      ["Catalog number", row.catalogNumber], ["Listed form", row.form], ["Type", row.types?.join(" · ")],
      ["Trait", row.trait], ["Trait effect", row.traitEffect], ["Evolution stage", row.evolutionStage],
      ["Season label", row.season], ["Egg group", row.eggGroup], ["Height", row.height], ["Weight", row.weight],
      ["Rideable", row.rideable], ["Co-ridable", row.coRideable], ["Source description", row.description]
    ];
    const page = safeUrl(row.source?.page || DB.creatures.source);
    const traitUrl = row.source?.traitPage ? safeUrl(row.source.traitPage) : "";
    $("#detail-content").innerHTML = `<div class="detail-head"><span class="specimen-mark" aria-hidden="true">${esc(row.types?.[0]?.slice(0, 1) || "✦")}</span><div><span class="section-label">CATALOG ${esc(row.catalogNumber)} · FORM RECORD ${esc(row.recordId)}</span><h2 id="detail-title">${esc(row.name)}</h2><p>${esc(recordText(row.form))} · ${(row.types || []).map(type => `<span class="type-pill">${esc(type)}</span>`).join(" ")}</p></div></div>
      <div class="section-actions"><button class="button-secondary button-small" data-bookmark="creature:${esc(row.recordId)}">${saved ? "◆ Saved" : "◇ Save record"}</button><button class="button-quiet button-small" data-export="one-json" data-record="${esc(row.recordId)}">Export JSON ↗</button></div>
      <section class="detail-section"><h3>Listed base stats</h3><div class="stat-grid">${stats.map(([label, value]) => `<div class="stat-box"><span>${esc(label)}</span><strong>${esc(recordText(value))}</strong></div>`).join("")}</div></section>
      <section class="detail-section"><h3>Record fields</h3><div class="detail-facts">${facts.map(([label, value]) => `<div class="detail-fact"><span>${esc(label)}</span><strong>${esc(recordText(Array.isArray(value) ? value.join(" · ") : value))}</strong></div>`).join("")}</div></section>
      <section class="detail-section"><div class="source-note"><p><strong>Source and freshness</strong></p><p>Community transcription · page date ${esc(recordText(row.source?.communityUpdatedOn))} · reviewed ${esc(recordText(row.source?.checkedOn))}.</p><p>Missing in this list means undocumented here; it does not prove the creature has no habitat, skill, capture condition, or special rule.</p><p><a href="${esc(page)}" target="_blank" rel="noopener noreferrer">Open this record's source page ↗</a>${traitUrl ? ` · <a href="${esc(traitUrl)}" target="_blank" rel="noopener noreferrer">Trait reference ↗</a>` : ""}</p></div></section>`;
    appendCreatureSourceDetails(row, dialog);
    dialog.showModal();
  }

  function appendCreatureSourceDetails(row, dialog) {
    const container = $("#detail-content", dialog);
    const data = DB.creatureDetails;
    const profile = data?.records?.[row.recordId];
    if (!profile) return;
    dialog.dataset.recordId = row.recordId;
    const copy = (en, zh) => local(en, zh);
    const attributes = data.catalog[profile.dataId] || {};
    const handbook = profile.handbookId ? data.handbooks[profile.handbookId] : null;
    const learnset = profile.learnsetId ? data.learnsets[profile.learnsetId] : null;
    const make = (tag, text, className) => {
      const node = document.createElement(tag);
      if (text !== undefined && text !== null) node.textContent = String(text);
      if (className) node.className = className;
      return node;
    };
    const section = (title, parent = container) => {
      const node = make("section", null, "detail-section");
      node.append(make("h3", title));
      parent.append(node);
      return node;
    };
    const disclosure = (title, parent) => {
      const node = make("details", null, "detail-accordion");
      node.append(make("summary", title));
      parent.append(node);
      return node;
    };
    const factGrid = facts => {
      const grid = make("div", null, "detail-facts");
      for (const [label, value] of facts) {
        const item = make("div", null, "detail-fact");
        item.append(make("span", label), make("strong", value || "Not listed"));
        grid.append(item);
      }
      return grid;
    };
    const skills = data.skills || {};
    const renderSkillList = (entries, title, noteFor = () => "") => {
      if (!entries?.length) return;
      const group = disclosure(copy(title, title === "Native learnset" ? "原生技能学习表" : title === "Bloodline skills" ? "血脉技能" : "技能石") + " · " + entries.length, skillSection);
      const list = make("ul", null, "detail-skill-list");
      for (const entry of entries) {
        const id = typeof entry === "string" ? entry : entry.skill;
        const skill = skills[id] || {};
        const item = make("li", null, "detail-skill");
        const body = make("div");
        body.append(make("strong", skill.name || id));
        body.append(make("small", [noteFor(entry), skill.element, skill.category, skill.energy !== undefined ? copy("Energy ", "能量 ") + skill.energy : ""].filter(Boolean).join(" · ")));
        if (skill.desc) body.append(make("p", skill.desc));
        item.append(body);
        list.append(item);
      }
      group.append(list);
    };

    if (handbook) {
      const area = section(copy("Handbook, habitat, and tasks", "图鉴、栖息地与任务"));
      area.append(make("p", copy("Habitat: ", "栖息地：") + (handbook.habitat || copy("Not documented in this entry", "此条目没有记录")) + " · " + copy("Index areas: ", "索引区域：") + ((handbook.areas || []).join(" · ") || copy("Not listed", "未列出")), "copy-block"));
      const topics = handbook.topics || [];
      if (topics.length) {
        const group = disclosure(copy("All handbook tasks", "全部图鉴任务") + " · " + topics.length, area);
        const list = make("ul", null, "handbook-task-list");
        for (const topic of topics) {
          const item = make("li");
          item.append(make("strong", topic.text || copy("Unlabeled task", "未命名任务")));
          item.append(make("span", [topic.target ? copy("Target ", "目标 ") + topic.target : "", (topic.rewards || []).map(reward => reward.name + " ×" + reward.count).join(" · ")].filter(Boolean).join(" · ") || copy("No reward listed", "没有列出奖励")));
          list.append(item);
        }
        group.append(list);
      }
    }

    const skillSection = section(copy("Complete skill references", "完整技能资料"));
    const featureId = attributes.feature_skill_id || learnset?.feature_skill;
    if (featureId) {
      const skill = skills[featureId] || {};
      const feature = make("div", null, "feature-skill");
      feature.append(make("strong", copy("Feature skill", "特色技能")), make("p", [skill.name, skill.element, skill.category].filter(Boolean).join(" · ")));
      if (skill.desc) feature.append(make("p", skill.desc));
      skillSection.append(feature);
    }
    renderSkillList(learnset?.native_skills, "Native learnset", entry => copy("Level ", "等级 ") + entry.level + " · " + copy("stage ", "阶段 ") + entry.stage);
    renderSkillList(learnset?.blood_skills, "Bloodline skills", entry => entry.blood + " " + copy("blood · level ", "血脉 · 等级 ") + entry.level);
    renderSkillList(learnset?.skill_stones, "Skill stones");
    const stoneTopics = data.skillStoneTopics?.[profile.dataId] || [];
    if (stoneTopics.length) {
      const group = disclosure(copy("Skill-stone handbook topics", "技能石图鉴主题") + " · " + stoneTopics.length, skillSection);
      const list = make("ul", null, "handbook-task-list");
      for (const item of stoneTopics) list.append(make("li", item.topic + " · " + item.pet_name + " · " + item.topic_id));
      group.append(list);
    }
    if (!featureId && !learnset?.native_skills?.length && !learnset?.blood_skills?.length && !learnset?.skill_stones?.length && !stoneTopics.length) {
      skillSection.append(make("p", copy("No linked skill records are present in this snapshot.", "此资料快照没有关联技能记录。"), "field-hint"));
    }

    const paths = (profile.evolutionIds || []).flatMap(id => (data.evolutions[id] || []).map(path => ({ id, path })));
    const evolution = section(copy("Evolution paths and conditions", "进化路线与条件"));
    if (!paths.length) evolution.append(make("p", copy("No linked evolution path is present in this snapshot.", "此资料快照没有关联进化路线。"), "field-hint"));
    for (const { id, path } of paths) {
      const group = disclosure(path.name || id, evolution);
      const chain = make("ol");
      for (const step of path.chain || []) {
        const item = make("li");
        item.append(make("strong", step.title || step.name || step.id));
        item.append(make("span", [step.types?.join(" / "), step.level ? copy("Level ", "等级 ") + step.level : "", step.cond || ""].filter(Boolean).join(" · ") || copy("Starting form", "初始形态")));
        chain.append(item);
      }
      group.append(chain);
      if (path.lord_branches?.length) {
        group.append(make("h4", copy("Leader branches", "首领分支")));
        const branches = make("ul");
        for (const step of path.lord_branches) branches.append(make("li", [step.title || step.name || step.id, step.cond, step.item].filter(Boolean).join(" · ")));
        group.append(branches);
      }
    }

    if (attributes.affinity) {
      section(copy("Affinity references", "喜好资料")).append(factGrid([[copy("Enjoys", "喜欢"), (attributes.affinity.enjoy || []).join(" · ")], [copy("Avoids", "讨厌"), (attributes.affinity.hate || []).join(" · ")]]));
    }
    if (attributes.ecology?.fruits?.length) {
      const ecology = section(copy("Ecology and fruit notes", "生态与果实资料"));
      const list = make("ul", null, "detail-skill-list");
      for (const fruit of attributes.ecology.fruits) {
        const item = make("li", null, "detail-skill");
        const body = make("div");
        body.append(make("strong", fruit.name || copy("Fruit record", "果实记录")));
        if (fruit.description) body.append(make("p", fruit.description));
        body.append(make("small", (fruit.sources || []).join(" · ") || copy("Source not listed", "未列出来源")));
        item.append(body);
        list.append(item);
      }
      ecology.append(list);
    }
    const matchup = DB.typeChart?.records?.[(attributes.types || []).join("|")];
    if (matchup) {
      section(copy("Type matchup", "属性克制")).append(factGrid([
        [copy("Weak to", "弱点"), (matchup.weak || []).map(item => item.type + " ×" + item.multiplier).join(" · ") || copy("None listed", "未列出")],
        [copy("Resists", "抵抗"), (matchup.resist || []).map(item => item.type + " ×" + item.multiplier).join(" · ") || copy("None listed", "未列出")]
      ]));
    }

    const source = data.snapshot;
    const provenance = section(copy("Joined source and freshness", "关联资料与更新时间"));
    provenance.append(make("p", copy("Snapshot ", "资料快照 ") + source.version + " · " + source.updatedOn + " · " + source.license, "source-note"));
    provenance.append(make("p", copy("Missing values mean the source did not document a field. The separate training sample is from S3. No artwork is included.", "空白表示来源没有记录该字段。另附训练样本来自S3。本资料没有收录游戏美术。"), "field-hint"));
    const link = make("a", copy("Open the pinned source snapshot ↗", "打开固定版本资料快照 ↗"));
    link.href = safeUrl(source.repository + "/tree/" + source.commit);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    provenance.append(link);

    const raw = disclosure(copy("All " + Object.keys(attributes).length + " original catalog fields", "全部" + Object.keys(attributes).length + "个原始目录字段"), container);
    raw.classList.add("raw-fields");
    raw.append(make("pre", JSON.stringify(attributes, null, 2), "raw-source-json"));

    const training = disclosure(copy("Historical community training sample · S3", "历史社区训练样本 · S3"), container);
    training.dataset.trainingFor = row.recordId;
    training.append(make("p", copy("Loads dated community submission counts on request. Counts are not official rankings or recommendations.", "展开后才会载入注明日期的社区投稿统计。计数不是官方排名或建议。"), "field-hint"));
    training.addEventListener("toggle", () => {
      if (training.open && !training.dataset.loaded) renderTrainingReference(row, training, dialog);
    });
  }

  async function loadTrainingReference() {
    if (DB.trainingReference) return DB.trainingReference;
    if (!DB.trainingReferencePromise) DB.trainingReferencePromise = fetch("data/training-reference.json", { credentials: "omit", cache: "no-cache" }).then(response => {
      if (!response.ok) throw new Error("The historical training file could not be loaded.");
      return response.json();
    }).then(data => (DB.trainingReference = data));
    return DB.trainingReferencePromise;
  }

  async function renderTrainingReference(row, container, dialog) {
    const original = container.querySelector("p");
    if (original) original.textContent = local("Loading the historical reference…", "正在载入历史资料…");
    const recordId = row.recordId;
    try {
      const reference = await loadTrainingReference();
      if (!dialog.open || dialog.dataset.recordId !== recordId || !container.isConnected) return;
      const profile = DB.creatureDetails.records[recordId];
      const sample = reference.records[String(profile?.gameId)];
      if (!sample) {
        if (original) original.textContent = local("This form has no matching entry in the " + reference.sourceSeason + " sample.", "此形态没有对应的" + reference.sourceSeason + "样本记录。");
        return;
      }
      const skillsByGameId = new Map(Object.values(DB.creatureDetails.skills).filter(skill => skill.game_id !== undefined).map(skill => [String(skill.game_id), skill.name]));
      for (const [mode, categories] of Object.entries(sample)) {
        const group = document.createElement("details");
        group.className = "training-mode";
        const summary = document.createElement("summary");
        summary.textContent = mode === "pvp" ? local("Player battles", "玩家对战") : local("Large-world encounters", "大世界遭遇战");
        group.append(summary);
        const grid = document.createElement("div");
        grid.className = "training-grid";
        for (const [kind, entries] of Object.entries(categories)) {
          const category = document.createElement("section");
          const heading = document.createElement("h4");
          heading.textContent = reference.labels?.[kind]?.title ? local(reference.labels[kind].title, reference.labels[kind].title) : kind;
          category.append(heading);
          const list = document.createElement("ol");
          for (const [id, count] of entries || []) {
            const labels = reference.labels?.[kind] || {};
            const label = labels[String(id)]?.name || labels[String(id)] || (kind === "skill" ? skillsByGameId.get(String(id)) : "") || String(id);
            const item = document.createElement("li");
            const name = document.createElement("span");
            name.textContent = label;
            const total = document.createElement("strong");
            total.textContent = statusCount(count);
            item.append(name, total);
            list.append(item);
          }
          category.append(list);
          grid.append(category);
        }
        group.append(grid);
        container.append(group);
      }
      if (original) original.textContent = local(reference.interpretation + " Source season: " + reference.sourceSeason + ". Snapshot date: " + reference.snapshot.updatedOn + ".", "" + reference.interpretation + " 资料赛季：" + reference.sourceSeason + "。快照日期：" + reference.snapshot.updatedOn + "。");
      container.dataset.loaded = "true";
    } catch (error) {
      if (original) original.textContent = local(error.message, "载入这份历史资料时遇到问题。");
    }
  }

  function renderTypeChart() {
    const query = $("#type-query")?.value || state.typeQuery || "";
    const regex = regexFor(query, "types");
    const rows = Object.entries(DB.typeChart?.records || {}).filter(([key, value]) => fieldMatches(key + " " + (value.weak || []).map(item => item.type).join(" ") + " " + (value.resist || []).map(item => item.type).join(" "), query, regex));
    const cards = rows.map(([key, value]) => {
      const weak = (value.weak || []).map(item => "<li><span>" + esc(item.type) + "</span><strong>×" + esc(item.multiplier) + "</strong></li>").join("") || "<li>" + esc(local("No weakness listed", "未列出弱点")) + "</li>";
      const resist = (value.resist || []).map(item => "<li><span>" + esc(item.type) + "</span><strong>×" + esc(item.multiplier) + "</strong></li>").join("") || "<li>" + esc(local("No resistance listed", "未列出抵抗")) + "</li>";
      return "<article class=\"type-card\"><div class=\"type-card-title\"><span class=\"specimen-mark\" aria-hidden=\"true\">◎</span><h3>" + esc(key.replaceAll("|", " / ")) + "</h3></div><div class=\"type-result-grid\"><section><h4>" + esc(local("Weak to", "弱点")) + "</h4><ul>" + weak + "</ul></section><section><h4>" + esc(local("Resists", "抵抗")) + "</h4><ul>" + resist + "</ul></section></div></article>";
    }).join("");
    return "<div class=\"view-content\"><div class=\"section-heading\"><div><span class=\"section-label\">" + esc(local("SOURCE-LINKED MATCHUP TABLE", "附有来源的克制表")) + "</span><h2>" + esc(local("Type matchups", "属性克制")) + "</h2><p>" + esc(local("Browse all " + statusCount(Object.keys(DB.typeChart?.records || {}).length) + " indexed combinations. Use the listed multipliers as source data and check the current client for changed rules.", "浏览已索引的" + statusCount(Object.keys(DB.typeChart?.records || {}).length) + "种组合。倍率来自资料快照；规则更新请以当前游戏客户端为准。")) + "</p></div></div>" +
      "<div class=\"status-banner\"><span class=\"mark\">◎</span><div><strong>" + esc(local("Community reference, not a battle simulator.", "社区参考资料，不是战斗模拟器。")) + "</strong><p>" + esc(local("The chart transcribes the pinned community snapshot. It does not calculate damage, turn order, status duration, or battle-specific exceptions.", "本表转录自固定版本的社区资料，不会计算伤害、行动顺序、状态持续时间或战斗特殊规则。")) + "</p></div></div>" +
      "<div class=\"dex-toolbar\"><label class=\"sr-only\" for=\"type-query\">" + esc(local("Search type combinations", "搜索属性组合")) + "</label><input id=\"type-query\" class=\"field-control\" type=\"search\" value=\"" + esc(query) + "\" placeholder=\"" + esc(local("Search a type or combination…", "搜索属性或组合…")) + "\"><button class=\"button-secondary\" data-open-regex=\"types\">" + (state.regex.types ? ".* " + esc(local("Pattern on", "模式已启用")) : ".* " + esc(local("Pattern", "模式搜索"))) + "</button><span class=\"badge\">" + statusCount(rows.length) + " " + esc(local("combinations", "种组合")) + "</span></div>" +
      "<div class=\"type-card-grid\">" + (cards || "<div class=\"empty-state\">" + esc(local("No matchup entry matches this search.", "没有符合条件的克制资料。")) + "</div>") + "</div>" +
      "<p class=\"field-hint\">" + esc(local("Snapshot", "资料快照")) + ": " + esc(DB.typeChart?.snapshot?.version || "unknown") + " · " + esc(DB.typeChart?.snapshot?.updatedOn || "date unavailable") + " · <a href=\"" + esc(safeUrl(DB.typeChart?.snapshot?.repository + "/tree/" + DB.typeChart?.snapshot?.commit)) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + esc(local("Source revision", "来源版本")) + " ↗</a></p></div>";
  }

  function renderRichMap() {
    const data = DB.locations;
    const q = $("#map-query")?.value || state.mapQuery || "";
    const regex = regexFor(q, "map");
    const records = new Map(DB.creatures.records.map(row => [row.recordId, row]));
    const markerRows = (data?.anchors || []).filter(item => fieldMatches(item.label + " " + item.kind, q, regex));
    const visibleHabitat = (data?.habitatIndex || []).filter(item => {
      const names = item.recordIds.map(id => records.get(id)).filter(Boolean).map(row => row.name + " " + row.form).join(" ");
      return fieldMatches(item.label + " " + names, q, regex);
    });
    const visibleAreas = (data?.handbookAreas || []).filter(item => {
      const names = item.recordIds.map(id => records.get(id)).filter(Boolean).map(row => row.name + " " + row.form).join(" ");
      return fieldMatches(item.label + " " + names, q, regex);
    });
    const markerMarkup = markerRows.map((item, index) => "<div class=\"location-item\"><span class=\"locator\">" + String(index + 1).padStart(2, "0") + "</span><span class=\"label\" lang=\"zh-Hans\">" + esc(item.label) + "<small>" + esc(local(item.kind === "Magic-source index label" ? "Community marker label · coordinates not included" : "Community Eternal Night marker label · current status unknown", item.kind === "Magic-source index label" ? "社区地图标签 · 未附坐标" : "社区永夜地图标签 · 当前状态未核实")) + "</small></span><button class=\"icon-button\" type=\"button\" data-bookmark=\"location:" + esc(item.label) + "\" aria-label=\"" + esc(local("Save ", "保存地点：")) + esc(item.label) + "\">◇</button></div>").join("");
    const recordButtons = ids => ids.map(id => {
      const row = records.get(id);
      return row ? "<li><button class=\"location-creature-link\" type=\"button\" data-open-creature=\"" + esc(id) + "\"><span>" + esc(row.catalogNumber) + " · " + esc(row.name) + "</span><small>" + esc(recordText(row.form)) + "</small></button></li>" : "";
    }).join("");
    const habitatMarkup = visibleHabitat.map(item => "<details class=\"habitat-entry\"><summary><span lang=\"zh-Hans\">" + esc(item.label) + "</span><span class=\"badge\">" + statusCount(item.count) + " " + esc(local("form records", "条形态记录")) + "</span></summary><ul class=\"location-creature-list\">" + (recordButtons(item.recordIds) || "<li>" + esc(local("No linked Dex rows.", "没有关联的图鉴记录。")) + "</li>") + "</ul></details>").join("");
    const areaMarkup = visibleAreas.map(item => "<details class=\"habitat-entry\"><summary><span lang=\"zh-Hans\">" + esc(item.label) + "</span><span class=\"badge\">" + statusCount(item.count) + " " + esc(local("form records", "条形态记录")) + "</span></summary><ul class=\"location-creature-list\">" + (recordButtons(item.recordIds) || "<li>" + esc(local("No linked Dex rows.", "没有关联的图鉴记录。")) + "</li>") + "</ul></details>").join("");
    return "<div class=\"view-content\"><div class=\"section-heading\"><div><span class=\"section-label\">" + esc(local("NAMED PLACES, HABITAT INDEX, AND SOURCE LIMITS", "地点、栖息地索引与资料限制")) + "</span><h2>" + esc(local("World atlas", "世界地图索引")) + "</h2><p>" + esc(local("Search handbook areas, creature habitat notes, and original map labels. The source provides no verified coordinates for this local atlas.", "搜索图鉴区域、精灵栖息地说明和原始地图标签。本地资料没有已核实的坐标。")) + "</p></div><div class=\"section-actions\"><a class=\"button-secondary\" href=\"" + esc(safeUrl(data?.externalMap)) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + esc(local("Open the external coordinate map", "打开外部坐标地图")) + " ↗</a></div></div>" +
      "<div class=\"location-summary\"><span class=\"badge community\">" + statusCount(data?.anchors.length || 0) + " " + esc(local("S3 marker labels", "个S3地图标签")) + "</span><span class=\"badge community\">" + statusCount(data?.habitatIndex?.length || 0) + " " + esc(local("handbook habitat labels", "个图鉴栖息地标签")) + "</span><span class=\"badge community\">" + statusCount(data?.handbookAreas?.length || 0) + " " + esc(local("handbook index areas", "个图鉴索引区域")) + "</span><span class=\"badge\">" + statusCount(data?.handbookEntryCount || 0) + " " + esc(local("handbook entries", "条图鉴记录")) + "</span></div>" +
      "<div class=\"status-banner\"><span class=\"mark\">!</span><div><strong>" + esc(local("Labels are not map geometry.", "地名标签不等于地图坐标。")) + "</strong><p>" + esc(local("The 43 marker names come from an S3 map index. Habitat and index-area labels are joined from a dated community Dex snapshot. Neither source supplies local coordinates, route lines, area borders, or a complete S4 access table. No third-party map points or tiles are copied.", "43个地图名称来自S3地图索引。栖息地和索引区域标签则连接至注明日期的社区图鉴快照。两种资料都没有提供本地坐标、路线、区域边界或完整S4通行表。本项目没有复制第三方地图点位或地图图块。")) + "</p></div></div>" +
      "<div class=\"dex-toolbar\"><label class=\"sr-only\" for=\"map-query\">" + esc(local("Search place labels and linked forms", "搜索地点标签和关联形态")) + "</label><input id=\"map-query\" class=\"field-control\" type=\"search\" value=\"" + esc(q) + "\" placeholder=\"" + esc(local("Search an original label, habitat, or creature…", "搜索原始标签、栖息地或精灵…")) + "\"><button class=\"button-secondary\" data-open-regex=\"map\">" + (state.regex.map ? ".* " + esc(local("Pattern on", "模式已启用")) : ".* " + esc(local("Pattern", "模式搜索"))) + "</button><span class=\"badge\">" + statusCount(markerRows.length + visibleHabitat.length + visibleAreas.length) + " " + esc(local("matching groups", "组符合条件")) + "</span></div>" +
      "<section class=\"detail-section\"><div class=\"inline-title\"><div><span class=\"section-label\">" + esc(local("S3 COMMUNITY MAP INDEX", "S3社区地图索引")) + "</span><h3>" + esc(local("Original marker names", "原始地图标签")) + "</h3></div><span class=\"badge\">" + esc(local("Updated", "更新于")) + " " + esc(data?.sourceUpdatedOn || "date unavailable") + "</span></div><div class=\"location-index\" aria-label=\"" + esc(local("Original community map marker names", "社区地图原始标签")) + "\">" + (markerMarkup || "<div class=\"empty-state\">" + esc(local("No marker name matches.", "没有符合条件的地图标签。")) + "</div>") + "</div></section>" +
      "<section class=\"detail-section\"><div class=\"inline-title\"><div><span class=\"section-label\">" + esc(local("HANDBOOK INDEX", "图鉴索引")) + "</span><h3>" + esc(local("Catalog areas", "索引区域")) + "</h3></div><span class=\"badge\">" + esc(local("Community snapshot", "社区资料快照")) + " · " + esc(data?.handbookSnapshot?.version || "unknown") + "</span></div><p class=\"field-hint\">" + esc(local("These labels describe source handbook sections. They are not asserted as geographic region borders.", "这些标签表示来源图鉴的章节，不代表已核实的地理区域边界。")) + "</p>" + (areaMarkup || "<div class=\"empty-state\">" + esc(local("No handbook area matches.", "没有符合条件的图鉴区域。")) + "</div>") + "</section>" +
      "<section class=\"detail-section\"><div class=\"inline-title\"><div><span class=\"section-label\">" + esc(local("CREATURE FIELD NOTES", "精灵栖息地资料")) + "</span><h3>" + esc(local("All indexed habitat labels", "全部栖息地标签")) + "</h3></div><span class=\"badge\">" + statusCount(visibleHabitat.length) + " " + esc(local("shown", "项显示")) + "</span></div><p class=\"field-hint\">" + esc(local("Each entry opens the Dex forms linked to that exact source label. A habitat note does not prove current spawn timing or availability.", "每项都会打开与该来源标签准确关联的图鉴形态。栖息地说明不代表当前出现时间或可用状态已核实。")) + "</p>" + (habitatMarkup || "<div class=\"empty-state\">" + esc(local("No habitat label matches.", "没有符合条件的栖息地标签。")) + "</div>") + "</section>" +
      "<section class=\"home-section\"><div class=\"panel\"><span class=\"card-kicker\">" + esc(local("SEASON 4", "第四季")) + "</span><h3>" + esc(local("The Moon surface is confirmed as a season destination.", "官方已确认月球表面为本季目的地。")) + "</h3><p class=\"copy-block\">" + esc(local("The official opening notice does not publish a complete coordinate atlas or every unlock step. Follow the current season assignment and in-game map prompts for exact access.", "官方开季公告没有提供完整坐标图或全部解锁步骤。请按当前赛季任务和游戏内地图提示确认具体通行方式。")) + "</p>" + sourceChips(["s4-opening", "s4-notes"]) + "</div></section>" +
      "<p class=\"field-hint\">" + esc(local("Map index", "地图索引")) + ": <a href=\"" + esc(safeUrl(data?.source)) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + esc(local("original S3 index", "S3原始索引")) + " ↗</a> · " + esc(local("Coordinate viewer", "坐标地图")) + ": <a href=\"" + esc(safeUrl(data?.externalMap)) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + esc(local("community viewer", "社区地图")) + " ↗</a></p></div>";
  }

  function renderMap() {
    return renderRichMap();
    const data = DB.locations;
    const q = $("#map-query")?.value || state.mapQuery || "";
    const regex = regexFor(q, "map");
    const anchors = (data?.anchors || []).filter(item => fieldMatches(item.label, q, regex));
    const magic = anchors.filter(item => item.kind.startsWith("Magic"));
    const night = anchors.filter(item => item.kind.startsWith("Eternal"));
    return `<div class="view-content">
      <div class="section-heading"><div><span class="section-label">LOCATION ATLAS / S3 COMMUNITY SNAPSHOT</span><h2>World index</h2><p>Exact marker names, one external coordinate map, and no pretend route lines. This is a carefully sourced index, not a current full-coverage survey.</p></div><div class="section-actions"><a class="button-secondary" href="${esc(safeUrl(data?.externalMap))}" target="_blank" rel="noopener noreferrer">Open interactive map ↗</a></div></div>
      <div class="map-preview"><span class="star-pin pin-a" aria-hidden="true">✦</span><span class="star-pin pin-b" aria-hidden="true">✧</span><span class="star-pin pin-c" aria-hidden="true">✦</span><div class="map-copy"><span class="card-kicker">SCHEMATIC · NOT TO SCALE</span><h3>A location index, not a route drawing.</h3><p>The original coordinate geometry is available from the linked community map. The decorative field above carries no location data.</p></div></div>
      <div class="location-summary"><span class="badge community">${statusCount(data?.anchors.filter(x => x.kind.startsWith("Magic")).length)} Magic Source labels</span><span class="badge community">${statusCount(data?.anchors.filter(x => x.kind.startsWith("Eternal")).length)} Eternal Night labels</span><span class="badge">S3 index page: ${esc(data?.sourceUpdatedOn)}</span></div>
      <div class="status-banner"><span class="mark">!</span><div><strong>Coverage limit.</strong><p>The page labels itself S3 and shows an August 26, 2026 update. Its named anchors are exact community-index text, but S4 availability, subarea boundaries, coordinate systems, travel prerequisites, and completeness are unverified. No map tiles, point coordinates, or region outlines are copied.</p></div></div>
      <div class="section-heading" style="margin-top:1.6rem"><div><h2 style="font-size:1.35rem">Named marker lookup</h2><p>Search original labels. No English location names were verified, so the Chinese strings are retained.</p></div></div>
      <div class="dex-toolbar"><label class="sr-only" for="map-query">Search named map markers</label><input id="map-query" class="field-control" type="search" value="${esc(q)}" placeholder="Search an original label…"><button class="button-secondary" data-open-regex="map">${state.regex.map ? ".* Pattern on" : ".* Pattern"}</button><span class="badge">${statusCount(anchors.length)} ${esc(local("matches", "个结果"))}</span></div>
      <div class="location-index" aria-label="Named community map markers">${anchors.map((item, index) => `<div class="location-item"><span class="locator">${String(index + 1).padStart(2, "0")}</span><span class="label" lang="zh-Hans">${esc(item.label)}<small>${esc(item.kind === "Magic-source index label" ? "Community marker label · coordinates not included" : "Community Eternal Night marker label · current status unknown")}</small></span><button class="icon-button" type="button" data-bookmark="location:${esc(item.label)}" aria-label="Save ${esc(item.label)}">◇</button></div>`).join("") || `<div class="empty-state">${esc(local("No location names match.", "搵唔到相符嘅地名。"))}</div>`}</div>
      <section class="home-section"><div class="panel"><span class="card-kicker">SEASON 4</span><h3 style="margin:.45rem 0">The Moon surface is confirmed as a season destination.</h3><p class="copy-block">The official opening notice confirms the destination, but does not publish a complete coordinate atlas or every unlock step. Follow the current season assignment and in-game map prompts for access instructions.</p>${sourceChips(["s4-opening", "s4-notes"])}</div></section>
      <p class="field-hint" style="margin-top:.9rem">BWiki map: <a href="${esc(safeUrl(data?.source))}" target="_blank" rel="noopener noreferrer">original S3 map index ↗</a> · Interactive viewer: <a href="${esc(safeUrl(data?.externalMap))}" target="_blank" rel="noopener noreferrer">community map ↗</a></p>
    </div>`;
  }

  function renderGuides() {
    const query = $("#guide-query")?.value || state.articleQuery || "";
    const regex = regexFor(query, "guides");
    const articles = DB.articles.filter(item => fieldMatches(`${item.title} ${item.titleZh} ${item.category}`, query, regex));
    const selected = DB.articles.find(item => item.id === route.articleId) || articles[0] || DB.articles[0];
    const body = selected ? `<article class="article-content"><span class="section-label">${esc(selected.category)} / EDITION CHECKED ${esc(selected.updatedOn)}</span><h2>${esc(titleForArticle(selected))}</h2><p class="article-deck">${esc(introForArticle(selected))}</p><div class="article-meta"><span class="badge ${selected.confidence.startsWith("Official") ? "official" : "community"}">${esc(selected.confidence)}</span><span class="badge">Last checked ${esc(selected.updatedOn)}</span><button class="button-quiet button-small" data-bookmark="article:${esc(selected.id)}">${state.bookmarks.includes(`article:${selected.id}`) ? "◆ Saved" : "◇ Save article"}</button></div><div class="article-copy">${selected.sections.map(section => `<section><h3>${esc(local(section.heading, section.headingZh))}</h3><p>${esc(local(section.text, section.textZh))}</p><div class="article-sources">${sourceChips(section.sources)}</div></section>`).join("")}</div><div class="source-note" style="margin-top:1rem"><strong>Editorial limit:</strong> This article separates official dated statements from community advice. Recheck current in-game prompts for live conditions.</div></article>` : `<div class="empty-state">No article is selected.</div>`;
    return `<div class="view-content"><div class="section-heading"><div><span class="section-label">GUIDES / STRATEGY / SEASON NOTES</span><h2>Field articles</h2><p>${DB.articles.length} original articles, each with source links, a review date, and written Cantonese alongside English.</p></div><div class="section-actions"><button class="button-secondary button-small" data-export="article-md" data-article="${esc(selected?.id || "")}">Export current article</button></div></div>
      <div class="guide-layout"><aside class="article-index" aria-label="Article index"><label class="sr-only" for="guide-query">Search article titles</label><input id="guide-query" class="field-control" type="search" value="${esc(query)}" placeholder="Find an article…"><button class="button-quiet button-small" data-open-regex="guides">${state.regex.guides ? ".* Pattern on" : ".* Pattern"}</button>${articles.map(item => `<button type="button" data-go="article:${esc(item.id)}" ${selected?.id === item.id ? 'aria-current="true"' : ""}>${esc(titleForArticle(item))}<small style="display:block;color:var(--muted)">${esc(item.category)}</small></button>`).join("")}</aside>${body}</div></div>`;
  }

  function renderSources() {
    return `<div class="view-content"><div class="section-heading"><div><span class="section-label">CITATION / FRESHNESS / REUSE</span><h2>Source desk</h2><p>Official notices support dated event claims. Community indexes support discovery, not official completeness. Each record below states what its source can and cannot establish.</p></div><div class="section-actions"><button class="button-secondary button-small" data-export="sources-json">Export source register ↗</button></div></div>
      <div class="status-banner"><span class="mark">◎</span><div><strong>${esc(local("Reviewed 25 September 2026.", "核对日期：2026年9月25日。"))}</strong><p>${esc(local("The BiliWiki list reports 621 results and carries a September 13 update date. The independent Roco Kingdom World index reports 644 entries. The separate detail snapshot is pinned to commit 71eba6e4cd5e0f01a5cda60ec5560f58aae2a1c2, version s4-2026-09-24, and uses CC BY-NC-SA 4.0. These community counts use different snapshots and keys, and none is an official total. This independent fan reference is not affiliated with Tencent or 4399.", "BiliWiki列表显示621条结果，页面更新日期为9月13日。独立的Roco Kingdom World索引显示644条记录。另一份详情快照固定于提交编号71eba6e4cd5e0f01a5cda60ec5560f58aae2a1c2，版本为s4-2026-09-24，采用CC BY-NC-SA 4.0授权。这些社区数字来自不同快照和编号方式，没有一个是官方总数。本独立粉丝资料与腾讯或4399无关。"))}</p></div></div>
      <div class="panel" style="margin:1rem 0"><h3>${esc(local("Counting and coverage", "数量与收录范围"))}</h3><p class="copy-block" style="margin-top:.4rem">${esc(local("This edition's saved snapshot has ", "本版保存快照共有"))}<strong>625 ${esc(local("form rows", "条形态记录"))}</strong> ${esc(local("across", "分属"))} <strong>466 ${esc(local("catalog numbers", "个目录编号"))}</strong>${esc(local(". The current BiliWiki list shows 621 results; the Roco Kingdom World fan index shows 644 entries. These figures do not share a proven one-to-one row mapping. Joined fields add 824 skills, 311 learnsets, 275 evolution groups, 466 handbook entries, 2,342 task topics, and 120 type combinations.", "。目前BiliWiki列表显示621条结果；Roco Kingdom World粉丝索引显示644条记录。现未证明这些数字可以逐行一对一配对。关联资料另有824项技能、311份学习表、275组进化路线、466条图鉴记录、2,342项任务主题和120种属性组合。"))}</p><p class="copy-block" style="margin-top:.45rem">${esc(local("The source files include text and structured community reference data. They do not include creature portraits or map artwork. Missing values remain undocumented here; a source row is not proof that the live client has the same current rule.", "资料文件包含文字和结构化社区参考数据，没有精灵肖像或地图美术。未提供的字段会保留为未记录；来源条目不能证明当前客户端仍采用相同规则。"))}</p><p class="field-hint">${esc(local("The local-only keys and unresolved differences are listed in the roster comparison article.", "本地编号同未解决差异列于精灵数量比较文章。"))} <a href="#article/roster-snapshots" data-go="article:roster-snapshots">${esc(local("Open article", "打开文章"))} ↗</a></p></div>
      <div class="sources-list">${DB.sources.map(item => `<article class="source-row"><span class="badge ${item.kind.startsWith("Official") ? "official" : "community"}">${esc(item.kind)}</span><div><h3>${esc(item.title)}</h3><p>${esc(item.scope)}</p><small class="field-hint">Checked ${esc(item.checkedOn)}</small></div><a href="${esc(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer">Open source ↗</a></article>`).join("")}</div>
      <section class="home-section"><div class="panel"><h3>Reuse and licensing</h3><p class="copy-block" style="margin-top:.4rem">The creature list and S3 map index state CC BY-NC-SA 4.0. This site credits those sources, limits derivative use to listed text fields and exact marker names, makes no artwork claim, and carries the same terms for those data derivatives. The external interactive map is linked, not embedded or copied, because a reuse license for its marker set was not identified.</p><p class="copy-block" style="margin-top:.45rem">Article prose is original and cited per section. Official notices and community guide links remain the property of their publishers.</p></div></section>
    </div>`;
  }

  function renderUpdates() {
    return `<div class="view-content"><div class="section-heading"><div><span class="section-label">EDITION HISTORY</span><h2>Edition log</h2><p>Facts are tied to the date on which their source was reviewed. Changes to source data are not represented as official game patches.</p></div></div>
      <p class="field-hint" style="margin:.8rem 0">${esc(local("This edition has two dated entries. New editions will be added here.", "本版有两条带日期的记录。新版资料会在此列出。"))}</p>
      <div class="changelog-list"><article class="changelog-entry"><time datetime="2026-09-25">2026-09-25</time><div><h3>Added a roster-count comparison</h3><p>Expanded the guide to 21 articles and added a bilingual comparison plus separate source records for this edition's 625 saved form rows, the current BiliWiki page's 621 results, and the independent index's 644 entries. The row-level mismatch remains unresolved; no creature data was added or removed.</p></div></article><article class="changelog-entry"><time datetime="2026-09-24">2026-09-24</time><div><h3>First World field edition</h3><p>Added the 625-row community form index, 43 named S3 marker labels, 20 sourced articles, official S4 notes, English and Cantonese reading modes, and local export tools. Current season and event notices carry their review date and evidence limits.</p></div></article></div>
    </div>`;
  }

  function renderSettings() {
    const groupOptions = ["Atlas", "Field notes", "Tools", "Favorites"];
    return `<div class="view-content"><div class="section-heading"><div><span class="section-label">LOCAL CONTROLS / DEVICE ONLY</span><h2>Settings and tools</h2><p>Preferences, bookmarks, recent pages, and reminder schedules stay in this browser. This public reference has no account or server-side profile.</p></div></div>
      <div class="settings-grid">
        <section class="settings-section"><h3>Language and tone</h3><div class="control-row"><div><strong>Reading mode</strong><small>Original creature names remain in their source language.</small></div><div class="lang-row"><button class="lang-chip" data-lang="en" aria-pressed="${state.lang === "en"}">English</button><button class="lang-chip" data-lang="zh" aria-pressed="${state.lang === "zh"}">廣東話</button><button class="lang-chip" data-lang="both" aria-pressed="${state.lang === "both"}">Bilingual</button></div></div>
          <label class="control-row"><span><strong>English playful tone</strong><small>Adjusts helper notices, never source facts.</small></span><span class="range-line"><span class="range-value">${state.funnyEn}/3</span><input type="range" min="0" max="3" step="1" data-state="funnyEn" value="${state.funnyEn}" aria-label="English playful tone level"></span></label>
          <label class="control-row"><span><strong>Cantonese playful tone</strong><small>Separate from the English setting.</small></span><span class="range-line"><span class="range-value">${state.funnyZh}/3</span><input type="range" min="0" max="3" step="1" data-state="funnyZh" value="${state.funnyZh}" aria-label="Cantonese playful tone level"></span></label>
        </section>
        <section class="settings-section"><h3>Appearance</h3><div class="settings-fields"><label class="field-label">Theme<select class="field-control" data-state="theme"><option value="system" ${state.theme === "system" ? "selected" : ""}>System</option><option value="light" ${state.theme === "light" ? "selected" : ""}>Light</option><option value="dark" ${state.theme === "dark" ? "selected" : ""}>Dark</option></select></label><label class="field-label">Accent<select class="field-control" data-state="accent">${[["gold","Amber"],["teal","Harbor teal"],["rose","Rosewood"],["violet","Night violet"]].map(([v,l]) => `<option value="${v}" ${state.accent === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
          <label class="field-label">Text scale <span class="range-line"><span class="range-value">${Math.round(state.scale * 100)}%</span><input type="range" min="0.9" max="1.18" step="0.02" data-state="scale" value="${state.scale}" aria-label="Text scale"></span></label><label class="field-label">Corner shape <span class="range-line"><span class="range-value">${state.radius}px</span><input type="range" min="8" max="28" step="2" data-state="radius" value="${state.radius}" aria-label="Corner roundness"></span></label>
          <label class="field-label">Reading density <span class="range-line"><span class="range-value">${Math.round(state.density * 100)}%</span><input type="range" min="0.82" max="1.2" step="0.04" data-state="density" value="${state.density}" aria-label="Reading density"></span></label><div class="field-label">Contrast <button class="switch" role="switch" aria-checked="${state.contrast}" data-toggle="contrast" aria-label="High contrast"></button></div>
        </div></section>
        <section class="settings-section"><h3>Tabs, pins, and groups</h3><p class="field-hint" style="margin-bottom:.65rem">Use the arrows to reorder. Pins stay visible in the left rail. Change a group to collect related tabs; groups become sections in the navigation.</p><div class="tab-settings-list">${state.order.map((id,index) => { const item=NAV.find(x=>x.id===id); return `<div class="tab-setting"><span>${esc(navTitle(item))} ${state.pinned.includes(id) ? "◆" : ""}</span><select class="field-control" data-tab-group="${id}" aria-label="Group ${esc(navTitle(item))}">${groupOptions.map(group=>`<option value="${group}" ${(state.groups[id] || item.group) === group ? "selected" : ""}>${esc(local(group, group))}</option>`).join("")}</select><span><button class="button-secondary button-small" data-tab-move="${id}" data-direction="-1" aria-label="Move ${esc(navTitle(item))} earlier" ${index === 0 ? "disabled" : ""}>↑</button> <button class="button-secondary button-small" data-tab-move="${id}" data-direction="1" aria-label="Move ${esc(navTitle(item))} later" ${index === state.order.length - 1 ? "disabled" : ""}>↓</button> <button class="button-quiet button-small" data-tab-pin="${id}" aria-label="${state.pinned.includes(id) ? "Unpin" : "Pin"} ${esc(navTitle(item))}">${state.pinned.includes(id) ? "Unpin" : "Pin"}</button></span></div>`; }).join("")}</div></section>
        <section class="settings-section"><h3>Local vocabulary file</h3><div class="drop-zone"><p class="copy-block">Choose a version 1 JSON file shaped as <code>{"schemaVersion":1,"entries":{"phrase":"replacement"}}</code>. The file is checked in memory only. This public edition has no authenticated area, so it will <strong>not</strong> apply private wording to the page or persist the file. A future authenticated mode must pass the private upload contract first.</p><label class="field-label" style="margin-top:.7rem">Choose JSON file<input class="field-control" id="vocabulary-file" type="file" accept="application/json,.json"></label><div id="vocabulary-status" class="field-hint" role="status" style="margin-top:.5rem">${esc(state.vocab.notice || "No file loaded. Nothing leaves this browser.")}</div><div class="field-actions"><button class="button-secondary button-small" data-vocab-clear>Clear file status</button></div></div><p class="field-hint" style="margin-top:.6rem">The selected file contents are never stored, exported, logged, sent to a server, or added to recent-page history.</p></section>
        <section class="settings-section"><h3>Reading focus and schedule</h3><div class="settings-fields"><label class="field-label">Focus label<input class="field-control" maxlength="32" data-state="focusLabel" value="${esc(state.focusLabel)}"></label><label class="field-label">Reminder time (local)<input class="field-control" type="time" data-schedule-time value="${esc(state.schedule.time)}"></label></div><div class="control-row"><div><strong>Focus mask</strong><small>Presentation-only blur on chosen sections; it is not a privacy or account lock.</small></div><button class="switch" role="switch" aria-checked="${state.focusMode}" data-toggle="focusMode" aria-label="Enable focus mask"></button></div><div class="control-row"><div><strong>Reminder while this page is open</strong><small>No background schedule. The reminder stops when this page closes.</small></div><button class="switch" role="switch" aria-checked="${state.schedule.enabled}" data-toggle="schedule" aria-label="Enable local reminder"></button></div><label class="field-label" style="margin-top:.6rem">Reminder note<textarea class="field-control" rows="2" maxlength="180" data-schedule-note>${esc(state.schedule.note)}</textarea></label><div class="field-actions"><button class="button-secondary button-small" data-notification-test>Send a sample notice</button><button class="button-secondary button-small" data-random-tip>Random field note ✦</button></div></section>
        <section class="settings-section"><h3>Local field kit</h3><div class="field-actions"><button class="button-secondary button-small" data-export="bookmarks-json">Export saved notes</button><button class="button-secondary button-small" data-export="settings-json">Export settings</button><label class="button-secondary button-small">Import settings<input id="settings-file" type="file" accept="application/json,.json" hidden></label><button class="button-secondary button-small" data-export="print">Print current page</button></div><div class="control-row" style="margin-top:.6rem"><div><strong>Reset browser data</strong><small>Removes preferences, saved notes, and recent-page history from this browser. Guide data is not touched.</small></div><button class="button-warn button-small" data-reset-open>Reset…</button></div></section>
        ${renderStatusReportingSettings()}
        <section class="settings-section"><h3>Accounts and protection</h3><p class="copy-block">This is an anonymous, static reference with no account, credentials, shared profile, or private content. Credential editing, account pairing, QR authenticators, and recovery codes do not apply to this edition. The focus mask is cosmetic only; do not enter passwords or secrets here.</p></section>
      </div></div>`;
  }

  function renderStatusReportingSettings() {
    const bridge = typeof window.rocoDesktop?.getStatus === "function" && typeof window.rocoDesktop?.setStatusEnabled === "function";
    const current = bridge ? DESKTOP_STATUS : { state: "browser", configured: false, enabled: false, lastUpdated: null };
    const copy = {
      browser: ["The browser edition does not connect to Status Hub.", "浏览器版不会连接 Status Hub。"],
      checking: ["Checking local status configuration…", "正在检查本机状态设定…"],
      starting: ["Starting the optional status session…", "正在启动可选状态记录…"],
      "configuration-required": ["Status Hub is not configured for this desktop. Nothing has been sent.", "此电脑尚未设定 Status Hub，未有资料传送。"],
      off: ["Off. Nothing is sent.", "已关闭，不会传送资料。"],
      reporting: ["The desktop session is being reported.", "正在报告桌面工作阶段。"],
      unavailable: ["Status Hub has not confirmed this session. The guide remains available.", "Status Hub 尚未确认此工作阶段，指南仍可使用。"],
      finishing: ["Finishing the status session…", "正在结束状态记录…"],
      unconfirmed: ["The final update was not confirmed. The last record may remain open.", "未能确认最后更新，上一条记录可能仍然开启。"]
    };
    const [english, cantonese] = copy[current.state] || copy.unavailable;
    const canChange = bridge && current.configured && !["checking", "starting", "finishing"].includes(current.state);
    const toggle = bridge
      ? `<button class="switch" type="button" role="switch" aria-checked="${Boolean(current.enabled)}" aria-label="${esc(local("Enable optional Status Hub reporting", "启用可选 Status Hub 状态报告"))}" data-status-hub-toggle ${canChange ? "" : "disabled"}></button>`
      : `<span class="badge unavailable">${esc(local("Desktop only", "只限桌面版"))}</span>`;
    const lastUpdated = current.lastUpdated
      ? `<p class="field-hint" style="margin-top:.5rem">${esc(local("Last confirmed update: ", "最后确认更新："))}${esc(formatLocalTimestamp(current.lastUpdated))}</p>`
      : "";
    return `<section class="settings-section"><h3>${esc(local("Optional project status", "可选专案状态"))}</h3>
      <div class="control-row"><span><strong>Status Hub reporting</strong><small role="status" aria-live="polite">${esc(local(english, cantonese))}</small></span>${toggle}</div>
      <p class="field-hint" style="margin-top:.6rem">${esc(local("Status reporting starts off on every launch. When enabled, it sends the project and source ref, machine name, and any available local checkout paths, refs, commit IDs, dirty state, and measured size. A packaged build without repository metadata has no checkout inventory.", "每次启动时状态报告都会关闭。启用后会传送专案和来源 ref、电脑名称，以及可用的本机目录、ref、提交编号、修改状态和量度大小。没有专案资料的安装版本不会传送目录清单。"))}</p>
      <p class="field-hint">${esc(local("Searches, bookmarks, notes, and reading history are never read or sent. The browser edition never connects to Status Hub. The Status Hub credential stays in the desktop process and is never exposed to this page.", "系统不会读取或传送搜寻、书签、笔记或浏览记录。浏览器版不会连接 Status Hub。Status Hub 凭证只保留在桌面程序内，本页面无法读取。"))}</p>${lastUpdated}</section>`;
  }

  async function refreshDesktopStatus() {
    const bridge = window.rocoDesktop;
    if (typeof bridge?.getStatus !== "function") {
      DESKTOP_STATUS = { desktop: false, configured: false, enabled: false, state: "browser", lastUpdated: null };
      return;
    }
    try {
      DESKTOP_STATUS = await bridge.getStatus();
    } catch {
      DESKTOP_STATUS = { desktop: true, configured: false, enabled: false, state: "unavailable", lastUpdated: null };
    }
    if (route.page === "settings") renderApp();
  }

  async function setDesktopStatusEnabled(enabled) {
    const bridge = window.rocoDesktop;
    if (typeof bridge?.setStatusEnabled !== "function") return;
    DESKTOP_STATUS = { ...DESKTOP_STATUS, enabled: enabled === true || DESKTOP_STATUS.enabled, state: enabled ? "starting" : "finishing" };
    renderApp();
    try {
      DESKTOP_STATUS = await bridge.setStatusEnabled(enabled === true);
    } catch {
      DESKTOP_STATUS = { ...DESKTOP_STATUS, enabled: enabled === true, state: "unavailable" };
    }
    renderApp();
    if (DESKTOP_STATUS.state === "reporting") toast(local("Status reporting is enabled.", "状态报告已启用。"));
    else if (DESKTOP_STATUS.state === "unconfirmed") toast(local("Status reporting stopped, but the final update was not confirmed.", "状态报告已停止，但未能确认最后更新。"), "warning");
    else if (DESKTOP_STATUS.state === "unavailable" || DESKTOP_STATUS.state === "configuration-required") toast(local("Status reporting is unavailable. The guide remains usable.", "状态报告暂时无法使用，指南仍可继续浏览。"), "warning");
    else if (!enabled) toast(local("Status reporting is off.", "状态报告已关闭。"));
  }

  function renderApp() {
    const view = $("#app-view");
    renderBuildProvenance();
    if (!view || !DB.creatures || !DB.locations || !DB.articles || !DB.sources) return;
    view.setAttribute("aria-busy", "false");
    const content = route.page === "home" ? renderHome() : route.page === "dex" ? renderDex() : route.page === "types" ? renderTypeChart() : route.page === "map" ? renderMap() : route.page === "guides" ? renderGuides() : route.page === "sources" ? renderSources() : route.page === "updates" ? renderUpdates() : renderSettings();
    const locked = state.locked[route.page];
    view.innerHTML = `${content}${locked ? `<div class="lock-screen"><div><span class="section-label">${esc(state.focusLabel || "Field school")}</span><h2>${esc(local("Take a breath, then continue.", "抖擻精神，再慢慢睇。"))}</h2><p>This is a local visual mask, not account security. Any visitor can remove it.</p><button class="button" data-unlock-page="${route.page}">Show this page</button></div></div>` : ""}`;
    if (state.focusMode) $$(".view-content", view).forEach(el => el.classList.add("focus-blurred"));
    document.title = `${route.page === "home" ? "Overview" : NAV.find(item => item.id === route.page)?.en || "Guide"} · Roco Kingdom: World`;
  }

  function safeSearchAll(query) {
    const q = query.trim();
    if (!q) return [];
    const regex = regexFor(q, "global");
    const found = [];
    for (const row of DB.creatures.records) {
      if (fieldMatches(DB.creatureSearch.get(row.recordId) || `${row.name} ${row.catalogNumber} ${row.form || ""} ${(row.types || []).join(" ")}`, q, regex)) {
        found.push({ title: `${row.catalogNumber} · ${row.name}`, sub: `${row.form || "Form not named"} · ${(row.types || []).join(" / ") || "Type not listed"}`, kind: "Creature", open: `creature:${row.recordId}`, order: 1 });
        if (found.length >= 7) break;
      }
    }
    for (const item of [...DB.locations.anchors, ...(DB.locations.habitatIndex || []), ...(DB.locations.handbookAreas || [])]) if (fieldMatches(item.label, q, regex)) found.push({ title: item.label, sub: item.kind || `${item.count} linked form records`, kind: "Location", open: "map", order: 2 });
    for (const [key, value] of Object.entries(DB.typeChart?.records || {})) if (fieldMatches(`${key} ${(value.weak || []).map(item => item.type).join(" ")} ${(value.resist || []).map(item => item.type).join(" ")}`, q, regex)) found.push({ title: key.replaceAll("|", " / "), sub: "Type matchup", kind: "Type chart", open: "types", order: 2 });
    for (const item of DB.articles) if (fieldMatches(`${item.title} ${item.titleZh} ${item.category}`, q, regex)) found.push({ title: titleForArticle(item), sub: introForArticle(item), kind: "Article", open: `article:${item.id}`, order: 3 });
    return found.sort((a, b) => a.order - b.order).slice(0, 20);
  }

  function renderGlobalSearch(query) {
    const panel = $("#search-results");
    if (!panel) return;
    const results = safeSearchAll(query);
    if (!query.trim()) { panel.hidden = true; panel.innerHTML = ""; return; }
    const error = regexFor(query, "global")?.error;
    panel.hidden = false;
    panel.innerHTML = `${error ? `<div class="empty-state">${esc(error)}</div>` : results.map(item => `<button class="result-item" type="button" data-go="${esc(item.open)}"><span><strong>${esc(item.title)}</strong><small>${esc(item.sub)}</small></span><span class="result-kind">${esc(item.kind)}</span></button>`).join("") || `<div class="empty-state">${esc(local("No matches yet.", "暂时搵唔到结果。"))}</div>`}`;
  }

  function openPalette() {
    const dialog = $("#palette-dialog");
    dialog.showModal();
    state.paletteMode = "pages";
    $$("[data-palette-mode]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.paletteMode === state.paletteMode)));
    $("#palette-search").value = "";
    renderPalette("");
    $("#palette-search").focus();
  }

  function renderPalette(query) {
    const target = $("#palette-results");
    const q = query.trim();
    const regex = regexFor(q, "palette");
    const tabMatches = NAV.filter(item => fieldMatches(`${item.en} ${item.zh} ${state.groups[item.id] || item.group}`, q, regex)).map(item => ({ title: navTitle(item), sub: "Page", open: item.id }));
    const articleMatches = DB.articles.filter(item => fieldMatches(`${item.title} ${item.titleZh} ${item.category}`, q, regex)).map(item => ({ title: titleForArticle(item), sub: "Guide", open: `article:${item.id}` }));
    const savedMatches = state.bookmarks.map(key => ({ key, title: bookmarkLabel(key) })).filter(item => fieldMatches(item.title, q, regex)).map(item => ({ title: item.title, sub: "Saved", open: item.key }));
    const recentMatches = state.history.map(item => ({ title: bookmarkLabel(item.route), sub: "Recent", open: item.route })).filter(item => fieldMatches(item.title, q, regex));
    const byMode = { pages: tabMatches, guides: articleMatches, saved: savedMatches, recent: recentMatches };
    const list = (byMode[state.paletteMode] || tabMatches).slice(0, 30);
    target.innerHTML = regex?.error ? `<div class="empty-state">${esc(regex.error)}</div>` : list.map(item => `<button class="palette-result" type="button" data-go="${esc(item.open)}"><span>${esc(item.title)}</span><small>${esc(item.sub)}</small></button>`).join("") || `<div class="empty-state">Search tabs, guide titles, saved records, and recent pages.</div>`;
  }

  function bookmarkLabel(key) {
    if (key.startsWith("creature:")) {
      const row = DB.creatures.records.find(item => item.recordId === key.slice(9));
      return row ? `${row.catalogNumber} · ${row.name}` : key;
    }
    if (key.startsWith("article:")) return titleForArticle(DB.articles.find(item => item.id === key.slice(8)) || { title: key, titleZh: key });
    if (key.startsWith("location:")) return key.slice(9);
    if (key.startsWith("guides/")) return titleForArticle(DB.articles.find(item => item.id === key.slice(7)) || { title: key, titleZh: key });
    const id = key.startsWith("article:") ? key.slice(8) : key;
    return NAV.find(item => item.id === id)?.en || id;
  }

  function toggleBookmark(key) {
    state.bookmarks = state.bookmarks.includes(key) ? state.bookmarks.filter(item => item !== key) : [key, ...state.bookmarks].slice(0, 300);
    persist();
    $("#bookmark-count").textContent = statusCount(state.bookmarks.length);
    renderApp();
    const dialog = $("#detail-dialog");
    if (dialog.open) {
      const id = $("#detail-content [data-record]")?.dataset.record;
      if (id) openCreature(DB.creatures.records.find(row => row.recordId === id));
    }
    toast(state.bookmarks.includes(key) ? "Saved in this browser." : "Removed from saved notes.");
  }

  function exportFile(name, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = name; link.style.display = "none";
    document.body.append(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`Created ${name} locally.`);
  }

  function exportedCreature(row) {
    const snapshot = DB.creatureDetails;
    const profile = snapshot?.records?.[row.recordId] || null;
    const attributes = profile ? snapshot.catalog?.[profile.dataId] || {} : {};
    const handbook = profile?.handbookId ? snapshot.handbooks?.[profile.handbookId] || null : null;
    const learnset = profile?.learnsetId ? snapshot.learnsets?.[profile.learnsetId] || null : null;
    const skillIds = [...new Set([
      attributes.feature_skill_id,
      learnset?.feature_skill,
      ...(learnset?.native_skills || []).map(item => item.skill),
      ...(learnset?.blood_skills || []).map(item => item.skill),
      ...(learnset?.skill_stones || []),
      ...(snapshot?.skillStoneTopics?.[profile?.dataId] || []).map(item => item.topic)
    ].filter(Boolean))];
    return {
      ...row,
      joinedData: {
        sourceRevision: snapshot ? { ...snapshot.snapshot } : null,
        profile,
        originalCatalogFields: attributes,
        handbook,
        learnset,
        skills: Object.fromEntries(skillIds.map(id => [id, snapshot?.skills?.[id]]).filter(([, skill]) => skill)),
        evolutionPaths: (profile?.evolutionIds || []).map(id => ({ id, paths: snapshot?.evolutions?.[id] || [] })),
        skillStoneTopics: snapshot?.skillStoneTopics?.[profile?.dataId] || [],
        typeMatchup: DB.typeChart?.records?.[(attributes.types || []).join("|")] || null,
        historicalTrainingSample: DB.trainingReference?.records?.[String(profile?.gameId)] || null,
        trainingSampleRevision: DB.trainingReference?.snapshot || null
      }
    };
  }
  function csvCell(value) { return `"${String(value ?? "").replace(/"/g, '""')}"`; }
  function markdownValue(value) {
    return String(value ?? "Not listed").replace(/\\/g, "\\\\").replace(/\r?\n/g, " ").replace(/\|/g, "\\|");
  }
  function exportRecords(format, rows) {
    const list = rows || visibleDex;
    const date = new Date().toISOString().slice(0, 10);
    if (format === "json") exportFile(`roco-creature-records-${date}.json`, JSON.stringify({ checkedOn: DB.creatures.checkedOn, attribution: DB.creatures.source, license: DB.creatures.license, joinedSnapshot: DB.creatureDetails?.snapshot || null, typeChartSnapshot: DB.typeChart?.snapshot || null, records: list.map(exportedCreature) }, null, 2), "application/json;charset=utf-8");
    else if (format === "csv") {
      const fields = ["catalogNumber","recordId","name","types","trait","hp","speed","physicalAttack","specialAttack","physicalDefense","specialDefense","total","traitEffect","evolutionStage","form","season","eggGroup","height","weight","rideable","coRideable","description","habitat","habitatAreas","handbookTasks","featureSkill","nativeSkills","bloodlineSkills","skillStones","skillStoneTopics","evolutionPaths","affinity","ecology","weakTo","resists","historicalTrainingSample","trainingSampleRevision","originalCatalogFields","sourcePage","joinedSnapshot"];
      const detailed = list.map(exportedCreature);
      const lines = [fields.map(csvCell).join(","), ...detailed.map(item => fields.map(field => {
        const row = item;
        const joined = item.joinedData;
        const skills = joined.skills || {};
        const learnset = joined.learnset || {};
        const value = field === "types" ? (row.types || []).join(" | ")
          : field === "sourcePage" ? row.source?.page
          : field === "total" ? row.stats?.total
          : field === "habitat" ? joined.handbook?.habitat
          : field === "habitatAreas" ? (joined.handbook?.areas || []).join(" | ")
          : field === "handbookTasks" ? (joined.handbook?.topics || []).map(topic => [topic.text, topic.target, ...(topic.rewards || []).map(reward => reward.name + " ×" + reward.count)].filter(Boolean).join(" / ")).join(" | ")
          : field === "featureSkill" ? skills[row.featureSkillId || learnset.feature_skill || joined.originalCatalogFields.feature_skill_id]?.name
          : field === "nativeSkills" ? (learnset.native_skills || []).map(item => (skills[item.skill]?.name || item.skill) + " (Lv " + item.level + ", stage " + item.stage + ")").join(" | ")
          : field === "bloodlineSkills" ? (learnset.blood_skills || []).map(item => (skills[item.skill]?.name || item.skill) + " (" + item.blood + ", Lv " + item.level + ")").join(" | ")
          : field === "skillStones" ? (learnset.skill_stones || []).map(id => skills[id]?.name || id).join(" | ")
          : field === "skillStoneTopics" ? JSON.stringify(joined.skillStoneTopics)
          : field === "evolutionPaths" ? joined.evolutionPaths.map(group => group.paths.map(path => (path.name || group.id) + ": " + (path.chain || []).map(step => [step.title, step.types?.join("/"), step.level ? "Lv " + step.level : "", step.cond].filter(Boolean).join(" ")).join(" > ") + (path.lord_branches?.length ? " | " + path.lord_branches.map(step => [step.title, step.cond, step.item].filter(Boolean).join(" ")).join("; ") : "")).join("; ")).join(" | ")
          : field === "affinity" ? JSON.stringify(joined.originalCatalogFields.affinity || null)
          : field === "ecology" ? JSON.stringify(joined.originalCatalogFields.ecology || null)
          : field === "weakTo" ? (joined.typeMatchup?.weak || []).map(entry => entry.type + " ×" + entry.multiplier).join(" | ")
          : field === "resists" ? (joined.typeMatchup?.resist || []).map(entry => entry.type + " ×" + entry.multiplier).join(" | ")
          : field === "historicalTrainingSample" ? JSON.stringify(joined.historicalTrainingSample)
          : field === "trainingSampleRevision" ? joined.trainingSampleRevision?.sourceSeason
          : field === "originalCatalogFields" ? JSON.stringify(joined.originalCatalogFields)
          : field === "joinedSnapshot" ? joined.sourceRevision?.version
          : row.stats?.[field] ?? row[field];
        return csvCell(value);
      }).join(","))];
      exportFile(`roco-creature-records-${date}.csv`, `\uFEFF${lines.join("\r\n")}`, "text/csv;charset=utf-8");
    } else {
      const lines = [`# Roco Kingdom: World creature records`, ``, `Checked ${DB.creatures.checkedOn}. Derived from ${DB.creatures.source} under ${DB.creatures.license}. Joined snapshot ${DB.creatureDetails?.snapshot?.version || "unavailable"}.`, "", ...list.map(row => {
        const full = exportedCreature(row);
        const data = full.joinedData;
        const tasks = (data.handbook?.topics || []).map(topic => [topic.text, topic.target, ...(topic.rewards || []).map(reward => reward.name + " ×" + reward.count)].filter(Boolean).join(" / ")).join("; ");
        const skills = Object.entries(data.skills || {}).map(([id, skill]) => [skill.name || id, skill.element, skill.category, skill.energy !== undefined ? "Energy " + skill.energy : "", skill.desc].filter(Boolean).join(" / ")).join("; ");
        return `## ${markdownValue(row.catalogNumber)} · ${markdownValue(row.name)}\n\n- Form: ${markdownValue(row.form)}\n- Type: ${markdownValue((row.types || []).join(" / "))}\n- Trait: ${markdownValue(row.trait)}\n- Base stats: HP ${row.stats.hp ?? "Not listed"}, Speed ${row.stats.speed ?? "Not listed"}, Physical attack ${row.stats.physicalAttack ?? "Not listed"}, Special attack ${row.stats.specialAttack ?? "Not listed"}, Physical defense ${row.stats.physicalDefense ?? "Not listed"}, Special defense ${row.stats.specialDefense ?? "Not listed"}, Total ${row.stats.total ?? "Not listed"}\n- Trait effect: ${markdownValue(row.traitEffect)}\n- Evolution label: ${markdownValue(row.evolutionStage)}\n- Season / egg group: ${markdownValue(row.season)} / ${markdownValue(row.eggGroup)}\n- Height / weight: ${markdownValue(row.height)} / ${markdownValue(row.weight)}\n- Rideable / co-ridable: ${markdownValue(row.rideable)} / ${markdownValue(row.coRideable)}\n- Description: ${markdownValue(row.description)}\n- Habitat / index areas: ${markdownValue(data.handbook?.habitat)} / ${markdownValue((data.handbook?.areas || []).join("; "))}\n- Handbook tasks and rewards: ${markdownValue(tasks)}\n- Linked skills: ${markdownValue(skills)}\n- Learnset data: ${markdownValue(JSON.stringify(data.learnset))}\n- Skill-stone topics: ${markdownValue(JSON.stringify(data.skillStoneTopics))}\n- Evolution paths and conditions: ${markdownValue(JSON.stringify(data.evolutionPaths))}\n- Affinity: ${markdownValue(JSON.stringify(data.originalCatalogFields.affinity))}\n- Ecology: ${markdownValue(JSON.stringify(data.originalCatalogFields.ecology))}\n- Type matchup: ${markdownValue(JSON.stringify(data.typeMatchup))}\n- Historical S3 sample: ${markdownValue(JSON.stringify(data.historicalTrainingSample || "Open the detail sample before exporting to include these counts"))}\n- Original catalog fields: ${markdownValue(JSON.stringify(data.originalCatalogFields))}\n- Joined source: ${markdownValue(data.sourceRevision?.repository)} @ ${markdownValue(data.sourceRevision?.commit)}\n- Creature source: ${markdownValue(row.source?.page || DB.creatures.source)}`;
      })];
      exportFile(`roco-creature-records-${date}.md`, lines.join("\n\n"), "text/markdown;charset=utf-8");
    }
  }

  function recordsFromKeys(keys) { return keys.map(key => DB.creatures.records.find(row => `creature:${row.recordId}` === key)).filter(Boolean); }
  function exportAction(kind, element) {
    if (kind === "selected-csv") return exportRecords("csv", recordsFromKeys(state.selected.map(id => `creature:${id}`)));
    if (kind === "selected-md") return exportRecords("md", recordsFromKeys(state.selected.map(id => `creature:${id}`)));
    if (kind === "filtered-json") return exportRecords("json", visibleDex);
    if (kind === "one-json") return exportRecords("json", DB.creatures.records.filter(row => row.recordId === element.dataset.record));
    if (kind === "sources-json") return exportFile("roco-source-register.json", JSON.stringify(DB.sources, null, 2), "application/json;charset=utf-8");
    if (kind === "bookmarks-json") return exportFile("roco-saved-notes.json", JSON.stringify({ bookmarks: state.bookmarks.map(key => ({ id: key, label: bookmarkLabel(key) })), at: new Date().toISOString() }, null, 2), "application/json;charset=utf-8");
    if (kind === "settings-json") {
      const { vocab, ...safe } = state;
      return exportFile("roco-field-kit-settings.json", JSON.stringify({ version: 1, settings: safe }, null, 2), "application/json;charset=utf-8");
    }
    if (kind === "article-md") {
      const item = DB.articles.find(article => article.id === element.dataset.article);
      if (!item) return;
      const lines = [`# ${item.title}`, "", item.summary, "", ...item.sections.flatMap(section => [`## ${section.heading}`, "", section.text, "", `Sources and related articles: ${(section.sources || []).map(referenceLabel).filter(Boolean).join(", ")}`])];
      return exportFile(`${item.id}.md`, lines.join("\n"), "text/markdown;charset=utf-8");
    }
    if (kind === "print") return window.print();
  }

  function openRegex(scope) {
    const dialog = $("#regex-dialog");
    const targetId = scope === "global" ? "global-search" : scope === "dex" ? "dex-query" : scope === "map" ? "map-query" : scope === "palette" ? "palette-search" : "guide-query";
    const input = $(`#${targetId}`);
    const current = input?.value || "";
    dialog.dataset.scope = scope;
    dialog.dataset.target = targetId;
    $("#regex-content").innerHTML = `<div class="regex-builder"><p class="copy-block">Build a bounded search pattern. Names and titles only are searched in pattern mode. Nested unlimited quantifiers, lookarounds, and backreferences are blocked to keep searches responsive.</p><label class="field-label">Search phrase<input id="regex-phrase" class="field-control" value="${esc(current)}" maxlength="80"></label><label class="field-label">Match style<select id="regex-style" class="field-control"><option value="contains">Contains phrase</option><option value="starts">Starts with phrase</option><option value="ends">Ends with phrase</option><option value="whole">Whole phrase</option></select></label><label class="control-row"><span><strong>Ignore letter case</strong></span><input id="regex-case" type="checkbox" checked></label><div id="regex-preview" class="builder-preview" aria-live="polite"></div><div class="field-actions"><button class="button" data-regex-apply>Use pattern</button><button class="button-secondary" data-regex-off>Turn pattern search off</button></div></div>`;
    const make = () => {
      const phrase = $("#regex-phrase").value;
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const style = $("#regex-style").value;
      const wrap = style === "starts" ? `^${escaped}` : style === "ends" ? `${escaped}$` : style === "whole" ? `^${escaped}$` : escaped;
      const pattern = `/${wrap}/${$("#regex-case").checked ? "i" : ""}`;
      $("#regex-preview").textContent = `Preview: ${pattern || "/(?:)/"}`;
      return wrap;
    };
    ["#regex-phrase", "#regex-style", "#regex-case"].forEach(selector => $(selector).addEventListener("input", make));
    ["#regex-style", "#regex-case"].forEach(selector => $(selector).addEventListener("change", make));
    make(); dialog.showModal();
  }

  function applyPattern() {
    const dialog = $("#regex-dialog");
    const scope = dialog.dataset.scope;
    const target = $(`#${dialog.dataset.target}`);
    const phrase = $("#regex-phrase").value;
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const style = $("#regex-style").value;
    const pattern = style === "starts" ? `^${escaped}` : style === "ends" ? `${escaped}$` : style === "whole" ? `^${escaped}$` : escaped;
    if (!pattern || pattern.length > 100) { toast("Add a search phrase up to 80 characters.", "warning"); return; }
    const ignoreCase = $("#regex-case").checked;
    try { new RegExp(pattern, `${ignoreCase ? "i" : ""}u`); } catch { toast("The pattern could not be compiled.", "warning"); return; }
    state.regex[scope] = true;
    state.regexIgnoreCase[scope] = ignoreCase;
    state.regexPattern[scope] = pattern;
    state.regexDisplay[scope] = phrase;
    persist();
    if (target) { target.value = phrase; target.dispatchEvent(new Event("input", { bubbles: true })); }
    dialog.close();
    if (scope === "global") renderGlobalSearch(phrase);
    else if (scope === "palette") renderPalette(phrase);
    else renderApp();
    toast("Pattern search is on for this page session.");
  }

  function toneMessage(en, zh) {
    const level = state.lang === "zh" ? state.funnyZh : state.funnyEn;
    if (level === 0) return local("Done.", "完成。");
    if (level === 1) return local(en, zh);
    if (level === 2) return local(`${en} The notebook is still behaving.`, `${zh} 本簿仲算听话。`);
    return local(`${en} No map goblin was harmed.`, `${zh} 暂时冇地图小精灵捣乱。`);
  }

  function randomTip() {
    const tips = DB.articles.filter(item => ["smart-tips", "first-sessions", "capture-planning", "world-map"].includes(item.id));
    const item = tips[Math.floor(Math.random() * tips.length)];
    const section = item.sections[Math.floor(Math.random() * item.sections.length)];
    const target = $("#random-tip");
    if (target) target.innerHTML = `<span class="card-kicker">${esc(titleForArticle(item))}</span><p class="copy-block" style="margin-top:.45rem">${esc(local(section.text, section.textZh))}</p><div class="article-sources">${sourceChips(section.sources)}</div>`;
    toast(toneMessage("A fresh field note, pulled at random.", "随机抽咗一条实用笔记。"));
  }

  function renderNotificationList() {
    const items = state.notifications;
    $("#notifications-content").innerHTML = `<div class="field-actions"><button class="button-secondary button-small" data-notification-read-all>Mark all as read</button><button class="button-quiet button-small" data-notification-clear>Clear notice history</button></div>${items.map(item => `<article class="changelog-entry"><time datetime="${esc(item.at)}">${esc(new Date(item.at).toLocaleString())}</time><div><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p><small>${esc(item.source)}</small></div></article>`).join("") || `<div class="empty-state"><strong>No local notices yet.</strong>Updates and reminders appear here.</div>`}`;
  }

  function scheduleReminder() {
    window.clearTimeout(reminderTimer);
    if (!state.schedule.enabled) return;
    const [hour, minute] = (state.schedule.time || "19:00").split(":").map(Number);
    const now = new Date();
    const next = new Date(now);
    next.setHours(hour || 0, minute || 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    reminderTimer = window.setTimeout(() => {
      notify("Your field guide reminder", state.schedule.note || "Check the latest in-game notice.", "Local schedule");
      toast("Your local reminder is here. Check the current in-game notice.", "warning");
      scheduleReminder();
    }, Math.min(next.getTime() - now.getTime(), 2147483000));
  }

  function updateQueryView(id) {
    const page = route.page;
    const keep = { dex: $("#dex-query")?.value || "", map: $("#map-query")?.value || "", guides: $("#guide-query")?.value || "" };
    if (page === "dex" && id === "dex-query") state.dexQuery = keep.dex;
    if (page === "map" && id === "map-query") state.mapQuery = keep.map;
    if (page === "guides" && id === "guide-query") state.articleQuery = keep.guides;
    renderApp();
    const field = $(`#${id}`);
    if (field) { field.focus(); field.setSelectionRange(field.value.length, field.value.length); }
  }

  function toggleFocusPage(page) {
    state.locked[page] = !state.locked[page];
    persist(); renderApp();
    toast(state.locked[page] ? "Presentation mask enabled. This is not security." : "Presentation mask cleared.");
  }

  function renderQuickList(kind) {
    const isSaved = kind === "saved";
    $("#quick-list-title").textContent = isSaved ? "Saved notes" : "Recent places";
    const entries = isSaved
      ? state.bookmarks.map(key => ({ key, label: bookmarkLabel(key), at: "Saved on this device" }))
      : state.history.map(item => ({ key: item.route, label: bookmarkLabel(item.route), at: new Date(item.at).toLocaleString() }));
    $("#quick-list-content").innerHTML = `<div class="palette-results">${entries.map(item => `<button class="palette-result" type="button" data-go="${esc(item.key)}"><span>${esc(item.label)}</span><small>${esc(item.at)}</small></button>`).join("") || `<div class="empty-state"><strong>${isSaved ? "No saved notes yet." : "No recent places yet."}</strong>${isSaved ? "Save a creature, article, or location label to keep it here." : "Pages you visit appear here, stored only in this browser."}</div>`}</div><div class="field-actions">${isSaved ? `<button class="button-secondary button-small" data-export="bookmarks-json">Export list</button>` : `<button class="button-quiet button-small" data-history-clear>Clear recent places</button>`}</div>`;
    $("#quick-list-dialog").showModal();
  }

  function handleClick(event) {
    const target = event.target.closest("button,a,input,label");
    if (!target) return;
    if (target.matches("a[data-go]")) event.preventDefault();
    const go = target.dataset.go;
    if (go) return navigate(go);
    if (target.dataset.route) return navigate(target.dataset.route);
    if (target.id === "palette-open") return openPalette();
    if (target.id === "regex-open") return openRegex("global");
    if (target.dataset.openRegex) return openRegex(target.dataset.openRegex);
    if (target.matches("[data-regex-apply]")) return applyPattern();
    if (target.matches("[data-regex-off]")) {
      const dlg = $("#regex-dialog"), scope = dlg.dataset.scope;
      state.regex[scope] = false; persist(); dlg.close(); renderApp();
      toast("Pattern search is off."); return;
    }
    if (target.id === "notifications-toggle") {
      renderNotificationList();
      state.notifications = state.notifications.map(item => ({ ...item, read: true })); persist(); renderNotificationBadge();
      return $("#notifications-dialog").showModal();
    }
    if (target.id === "open-bookmarks") return renderQuickList("saved");
    if (target.id === "open-history") return renderQuickList("recent");
    if (target.id === "fieldkit-toggle") return renderQuickList("saved");
    if (target.matches("[data-status-hub-toggle]")) {
      if (target.disabled) return;
      void setDesktopStatusEnabled(!DESKTOP_STATUS.enabled);
      return;
    }
    if (target.matches("[data-palette-mode]")) {
      state.paletteMode = target.dataset.paletteMode;
      $$("[data-palette-mode]").forEach(button => button.setAttribute("aria-pressed", String(button === target)));
      return renderPalette($("#palette-search").value);
    }
    if (target.matches("[data-close-dialog]")) return target.closest("dialog")?.close();
    if (target.matches("[data-open-creature]")) return openCreature(DB.creatures.records.find(row => row.recordId === target.dataset.openCreature));
    if (target.matches("[data-bookmark]")) return toggleBookmark(target.dataset.bookmark);
    if (target.matches("[data-select-creature]")) {
      event.stopPropagation();
      const id = target.dataset.selectCreature;
      state.selected = target.checked ? [...new Set([...state.selected, id])] : state.selected.filter(item => item !== id);
      persist(); const bulk = $("#dex-bulk"); if (bulk) { bulk.hidden = !state.selected.length; bulk.querySelector("strong").textContent = `${state.selected.length} selected`; }
      return;
    }
    if (target.dataset.export) return exportAction(target.dataset.export, target);
    if (target.matches("[data-bulk='clear']")) { state.selected = []; persist(); renderApp(); return; }
    if (target.matches("[data-bulk='save']")) {
      const keys = state.selected.map(id => `creature:${id}`);
      state.bookmarks = [...new Set([...keys, ...state.bookmarks])].slice(0, 300); persist(); renderApp(); toast("Selected creature records saved on this device."); return;
    }
    if (target.matches("[data-load-more]")) { state.dexLimit = Math.min(DB.creatures.records.length, state.dexLimit + 60); persist(); return renderApp(); }
    if (target.matches("[data-tab-pin]")) {
      const id = target.dataset.tabPin;
      state.pinned = state.pinned.includes(id) ? state.pinned.filter(item => item !== id) : [...state.pinned, id];
      persist(); renderApp(); renderNav(); return;
    }
    if (target.matches("[data-tab-move]")) {
      const from = state.order.indexOf(target.dataset.tabMove), to = from + Number(target.dataset.direction);
      if (from >= 0 && to >= 0 && to < state.order.length) [state.order[from], state.order[to]] = [state.order[to], state.order[from]];
      persist(); renderApp(); renderNav(); return;
    }
    if (target.dataset.toggle) {
      const key = target.dataset.toggle;
      if (key === "schedule") { state.schedule.enabled = !state.schedule.enabled; scheduleReminder(); }
      else state[key] = !state[key];
      persist(); renderApp(); return;
    }
    if (target.dataset.lang) { state.lang = target.dataset.lang; persist(); renderApp(); renderNav(); return; }
    if (target.matches("[data-random-tip]")) return randomTip();
    if (target.matches("[data-unlock-page]")) return toggleFocusPage(target.dataset.unlockPage);
    if (target.matches("[data-reset-open]")) {
      $("#confirm-content").innerHTML = `<p class="copy-block">This removes saved notes, preferences, and recent pages from this browser. Guide data and published content remain unchanged.</p><label class="field-label" style="margin-top:.8rem">Type RESET to confirm<input id="reset-word" class="field-control" autocomplete="off" spellcheck="false"></label><div class="field-actions"><button class="button-warn" data-reset-confirm>Reset local data</button></div>`;
      return $("#confirm-dialog").showModal();
    }
    if (target.matches("[data-reset-confirm]")) {
      if ($("#reset-word").value !== "RESET") return toast("Reset canceled. Type RESET exactly to continue.", "warning");
      localStorage.removeItem(KEY); state = structuredClone(DEFAULTS); persist(); $("#confirm-dialog").close(); setRoute("home"); toast("Local field kit reset."); return;
    }
    if (target.matches("[data-vocab-clear]")) {
      if ($("#vocabulary-file")) $("#vocabulary-file").value = "";
      if ($("#topbar-vocabulary-file")) $("#topbar-vocabulary-file").value = "";
      state.vocab = { valid: false, count: 0, notice: "No file loaded. Nothing leaves this browser." }; persist(); renderApp(); return;
    }
    if (target.matches("[data-notification-read-all]")) { state.notifications = state.notifications.map(item => ({ ...item, read: true })); persist(); renderNotificationBadge(); renderNotificationList(); return; }
    if (target.matches("[data-notification-clear]")) { state.notifications = []; persist(); renderNotificationBadge(); renderNotificationList(); return; }
    if (target.matches("[data-history-clear]")) { state.history = []; persist(); renderApp(); $("#quick-list-dialog").close(); return; }
    if (target.matches("[data-notification-test]")) { notify("Sample field note", "Check one dated source before relying on a season detail.", "Local sample"); return toast("Sample notice added to the local center."); }
    if (target.matches("[data-focus-toggle]")) return toggleFocusPage(route.page);
  }

  function handleChange(event) {
    const input = event.target;
    if (input.dataset.state) {
      const key = input.dataset.state;
      state[key] = ["scale", "density", "radius", "funnyEn", "funnyZh"].includes(key) ? Number(input.value) : input.value.slice(0, 32);
      persist();
      const badge = input.closest(".range-line")?.querySelector(".range-value");
      if (badge) badge.textContent = key === "radius" ? `${state[key]}px` : key.startsWith("funny") ? `${state[key]}/3` : `${Math.round(state[key] * 100)}%`;
      if (key === "theme" || key === "accent" || key === "scale" || key === "radius" || key === "density") renderApp();
      return;
    }
    if (input.dataset.tabGroup) { state.groups[input.dataset.tabGroup] = input.value; persist(); renderNav(); return; }
    if (input.matches("#dex-type,#dex-form,#dex-sort")) { state.dexLimit = 60; persist(); renderApp(); return; }
    if (input.matches("#vocabulary-file,#topbar-vocabulary-file")) return importVocabulary(input.files?.[0], input);
    if (input.matches("#settings-file")) return importSettings(input.files?.[0]);
    if (input.matches("[data-schedule-time]")) { state.schedule.time = input.value; persist(); scheduleReminder(); return; }
  }

  function handleInput(event) {
    const input = event.target;
    if (input.id === "global-search") {
      window.clearTimeout(searchTimer);
      const q = input.value;
      searchTimer = window.setTimeout(() => renderGlobalSearch(q), 80);
      return;
    }
    if (input.id === "dex-query") { state.dexLimit = 60; updateQueryView("dex-query"); return; }
    if (input.id === "map-query") { state.mapQuery = input.value; updateQueryView("map-query"); return; }
    if (input.id === "type-query") { state.typeQuery = input.value; updateQueryView("type-query"); return; }
    if (input.id === "guide-query") { state.articleQuery = input.value; updateQueryView("guide-query"); return; }
    if (input.id === "palette-search") { renderPalette(input.value); return; }
    if (input.matches("[data-schedule-note]")) { state.schedule.note = input.value.slice(0, 180); persist(); return; }
  }

  function importVocabulary(file, input) {
    if (!file) return;
    const status = $("#vocabulary-status");
    const showStatus = message => { state.vocab.notice = message; if (status) status.textContent = message; };
    const maxBytes = 200 * 1024;
    if (!file.name.toLowerCase().endsWith(".json") || file.size > maxBytes) {
      state.vocab = { valid: false, count: 0, notice: "File declined. Choose a JSON file no larger than 200 KB." };
      showStatus(state.vocab.notice); persist(); if (input) input.value = ""; return;
    }
    const reader = new FileReader();
    reader.onerror = () => { state.vocab = { valid: false, count: 0, notice: "File could not be read. No content was retained." }; showStatus(state.vocab.notice); persist(); if (input) input.value = ""; };
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!data || data.schemaVersion !== 1 || !data.entries || Array.isArray(data.entries) || typeof data.entries !== "object") throw new Error("Expected a version 1 entries object.");
        const entries = Object.entries(data.entries);
        if (entries.length > 2500 || entries.some(([key, value]) => typeof key !== "string" || typeof value !== "string" || key.length > 180 || value.length > 180)) throw new Error("Entry count or entry size is outside the supported limits.");
        state.vocab = { valid: true, count: entries.length, notice: `Valid version 1 file, ${entries.length} entries. Checked in memory only. Not applied or saved because this public edition has no authenticated area.` };
        showStatus(state.vocab.notice); persist();
      } catch (error) {
        state.vocab = { valid: false, count: 0, notice: `File declined: ${error.message}` };
        persist(); showStatus(state.vocab.notice);
      } finally { reader.onload = null; reader.onerror = null; if (input) input.value = ""; }
    };
    reader.readAsText(file);
  }

  function importSettings(file) {
    if (!file) return;
    if (file.size > 120 * 1024) return toast("Settings file is larger than 120 KB.", "warning");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const values = parsed.settings;
        if (parsed.version !== 1 || !values || typeof values !== "object") throw new Error("Unsupported settings file.");
        const next = { ...structuredClone(DEFAULTS), ...values, vocab: { valid: false, count: 0, notice: "No file loaded. Nothing leaves this browser." } };
        next.order = [...new Set((next.order || []).filter(id => NAV.some(nav => nav.id === id))), ...NAV.map(nav => nav.id).filter(id => !(next.order || []).includes(id))];
        next.bookmarks = (next.bookmarks || []).filter(item => typeof item === "string").slice(0, 300);
        next.history = (next.history || []).filter(item => item && typeof item.route === "string").slice(0, 40);
        state = next; persist(); renderApp(); renderNav(); toast("Settings imported locally. Vocabulary file contents were not included.");
      } catch (error) { toast(`Settings file declined: ${error.message}`, "warning"); }
    };
    reader.readAsText(file);
  }

  function handleKeydown(event) {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "f") {
      event.preventDefault(); openPalette();
    }
    if (event.key === "Escape") $("#search-results").hidden = true;
    const row = event.target.closest?.("[data-open-creature]");
    if (row && (event.key === "Enter" || event.key === " ") && event.target === row) {
      event.preventDefault(); openCreature(DB.creatures.records.find(item => item.recordId === row.dataset.openCreature));
    }
  }

  async function boot() {
    applyAppearance();
    void loadBuildProvenance();
    const urls = ["data/creatures.json", "data/creature-details.json", "data/type-chart.json", "data/locations.json", "data/articles.json", "data/sources.json"];
    try {
      const responses = await Promise.all(urls.map(url => fetch(url, { credentials: "omit", cache: "no-cache" })));
      if (responses.some(response => !response.ok)) throw new Error("One or more local data files could not be loaded.");
      [DB.creatures, DB.creatureDetails, DB.typeChart, DB.locations, DB.articles, DB.sources] = await Promise.all(responses.map(response => response.json()));
      DB.creatureSearch = new Map(DB.creatures.records.map(row => [row.recordId, searchableCreatureText(row)]));
      $("#bookmark-count").textContent = statusCount(state.bookmarks.length);
      document.addEventListener("click", handleClick);
      document.addEventListener("change", handleChange);
      document.addEventListener("input", handleInput);
      document.addEventListener("keydown", handleKeydown);
      document.addEventListener("click", event => {
        const creatureRow = event.target.closest(".dex-row[data-open-creature]");
        if (creatureRow && !event.target.closest("button,input,a")) openCreature(DB.creatures.records.find(row => row.recordId === creatureRow.dataset.openCreature));
      });
      $("#global-search-form").addEventListener("submit", event => { event.preventDefault(); renderGlobalSearch($("#global-search").value); });
      $("#palette-search").addEventListener("input", event => renderPalette(event.target.value));
      $$("[data-close-dialog]").forEach(button => button.addEventListener("click", () => button.closest("dialog")?.close()));
      document.addEventListener("click", event => { if (event.target === $("#search-results")) $("#search-results").hidden = true; });
      document.addEventListener("click", event => { if (event.target.matches("[data-focus-toggle]")) toggleFocusPage(route.page); });
      route = { page: "home", articleId: "" };
      const initial = location.hash ? location.hash.slice(1) : "home";
      const [page, articleId = ""] = initial.split("/");
      route = NAV.some(item => item.id === page) ? { page, articleId } : { page: "home", articleId: "" };
      renderNav(); renderApp();
      void refreshDesktopStatus();
      scheduleReminder();
      if (!sessionStorage.getItem("roco-welcome-v1")) {
        sessionStorage.setItem("roco-welcome-v1", "seen");
        notify("Welcome to the World field guide", "Your saved notes stay in this browser. Check the date beside any season detail.");
      }
    } catch (error) {
      const view = $("#app-view");
      view.setAttribute("aria-busy", "false");
      view.innerHTML = `<div class="empty-state"><strong>The field data could not be opened.</strong><p>${esc(error.message)}</p><p>Check that this page is served with the bundled data files.</p></div>`;
    }
  }

  function syncRouteFromLocation() {
    const raw = location.hash.slice(1) || "home";
    const [page, articleId = ""] = raw.split("/");
    route = NAV.some(item => item.id === page) ? { page, articleId } : { page: "home", articleId: "" };
    remember(articleId ? `article:${articleId}` : page);
    renderApp(); renderNav();
  }
  window.addEventListener("hashchange", syncRouteFromLocation);
  window.addEventListener("popstate", syncRouteFromLocation);
  boot();
})();
