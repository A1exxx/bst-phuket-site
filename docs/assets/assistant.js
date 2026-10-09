// BST Phuket — помощник на сайте: кнопка и окно чата. Тексты приходят из window.BST_ASSIST (content/assistant.mjs),
// данные сайта — из window.BST (см. build.mjs). Без зависимостей. Внешний запрос только к необязательному BST.assistUrl.
(() => {
  const B = window.BST;
  const S = window.BST_ASSIST;
  if (!B || !S || !Array.isArray(S.intents)) return;

  const KEY = "bst-assist";
  const MAX = 30; // сколько сообщений помним
  const HOT = ["price", "time", "human"]; // после этих тем сразу предлагаем написать менеджеру
  const rm = matchMedia("(prefers-reduced-motion: reduce)");
  const narrow = matchMedia("(max-width: 899px)");
  const aiUrl = typeof B.assistUrl === "string" ? B.assistUrl.trim() : "";

  const svg = (paths) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
  const ICON = {
    chat: svg('<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/>'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    send: svg('<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>')
  };

  // Весь текст кладём через textContent: ввод пользователя никогда не попадает в разметку
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function boot() {
    if (document.querySelector(".as-root")) return;

    // --- Состояние: история и открыто/закрыто живут в sessionStorage, переживают переходы между страницами ---
    function load() {
      const fresh = { l: B.lang, o: false, p: [], m: [] };
      try {
        const s = JSON.parse(sessionStorage.getItem(KEY));
        if (!s || s.l !== B.lang || !Array.isArray(s.m)) return fresh; // другой язык — начинаем заново
        return {
          l: B.lang,
          o: s.o === true,
          p: Array.isArray(s.p) ? s.p.filter((x) => typeof x === "string") : [],
          m: s.m
            .filter((m) => m && (m.r === "u" || m.r === "b") && typeof m.t === "string")
            .map((m) => ({ r: m.r, t: m.t, k: m.k === "o" || m.k === "c" ? m.k : undefined, i: typeof m.i === "string" ? m.i : undefined }))
            .slice(-MAX)
        };
      } catch { return fresh; }
    }
    const st = load(); // l — язык, o — открыто, p — темы разговора, m — сообщения {r: u|b, t, k: o|c, i: id темы}
    function save() {
      try { sessionStorage.setItem(KEY, JSON.stringify(st)); } catch { /* приватный режим */ }
    }

    // --- Разметка ---
    const root = el("div", "as-root");
    const launch = el("button", "as-launch");
    launch.type = "button";
    launch.setAttribute("aria-expanded", "false");
    launch.setAttribute("aria-controls", "as-panel");
    launch.insertAdjacentHTML("afterbegin", ICON.chat);
    launch.append(el("span", "", S.open));

    const panel = el("section", "as-panel");
    panel.id = "as-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", S.title);

    const head = el("div", "as-head");
    const headText = el("div", "as-head-txt");
    headText.append(el("p", "as-title", S.title), el("p", "as-sub", S.sub));
    const closeBtn = el("button", "as-close");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", S.close);
    closeBtn.insertAdjacentHTML("afterbegin", ICON.close);
    head.append(headText, closeBtn);

    const list = el("div", "as-list");
    list.setAttribute("aria-live", "polite");

    const form = el("form", "as-form");
    const label = el("label", "as-sr", S.placeholder);
    label.htmlFor = "as-input";
    const input = el("input", "as-input");
    input.id = "as-input";
    input.type = "text";
    input.maxLength = 300;
    input.autocomplete = "off";
    input.placeholder = S.placeholder;
    input.enterKeyHint = "send";
    const sendBtn = el("button", "as-send");
    sendBtn.type = "submit";
    sendBtn.setAttribute("aria-label", S.send);
    sendBtn.insertAdjacentHTML("afterbegin", ICON.send);
    form.append(label, input, sendBtn);

    panel.append(head, list, form);
    root.append(launch, panel);
    document.body.append(root);

    // --- Сообщения ---
    const nodes = []; // DOM-узлы сообщений, по порядку st.m
    let chips = null, typing = null, busy = false, closeTimer = 0;
    const scrollEnd = () => { list.scrollTop = list.scrollHeight; };

    function actionButton(text, kind, cls) {
      const b = el("button", `as-btn ${cls}`, text);
      b.type = "button";
      b.dataset.as = kind;
      b.dataset.track = "Contact"; // тот же счётчик, что у остальных кнопок связи (см. site.js)
      return b;
    }
    function bubble(m) {
      const row = el("div", `as-msg ${m.r === "u" ? "as-user" : "as-bot"}`);
      row.append(el("p", "as-bubble", m.t));
      if (m.k === "o") {
        const box = el("div", "as-actions");
        box.append(actionButton(S.toTelegram, "tg", "as-btn-ghost"), actionButton(S.toWhatsapp, "wa", "as-btn-solid"));
        row.append(box);
      } else if (m.i) {
        const link = S.intents.find((x) => x.id === m.i)?.link;
        if (link) {
          const a = el("a", "as-btn as-btn-ghost as-link", link.label);
          a.href = link.href;
          row.append(a);
        }
      }
      return row;
    }
    function add(m) {
      st.m.push(m);
      const n = bubble(m);
      nodes.push(n);
      list.insertBefore(n, typing); // индикатор набора, если он есть, остаётся последним
      if (st.m.length > MAX) { st.m.shift(); nodes.shift().remove(); }
      save();
      scrollEnd();
    }
    function showChips() {
      chips = el("div", "as-chips");
      for (const c of S.chips) {
        const b = el("button", "as-chip", c.label);
        b.type = "button";
        b.dataset.say = c.say;
        chips.append(b);
      }
      list.append(chips);
    }
    function start() {
      if (st.m.length) return;
      add({ r: "b", t: S.hello });
      showChips();
    }
    function typingOn() {
      typing = el("div", "as-msg as-bot as-typing");
      const b = el("p", "as-bubble");
      b.setAttribute("aria-hidden", "true");
      b.append(el("span", "as-dot"), el("span", "as-dot"), el("span", "as-dot"));
      typing.append(b);
      list.append(typing);
      scrollEnd();
    }
    function typingOff() {
      if (typing) { typing.remove(); typing = null; }
    }

    // --- Простой мозг: ключевые слова ---
    // Текст в нижнем регистре, без знаков препинания, с пробелом по краям: ключ " sign" ищет слово целиком.
    const norm = (s) => ` ${s.toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, " ").trim()} `;
    function match(text) {
      const t = norm(text);
      let best = null, top = 0;
      for (const it of S.intents) {
        const n = it.keys.filter((k) => t.includes(k)).length;
        // При равном счёте вопрос про цену, срок или менеджера важнее темы, в остальном побеждает первый
        if (n > top || (n === top && n > 0 && HOT.includes(it.id) && !HOT.includes(best.id))) { top = n; best = it; }
      }
      return best;
    }

    // --- Настоящий ИИ-ответ: только если сайт задал BST.assistUrl; любая ошибка — молча уходим на простой мозг ---
    async function askAssist() {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 12000);
      try {
        const messages = st.m.filter((m) => !m.k).map((m) => ({ role: m.r === "u" ? "user" : "assistant", content: m.t }));
        while (messages.length && messages[0].role !== "user") messages.shift();
        const res = await fetch(aiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lang: B.lang, messages }),
          signal: ctl.signal,
          credentials: "omit"
        });
        if (!res.ok) return "";
        const data = await res.json();
        return typeof data.reply === "string" ? data.reply.trim().slice(0, 1200) : "";
      } catch { return ""; } finally { clearTimeout(timer); }
    }

    async function answer(text) {
      busy = true;
      try {
        const t0 = Date.now();
        const hit = match(text);
        if (hit && hit.topic && !st.p.includes(hit.topic)) st.p.push(hit.topic);
        if (!rm.matches || aiUrl) typingOn();
        const reply = aiUrl ? await askAssist() : "";
        const wait = rm.matches ? 0 : 600 - (Date.now() - t0);
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        typingOff();
        if (reply) add({ r: "b", t: reply });
        else add({ r: "b", t: hit ? hit.answer : S.fallback, i: hit && hit.link ? hit.id : undefined });
        // Предложение написать менеджеру: после второго вопроса или сразу по цене, сроку, менеджеру.
        // Не повторяем, пока прошлое предложение ещё на виду.
        const asked = st.m.filter((m) => m.r === "u").length;
        const hot = hit && HOT.includes(hit.id);
        if ((asked >= 2 || hot) && !st.m.slice(-8).some((m) => m.k === "o")) add({ r: "b", t: S.offer, k: "o" });
      } finally {
        typingOff();
        busy = false;
      }
    }

    function send(raw) {
      const text = String(raw).trim().slice(0, 300);
      if (!text || busy) return false;
      if (chips) { chips.remove(); chips = null; }
      add({ r: "u", t: text });
      answer(text);
      return true;
    }

    // --- Передача менеджеру ---
    function brief() {
      const asked = st.m.filter((m) => m.r === "u").map((m) => m.t).join(" / ");
      const lines = [S.briefHead];
      if (st.p.length) lines.push(`${S.briefTopic}: ${st.p.join(", ")}`);
      lines.push(`${S.briefChat}: ${asked.length > 900 ? "…" + asked.slice(-900) : asked}`);
      return lines.join("\n");
    }
    function toTelegram() {
      let copied = Promise.resolve(false);
      try { copied = navigator.clipboard.writeText(brief()).then(() => true, () => false); } catch { /* буфер недоступен */ }
      window.open(B.tg, "_blank", "noopener");
      copied.then((ok) => { if (ok) add({ r: "b", t: S.copied, k: "c" }); });
    }

    // --- Открыть и закрыть ---
    function setOpen(on, focus = true) {
      clearTimeout(closeTimer);
      st.o = on;
      save();
      launch.setAttribute("aria-expanded", on);
      root.classList.toggle("as-open", on);
      if (on) {
        start();
        panel.hidden = false;
        void panel.offsetWidth; // чтобы переход начался с закрытого вида
        panel.classList.add("is-on");
        scrollEnd();
        if (focus) input.focus({ preventScroll: true });
      } else {
        panel.classList.remove("is-on");
        closeTimer = setTimeout(() => { panel.hidden = true; }, rm.matches ? 0 : 260);
        if (focus) launch.focus();
      }
    }

    launch.addEventListener("click", () => setOpen(!st.o));
    closeBtn.addEventListener("click", () => setOpen(false));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (send(input.value)) input.value = "";
    });
    list.addEventListener("click", (e) => {
      const b = e.target.closest("button, a");
      if (!b) return;
      if (b.dataset.say) {
        const byKeyboard = b.matches(":focus-visible"); // кнопки подсказок исчезают: клавиатурному пользователю возвращаем фокус в поле
        if (send(b.dataset.say) && byKeyboard) input.focus({ preventScroll: true });
      } else if (b.dataset.as === "wa") {
        window.open(`https://wa.me/${B.wa}?text=${encodeURIComponent(brief())}`, "_blank", "noopener");
      } else if (b.dataset.as === "tg") {
        toTelegram();
      } else if (b.classList.contains("as-link") && narrow.matches) {
        setOpen(false, false); // на телефоне окно закрывало бы страницу, на которую человек как раз перешёл
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && st.o) setOpen(false);
    });

    // --- Восстановление после перехода на другую страницу ---
    for (const m of st.m) {
      const n = bubble(m);
      nodes.push(n);
      list.append(n);
    }
    if (st.m.length && !st.m.some((m) => m.r === "u")) showChips();
    if (st.o) setOpen(true, false);
  }

  if (document.body) boot();
  else document.addEventListener("DOMContentLoaded", boot, { once: true });
})();
