// «Умный билборд» на первом экране: по названию бизнеса сайт угадывает его тип и дорисовывает пример рекламы.
//
// У каждого типа:
//   strong — слова, которые однозначно называют бизнес («pizza», «массаж»);
//   weak   — общие слова-подсказки («shop», «урок»): учитываются, только если сильного слова нет;
//   slogan — пример рекламной строки на трёх языках.
// Слово из 4 букв и длиннее ищется как начало слова в названии («пицц» найдёт «пиццерия»),
// короткое (до 3 букв) — только целиком («bar» не сработает на «barber»). Фразы с пробелом и тайские слова ищутся где угодно.
// Картинка типа лежит в src/img/b-<тип>.webp. Тип generic — для названий, где знакомых слов нет.
export default {
  kinds: {
    bar: {
      strong: ["bar", "pub", "cocktail", "beer", "wine", "lounge", "nightclub", "karaoke", "бар", "паб", "коктейл", "пиво", "пивн", "вино", "винн", "лаунж", "караоке", "บาร์", "ผับ", "ค็อกเทล"],
      weak: ["club", "rooftop", "night", "клуб", "ночн"],
      slogan: { ru: "Счастливые часы каждый вечер", en: "Happy hour every evening", th: "แฮปปี้อาวร์ทุกเย็น" }
    },
    cafe: {
      strong: ["coffee", "espresso", "latte", "roaster", "cappuccino", "кофе", "кофейн", "эспрессо", "капучино", "กาแฟ"],
      weak: ["cafe", "café", "кафе", "tea", "чай", "brunch", "breakfast", "завтрак", "คาเฟ่"],
      slogan: { ru: "Второй кофе в подарок", en: "Second coffee on us", th: "กาแฟแก้วที่สองฟรี" }
    },
    weed: {
      strong: ["weed", "cannabis", "ganja", "kush", "dispensary", "420", "hemp", "marijuana", "thc", "cbd", "sativa", "indica", "coffeeshop", "каннабис", "канабис", "ганджа", "марихуан", "конопл", "кофешоп", "трава", "травк", "กัญชา"],
      weak: ["high", "smoke", "stoned", "кайф"],
      slogan: { ru: "Открыто каждый день", en: "Open every day", th: "เปิดทุกวัน" }
    },
    food: {
      strong: ["pizza", "burger", "steak", "grill", "bbq", "barbecue", "kebab", "pasta", "italian", "catering", "пицц", "бургер", "стейк", "гриль", "шашлык", "паста", "итальян", "кейтеринг", "барбекю", "พิซซ่า", "เบอร์เกอร์", "สเต็ก"],
      weak: ["restaurant", "kitchen", "food", "bistro", "diner", "eatery", "ресторан", "кухн", "еда", "бистро", "столов", "ร้านอาหาร", "อาหาร"],
      slogan: { ru: "Бизнес-ланч каждый день", en: "Lunch special every day", th: "ชุดอาหารกลางวันทุกวัน" }
    },
    thai: {
      strong: ["seafood", "noodle", "curry", "tom yum", "pad thai", "somtam", "thai food", "thai kitchen", "морепродукт", "лапш", "карри", "том ям", "пад тай", "тайская кухня", "ซีฟู้ด", "ต้มยำ", "ผัดไทย", "ก๋วยเตี๋ยว", "ส้มตำ", "อาหารไทย", "อาหารทะเล"],
      weak: ["thai", "тайск"],
      slogan: { ru: "Настоящая тайская кухня", en: "Real Thai kitchen", th: "อาหารไทยรสแท้" }
    },
    sushi: {
      strong: ["sushi", "ramen", "japanese", "sashimi", "izakaya", "poke", "суши", "рамен", "японск", "ролл", "ซูชิ", "ราเมง", "ญี่ปุ่น"],
      weak: [],
      slogan: { ru: "Сет дня со скидкой", en: "Set of the day", th: "เซ็ตพิเศษประจำวัน" }
    },
    bakery: {
      strong: ["bakery", "cake", "dessert", "ice cream", "gelato", "donut", "pastry", "croissant", "waffle", "sweet", "пекарн", "торт", "десерт", "морожен", "пончик", "выпечк", "кондитер", "вафл", "сладк", "เบเกอรี่", "เค้ก", "ไอศกรีม", "ขนม"],
      weak: [],
      slogan: { ru: "Свежая выпечка каждое утро", en: "Baked fresh every morning", th: "อบสดใหม่ทุกเช้า" }
    },
    spa: {
      strong: ["massage", "spa", "sauna", "wellness", "массаж", "спа", "сауна", "баня", "นวด", "สปา"],
      weak: [],
      slogan: { ru: "Скидка на первый визит", en: "First visit discount", th: "ส่วนลดสำหรับครั้งแรก" }
    },
    beauty: {
      strong: ["salon", "beauty", "nail", "barber", "hair", "lash", "brows", "eyebrow", "makeup", "cosmet", "салон", "красот", "маникюр", "барбер", "парикмахер", "ресниц", "брови", "косметолог", "макияж", "ซาลอน", "เสริมสวย", "ทำเล็บ", "ตัดผม"],
      weak: [],
      slogan: { ru: "Запись без ожидания", en: "Walk-ins welcome", th: "ไม่ต้องจองล่วงหน้า" }
    },
    dive: {
      strong: ["dive", "diving", "snorkel", "tour", "boat", "yacht", "travel", "trip", "excursion", "charter", "surf", "fishing", "дайв", "тур", "туры", "экскурс", "яхт", "лодк", "катер", "серф", "рыбалк", "путешеств", "ดำน้ำ", "ทัวร์", "เรือ"],
      weak: ["island", "sea", "ocean", "море", "остров"],
      slogan: { ru: "Пробное погружение", en: "Try a discovery dive", th: "ทดลองดำน้ำ" }
    },
    moto: {
      strong: ["moto", "bike", "scooter", "car rental", "rent a car", "мото", "байк", "скутер", "прокат", "аренда авто", "аренда байк", "มอเตอร์ไซค์", "เช่ารถ", "รถเช่า"],
      weak: ["rent", "rental", "аренд", "car", "cars", "auto", "авто"],
      slogan: { ru: "Аренда от одного дня", en: "Rent from one day", th: "เช่าได้ตั้งแต่ 1 วัน" }
    },
    repair: {
      strong: ["repair", "garage", "mechanic", "car wash", "carwash", "tyre", "tire", "workshop", "service center", "ремонт", "автосервис", "шиномонтаж", "автомойк", "мойка", "мастерск", "ซ่อม", "อู่", "ล้างรถ"],
      weak: ["service", "сервис", "fix"],
      slogan: { ru: "Диагностика бесплатно", en: "Free check-up", th: "ตรวจเช็กฟรี" }
    },
    class: {
      strong: ["yoga", "pilates", "meditation", "retreat", "йога", "йоги", "йогу", "пилатес", "медитац", "ретрит", "โยคะ", "พิลาทิส"],
      weak: [],
      slogan: { ru: "Пробное занятие бесплатно", en: "First class free", th: "ทดลองเรียนฟรี" }
    },
    fitness: {
      strong: ["fitness", "gym", "muay", "boxing", "crossfit", "mma", "workout", "tennis", "padel", "martial", "фитнес", "спортзал", "бокс", "кроссфит", "тренаж", "теннис", "качалк", "ฟิตเนส", "ยิม", "มวย"],
      weak: ["sport", "sports", "спорт"],
      slogan: { ru: "Первая тренировка бесплатно", en: "First session free", th: "ทดลองฝึกฟรี" }
    },
    music: {
      strong: ["music", "guitar", "piano", "vocal", "drum", "dj", "музык", "гитар", "фортепиано", "пианино", "вокал", "барабан", "ดนตรี", "กีตาร์", "เปียโน"],
      weak: ["studio", "sound", "студия", "звук"],
      slogan: { ru: "Пробный урок бесплатно", en: "First lesson free", th: "ทดลองเรียนฟรี" }
    },
    school: {
      strong: ["school", "english", "academy", "kindergarten", "tutor", "language", "course", "kids", "montessori", "nursery", "школ", "английск", "академ", "детский сад", "репетитор", "языков", "курс", "детск", "โรงเรียน", "ภาษา", "อนุบาล", "ติว"],
      weak: ["lesson", "class", "education", "learn", "урок", "обуч", "занят", "เรียน"],
      slogan: { ru: "Набор открыт", en: "Enrolling now", th: "เปิดรับสมัครแล้ว" }
    },
    hotel: {
      strong: ["hotel", "villa", "hostel", "resort", "apartment", "guesthouse", "bungalow", "real estate", "property", "estate", "condo", "residence", "отель", "отели", "вилла", "виллы", "хостел", "апарт", "недвиж", "гестхаус", "бунгало", "кондо", "โรงแรม", "วิลล่า", "รีสอร์ท", "อสังหา", "คอนโด"],
      weak: [],
      slogan: { ru: "Бронируйте напрямую", en: "Book direct", th: "จองตรงกับเรา" }
    },
    shop: {
      strong: ["fashion", "boutique", "clothes", "clothing", "wear", "dress", "shoes", "jewelry", "jewellery", "tailor", "одежд", "бутик", "мода", "модн", "обув", "ювелир", "ателье", "плать", "เสื้อผ้า", "แฟชั่น", "รองเท้า", "เครื่องประดับ"],
      weak: ["shop", "store", "магазин"],
      slogan: { ru: "Новая коллекция", en: "New collection", th: "คอลเลกชันใหม่" }
    },
    market: {
      strong: ["market", "minimart", "mart", "grocery", "supermarket", "fruit", "organic", "маркет", "продукт", "фрукт", "супермаркет", "рынок", "минимарт", "овощ", "มินิมาร์ท", "ตลาด", "ผลไม้", "ซูเปอร์"],
      weak: [],
      slogan: { ru: "Свежее каждый день", en: "Fresh every day", th: "สดใหม่ทุกวัน" }
    },
    laundry: {
      strong: ["laundry", "laundromat", "dry clean", "cleaning", "прачечн", "химчистк", "стирк", "клининг", "уборк", "ซักรีด", "ซักผ้า", "ซักอบ"],
      weak: [],
      slogan: { ru: "Стирка за один день", en: "Same-day laundry", th: "ซักเสร็จในวันเดียว" }
    },
    tattoo: {
      strong: ["tattoo", "piercing", "тату", "пирсинг", "ทัททู", "รอยสัก"],
      weak: ["ink"],
      slogan: { ru: "Эскиз бесплатно", en: "Free design sketch", th: "ออกแบบลายฟรี" }
    },
    clinic: {
      strong: ["clinic", "dental", "dentist", "doctor", "medical", "pharmacy", "hospital", "клиник", "стоматолог", "врач", "медицин", "аптек", "зубн", "คลินิก", "ทันตกรรม", "ร้านยา"],
      weak: [],
      slogan: { ru: "Запись онлайн", en: "Book online", th: "จองคิวออนไลน์" }
    },
    pets: {
      strong: ["pet", "pets", "vet", "dog", "dogs", "cat", "cats", "grooming", "animal", "ветеринар", "питом", "груминг", "собак", "кошк", "зоомагазин", "สัตว์เลี้ยง", "สัตวแพทย์"],
      weak: [],
      slogan: { ru: "Забота о питомцах", en: "We care for pets", th: "ดูแลสัตว์เลี้ยงด้วยใจ" }
    },
    generic: {
      strong: [],
      weak: [],
      slogan: { ru: "Мы открылись", en: "Now open", th: "เปิดแล้ววันนี้" }
    }
  }
};
