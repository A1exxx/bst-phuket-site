// Проверка сайта: совпадение структуры трёх языков и целостность собранных страниц. Запуск: node check.mjs
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const LANGS = ["ru", "en", "th"];
const SERVICE = new Set(["type", "k", "id", "href", "img", "tone", "price"]);
const errors = [];
const load = async (l) => (await import(pathToFileURL(path.join(ROOT, "content", `${l}.mjs`)).href)).default;

// 1. Языки совпадают ключ в ключ, служебные поля не тронуты, акцентные скобки на месте
function walk(a, b, at, lang) {
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return errors.push(`${lang}: разная длина списка — ${at}`);
    a.forEach((v, i) => walk(v, b[i], `${at}[${i}]`, lang));
  } else if (a && typeof a === "object") {
    const ka = Object.keys(a).join(), kb = Object.keys(b || {}).join();
    if (ka !== kb) return errors.push(`${lang}: разные ключи — ${at}`);
    for (const k of Object.keys(a)) walk(a[k], b[k], `${at}.${k}`, lang);
  } else if (typeof a === "string") {
    const key = at.split(".").pop().replace(/\[\d+\]$/, "");
    if (typeof b !== "string") return errors.push(`${lang}: не строка — ${at}`);
    if (SERVICE.has(key) && a !== b) errors.push(`${lang}: изменено служебное поле — ${at}`);
    if (!SERVICE.has(key) && a && !b.trim()) errors.push(`${lang}: пустой перевод — ${at}`);
    const braces = (s) => (s.match(/\{[^}]*\}/g) || []).length;
    if (braces(a) !== braces(b)) errors.push(`${lang}: не совпадают скобки {…} — ${at}`);
    if ((a === "+" || a === "-") && a !== b) errors.push(`${lang}: изменена ячейка таблицы — ${at}`);
  } else if (a !== b) errors.push(`${lang}: разные значения — ${at}`);
}
const ru = await load("ru");
for (const l of ["en", "th"]) walk({ ...ru, lang: 0, htmlLang: 0, short: 0, name: 0 }, { ...(await load(l)), lang: 0, htmlLang: 0, short: 0, name: 0 }, "root", l);

// 2. Собранные страницы: один h1, есть заголовок и описание, нет мусора, все внутренние ссылки и якоря ведут куда-то
const pages = Object.keys(ru.pages);
let checked = 0, links = 0;
const html = {};
for (const l of LANGS) for (const p of pages) {
  const file = path.join(ROOT, "docs", l, `${p}.html`);
  if (!existsSync(file)) { errors.push(`нет страницы docs/${l}/${p}.html`); continue; }
  html[`${l}/${p}.html`] = readFileSync(file, "utf8");
}
for (const [name, src] of Object.entries(html)) {
  checked++;
  const [lang] = name.split("/");
  if ((src.match(/<h1[\s>]/g) || []).length !== 1) errors.push(`${name}: заголовок h1 должен быть ровно один`);
  if (!/<title>[^<]{10,}<\/title>/.test(src)) errors.push(`${name}: нет заголовка страницы`);
  if (!/<meta name="description" content="[^"]{40,}"/.test(src)) errors.push(`${name}: нет описания страницы`);
  if (!src.includes(`<html lang="${lang}"`)) errors.push(`${name}: не указан язык`);
  for (const junk of ["undefined", "[object Object]", "NaN"]) if (src.replace(/<script>window\.BST=.*?<\/script>/s, "").includes(junk)) errors.push(`${name}: в тексте «${junk}»`);
  const ids = new Set([...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  if (ids.size !== [...src.matchAll(/\sid="([^"]+)"/g)].length) errors.push(`${name}: повторяются id`);
  for (const [, href] of src.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
    if (/^(https?:|tel:|mailto:)/.test(href)) continue;
    links++;
    const [file, hash] = href.split("#");
    const target = file ? path.posix.normalize(`${lang}/${file}`) : name;
    const tsrc = html[target];
    if (!tsrc) { errors.push(`${name}: ссылка в никуда — ${href}`); continue; }
    if (hash && !new RegExp(`\\sid="${hash}"`).test(tsrc)) errors.push(`${name}: нет якоря — ${href}`);
  }
  for (const [, asset] of src.matchAll(/(?:src|href)="\.\.\/(assets\/[^"?]+)/g)) {
    if (!existsSync(path.join(ROOT, "docs", asset))) errors.push(`${name}: нет файла ${asset}`);
  }
  // Вкладки разделов: у каждой вкладки свой раздел, в том же порядке; изначально открыт ровно один
  const tabs = [...src.matchAll(/class="deck-tab"[^>]*aria-controls="([^"]+)"/g)].map((m) => m[1]);
  const panels = [...src.matchAll(/<section data-panel role="tabpanel" aria-labelledby="tab-([^"]+)" class="(is-on )?/g)];
  if (tabs.length < 2 || tabs.join() !== panels.map((m) => m[1]).join()) errors.push(`${name}: вкладки и разделы не совпадают`);
  if (panels.filter((m) => m[2]).length !== 1) errors.push(`${name}: изначально открыт должен быть ровно один раздел`);
}
if (!existsSync(path.join(ROOT, "docs", "index.html"))) errors.push("нет корневой страницы docs/index.html");

// 3. «Умный билборд»: у каждого типа бизнеса есть картинка и строка рекламы на трёх языках
const board = await load("board");
for (const [k, v] of Object.entries(board.kinds)) {
  if (!existsSync(path.join(ROOT, "src", "img", `b-${k}.webp`))) errors.push(`билборд: нет картинки для типа ${k}`);
  for (const l of LANGS) if (!v.slogan?.[l]) errors.push(`билборд: нет строки ${l} для типа ${k}`);
  if (!Array.isArray(v.strong) || !Array.isArray(v.weak)) errors.push(`билборд: нет списков слов у типа ${k}`);
  if (k !== "generic" && !v.strong.length) errors.push(`билборд: пустой список слов у типа ${k}`);
}
for (const l of LANGS) if (!existsSync(path.join(ROOT, "docs", "assets", `board.${l}.json`))) errors.push(`билборд: не собран файл слов для ${l}`);

if (errors.length) {
  console.error(`ОШИБОК: ${errors.length}\n` + errors.slice(0, 40).join("\n"));
  process.exit(1);
}
console.log(`OK: языков ${LANGS.length}, страниц ${checked}, внутренних ссылок ${links}, файлов в docs/assets ${readdirSync(path.join(ROOT, "docs", "assets")).length}`);
