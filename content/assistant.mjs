// BST Phuket — тексты помощника на сайте (чат-виджет src/assistant.js). Три языка, структура одинаковая ключ в ключ.
// В текстах НЕТ цен, сроков, гарантий, числа клиентов и любой статистики: клиент их не подтвердил. Не добавлять без его слова.
// Подбор ответа: текст пользователя в нижнем регистре, знаки препинания заменены пробелами, по краям по пробелу.
// Балл интента = сколько его keys нашлось в тексте. Ключ с пробелом в начале или в конце ищет слово целиком (" sign", " led ").

// Ключи для ru и en: русские и английские основы слов вместе, поэтому оба языка используют один набор.
const K = {
  hello: ["привет", "здравств", "добрый день", "добрый вечер", "доброе утро", "hello", " hi ", " hey ", "good morning", "good evening"],
  signs: ["вывеск", "фасад", "крыш", "билборд", "наружн", "табличк", " sign", "signage", "facade", "façade", "fascia", "rooftop", "billboard", "storefront", "shopfront"],
  letters: ["букв", "канальн", "контражур", "лицев", "торцев", "нержав", "акрил", "пвх", "композит", "алюмин", " letter", "lettering", "face lit", "side lit", "halo", "backlit", "back lit", "stainless", "acrylic", "aluminium", "aluminum", "pvc"],
  neon: ["неон", "неонов", "neon", "neon sign"],
  lightbox: ["короб", "лайтбокс", "лайт бокс", "lightbox", "light box", "box sign"],
  led: ["экран", "дисплей", "светодиод", "пиксел", " led ", "screen", "display", "video wall", "videowall", "pixel"],
  print: ["печат", "баннер", "плёнк", "пленк", "винил", "наклейк", "ламинац", "перфор", "print", "banner", "vinyl", " film", "sticker", "laminat", "perforated"],
  dynamic: ["динамическ", "проектор", "гобо", "лазер", "голограф", "проекц", "вентилятор", "подвижн", "движущ", "hologra", "projector", "projection", "gobo", "laser", " fan", "moving"],
  robots: ["робот", "аренд", "выкуп", "robot", " rent", "rental", "lease"],
  branding: ["бренд", "дизайн", "макет", "логотип", "упаковк", "айдентик", "файл", "brand", "branding", "design", "logo", "artwork", "packaging", "layout", "identity", " file"],
  price: ["цена", "цены", "цену", "цене", "цен", "ценник", "стоимост", "стоим", "стоит", "стоят", "сколько", "прайс", "расценк", "почём", "почем", "бюджет", "смета", "расчёт", "расчет", "рассчитат", "посчитат", "дорого", "price", "pric", "cost", "cost of", "how much", "much", "quote", "quotation", "estimate", "budget"],
  time: ["срок", "врем", "долго", "быстро", "когда", "срочно", "скоро", "сколько времени", "how long", "how fast", "how soon", "when", "deadline", "turnaround", "lead time", "timeline", "urgent", "asap"],
  install: ["монтаж", "монтир", "установ", "повесит", "креплен", "install", " mount", "mounting", "fitting", "put up", " hang"],
  where: ["где", "адрес", "находит", "расположен", "добрат", "локаци", "чалонг", "пхукет", "район", "приехать", "офис", "мастерск", "производств", "where", "address", "location", "located", "find you", "chalong", "phuket", "office", "workshop", "factory", "visit", " map", "directions"],
  human: ["менеджер", "оператор", "живой", "звон", "телефон", "связ", "свяж", "контакт", "номер", "ватсап", "вотсап", "whatsapp", "телеграм", "telegram", "язык", "русск", "manager", "human", "person", "operator", " agent", " call", "phone", "contact", "talk", "speak", "language", "russian", "english"],
  thanks: ["спасибо", "благодар", "спс", "отлично", "супер", "thank", "thx", " ty ", "cheers", "great", "perfect"]
};

// Тайские ключи: у тайского нет пробелов между словами, поэтому здесь основы слов. Добавляются к общим K.
const T = {
  hello: ["สวัสดี", "หวัดดี"],
  signs: ["ป้าย", "ป้ายร้าน", "หน้าร้าน", "ดาดฟ้า", "หลังคา", "บิลบอร์ด"],
  letters: ["ตัวอักษร", "อักษร", "ตัวนูน", "สแตนเลส", "อะคริลิค", "อะคริลิก", "พีวีซี", "อลูมิเนียม", "คอมโพสิต", "ฮาโล"],
  neon: ["นีออน", "ป้ายไฟนีออน"],
  lightbox: ["กล่องไฟ", "ป้ายกล่องไฟ"],
  led: ["จอ led", "จอled", "แอลอีดี", "พิกเซล", "จอโฆษณา", "จอภาพ"],
  print: ["งานพิมพ์", "พิมพ์", "ไวนิล", "สติ๊กเกอร์", "สติกเกอร์", "ฟิล์ม", "เคลือบ", "ลามิเนต"],
  dynamic: ["ไดนามิก", "เคลื่อนไหว", "โปรเจกเตอร์", "โปรเจคเตอร์", "เลเซอร์", "โฮโลแกรม", "ฉายภาพ", "พัดลม", "โกโบ"],
  robots: ["หุ่นโฆษณา", "หุ่นยนต์", "หุ่น", "เช่า", "ซื้อมือสอง"],
  branding: ["แบรนด์", "แบรนด์บุ๊ก", "แบรนดิ้ง", "โลโก้", "ออกแบบ", "บรรจุภัณฑ์", "ไฟล์"],
  price: ["ราคา", "ราค", "เท่าไหร่", "เท่าไร", "กี่บาท", "ค่าใช้จ่าย", "ใบเสนอราคา", "เสนอราคา", "ประเมิน", "แพง", "งบประมาณ", "งบ"],
  time: ["ระยะเวลา", "เวลา", "กี่วัน", "นานไหม", "นานแค่ไหน", "นาน", "เมื่อไหร่", "ด่วน", "เร็ว", "กำหนดส่ง", "เสร็จ"],
  install: ["ติดตั้ง", "ติดให้", "ช่างติด"],
  where: ["ที่อยู่", "อยู่ที่ไหน", "ที่ไหน", "ฉลอง", "ภูเก็ต", "แผนที่", "โรงงาน", "ออฟฟิศ", "สำนักงาน", "เดินทาง"],
  human: ["ผู้จัดการ", "เจ้าหน้าที่", "แอดมิน", "พนักงาน", "คุยกับ", "โทร", "ติดต่อ", "เบอร์", "ภาษา"],
  thanks: ["ขอบคุณ", "ขอบใจ"]
};

export default {
  ru: {
    "open": "Задать вопрос",
    "title": "Помощник BST",
    "sub": "Отвечает сразу. Сложные вопросы передаёт менеджеру.",
    "close": "Закрыть чат",
    "placeholder": "Напишите вопрос",
    "send": "Отправить",
    "hello": "Здравствуйте! Подскажу по вывескам, буквам, экранам, печати и рекламным роботам. Выберите тему или напишите свой вопрос.",
    "chips": [
      { "label": "Вывески", "say": "Расскажите про вывески" },
      { "label": "Объёмные буквы", "say": "Нужны объёмные буквы" },
      { "label": "LED-экран", "say": "Нужен LED-экран" },
      { "label": "Рекламный робот", "say": "Расскажите про рекламного робота" },
      { "label": "Узнать цену", "say": "Сколько это стоит?" }
    ],
    "fallback": "Не уверен, что понял вопрос. Спросите про вывески, буквы, экраны, печать или роботов либо напишите менеджеру в WhatsApp или Telegram, +66 81 730 6020: он отвечает в течение 30 минут в рабочее время.",
    "offer": "Чтобы получить точный расчёт, отправьте запрос менеджеру. Я передам, о чём мы говорили.",
    "toTelegram": "Написать в Telegram",
    "toWhatsapp": "Написать в WhatsApp",
    "copied": "Текст запроса скопирован. Вставьте его в чат Telegram и отправьте.",
    "briefHead": "Здравствуйте! Пишу с сайта BST Phuket.",
    "briefTopic": "Интересует",
    "briefChat": "Мои вопросы в чате",
    "intents": [
      {
        "id": "hello",
        "topic": "",
        "keys": K.hello,
        "answer": "Здравствуйте! Чем помочь: вывески, буквы, экраны, печать, роботы или дизайн?",
        "link": null
      },
      {
        "id": "signs",
        "topic": "вывески",
        "keys": K.signs,
        "answer": "Делаем вывески для фасада, крыши и интерьера, а также неоновые вывески и билборды. Расскажите, где будет вывеска, и мы предложим подходящий вариант.",
        "link": { "href": "signs.html", "label": "Все виды вывесок" }
      },
      {
        "id": "letters",
        "topic": "объёмные буквы",
        "keys": K.letters,
        "answer": "Объёмные буквы бывают с лицевой, торцевой и контражурной подсветкой, а также пиксельные и RGB. Материалы: ПВХ, акрил, алюминиевый композит, нержавеющая сталь и алюминий.",
        "link": { "href": "letters.html", "label": "Подробнее про буквы" }
      },
      {
        "id": "neon",
        "topic": "неон",
        "keys": K.neon,
        "answer": "Делаем неоновые вывески для фасада и интерьера. Пришлите логотип или идею, и мы подготовим макет.",
        "link": { "href": "signs.html#neon", "label": "Про неон" }
      },
      {
        "id": "lightbox",
        "topic": "световые короба",
        "keys": K.lightbox,
        "answer": "Световой короб — это вывеска с подсветкой изнутри, для фасада и интерьера. Макет сделаем сами или подготовим ваши файлы.",
        "link": { "href": "signs.html#lightbox", "label": "Про световые короба" }
      },
      {
        "id": "led",
        "topic": "LED-экраны",
        "keys": K.led,
        "answer": "Делаем LED-экраны для улицы и помещения, шаг пикселя от P1 до P10, в том числе нестандартной формы. Подходящий шаг зависит от того, с какого расстояния экран будут смотреть.",
        "link": { "href": "led.html", "label": "Про LED-экраны" }
      },
      {
        "id": "print",
        "topic": "печать",
        "keys": K.print,
        "answer": "Печатаем баннеры, плёнки, перфорированную плёнку для окон и винил для авто. Делаем УФ-печать и обычную, а также ламинацию.",
        "link": { "href": "print.html", "label": "Про печать" }
      },
      {
        "id": "dynamic",
        "topic": "динамическая реклама",
        "keys": K.dynamic,
        "answer": "Динамическая реклама: гобо и лазерные проекторы, обратная проекция на окна, голографические экраны, LED-вентиляторы и подвижные конструкции. Такие форматы привлекают взгляд там, где проходят люди.",
        "link": { "href": "dynamic.html", "label": "Про динамическую рекламу" }
      },
      {
        "id": "robots",
        "topic": "рекламные роботы",
        "keys": K.robots,
        "answer": "Рекламного робота можно купить новым, купить б/у после полного обслуживания, взять в аренду или арендовать на 12 месяцев с переходом робота в собственность. Модели есть 2D, 3D и под заказ.",
        "link": { "href": "robots.html", "label": "Про рекламных роботов" }
      },
      {
        "id": "branding",
        "topic": "брендинг и дизайн",
        "keys": K.branding,
        "answer": "Делаем брендбук, брендирование транспорта и упаковки, а также макеты для рекламы. Если макет уже есть, подготовим ваши файлы к печати.",
        "link": { "href": "branding.html", "label": "Про брендинг и дизайн" }
      },
      {
        "id": "price",
        "topic": "расчёт стоимости",
        "keys": K.price,
        "answer": "Цена зависит от размера, материалов и подсветки. Мы считаем три варианта: эконом, стандарт и премиум, а точную цифру называет менеджер.",
        "link": null
      },
      {
        "id": "time",
        "topic": "сроки",
        "keys": K.time,
        "answer": "Срок зависит от сложности работы. Мы называем его вместе с расчётом, а менеджер подтверждает точные даты.",
        "link": null
      },
      {
        "id": "install",
        "topic": "монтаж",
        "keys": K.install,
        "answer": "Да, монтаж делаем: на фасадах, на крышах и внутри помещений. Условия монтажа менеджер уточнит вместе с расчётом.",
        "link": null
      },
      {
        "id": "where",
        "topic": "",
        "keys": K.where,
        "answer": "Мы в Чалонге, на Пхукете, там же наше производство. Телефон, WhatsApp и Telegram: +66 81 730 6020.",
        "link": null
      },
      {
        "id": "human",
        "topic": "",
        "keys": K.human,
        "answer": "Менеджер отвечает в течение 30 минут в рабочее время. Телефон, WhatsApp и Telegram: +66 81 730 6020. Говорим по-русски, по-английски и по-тайски.",
        "link": null
      },
      {
        "id": "thanks",
        "topic": "",
        "keys": K.thanks,
        "answer": "Пожалуйста! Если появятся вопросы, пишите. Запрос менеджеру можно отправить в любой момент.",
        "link": null
      }
    ]
  },

  en: {
    "open": "Ask a question",
    "title": "BST assistant",
    "sub": "Answers right away and passes complex questions to a manager.",
    "close": "Close chat",
    "placeholder": "Type your question",
    "send": "Send",
    "hello": "Hi! I can help with signs, channel letters, LED screens, printing and advertising robots. Pick a topic or type your question.",
    "chips": [
      { "label": "Signs", "say": "Tell me about signs" },
      { "label": "Channel letters", "say": "I need channel letters" },
      { "label": "LED screen", "say": "I need an LED screen" },
      { "label": "Advertising robot", "say": "Tell me about advertising robots" },
      { "label": "Get a price", "say": "How much does it cost?" }
    ],
    "fallback": "I'm not sure I got that. Ask about signs, letters, screens, printing or robots, or message a manager on WhatsApp or Telegram at +66 81 730 6020. A manager replies within 30 minutes during working hours.",
    "offer": "For an exact quote, send your request to a manager. I will pass on what we talked about.",
    "toTelegram": "Message on Telegram",
    "toWhatsapp": "Message on WhatsApp",
    "copied": "Your request is copied. Paste it into the Telegram chat and send.",
    "briefHead": "Hello! I'm writing from the BST Phuket website.",
    "briefTopic": "Interested in",
    "briefChat": "My questions in the chat",
    "intents": [
      {
        "id": "hello",
        "topic": "",
        "keys": K.hello,
        "answer": "Hi there! What can I help with: signs, letters, screens, printing, robots or design?",
        "link": null
      },
      {
        "id": "signs",
        "topic": "signs",
        "keys": K.signs,
        "answer": "We make facade, rooftop and interior signs, plus neon signs and billboards. Tell us where the sign will go and we will suggest the right option.",
        "link": { "href": "signs.html", "label": "All sign types" }
      },
      {
        "id": "letters",
        "topic": "channel letters",
        "keys": K.letters,
        "answer": "Channel letters come face-lit, side-lit, halo-lit (back-lit), pixel or RGB. Materials: PVC, acrylic, aluminium composite, stainless steel and aluminium.",
        "link": { "href": "letters.html", "label": "More about letters" }
      },
      {
        "id": "neon",
        "topic": "neon",
        "keys": K.neon,
        "answer": "We make neon signs for facades and interiors. Send your logo or idea and we will prepare a layout.",
        "link": { "href": "signs.html#neon", "label": "About neon" }
      },
      {
        "id": "lightbox",
        "topic": "light boxes",
        "keys": K.lightbox,
        "answer": "A light box is a sign lit from inside, for a facade or an interior. We prepare the artwork ourselves or work with your files.",
        "link": { "href": "signs.html#lightbox", "label": "About light boxes" }
      },
      {
        "id": "led",
        "topic": "LED screens",
        "keys": K.led,
        "answer": "We supply LED screens for indoors and outdoors, with pixel pitch from P1 to P10 and custom shapes. The right pitch depends on how far viewers will stand.",
        "link": { "href": "led.html", "label": "About LED screens" }
      },
      {
        "id": "print",
        "topic": "printing",
        "keys": K.print,
        "answer": "We print banners, films, perforated window film and car vinyl. Both UV and standard printing are available, along with lamination.",
        "link": { "href": "print.html", "label": "About printing" }
      },
      {
        "id": "dynamic",
        "topic": "dynamic advertising",
        "keys": K.dynamic,
        "answer": "Dynamic advertising includes gobo and laser projectors, rear projection on windows, holographic screens, LED fans and moving displays. These formats catch the eye where people walk by.",
        "link": { "href": "dynamic.html", "label": "About dynamic advertising" }
      },
      {
        "id": "robots",
        "topic": "advertising robots",
        "keys": K.robots,
        "answer": "An advertising robot can be bought new, bought used and fully serviced, or rented. There is also a 12-month rental after which the robot is yours. Models come in 2D, 3D and custom versions.",
        "link": { "href": "robots.html", "label": "About advertising robots" }
      },
      {
        "id": "branding",
        "topic": "branding and design",
        "keys": K.branding,
        "answer": "We create brand books, vehicle and packaging branding, and layouts for your advertising. Already have a design? We will prepare your files for production.",
        "link": { "href": "branding.html", "label": "About branding and design" }
      },
      {
        "id": "price",
        "topic": "price estimate",
        "keys": K.price,
        "answer": "The price depends on size, materials and lighting. We calculate three options: economy, standard and premium, and a manager gives you the exact figure.",
        "link": null
      },
      {
        "id": "time",
        "topic": "timing",
        "keys": K.time,
        "answer": "Timing depends on how complex the job is. We name it together with the estimate, and a manager confirms the exact dates.",
        "link": null
      },
      {
        "id": "install",
        "topic": "installation",
        "keys": K.install,
        "answer": "Yes, we install signs on facades, on roofs and indoors. A manager agrees the installation details together with the estimate.",
        "link": null
      },
      {
        "id": "where",
        "topic": "",
        "keys": K.where,
        "answer": "We are in Chalong, Phuket, and our production is there too. Phone, WhatsApp and Telegram: +66 81 730 6020.",
        "link": null
      },
      {
        "id": "human",
        "topic": "",
        "keys": K.human,
        "answer": "A manager replies within 30 minutes during working hours. Phone, WhatsApp and Telegram: +66 81 730 6020. We speak Russian, English and Thai.",
        "link": null
      },
      {
        "id": "thanks",
        "topic": "",
        "keys": K.thanks,
        "answer": "You're welcome! Message us any time. You can also send your request to a manager whenever you like.",
        "link": null
      }
    ]
  },

  th: {
    "open": "ถามคำถาม",
    "title": "ผู้ช่วย BST",
    "sub": "ตอบทันที และส่งต่อคำถามที่ซับซ้อนให้ผู้จัดการ",
    "close": "ปิดแชท",
    "placeholder": "พิมพ์คำถามของคุณ",
    "send": "ส่ง",
    "hello": "สวัสดีครับ/ค่ะ ยินดีให้ข้อมูลเรื่องป้ายร้าน ตัวอักษร 3 มิติ จอ LED งานพิมพ์ และหุ่นโฆษณา เลือกหัวข้อหรือพิมพ์คำถามได้เลย",
    "chips": [
      { "label": "ป้ายร้าน", "say": "อยากทราบเรื่องป้ายร้าน" },
      { "label": "ตัวอักษร 3 มิติ", "say": "สนใจตัวอักษร 3 มิติ" },
      { "label": "จอ LED", "say": "สนใจจอ LED" },
      { "label": "หุ่นโฆษณา", "say": "อยากทราบเรื่องหุ่นโฆษณา" },
      { "label": "ขอราคา", "say": "ราคาเท่าไหร่" }
    ],
    "fallback": "ขออภัย ยังไม่แน่ใจว่าเข้าใจคำถามถูกต้อง ลองถามเรื่องป้าย ตัวอักษร จอ LED งานพิมพ์ หรือหุ่นโฆษณา หรือติดต่อผู้จัดการทาง WhatsApp หรือ Telegram ที่เบอร์ +66 81 730 6020 ผู้จัดการตอบกลับภายใน 30 นาทีในเวลาทำการ",
    "offer": "หากต้องการราคาที่แน่นอน ส่งคำขอถึงผู้จัดการได้เลย เราจะแนบหัวข้อที่คุยกันไปให้ด้วย",
    "toTelegram": "ส่งทาง Telegram",
    "toWhatsapp": "ส่งทาง WhatsApp",
    "copied": "คัดลอกข้อความคำขอแล้ว วางในแชท Telegram แล้วส่งได้เลย",
    "briefHead": "สวัสดีครับ/ค่ะ ติดต่อมาจากเว็บไซต์ BST Phuket",
    "briefTopic": "สนใจเรื่อง",
    "briefChat": "ข้อความที่ถามในแชท",
    "intents": [
      {
        "id": "hello",
        "topic": "",
        "keys": [...T.hello, ...K.hello],
        "answer": "สวัสดีครับ/ค่ะ ต้องการสอบถามเรื่องป้าย ตัวอักษร จอ LED งานพิมพ์ หุ่นโฆษณา หรืองานออกแบบ",
        "link": null
      },
      {
        "id": "signs",
        "topic": "ป้ายร้าน",
        "keys": [...T.signs, ...K.signs],
        "answer": "เรารับทำป้ายหน้าร้าน ป้ายบนหลังคา ป้ายภายในร้าน ป้ายไฟนีออน และบิลบอร์ด บอกตำแหน่งที่จะติดตั้งได้เลย เราจะแนะนำแบบที่เหมาะสม",
        "link": { "href": "signs.html", "label": "ดูป้ายทุกประเภท" }
      },
      {
        "id": "letters",
        "topic": "ตัวอักษร 3 มิติ",
        "keys": [...T.letters, ...K.letters],
        "answer": "ตัวอักษร 3 มิติมีแบบไฟหน้า ไฟข้าง ไฟส่องหลัง (ฮาโล) พิกเซล และ RGB วัสดุมีพีวีซี อะคริลิค อลูมิเนียมคอมโพสิต สแตนเลส และอลูมิเนียม",
        "link": { "href": "letters.html", "label": "ดูรายละเอียดตัวอักษร" }
      },
      {
        "id": "neon",
        "topic": "ป้ายไฟนีออน",
        "keys": [...T.neon, ...K.neon],
        "answer": "เราทำป้ายไฟนีออนสำหรับหน้าร้านและภายในร้าน ส่งโลโก้หรือไอเดียมาได้เลย เราจะทำแบบให้ดู",
        "link": { "href": "signs.html#neon", "label": "ดูป้ายไฟนีออน" }
      },
      {
        "id": "lightbox",
        "topic": "ป้ายกล่องไฟ",
        "keys": [...T.lightbox, ...K.lightbox],
        "answer": "ป้ายกล่องไฟคือป้ายที่มีไฟส่องสว่างจากด้านใน ใช้ได้ทั้งหน้าร้านและภายในอาคาร เราออกแบบให้ หรือจัดเตรียมไฟล์งานของคุณได้",
        "link": { "href": "signs.html#lightbox", "label": "ดูป้ายกล่องไฟ" }
      },
      {
        "id": "led",
        "topic": "จอ LED",
        "keys": [...T.led, ...K.led],
        "answer": "เรามีจอ LED ทั้งภายนอกและภายในอาคาร ระยะพิกเซลตั้งแต่ P1 ถึง P10 และทำรูปทรงพิเศษได้ ระยะที่เหมาะขึ้นอยู่กับว่าคนมองจากไกลแค่ไหน",
        "link": { "href": "led.html", "label": "ดูจอ LED" }
      },
      {
        "id": "print",
        "topic": "งานพิมพ์",
        "keys": [...T.print, ...K.print],
        "answer": "เรารับพิมพ์แบนเนอร์ ฟิล์ม ฟิล์มเจาะรูสำหรับติดกระจก และสติ๊กเกอร์ติดรถ ทั้งพิมพ์ UV และพิมพ์ทั่วไป พร้อมงานเคลือบ",
        "link": { "href": "print.html", "label": "ดูงานพิมพ์" }
      },
      {
        "id": "dynamic",
        "topic": "โฆษณาแบบไดนามิก",
        "keys": [...T.dynamic, ...K.dynamic],
        "answer": "โฆษณาแบบไดนามิกของเรามีโปรเจกเตอร์โกโบและเลเซอร์ การฉายภาพหลังกระจก จอโฮโลแกรม พัดลม LED และป้ายเคลื่อนที่ ช่วยดึงสายตาคนที่เดินผ่าน",
        "link": { "href": "dynamic.html", "label": "ดูโฆษณาแบบไดนามิก" }
      },
      {
        "id": "robots",
        "topic": "หุ่นโฆษณา",
        "keys": [...T.robots, ...K.robots],
        "answer": "หุ่นโฆษณามีให้ซื้อใหม่ ซื้อมือสองที่ผ่านการซ่อมบำรุงครบ เช่า หรือเช่า 12 เดือนแล้วเป็นเจ้าของเมื่อครบสัญญา รุ่นมีทั้ง 2D 3D และสั่งทำพิเศษ",
        "link": { "href": "robots.html", "label": "ดูหุ่นโฆษณา" }
      },
      {
        "id": "branding",
        "topic": "แบรนด์และงานออกแบบ",
        "keys": [...T.branding, ...K.branding],
        "answer": "เราทำแบรนด์บุ๊ก ออกแบบแบรนดิ้งรถและบรรจุภัณฑ์ รวมถึงงานออกแบบสำหรับป้ายและงานพิมพ์ ถ้ามีไฟล์อยู่แล้ว เราช่วยจัดเตรียมให้พร้อมผลิตได้",
        "link": { "href": "branding.html", "label": "ดูงานแบรนด์และออกแบบ" }
      },
      {
        "id": "price",
        "topic": "ประเมินราคา",
        "keys": [...T.price, ...K.price],
        "answer": "ราคาขึ้นอยู่กับขนาด วัสดุ และระบบไฟ เราคำนวณให้ 3 แบบ คือ ประหยัด มาตรฐาน และพรีเมียม แล้วผู้จัดการจะแจ้งราคาที่แน่นอน",
        "link": null
      },
      {
        "id": "time",
        "topic": "ระยะเวลา",
        "keys": [...T.time, ...K.time],
        "answer": "ระยะเวลาขึ้นอยู่กับความซับซ้อนของงาน เราแจ้งพร้อมใบเสนอราคา และผู้จัดการจะยืนยันวันที่แน่นอนให้",
        "link": null
      },
      {
        "id": "install",
        "topic": "การติดตั้ง",
        "keys": [...T.install, ...K.install],
        "answer": "มีบริการติดตั้งป้ายที่หน้าอาคาร บนหลังคา และภายในอาคาร ผู้จัดการจะแจ้งรายละเอียดการติดตั้งพร้อมใบเสนอราคา",
        "link": null
      },
      {
        "id": "where",
        "topic": "",
        "keys": [...T.where, ...K.where],
        "answer": "เราอยู่ที่ฉลอง ภูเก็ต และโรงงานผลิตก็อยู่ที่นั่นด้วย โทรศัพท์ WhatsApp และ Telegram ใช้เบอร์เดียวกัน +66 81 730 6020",
        "link": null
      },
      {
        "id": "human",
        "topic": "",
        "keys": [...T.human, ...K.human],
        "answer": "ผู้จัดการตอบกลับภายใน 30 นาทีในเวลาทำการ โทรศัพท์ WhatsApp และ Telegram ใช้เบอร์ +66 81 730 6020 ทีมงานพูดได้ทั้งภาษารัสเซีย อังกฤษ และไทย",
        "link": null
      },
      {
        "id": "thanks",
        "topic": "",
        "keys": [...T.thanks, ...K.thanks],
        "answer": "ยินดีครับ/ค่ะ มีคำถามเพิ่มเติมถามได้เลย หรือจะส่งคำขอถึงผู้จัดการได้ทุกเมื่อ",
        "link": null
      }
    ]
  }
};
