// Собирает статический сайт в docs/ из content/*.mjs и src/. Запуск: node build.mjs
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { build as bundle } from "esbuild";
import cfg from "./site.config.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, "docs");
const LANGS = ["ru", "en", "th"];
const PAGES = ["index", "signs", "letters", "led", "print", "dynamic", "robots", "branding"];
const COLORS = { warm: "#ffd9a8", white: "#eaf2ff", orange: "#ff9a3d", blue: "#4d8dff", red: "#ff4d4d", green: "#46e08a" };

const content = {};
for (const l of LANGS) content[l] = (await import(pathToFileURL(path.join(ROOT, "content", `${l}.mjs`)).href)).default;

const read = (p) => readFileSync(path.join(ROOT, p), "utf8");
const hash = (s) => createHash("sha1").update(s).digest("hex").slice(0, 8);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// {слово} в заголовке → акцентный цвет
const acc = (s) => esc(s).replace(/\{([^}]*)\}/g, "<em>$1</em>");
const plain = (s) => String(s).replace(/[{}]/g, "");

const svgCache = {};
function icon(name, cls = "") {
  if (!svgCache[name]) {
    const file = name === "line"
      ? "node_modules/simple-icons/icons/line.svg"
      : name.endsWith("-logo") // логотипы мессенджеров и соцсетей — залитые, как у LINE
        ? `node_modules/@phosphor-icons/core/assets/fill/${name}-fill.svg`
        : `node_modules/@phosphor-icons/core/assets/bold/${name}-bold.svg`;
    svgCache[name] = read(file).match(/<path[^>]*>|<title>.*?<\/title>/g).filter((t) => t.startsWith("<path")).join("");
  }
  const box = name === "line" ? "0 0 24 24" : "0 0 256 256";
  return `<svg class="ic ${cls}" viewBox="${box}" fill="currentColor" aria-hidden="true" focusable="false">${svgCache[name]}</svg>`;
}

const tel = `tel:+${cfg.phoneE164}`;
const waLink = (text) => `https://wa.me/${cfg.phoneE164}?text=${encodeURIComponent(text)}`;

// ---------- Общие блоки ----------

function stage(L, id, modes, labels, legend, withNotes, auto) {
  const def = "face";
  const s = L.stage;
  const chips = modes.map((m, i) =>
    `<label class="chip"><input type="radio" name="mode-${id}" value="${m}"${m === def ? " checked" : ""}><span>${esc(labels[m])}</span></label>`).join("");
  const sw = Object.entries(COLORS).map(([k, c], i) =>
    `<label class="swatch" title="${esc(s.colors[k])}"><input type="radio" name="color-${id}" value="${c}"${i === 0 ? " checked" : ""}><span style="--c:${c}"></span><span class="sr">${esc(s.colors[k])}</span></label>`).join("");
  return `
<div class="stagebox" data-stage${auto ? " data-auto" : ""}>
  <div class="stage" data-mode="${def}" data-time="night">
    <div class="scene">
      <div class="wall"></div>
      <div class="glowspill"></div>
      <div class="sign"><span class="sign-text">${esc(s.sample)}</span><canvas class="sign-led" aria-hidden="true"></canvas></div>
      <div class="shop" aria-hidden="true"><i></i><i class="door"></i><i></i></div>
      <div class="pave" aria-hidden="true"></div>
    </div>
    <div class="stage-time" role="group" aria-label="${esc(s.timeTitle)}">
      <button type="button" data-time="day" aria-pressed="false">${icon("sun")}<span>${esc(s.day)}</span></button>
      <button type="button" data-time="night" aria-pressed="true">${icon("moon")}<span>${esc(s.night)}</span></button>
    </div>
  </div>
  <div class="stage-ui">
    <label class="field"><span>${esc(s.label)}</span>
      <input type="text" maxlength="24" placeholder="${esc(s.placeholder)}" autocomplete="off" autocapitalize="characters" spellcheck="false" data-stage-input></label>
    <fieldset class="chips"><legend>${esc(legend)}</legend>${chips}</fieldset>
    <fieldset class="swatches"><legend>${esc(s.colorTitle)}</legend>${sw}</fieldset>
    ${withNotes ? `<p class="stage-note" data-stage-note aria-live="polite"></p>` : ""}
    <a class="btn btn-accent" data-stage-cta data-track="Contact" target="_blank" rel="noopener" href="${waLink(L.quiz.msgHead)}">${icon("whatsapp-logo")}<span>${esc(s.cta)}</span></a>
  </div>
</div>`;
}

// Картинки направлений — кинематографичные кадры
const photo = (name) => `<div class="vis vis-photo" aria-hidden="true"><img src="../assets/img/${name}.webp" alt="" width="1200" height="1200" loading="lazy" decoding="async"></div>`;
const VIS = { signs: photo("t-signs"), letters: photo("t-letters"), led: photo("t-led"), print: photo("t-print"), dynamic: photo("t-dynamic"), robots: photo("t-robots"), branding: photo("t-branding") };
const ARROW = () => `<i class="btn-arrow">${icon("arrow-up-right")}</i>`;

function secHead(s, extra = "") {
  return `<header class="sec-head rv"><h2>${acc(s.h2)}</h2>${s.lead ? `<p class="lead">${esc(s.lead)}</p>` : ""}${extra}</header>`;
}

function rows(items, L, opts = {}) {
  const tag = opts.ordered ? "ol" : "ul";
  return `<${tag} class="rows${opts.ordered ? " rows-num" : ""}">` + items.map((it, i) => {
    const t = it.href
      ? `<a href="${it.href}">${esc(it.t)}${icon("arrow-up-right")}</a>`
      : esc(it.t);
    return `<li class="rv" style="--n:${i}">${opts.tag ? `<span class="tag">${esc(opts.tag)}</span>` : ""}<h3>${t}</h3><p>${esc(it.d)}</p></li>`;
  }).join("") + `</${tag}>`;
}

// ---------- Секции ----------

const R = {
  hero(s, L) {
    return `
<section class="hero cine night">
  <div class="shot" aria-hidden="true"><div class="cam"><img src="../assets/img/hero.webp" alt="" width="1600" height="1600" fetchpriority="high"><div class="plate"><span data-plate>${esc(L.stage.sample)}</span></div></div></div>
  <div class="grade" aria-hidden="true"></div>
  <div class="wrap cine-ui">
    <div class="cine-top">
      <h1>${acc(s.h1)}</h1>
      <p class="lead">${esc(s.lead)}</p>
    </div>
    <div class="cine-bottom">
      <label class="field"><span>${esc(L.stage.label)}</span>
        <input type="text" maxlength="18" placeholder="${esc(L.stage.placeholder)}" autocomplete="off" autocapitalize="characters" spellcheck="false" data-plate-input></label>
      <div class="cta-row">
        <a class="btn btn-accent btn-lg" href="#quote"><span>${esc(L.ui.quote)}</span>${ARROW()}</a>
        <a class="btn btn-ghost btn-lg" data-track="Contact" target="_blank" rel="noopener" href="${waLink(L.quiz.msgHead)}">${icon("whatsapp-logo")}<span>${esc(L.ui.wa)}</span></a>
      </div>
    </div>
  </div>
</section>
<section class="sec night demo-light stage-sec" id="try">
  <div class="wrap">
    <header class="sec-head rv"><h2>${esc(s.try)}</h2><ul class="facts">${s.facts.map((f) => `<li>${icon("check")}<span>${esc(f)}</span></li>`).join("")}</ul></header>
    ${stage(L, "hero", ["face", "halo", "neon", "box", "led"], L.stage.modes, L.stage.modesTitle, false, true)}
  </div>
</section>`;
  },

  marquee(s) {
    const run = s.items.map((i) => `<span>${esc(i)}</span>`).join("");
    return `<div class="marquee" aria-hidden="true"><div class="marquee-track">${run}${run}</div></div>`;
  },

  head(s, L, key) {
    return `
<section class="phead night" data-rays="0.8">
  <div class="wrap phead-grid">
    <div class="phead-copy">
      <nav class="crumbs" aria-label="${esc(L.ui.home)}"><a href="index.html">${esc(L.ui.home)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(L.ui.nav[key])}</span></nav>
      <h1>${acc(s.h1)}</h1>
      <p class="lead">${esc(s.lead)}</p>
      <div class="cta-row">
        <a class="btn btn-accent btn-lg" href="#quote"><span>${esc(L.ui.quote)}</span>${ARROW()}</a>
        <a class="btn btn-ghost btn-lg" data-track="Contact" target="_blank" rel="noopener" href="${waLink(L.quiz.msgHead)}">${icon("whatsapp-logo")}<span>${esc(L.ui.wa)}</span></a>
      </div>
    </div>
    <div class="phead-vis pv-${s.k}">${VIS[s.k]}</div>
  </div>
</section>`;
  },

  tiles(s, L) {
    return `
<section class="sec night" id="${s.id}">
  <div class="wrap">
    ${secHead(s)}
    <div class="bento">${s.items.map((it, i) => `
      <a class="tile tile-${it.k} rv" style="--i:${i}" href="${it.k}.html">
        ${VIS[it.k]}
        <span class="tile-go">${icon("arrow-up-right")}</span>
        <span class="tile-txt"><strong>${esc(it.title)}</strong><span>${esc(it.text)}</span></span>
      </a>`).join("")}
    </div>
  </div>
</section>`;
  },

  place(s, L) {
    const tabs = s.tabs.map((t, i) =>
      `<button type="button" role="tab" id="t-${t.k}" aria-controls="p-${t.k}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-k="${t.k}">${esc(t.title)}</button>`).join("");
    const panels = s.tabs.map((t, i) => `
      <div role="tabpanel" id="p-${t.k}" aria-labelledby="t-${t.k}"${i === 0 ? "" : " hidden"}>
        <p>${esc(t.text)}</p>
        <ul class="ticks">${t.points.map((p) => `<li>${icon("check")}<span>${esc(p)}</span></li>`).join("")}</ul>
        ${t.exec ? `<p class="exec-title">${esc(L.ui.execLabel)}</p><ul class="exec">${t.exec.map((e) => `<li><a href="${e.href}">${esc(e.label)}</a></li>`).join("")}</ul>` : ""}
      </div>`).join("");
    return `
<section class="sec ${s.tone}" id="${s.id}">
  <div class="wrap">
    ${secHead(s)}
    <div class="place rv" data-place>
      <div class="place-art" data-k="${s.tabs[0].k}"><img class="pp pp-facade" src="../assets/img/t-signs.webp" alt="" width="1200" height="1200" loading="lazy"><img class="pp pp-roof" src="../assets/img/hero.webp" alt="" width="1600" height="1600" loading="lazy"><img class="pp pp-inside" src="../assets/img/p-inside.webp" alt="" width="1200" height="1200" loading="lazy"></div>
      <div class="place-side">
        <div class="place-tabs" role="tablist" aria-label="${esc(plain(s.h2))}">${tabs}</div>
        ${panels}
        ${s.cta ? `<a class="btn btn-ink" href="${s.cta.href}"><span>${esc(s.cta.label)}</span>${icon("arrow-right")}</a>` : ""}
      </div>
    </div>
  </div>
</section>`;
  },

  list(s, L) {
    return `
<section class="sec ${s.tone}" id="${s.id}">
  <div class="wrap split">
    ${secHead(s)}
    ${rows(s.items, L)}
  </div>
</section>`;
  },

  steps(s, L) {
    return `
<section class="sec ${s.tone}" id="${s.id}">
  <div class="wrap split">
    ${secHead(s)}
    ${rows(s.items, L, { ordered: true })}
  </div>
</section>`;
  },

  duo(s, L) {
    const col = (c) => `<div class="duo-col"><h2 class="rv">${acc(c.h2)}</h2>${rows(c.items, L, { tag: c.tag })}</div>`;
    return `
<section class="sec ${s.tone}" id="${s.id}">
  <div class="wrap duo">${col(s.a)}${col(s.b)}</div>
</section>`;
  },

  feature(s, L) {
    const img = s.img
      ? `<figure class="feature-img rv"><img src="../assets/img/${s.img}.webp" alt="${esc(plain(s.h2))}" width="1200" height="896" loading="lazy" decoding="async"><figcaption>${esc(L.ui.photoNote)}</figcaption></figure>`
      : "";
    return `
<section class="sec ${s.tone} feature${s.img ? "" : " feature-solo"}" id="${s.id}">
  <div class="wrap feature-grid">
    <div class="feature-copy rv">
      <h2>${acc(s.h2)}</h2>
      ${s.text.map((p) => `<p class="lead">${esc(p)}</p>`).join("")}
      ${s.points.length ? `<ul class="ticks">${s.points.map((p) => `<li>${icon("check")}<span>${esc(p)}</span></li>`).join("")}</ul>` : ""}
      <a class="btn btn-accent btn-lg" href="${s.cta.href}"><span>${esc(s.cta.label)}</span>${icon("arrow-right")}</a>
    </div>
    ${img}
  </div>
</section>`;
  },

  table(s, L) {
    const cell = (c) => c === "+"
      ? `<span class="yes">${icon("check")}<span class="sr">${esc(L.ui.yes)}</span></span>`
      : c === "-" ? `<span class="no" aria-hidden="true">—</span><span class="sr">${esc(L.ui.no)}</span>` : esc(c);
    return `
<section class="sec ${s.tone}" id="${s.id}">
  <div class="wrap">
    ${secHead(s)}
    <div class="tablewrap rv" tabindex="0" role="region" aria-label="${esc(plain(s.h2))}">
      <table>
        <thead><tr>${s.cols.map((c) => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead>
        <tbody>${s.rows.map((r) => `<tr>${r.map((c, i) => i === 0 ? `<th scope="row">${esc(c)}</th>` : `<td>${cell(c)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </div>
    <p class="note table-hint">${esc(L.ui.tableHint)}</p>
    ${s.note ? `<p class="note">${esc(s.note)}</p>` : ""}
  </div>
</section>`;
  },

  tiers(s, L, key) {
    return `
<section class="sec ${s.tone}" id="${s.id}">
  <div class="wrap">
    ${secHead(s)}
    <div class="tiers">${s.items.map((t, i) => `
      <article class="tier tier-${i + 1} rv" style="--i:${i}">
        <h3>${esc(t.name)}</h3>
        <p class="tier-for">${esc(t.for)}</p>
        <ul class="ticks">${t.specs.map((p) => `<li>${icon("check")}<span>${esc(p)}</span></li>`).join("")}</ul>
        <p class="tier-price">${esc(t.price || L.ui.priceOnRequest)}</p>
        <a class="btn ${i === 2 ? "btn-accent" : "btn-line"}" href="#quote" data-note="${esc(t.name)}">${esc(L.ui.quote)}</a>
      </article>`).join("")}
    </div>
  </div>
</section>`;
  },

  demo(s, L) {
    if (s.k === "lighting") {
      return `
<section class="sec ${s.tone} demo-light" id="${s.id}">
  <div class="wrap">
    ${secHead(s)}
    ${stage(L, "light", ["none", "face", "side", "halo", "pixel", "rgb"], L.stage.lightModes, L.stage.lightTitle, true)}
  </div>
</section>`;
    }
    return `
<section class="sec ${s.tone}" id="${s.id}">
  <div class="wrap">
    ${secHead(s)}
    <div class="pitch rv" data-pitch>
      <div class="pitch-screen" aria-hidden="true"><canvas></canvas></div>
      <div class="pitch-ui">
        <label for="pitch-r">${esc(s.sliderLabel)} <output for="pitch-r" data-out>P4</output></label>
        <input id="pitch-r" type="range" min="1" max="10" step="0.5" value="4">
        <div class="pitch-scale" aria-hidden="true"><span>P1</span><span>P10</span></div>
        <p class="pitch-dist">${esc(s.distLabel)} <strong data-dist>4 ${esc(s.unit)}</strong></p>
        <div class="pitch-range" aria-live="polite"><h3 data-rt></h3><p data-rd></p></div>
        <p class="note">${esc(s.note)}</p>
      </div>
    </div>
  </div>
</section>`;
  },

  model(s) {
    return `
<section class="sec ${s.tone} model" id="${s.id}">
  <div class="wrap model-grid">
    <div class="model-view rv" data-model>
      <div class="vis vis-letters" aria-hidden="true"><span>B</span></div>
      <p class="model-hint" aria-hidden="true">${icon("hand-grabbing")}<span>${esc(s.hint)}</span></p>
    </div>
    ${secHead(s)}
    <div class="model-side">
      <div class="parts rv">${s.parts.map((p) => `<button type="button" class="part" data-part="${p.k}" aria-pressed="false"><strong>${esc(p.t)}</strong><span>${esc(p.d)}</span></button>`).join("")}</div>
      <button type="button" class="btn btn-ghost" data-explode data-on="${esc(s.assemble)}" data-off="${esc(s.explode)}">${esc(s.explode)}</button>
    </div>
  </div>
</section>`;
  },

  faq(s) {
    return `
<section class="sec ${s.tone}" id="${s.id}">
  <div class="wrap split">
    ${secHead(s)}
    <div class="faq">${s.items.map((q) => `
      <details class="rv"><summary><span>${esc(q.q)}</span>${icon("caret-down")}</summary><p>${esc(q.a)}</p></details>`).join("")}
    </div>
  </div>
</section>`;
  }
};

function quote(L, key) {
  const q = L.quiz;
  const prod = Object.entries(q.products).map(([k, v]) =>
    `<label class="chip"><input type="checkbox" name="what" value="${esc(v)}"${k === key ? " checked" : ""}><span>${esc(v)}</span></label>`).join("");
  const place = Object.entries(q.places).map(([k, v]) =>
    `<label class="chip"><input type="radio" name="where" value="${esc(v)}"><span>${esc(v)}</span></label>`).join("");
  return `
<section class="sec night quote" id="quote">
  <img class="quote-bg" src="../assets/img/street.webp" alt="" width="1600" height="1600" loading="lazy" aria-hidden="true">
  <div class="wrap quote-grid">
    <div class="quote-copy rv">
      <h2>${acc(q.h2)}</h2>
      <p class="lead">${esc(q.lead)}</p>
      <a class="bigphone" data-track="Contact" href="${tel}">${icon("phone")}<span>${esc(cfg.phoneDisplay)}</span></a>
    </div>
    <form class="quiz rv" data-quiz novalidate>
      <fieldset class="chips"><legend>${esc(q.q1)}</legend>${prod}</fieldset>
      <fieldset class="chips"><legend>${esc(q.q2)}</legend>${place}</fieldset>
      <label class="field"><span>${esc(q.q3)}</span>
        <textarea name="note" rows="3" maxlength="600" aria-describedby="q3hint"></textarea>
        <small id="q3hint">${esc(q.q3hint)}</small></label>
      <div class="quiz-send">
        <button type="submit" class="btn btn-accent btn-lg" data-send="wa">${icon("whatsapp-logo")}<span>${esc(q.sendWa)}</span></button>
        <button type="button" class="btn btn-ghost" data-send="tg">${icon("telegram-logo")}<span>${esc(q.sendTg)}</span></button>
        <button type="button" class="btn btn-ghost" data-send="line">${icon("line")}<span>${esc(q.sendLine)}</span></button>
      </div>
      <p class="note">${esc(q.note)}</p>
    </form>
  </div>
</section>`;
}

function contacts(L) {
  const c = L.contacts;
  const social = [["instagram", "instagram-logo", "Instagram"], ["facebook", "facebook-logo", "Facebook"], ["tiktok", "tiktok-logo", "TikTok"], ["youtube", "youtube-logo", "YouTube"]]
    .filter(([k]) => cfg[k])
    .map(([k, ic, name]) => `<li><a href="${cfg[k]}" target="_blank" rel="noopener">${icon(ic)}<span>${name}</span></a></li>`).join("");
  const lineBtn = cfg.line
    ? `<a href="${cfg.line}" data-track="Contact" target="_blank" rel="noopener">${icon("line")}<span>${esc(c.line)}</span></a>`
    : `<button type="button" data-send="line">${icon("line")}<span>${esc(c.line)}</span></button>`;
  return `
<section class="sec paper contacts" id="contacts">
  <div class="wrap contacts-grid">
    <div class="contacts-copy rv">
      <h2>${acc(c.h2)}</h2>
      <p class="lead">${esc(c.lead)}</p>
      <ul class="channels">
        <li><a href="${tel}" data-track="Contact">${icon("phone")}<span>${esc(c.call)}</span></a></li>
        <li><a href="${waLink(L.quiz.msgHead)}" data-track="Contact" target="_blank" rel="noopener">${icon("whatsapp-logo")}<span>${esc(c.wa)}</span></a></li>
        <li>${lineBtn}</li>
        <li><a href="${cfg.telegram}" data-track="Contact" target="_blank" rel="noopener">${icon("telegram-logo")}<span>${esc(c.tg)}</span></a></li>
      </ul>
      <h3>${esc(c.followTitle)}</h3>
      <ul class="social">${social}</ul>
    </div>
    <div class="map rv">
      <iframe title="${esc(c.mapTitle)}" src="${cfg.mapEmbed}" loading="lazy" referrerpolicy="no-referrer"></iframe>
      <p>${icon("map-pin")}<span>${esc(c.place)}</span>${cfg.mapLink ? `<a href="${cfg.mapLink}" target="_blank" rel="noopener">${esc(c.mapOpen)}</a>` : ""}</p>
    </div>
  </div>
</section>`;
}

// ---------- Каркас страницы ----------

function page(L, key, ver) {
  const p = L.pages[key];
  const file = `${key}.html`;
  const nav = (cls) => PAGES.slice(1).map((k) =>
    `<a${cls ? ` class="${cls}"` : ""} href="${k}.html"${k === key ? ` aria-current="page"` : ""}>${esc(L.ui.nav[k])}</a>`).join("");
  // Раскрывающееся меню показывает всё дерево из документа заказчика: раздел и его подпункты
  const subs = (k) => L.pages[k].sections.flatMap((x) => x.type === "duo"
    ? [[x.id, x.a.h2], [x.id, x.b.h2]]
    : x.id && x.h2 ? [[x.id, x.h2]] : []).map(([id, h]) => `<a href="${k}.html#${id}">${esc(plain(h))}</a>`).join("");
  const tree = PAGES.map((k) => `<div class="menu-group"><a class="menu-top" href="${k}.html"${k === key ? ` aria-current="page"` : ""}>${esc(k === "index" ? L.ui.home : L.ui.nav[k])}</a><div class="menu-subs">${subs(k)}</div></div>`).join("");
  const langs = LANGS.map((l) =>
    `<a href="../${l}/${file}" lang="${content[l].htmlLang}" hreflang="${content[l].htmlLang}" data-lang="${l}"${l === L.lang ? ` aria-current="true"` : ""} title="${esc(content[l].name)}">${content[l].short}</a>`).join("");
  const alt = LANGS.map((l) => `<link rel="alternate" hreflang="${content[l].htmlLang}" href="${cfg.baseUrl}${l}/${file}">`).join("\n");
  const fonts = L.lang === "th"
    ? "family=Montserrat:wght@500;600;700;800;900&family=Prompt:wght@400;500;600;700;800"
    : "family=Montserrat:wght@500;600;700;800;900";
  const js = {
    lang: L.lang, v3d: ver.v3d,
    wa: cfg.phoneE164, tg: cfg.telegram, line: cfg.line, phone: cfg.phoneLocal, pixel: cfg.metaPixelId,
    t: {
      sample: L.stage.sample, modes: { ...L.stage.modes, ...L.stage.lightModes }, notes: L.stage.notes, msg: L.stage.msg,
      msgHead: L.quiz.msgHead, msgWhat: L.quiz.msgWhat, msgWhere: L.quiz.msgWhere, msgNote: L.quiz.msgNote,
      copied: L.quiz.copied, lineHint: L.quiz.lineHint
    }
  };
  const pitch = p.sections.find((s) => s.type === "demo" && s.k === "pitch");
  if (pitch) js.t.pitch = { unit: pitch.unit, ranges: pitch.ranges };

  return `<!doctype html>
<html lang="${L.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
${cfg.noindex ? `<meta name="robots" content="noindex">` : ""}
<link rel="canonical" href="${cfg.baseUrl}${L.lang}/${file}">
${alt}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${cfg.baseUrl}${L.lang}/${file}">
<meta property="og:image" content="${cfg.baseUrl}assets/img/og.png">
<meta name="theme-color" content="#050B1F">
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fonts}&display=swap">
<script>document.documentElement.className="js"</script>
<link rel="stylesheet" href="../assets/site.css?v=${ver.css}">
</head>
<body data-page="${key}">
<a class="skip" href="#main">${esc(L.ui.skip)}</a>
<header class="hdr" data-hdr>
  <div class="wrap hdr-in">
    <a class="logo" href="index.html" aria-label="BST Phuket — ${esc(L.ui.home)}"><b>BST</b><span>Phuket</span></a>
    <nav class="nav" aria-label="${esc(L.ui.menu)}">${nav("")}</nav>
    <div class="hdr-tools">
      <div class="langs" role="group" aria-label="${esc(L.ui.langLabel)}">${langs}</div>
      <a class="btn btn-accent btn-sm hdr-cta" href="#quote">${esc(L.ui.quoteShort)}</a>
      <button type="button" class="burger" aria-expanded="false" aria-controls="menu" data-burger><span class="sr" data-open="${esc(L.ui.menu)}" data-close="${esc(L.ui.close)}">${esc(L.ui.menu)}</span>${icon("list", "i-open")}${icon("x", "i-close")}</button>
    </div>
  </div>
  <div class="menu" id="menu" hidden>
    <nav class="wrap menu-in" aria-label="${esc(L.ui.menu)}">
      ${tree}
      <a class="menu-phone" href="${tel}">${icon("phone")}<span>${esc(cfg.phoneDisplay)}</span></a>
    </nav>
  </div>
</header>
<div class="hdr-sentinel" aria-hidden="true"></div>
<main id="main">
${p.sections.map((s) => R[s.type](s, L, key)).join("\n")}
<section class="sec night manifesto"><div class="wrap"><p data-scrub>${esc(L.footer.about)}</p></div></section>
${quote(L, key)}
${contacts(L)}
</main>
<footer class="ftr night">
  <div class="wrap ftr-grid">
    <div>
      <a class="logo" href="index.html" aria-label="BST Phuket — ${esc(L.ui.home)}"><b>BST</b><span>Phuket</span></a>
      <p>${esc(L.footer.about)}</p>
    </div>
    <nav aria-label="${esc(L.footer.navTitle)}">
      <h2>${esc(L.footer.navTitle)}</h2>
      ${nav("")}
    </nav>
    <div class="ftr-contact">
      <a href="${tel}">${esc(cfg.phoneDisplay)}</a>
      <div class="langs" role="group" aria-label="${esc(L.ui.langLabel)}">${langs}</div>
    </div>
  </div>
  <div class="wrap ftr-base"><span>© ${new Date().getFullYear()} BST Phuket. ${esc(L.footer.rights)}</span></div>
</footer>
<div class="dock" data-dock>
  <a class="btn btn-ghost" data-track="Contact" target="_blank" rel="noopener" href="${waLink(L.quiz.msgHead)}">${icon("whatsapp-logo")}<span>WhatsApp</span></a>
  <a class="btn btn-accent" href="#quote">${esc(L.ui.quote)}</a>
</div>
<div class="toast" role="status" aria-live="polite" data-toast></div>
<script>window.BST=${JSON.stringify(js).replace(/</g, "\\u003c")}</script>
<script src="../assets/site.js?v=${ver.js}" defer></script>
<script src="../assets/fx.js?v=${ver.fx}" defer></script>
</body>
</html>
`;
}

// Корень сайта: отправляет на язык браузера и сохраняет метки рекламы из адреса
function gateway(ver) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BST Phuket — outdoor advertising in Phuket</title>
<meta name="description" content="${esc(content.en.pages.index.description)}">
${cfg.noindex ? `<meta name="robots" content="noindex">` : ""}
<meta property="og:title" content="BST Phuket">
<meta property="og:description" content="${esc(content.en.pages.index.description)}">
<meta property="og:image" content="${cfg.baseUrl}assets/img/og.png">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<script>(function(){var l="en";try{var s=localStorage.getItem("bst-lang"),n=(navigator.language||"en").slice(0,2).toLowerCase();l=s||(n==="ru"?"ru":n==="th"?"th":"en")}catch(e){}location.replace(l+"/"+location.search+location.hash)})()</script>
<noscript><meta http-equiv="refresh" content="0;url=en/"></noscript>
<link rel="stylesheet" href="assets/site.css?v=${ver.css}">
</head>
<body class="gate night">
<main class="gate-in">
  <p class="logo"><b>BST</b><span>Phuket</span></p>
  <nav aria-label="Language">${LANGS.map((l) => `<a class="btn btn-ghost btn-lg" href="${l}/" lang="${content[l].htmlLang}">${esc(content[l].name)}</a>`).join("")}</nav>
</main>
</body>
</html>
`;
}

// ---------- Сборка ----------

rmSync(OUT, { recursive: true, force: true });
mkdirSync(path.join(OUT, "assets"), { recursive: true });
const css = read("src/site.css");
const jsSrc = read("src/site.js");
const fxSrc = read("src/fx.js");
const ver = { css: hash(css), js: hash(jsSrc), fx: hash(fxSrc) };
writeFileSync(path.join(OUT, "assets/fx.js"), fxSrc);
// 3D-модель: three.js и сцена собираются в один файл, который страница подгружает по требованию
await bundle({ entryPoints: [path.join(ROOT, "src/scene3d.js")], bundle: true, minify: true, format: "esm", target: "es2020", outfile: path.join(OUT, "assets/scene3d.js"), logLevel: "error" });
ver.v3d = hash(readFileSync(path.join(OUT, "assets/scene3d.js")));
writeFileSync(path.join(OUT, "assets/site.css"), css);
writeFileSync(path.join(OUT, "assets/site.js"), jsSrc);
cpSync(path.join(ROOT, "src/img"), path.join(OUT, "assets/img"), { recursive: true });
cpSync(path.join(ROOT, "src/look"), path.join(OUT, "look"), { recursive: true }); // страница с тремя вариантами первого экрана
if (existsSync(path.join(ROOT, "src/favicon.svg"))) cpSync(path.join(ROOT, "src/favicon.svg"), path.join(OUT, "assets/favicon.svg"));
writeFileSync(path.join(OUT, ".nojekyll"), "");
writeFileSync(path.join(OUT, "index.html"), gateway(ver));

let n = 0;
for (const l of LANGS) {
  mkdirSync(path.join(OUT, l), { recursive: true });
  for (const key of PAGES) {
    writeFileSync(path.join(OUT, l, `${key}.html`), page(content[l], key, ver));
    n++;
  }
}
console.log(`Собрано страниц: ${n} (+ корневая) → docs/`);
