// Настройки сайта, общие для всех языков. После правки — node build.mjs
export default {
  phoneDisplay: "+66 81 730 6020",
  phoneLocal: "081 730 6020",
  phoneE164: "66817306020", // для tel: и wa.me — без плюса и без нуля после кода страны
  telegram: "https://t.me/+66817306020",
  line: "", // ссылка вида https://line.me/ti/p/~ID; пока пусто — кнопка LINE показывает номер
  instagram: "https://www.instagram.com/bst.phuket",
  facebook: "https://www.facebook.com/bst.ads.th",
  youtube: "https://www.youtube.com/@bstcreativeadvertising",
  tiktok: "", // пусто — значок скрыт
  // Карта района Чалонг без метки: точного адреса для сайта пока нет
  mapEmbed: "https://www.openstreetmap.org/export/embed.html?bbox=98.305%2C7.822%2C98.372%2C7.872&layer=mapnik",
  mapLink: "", // ссылка на точку BST в Google Maps; пусто — ссылка скрыта
  metaPixelId: "", // пусто — пиксель Meta не загружается
  assistUrl: "", // адрес сервера с нейросетью для помощника-бота; пусто — бот отвечает по готовым ответам
  noindex: true, // демо-версия закрыта от поисковиков; перед запуском рекламы поставить false
  baseUrl: "https://a1exxx.github.io/bst-phuket-site/"
};
