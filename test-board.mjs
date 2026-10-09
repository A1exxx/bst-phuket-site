// Проверка «умного билборда»: берёт функцию угадывания прямо из src/site.js и прогоняет её на примерах названий.
// Запуск: node build.mjs && node test-board.mjs
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./src/site.js", import.meta.url), "utf8");
const from = src.indexOf("function guess(name) {");
const to = src.indexOf("// Картинка проявляется", from);
if (from < 0 || to < 0) throw new Error("в src/site.js не найдена функция guess");
const board = JSON.parse(readFileSync(new URL("./docs/assets/board.ru.json", import.meta.url), "utf8")).kinds;
const guess = new Function("board", `${src.slice(from, to)}; return guess;`)(board);

const CASES = {
  "bar": "bar", "Sunset Bar": "bar", "Бар Луна": "bar", "Pink Drinks Bar": "bar", "Martini Lounge": "bar",
  "barber shop": "beauty", "Nail Salon": "beauty", "Салон красоты": "beauty",
  "music lesson": "music", "Guitar School": "music",
  "Coco Coffee": "cafe", "coffee shop": "cafe", "Кофейня Утро": "cafe", "Brown Sugar Cafe": "cafe", "ร้านกาแฟ": "cafe",
  "Green House Coffeeshop": "weed", "Phuket Cannabis Club": "weed", "Weed Paradise": "weed", "Кофешоп Хай": "weed", "420 Phuket": "weed",
  "Thai Massage": "spa", "นวดแผนไทย": "spa",
  "Mama Thai Food": "thai", "Seafood Rawai": "thai",
  "Sushi Bar Tokyo": "sushi",
  "Пиццерия Марио": "food", "Burger House": "food", "Family Restaurant": "food",
  "Bakery & Cake": "bakery", "Gelato Italiano": "bakery",
  "Muay Thai Gym": "fitness", "Martial Arts Phuket": "fitness",
  "English School": "school", "Kids Academy": "school",
  "Yoga Studio": "class", "Школа йоги": "class",
  "Dive Center": "dive", "Island Tours": "dive",
  "Moto Rent": "moto", "Car Repair": "repair", "Автосервис": "repair",
  "Villa Rental": "hotel", "Real Estate Phuket": "hotel",
  "Fashion Boutique": "shop", "Fruit Market": "market", "Laundry Express": "laundry", "Прачечная": "laundry",
  "Tattoo Ink": "tattoo", "Dental Clinic": "clinic", "Pet Shop": "pets",
  "Sunrise": "generic", "Education Center": "school", "Carpet World": "generic", "Steak House": "food"
};

const bad = Object.entries(CASES).filter(([name, want]) => guess(name) !== want).map(([name, want]) => `${name} → ${guess(name)} (ждали ${want})`);
console.log(bad.length ? `НЕ СОШЛОСЬ ${bad.length} из ${Object.keys(CASES).length}:\n` + bad.join("\n") : `OK: все ${Object.keys(CASES).length} названий угаданы верно`);
process.exit(bad.length ? 1 : 0);
