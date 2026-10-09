// BST Phuket — поведение страниц. Данные и переводы приходят из window.BST (см. build.mjs).
(() => {
  const B = window.BST;
  const T = B.t;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const waUrl = (text) => `https://wa.me/${B.wa}?text=${encodeURIComponent(text)}`;

  // --- Счётчики рекламы: работают, только если на странице подключён пиксель или gtag ---
  function track(name, data) {
    if (window.fbq) window.fbq("track", name, data);
    if (window.gtag) window.gtag("event", name, data);
  }
  if (B.pixel) {
    const f = (window.fbq = function () { f.queue.push(arguments); });
    f.queue = []; f.loaded = true; f.version = "2.0";
    const s = document.createElement("script");
    s.async = true; s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.append(s);
    f("init", B.pixel); f("track", "PageView");
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-track]");
    if (a) track(a.dataset.track, { page: document.body.dataset.page });
    const l = e.target.closest("[data-lang]");
    if (l) { try { localStorage.setItem("bst-lang", l.dataset.lang); } catch { /* приватный режим */ } }
  });

  // --- Шапка и меню ---
  const hdr = $("[data-hdr]");
  new IntersectionObserver(([en]) => hdr.classList.toggle("is-stuck", !en.isIntersecting)).observe($(".hdr-sentinel"));
  const burger = $("[data-burger]");
  const menu = $("#menu");
  function setMenu(open) {
    menu.hidden = !open;
    hdr.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open);
    const label = $(".sr", burger);
    label.textContent = open ? label.dataset.close : label.dataset.open;
    document.documentElement.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", () => setMenu(menu.hidden));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { setMenu(false); burger.focus(); } });

  // --- Появление блоков ---
  const io = new IntersectionObserver((ens) => {
    for (const en of ens) if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }, { rootMargin: "0px 0px -8% 0px" });
  // Заголовки блоков появляются по словам (приём SplitText / BlurText с React Bits)
  const seg = window.Intl?.Segmenter ? new Intl.Segmenter(B.lang, { granularity: "word" }) : null;
  function splitWords(root) {
    let n = 0;
    (function walk(node) {
      for (const child of [...node.childNodes]) {
        if (child.nodeType !== 3) { walk(child); continue; }
        const parts = seg ? [...seg.segment(child.textContent)] : child.textContent.split(/(\s+)/).map((s) => ({ segment: s, isWordLike: true }));
        const frag = document.createDocumentFragment();
        let prev = null;
        for (const p of parts) {
          if (!p.segment.trim()) { frag.append(p.segment); prev = null; continue; }
          if (prev && !p.isWordLike) { prev.textContent += p.segment; continue; } // знак препинания остаётся со словом
          prev = document.createElement("span");
          prev.className = "w";
          prev.style.setProperty("--w", n++);
          prev.textContent = p.segment;
          frag.append(prev);
        }
        child.replaceWith(frag);
      }
    })(root);
  }
  if (!reduce) $$(".rv h2, h2.rv").forEach(splitWords);
  $$(".rv").forEach((el) => io.observe(el));

  // --- Всплывающая подсказка ---
  const toastEl = $("[data-toast]");
  let toastTimer;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 5200);
  }

  // --- Живая вывеска ---
  function ledPainter(canvas, getText, getColor) {
    const ROWS = 14;
    const ctx = canvas.getContext("2d");
    const off = document.createElement("canvas");
    const octx = off.getContext("2d", { willReadFrequently: true });
    let map, mapW = 1, x = 0, raf = 0, last = 0, on = false;
    const font = `900 ${ROWS + 2}px Montserrat, Prompt, sans-serif`;
    function raster() {
      const txt = `${getText()}   •   `;
      octx.font = font;
      mapW = Math.ceil(octx.measureText(txt).width) + 2;
      off.width = mapW; off.height = ROWS;
      octx.font = font; octx.textBaseline = "middle"; octx.fillStyle = "#fff";
      octx.fillText(txt, 1, ROWS / 2 + 1);
      map = octx.getImageData(0, 0, mapW, ROWS).data;
    }
    function draw() {
      const r = canvas.getBoundingClientRect();
      if (!r.width) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      const cell = H / (ROWS + 2), rad = cell * 0.34, color = getColor();
      ctx.clearRect(0, 0, W, H);
      for (let cx = 0; cx * cell < W; cx++) {
        const sx = (x + cx) % mapW;
        for (let ry = 0; ry < ROWS; ry++) {
          ctx.fillStyle = map[(ry * mapW + sx) * 4 + 3] > 96 ? color : "rgba(255,255,255,.06)";
          ctx.beginPath();
          ctx.arc(cx * cell + cell / 2, (ry + 1) * cell + cell / 2, rad, 0, 6.2832);
          ctx.fill();
        }
      }
    }
    function tick(t) {
      if (!on) return;
      if (t - last > 60) { x = (x + 1) % mapW; last = t; draw(); }
      raf = requestAnimationFrame(tick);
    }
    return {
      start() { raster(); draw(); if (!reduce && !on) { on = true; raf = requestAnimationFrame(tick); } },
      stop() { on = false; cancelAnimationFrame(raf); },
      refresh() { raster(); draw(); }
    };
  }

  $$("[data-stage]").forEach((box) => {
    const stage = $(".stage", box), scene = $(".scene", box), sign = $(".sign", box), text = $(".sign-text", box);
    const input = $("[data-stage-input]", box), cta = $("[data-stage-cta]", box), note = $("[data-stage-note]", box);
    let demo = ""; // название из автопоказа, пока человек не ввёл своё
    const name = () => (input.value.trim() || demo || T.sample);
    const mode = () => stage.dataset.mode;
    const glow = () => getComputedStyle(stage).getPropertyValue("--glow").trim();
    const led = ledPainter($(".sign-led", box), name, glow);
    let visible = false;

    // Размер букв, при котором строка помещается на вывеске
    function sizeFor(str) {
      const keep = text.textContent;
      text.textContent = str;
      text.style.setProperty("--fs", "100px");
      const fs = Math.min(sign.clientHeight * 0.6, (100 * sign.clientWidth * 0.94) / text.scrollWidth);
      text.textContent = keep;
      return Math.max(12, fs);
    }
    const setSize = (px) => text.style.setProperty("--fs", `${px.toFixed(1)}px`);
    const fit = () => setSize(sizeFor(text.textContent));
    function sync() {
      text.textContent = name();
      fit();
      if (mode() === "led" && visible) led.start(); else led.stop();
      if (note) note.textContent = T.notes[mode()] || "";
      const own = input.value.trim();
      cta.href = waUrl(own
        ? T.msg.replace("{name}", own).replace("{mode}", T.modes[mode()])
        : `${T.msgHead}\n${T.msgWhat}: ${T.modes[mode()]}`);
    }
    function ignite() {
      if (reduce) return;
      stage.classList.remove("ignite");
      void stage.offsetWidth;
      stage.classList.add("ignite");
    }

    input.addEventListener("input", () => { sync(); if (mode() === "led") led.refresh(); });
    box.addEventListener("change", (e) => {
      if (e.target.name?.startsWith("mode-")) { stage.dataset.mode = e.target.value; ignite(); }
      if (e.target.name?.startsWith("color-")) stage.style.setProperty("--glow", e.target.value);
      sync();
      if (mode() === "led") led.refresh();
    });
    $$("[data-time]", $(".stage-time", box)).forEach((b) => b.addEventListener("click", () => {
      stage.dataset.time = b.dataset.time;
      $$("[data-time]", b.parentElement).forEach((o) => o.setAttribute("aria-pressed", o === b));
      if (b.dataset.time === "night") ignite();
    }));

    // Лёгкий наклон сцены вслед за мышью — даёт ощущение объёма
    if (!reduce && matchMedia("(hover: hover)").matches) {
      let frame = 0;
      stage.addEventListener("pointermove", (e) => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const r = stage.getBoundingClientRect();
          scene.style.setProperty("--ry", `${(((e.clientX - r.left) / r.width) * 2 - 1) * 7}deg`);
          scene.style.setProperty("--rx", `${(((e.clientY - r.top) / r.height) * 2 - 1) * -5}deg`);
        });
      });
      stage.addEventListener("pointerleave", () => { scene.style.setProperty("--ry", "0deg"); scene.style.setProperty("--rx", "0deg"); });
    }

    new ResizeObserver(() => { fit(); if (mode() === "led") led.refresh(); }).observe(sign);
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; sync(); }).observe(stage);
    document.fonts?.ready.then(() => { sync(); if (mode() === "led") led.refresh(); });
    sync();
    ignite();

    // Автопоказ: пока человек ничего не трогал, вывеска сама печатает названия и меняет тип
    if (box.hasAttribute("data-auto") && !reduce) {
      const names = ["SUNSET BAR", "COCO CAFE", "DIVE CENTER", "THAI MASSAGE", "MOTO RENT"];
      const radios = $$("input[name^=mode-]", box);
      let step = 0, typing = 0, stopped = false;
      function type(target) {
        clearInterval(typing);
        let cur = name().trim(), erase = true;
        setSize(Math.min(sizeFor(cur || target), sizeFor(target)));
        typing = setInterval(() => {
          if (erase) { cur = cur.slice(0, -1); erase = cur.length > 0; }
          else cur = target.slice(0, cur.length + 1);
          demo = cur || " ";
          text.textContent = cur || "\u00a0";
          if (mode() === "led") led.refresh();
          if (!erase && cur === target) { clearInterval(typing); fit(); }
        }, 55);
      }
      const timer = setInterval(() => {
        if (!visible || document.hidden || input.value.trim()) return;
        step++;
        if (step % 2) return type(names[(step >> 1) % names.length]);
        const r = radios[(radios.findIndex((x) => x.checked) + 1) % radios.length];
        r.checked = true;
        r.dispatchEvent(new Event("change", { bubbles: true }));
      }, 2600);
      const stop = () => {
        if (stopped) return;
        stopped = true;
        clearInterval(timer); clearInterval(typing);
        demo = "";
        sync();
      };
      ["pointerdown", "keydown", "focusin"].forEach((ev) => box.addEventListener(ev, stop));
    }
  });

  // --- Где будет вывеска: вкладки ---
  $$("[data-place]").forEach((root) => {
    const tabs = $$("[role=tab]", root), art = $(".place-art", root);
    function pick(tab, focus) {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", on);
        t.tabIndex = on ? 0 : -1;
        $(`#${t.getAttribute("aria-controls")}`).hidden = !on;
      });
      art.dataset.k = tab.dataset.k;
      if (focus) tab.focus();
    }
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => pick(t));
      t.addEventListener("keydown", (e) => {
        const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (d) { e.preventDefault(); pick(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
  });

  // --- Подбор шага пикселя ---
  $$("[data-pitch]").forEach((root) => {
    const range = $("input[type=range]", root), out = $("[data-out]", root), dist = $("[data-dist]", root);
    const rt = $("[data-rt]", root), rd = $("[data-rd]", root), canvas = $("canvas", root), ctx = canvas.getContext("2d");
    const src = document.createElement("canvas"), sctx = src.getContext("2d", { willReadFrequently: true });
    function draw() {
      const p = Number(range.value);
      out.textContent = `P${p}`;
      dist.textContent = `${p} ${T.pitch.unit}`;
      const r = T.pitch.ranges.find((x) => p <= x.max) || T.pitch.ranges.at(-1);
      rt.textContent = r.t; rd.textContent = r.d;
      range.setAttribute("aria-valuetext", `P${p}`);

      const box = canvas.getBoundingClientRect();
      if (!box.width) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const W = (canvas.width = Math.round(box.width * dpr)), H = (canvas.height = Math.round(box.height * dpr));
      const cell = (2.2 + p * 2.1) * dpr; // крупнее шаг — крупнее «пиксель» на картинке
      const cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
      src.width = cols; src.height = rows;
      const g = sctx.createLinearGradient(0, 0, cols, rows);
      g.addColorStop(0, "#0D3B95"); g.addColorStop(1, "#050B1F");
      sctx.fillStyle = g; sctx.fillRect(0, 0, cols, rows);
      sctx.fillStyle = "#EF7B20";
      sctx.font = `900 ${rows * 0.62}px Montserrat, sans-serif`;
      sctx.textAlign = "center"; sctx.textBaseline = "middle";
      sctx.fillText("BST", cols / 2, rows * 0.46);
      sctx.fillStyle = "#fff";
      sctx.font = `800 ${rows * 0.16}px Montserrat, sans-serif`;
      sctx.fillText("PHUKET", cols / 2, rows * 0.84);
      const px = sctx.getImageData(0, 0, cols, rows).data;
      ctx.fillStyle = "#02040C"; ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        ctx.fillStyle = `rgb(${px[i]},${px[i + 1]},${px[i + 2]})`;
        ctx.beginPath();
        ctx.arc(x * cell + cell / 2, y * cell + cell / 2, cell * 0.36, 0, 6.2832);
        ctx.fill();
      }
    }
    range.addEventListener("input", draw);
    new ResizeObserver(draw).observe(canvas);
    document.fonts?.ready.then(draw);
  });

  // --- Заявка в мессенджер ---
  const quiz = $("[data-quiz]");
  function message() {
    const what = $$("input[name=what]:checked", quiz).map((i) => i.value);
    const where = $("input[name=where]:checked", quiz)?.value;
    const note = quiz.elements.note.value.trim();
    const lines = [T.msgHead];
    if (what.length) lines.push(`${T.msgWhat}: ${what.join(", ")}`);
    if (where) lines.push(`${T.msgWhere}: ${where}`);
    if (note) lines.push(`${T.msgNote}: ${note}`);
    return lines.join("\n");
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
  }
  async function send(channel) {
    const msg = message();
    track("Lead", { channel });
    if (channel === "wa") return void window.open(waUrl(msg), "_blank", "noopener");
    if (channel === "tg") {
      window.open(B.tg, "_blank", "noopener");
      if (await copy(msg)) toast(T.copied);
      return;
    }
    await copy(msg);
    if (B.line) window.open(B.line, "_blank", "noopener");
    toast(B.line ? T.copied : T.lineHint.replace("{phone}", B.phone));
  }
  quiz.addEventListener("submit", (e) => { e.preventDefault(); send("wa"); });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-send]");
    if (b && b.type !== "submit") send(b.dataset.send);
    // «Рассчитать» в карточке уровня подставляет его название в комментарий
    const tier = e.target.closest("[data-note]");
    if (tier && !quiz.elements.note.value) quiz.elements.note.value = tier.dataset.note;
  });

  // --- Название из поля появляется на вывеске в кадре (главная и «Вывески»). На главной сайт ещё угадывает бизнес по названию и дорисовывает пример рекламы ---
  const plate = $("[data-plate]"), plateInput = $("[data-plate-input]");
  if (plate) {
    const box = plate.parentElement, art = $(".plate-art", box), slogan = $("[data-slogan]", box), ctx = art?.getContext("2d");
    const images = {};
    let board = null, boardLoading = null, kind = "", drawTimer = 0, waitTimer = 0;
    // Слова и примеры рекламы лежат в отдельном файле и подгружаются, когда человек начал печатать
    const loadBoard = () => boardLoading || (boardLoading = fetch(`../assets/board.${B.lang}.json?v=${B.vBoard}`)
      .then((r) => r.json()).then((d) => { board = d.kinds; }));
    function fitPlate() {
      const n = Math.max(plate.textContent.length, 4), withArt = box.classList.contains("has-art");
      const size = Math.min(box.offsetHeight * (withArt ? 0.3 : 0.56), (box.offsetWidth * (withArt ? 0.84 : 0.92)) / (n * 0.7));
      plate.style.fontSize = `${size.toFixed(1)}px`;
      if (!slogan) return;
      const fit = (box.offsetWidth * 0.8) / (Math.max(slogan.textContent.length, 8) * 0.6);
      slogan.style.fontSize = `${Math.max(6, Math.min(size * 0.5, fit)).toFixed(1)}px`;
    }
    // Бизнес угадываем по словам названия. Сильное слово («pizza») весит больше общего («shop»);
    // слово, совпавшее целиком, весит больше, чем начало слова; короткие слова ищем только целиком,
    // чтобы «bar» не срабатывал на «barber». Ничего не нашлось — общий пример рекламы.
    function guess(name) {
      const tokens = name.toLowerCase().replace(/[^\p{L}\p{N}\p{M}]+/gu, " ").trim().split(" ");
      const text = tokens.join(" ");
      const hit = (w) => {
        if (w.includes(" ") || /[\u0E00-\u0E7F]/.test(w)) return text.includes(w) ? 1 : 0;
        if (tokens.includes(w)) return 2;
        return w.length > 3 && tokens.some((t) => t.startsWith(w)) ? 1 : 0;
      };
      let best = "generic", top = 0;
      for (const [k, v] of Object.entries(board)) {
        let score = 0;
        for (const w of v.s) { const h = hit(w); if (h) score += 10 + w.length + (h === 2 ? 4 : 0); }
        for (const w of v.w) if (hit(w)) score += w.length / 2;
        if (score > top) { top = score; best = k; }
      }
      return best;
    }
    // Картинка проявляется от крупной мозаики к чёткой — как будто дорисовывается на глазах
    function paint(img, atOnce) {
      clearInterval(drawTimer);
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const w = (art.width = Math.round(box.offsetWidth * dpr)), h = (art.height = Math.round(box.offsetHeight * dpr));
      const steps = reduce || atOnce ? [1] : [28, 18, 12, 8, 5, 3, 2, 1];
      const tiny = document.createElement("canvas"), tctx = tiny.getContext("2d");
      let i = 0;
      const step = () => {
        const cell = steps[i++];
        if (cell === 1) { ctx.imageSmoothingEnabled = true; ctx.drawImage(img, 0, 0, w, h); return clearInterval(drawTimer); }
        tiny.width = Math.max(2, Math.round(w / (cell * dpr))); tiny.height = Math.max(2, Math.round(h / (cell * dpr)));
        tctx.drawImage(img, 0, 0, tiny.width, tiny.height);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tiny, 0, 0, w, h);
      };
      step();
      if (steps.length > 1) drawTimer = setInterval(step, 130);
    }
    function show(next) {
      if (next === kind) return;
      kind = next;
      clearInterval(drawTimer);
      box.classList.toggle("has-art", !!kind);
      slogan.textContent = kind ? board[kind].t : "";
      fitPlate();
      if (!kind) return;
      const img = images[kind] || (images[kind] = Object.assign(new Image(), { src: `../assets/img/b-${kind}.webp` }));
      if (img.complete && img.naturalWidth) paint(img);
      else img.onload = () => { if (kind === next) paint(img); };
    }
    plateInput.addEventListener("input", () => {
      const name = plateInput.value.trim();
      plate.textContent = name || T.sample;
      fitPlate();
      $$("[data-stage-input]").forEach((i) => { i.value = plateInput.value; i.dispatchEvent(new Event("input", { bubbles: true })); });
      if (!art) return; // вывеска без примера рекламы — только название
      clearTimeout(waitTimer);
      waitTimer = setTimeout(() => { // ждём, пока человек допечатает слово
        if (name.length < 3) return show("");
        loadBoard().then(() => { if (plateInput.value.trim() === name) show(guess(name)); }).catch(() => {});
      }, 550);
    });
    addEventListener("resize", () => { fitPlate(); if (kind && images[kind]?.naturalWidth) paint(images[kind], true); });
    document.fonts?.ready.then(fitPlate);
    fitPlate();
    // «Вывески»: кадр ставится так, чтобы вывеска попала в просвет между заголовком и полем ввода — на любом экране и языке
    const gap = $("[data-plate-gap]");
    if (gap) {
      const head = gap.closest(".phead");
      const place = () => {
        const g = gap.getBoundingClientRect(), s = head.getBoundingClientRect();
        head.style.setProperty("--y0", `${Math.round(g.top + g.height / 2 - s.top)}px`);
        fitPlate();
      };
      const ro = new ResizeObserver(place);
      ro.observe(head); ro.observe(gap);
      place();
    }
  }

  // --- Вкладки разделов: на странице виден один раздел, остальные открываются по нажатию ---
  $$("[data-deck]").forEach((deck) => {
    const barBox = $(".deck-bar", deck), bar = $(".deck-tabs", deck), tabs = $$(".deck-tab", bar);
    const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
    function open(i, { jump = false, focus = false } = {}) {
      tabs.forEach((t, n) => {
        const on = n === i;
        t.setAttribute("aria-selected", on);
        t.tabIndex = on ? 0 : -1;
        panels[n].classList.toggle("is-on", on);
      });
      const tab = tabs[i];
      bar.scrollTo({ left: tab.offsetLeft - (bar.clientWidth - tab.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
      if (focus) tab.focus({ preventScroll: true });
      // Новый раздел читают с начала: если страница прокручена ниже полосы вкладок, возвращаемся к ней
      const y = Math.round(deck.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(barBox).top));
      if (jump || scrollY > y) scrollTo({ top: y, behavior: "instant" });
    }
    const pick = (i, opts) => { open(i, opts); history.replaceState(null, "", `#${panels[i].id}`); };
    const byHash = () => panels.findIndex((p) => `#${p.id}` === location.hash);
    tabs.forEach((t, i) => {
      t.addEventListener("click", (e) => { e.preventDefault(); pick(i); });
      t.addEventListener("keydown", (e) => {
        if (e.key === " ") { e.preventDefault(); return pick(i); }
        const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        pick((to + tabs.length) % tabs.length, { focus: true });
      });
    });
    // Ссылка на раздел (из меню, из кнопки «Дальше», из другой страницы) открывает его вкладку
    addEventListener("hashchange", () => { const i = byHash(); if (i >= 0) open(i, { jump: true, focus: true }); });
    const fromLink = () => { const i = byHash(); if (i >= 0) open(i, { jump: true }); };
    fromLink();
    addEventListener("load", fromLink, { once: true }); // после загрузки картинок и шрифтов высота блоков выше могла измениться
  });

  // --- «Объёмные буквы»: цвет свечения на кадре в шапке; тот же цвет получает вывеска в конструкторе ниже ---
  $$("[data-tint]").forEach((root) => root.addEventListener("change", (e) => {
    if (e.target.name !== "tint") return;
    root.style.setProperty("--tint", e.target.value);
    root.classList.toggle("is-tinted", !e.target.hasAttribute("data-off"));
    const same = $(`input[name^="color-"][value="${e.target.value}"]`);
    if (same) { same.checked = true; same.dispatchEvent(new Event("change", { bubbles: true })); }
  }));

  // --- Карта в контактах: на телефоне открывается по кнопке, чтобы не удлинять страницу ---
  $$("[data-map-toggle]").forEach((b) => b.addEventListener("click", () => {
    const on = $(`#${b.getAttribute("aria-controls")}`).classList.toggle("is-open");
    b.setAttribute("aria-expanded", on);
  }));

  // --- Крупная фраза перед заявкой: слова «зажигаются» по мере прокрутки ---
  $$("[data-scrub]").forEach((el) => {
    if (reduce) return;
    splitWords(el);
    const words = $$(".w", el);
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.9 - r.top) / (r.height + innerHeight * 0.36)));
      words.forEach((w, i) => { w.style.opacity = Math.min(1, Math.max(0.14, p * words.length * 1.15 - i)).toFixed(2); });
    };
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { if (!raf) raf = requestAnimationFrame(tick); }
      else { cancelAnimationFrame(raf); raf = 0; }
    }).observe(el);
  });

  // --- Нижняя панель на телефоне: прячется, когда форма заявки уже на экране ---
  const dock = $("[data-dock]");
  let past = false, atQuote = false;
  const dockSync = () => dock.classList.toggle("is-on", past && !atQuote);
  new IntersectionObserver(([en]) => { past = !en.isIntersecting; dockSync(); }).observe($(".cta-row"));
  new IntersectionObserver(([en]) => { atQuote = en.isIntersecting; dockSync(); }).observe($("#quote"));
})();
