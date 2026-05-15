import { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLang } from '@/lib/lang';

const GOLD = '#c4a46a';
const MUTED = '#6a7a6a';
const DIM = '#4a5a4a';
const BG_CARD = 'rgba(196,164,106,0.05)';
const BORDER = 'rgba(196,164,106,0.12)';
const BG_DARK = '#0a1a15';
const RED_WARN = '#c4614a';
const GREEN_OK = '#4a9a6a';

type Section = 'overview' | 'days' | 'duas' | 'do' | 'avoid' | 'map';

const HAJJ_T: Record<string, Record<string, string>> = {
  en: {
    title: 'Hajj Guide', sub: 'Complete Pilgrimage Companion',
    secOverview: 'Overview', secDays: 'Daily Guide', secDuas: "Hajj Du'a",
    secDo: 'Things To Do', secAvoid: 'Things To Avoid', secMap: 'Journey Map',
    pillarsTitle: 'Pillars of Hajj', wajibatTitle: 'Obligatory Acts (Wajibat)', typesTitle: 'Types of Hajj',
    daysTitle: 'Day-by-Day Hajj Schedule', duasTitle: "Hajj Du'as",
    doTitle: 'Things To Do During Hajj', avoidTitle: 'Things To Avoid During Hajj',
    mapTitle: 'Hajj Journey Map', mapSub: 'A 5-day spiritual journey through the sacred sites',
    distTitle: 'Approximate Distances', bannerTitle: 'Al-Hajj al-Mabrur',
    bannerSub: '"There is no reward for Hajj Mabrur except Paradise." — Bukhari & Muslim',
    stop: 'Stop', ihramProhib: 'Ihram Prohibitions — requires expiation',
    catIhram: 'Ihram & Intention', catPhysical: 'Physical Preparation',
    catSpiritual: 'Spiritual Priorities', catPractical: 'Practical Steps',
    catBehaviour: 'Behaviour & Conduct', catSafety: 'Safety & Health',
    catIhramAvoid: 'Ihram Prohibitions',
  },
  ar: {
    title: 'دليل الحج', sub: 'الحج المبرور ليس له ثواب إلا الجنة',
    secOverview: 'نظرة عامة', secDays: 'الجدول اليومي', secDuas: 'أدعية الحج',
    secDo: 'ما يجب فعله', secAvoid: 'ما يجب تجنبه', secMap: 'خريطة الرحلة',
    pillarsTitle: 'أركان الحج', wajibatTitle: 'واجبات الحج', typesTitle: 'أنواع الحج',
    daysTitle: 'الجدول اليومي للحج', duasTitle: 'أدعية الحج',
    doTitle: 'ما يجب فعله في الحج', avoidTitle: 'ما يجب تجنبه في الحج',
    mapTitle: 'خريطة رحلة الحج', mapSub: 'رحلة من خمسة أيام تغطي المشاعر المقدسة',
    distTitle: 'المسافات التقريبية', bannerTitle: 'الحج المبرور',
    bannerSub: '"الحج المبرور ليس له جزاء إلا الجنة" — البخاري ومسلم',
    stop: 'محطة', ihramProhib: 'محظورات الإحرام — كفارة واجبة',
    catIhram: 'الإحرام والنية', catPhysical: 'التحضير الجسدي',
    catSpiritual: 'الأولويات الروحية', catPractical: 'خطوات عملية',
    catBehaviour: 'السلوك والتصرف', catSafety: 'السلامة والصحة',
    catIhramAvoid: 'محظورات الإحرام',
  },
  id: {
    title: 'Panduan Haji', sub: 'Panduan Ibadah Haji Lengkap',
    secOverview: 'Gambaran', secDays: 'Panduan Harian', secDuas: "Doa Haji",
    secDo: 'Yang Harus Dilakukan', secAvoid: 'Yang Harus Dihindari', secMap: 'Peta Perjalanan',
    pillarsTitle: 'Rukun Haji', wajibatTitle: 'Wajib Haji', typesTitle: 'Jenis Haji',
    daysTitle: 'Jadwal Harian Haji', duasTitle: 'Doa-doa Haji',
    doTitle: 'Yang Harus Dilakukan Saat Haji', avoidTitle: 'Yang Harus Dihindari Saat Haji',
    mapTitle: 'Peta Perjalanan Haji', mapSub: 'Perjalanan spiritual 5 hari melalui tempat-tempat suci',
    distTitle: 'Jarak Perkiraan', bannerTitle: 'Haji Mabrur',
    bannerSub: '"Tidak ada balasan bagi haji mabrur kecuali surga." — Bukhari & Muslim',
    stop: 'Perhentian', ihramProhib: 'Larangan Ihram — wajib membayar dam',
    catIhram: 'Ihram & Niat', catPhysical: 'Persiapan Fisik',
    catSpiritual: 'Prioritas Spiritual', catPractical: 'Langkah Praktis',
    catBehaviour: 'Perilaku & Sikap', catSafety: 'Keselamatan & Kesehatan',
    catIhramAvoid: 'Larangan Ihram',
  },
  ms: {
    title: 'Panduan Haji', sub: 'Panduan Ibadah Haji Lengkap',
    secOverview: 'Gambaran Keseluruhan', secDays: 'Panduan Harian', secDuas: "Doa Haji",
    secDo: 'Perkara Yang Perlu Dilakukan', secAvoid: 'Perkara Yang Perlu Dielakkan', secMap: 'Peta Perjalanan',
    pillarsTitle: 'Rukun Haji', wajibatTitle: 'Wajib Haji', typesTitle: 'Jenis Haji',
    daysTitle: 'Jadual Harian Haji', duasTitle: 'Doa-doa Haji',
    doTitle: 'Yang Perlu Dilakukan Semasa Haji', avoidTitle: 'Yang Perlu Dielakkan Semasa Haji',
    mapTitle: 'Peta Perjalanan Haji', mapSub: 'Perjalanan rohani 5 hari melalui tapak-tapak suci',
    distTitle: 'Jarak Anggaran', bannerTitle: 'Haji Mabrur',
    bannerSub: '"Tiada ganjaran bagi haji mabrur melainkan syurga." — Bukhari & Muslim',
    stop: 'Perhentian', ihramProhib: 'Larangan Ihram — wajib membayar dam',
    catIhram: 'Ihram & Niat', catPhysical: 'Persediaan Fizikal',
    catSpiritual: 'Keutamaan Rohani', catPractical: 'Langkah Praktikal',
    catBehaviour: 'Tingkah Laku & Adab', catSafety: 'Keselamatan & Kesihatan',
    catIhramAvoid: 'Larangan Ihram',
  },
  fil: {
    title: 'Gabay sa Hajj', sub: 'Kumpletong Gabay sa Paglalakbay ng Haji',
    secOverview: 'Pangkalahatang-ideya', secDays: 'Araw-araw na Gabay', secDuas: "Mga Du'a ng Hajj",
    secDo: 'Mga Dapat Gawin', secAvoid: 'Mga Dapat Iwasan', secMap: 'Mapa ng Paglalakbay',
    pillarsTitle: 'Mga Haligi ng Hajj', wajibatTitle: 'Mga Obligadong Gawa', typesTitle: 'Mga Uri ng Hajj',
    daysTitle: 'Araw-araw na Iskedyul ng Hajj', duasTitle: "Mga Du'a ng Hajj",
    doTitle: 'Mga Dapat Gawin sa Hajj', avoidTitle: 'Mga Dapat Iwasan sa Hajj',
    mapTitle: 'Mapa ng Paglalakbay ng Hajj', mapSub: 'Isang 5-araw na espirituwal na paglalakbay sa mga banal na lugar',
    distTitle: 'Tinatayang Distansya', bannerTitle: 'Hajj Mabrur',
    bannerSub: '"Walang gantimpala para sa Hajj Mabrur maliban sa Paraiso." — Bukhari & Muslim',
    stop: 'Hinto', ihramProhib: 'Mga Ipinagbabawal sa Ihram — nangangailangan ng expiation',
    catIhram: 'Ihram at Intensyon', catPhysical: 'Pisikal na Paghahanda',
    catSpiritual: 'Mga Espirituwal na Priyoridad', catPractical: 'Mga Praktikal na Hakbang',
    catBehaviour: 'Pag-uugali at Pakikitungo', catSafety: 'Kaligtasan at Kalusugan',
    catIhramAvoid: 'Mga Ipinagbabawal sa Ihram',
  },
};

const HAJJ_DAYS = [
  {
    day: '8 Dhul Hijjah',
    dayAr: '٨ ذو الحجة',
    title: 'Yawm al-Tarwiyah — Day of Watering',
    titleAr: 'يوم التروية',
    location: 'Mina',
    color: '#4a7a9a',
    icon: '⛺',
    actions: [
      'Enter ihram from your current location after Fajr',
      'Make niyyah (intention) for Hajj',
      'Recite the Talbiyah continuously',
      'Travel to Mina',
      'Pray Dhuhr, Asr, Maghrib, Isha, and Fajr in Mina (qasr — shortened)',
      'Spend the night in Mina',
    ],
    actionsAr: [
      'ارتدِ الإحرام من مكانك بعد صلاة الفجر',
      'انوِ الحج',
      'رَدِّد التلبية باستمرار',
      'انتقل إلى منى',
      'صلِّ الظهر والعصر والمغرب والعشاء والفجر في منى قصراً',
      'بت في منى',
    ],
  },
  {
    day: '9 Dhul Hijjah',
    dayAr: '٩ ذو الحجة',
    title: "Yawm al-'Arafah — The Greatest Day",
    titleAr: 'يوم عرفة — أعظم يوم',
    location: "Arafah → Muzdalifah",
    color: '#c4a46a',
    icon: '⛰️',
    actions: [
      'Move to Arafah after sunrise',
      'Pray Dhuhr and Asr together (qasr) at Arafah',
      'Stand (wuquf) at Arafah until sunset — this is the pillar of Hajj',
      'Make abundant du\'a, dhikr, and repentance',
      'Move to Muzdalifah after sunset',
      'Pray Maghrib and Isha combined at Muzdalifah',
      'Collect 70 pebbles for the stoning rituals',
      'Spend the night under the open sky in Muzdalifah',
    ],
    actionsAr: [
      'انتقل إلى عرفة بعد شروق الشمس',
      'صلِّ الظهر والعصر جمعاً وقصراً في عرفة',
      'قف في عرفة حتى غروب الشمس — هذا ركن الحج',
      'أكثر من الدعاء والذكر والاستغفار',
      'انتقل إلى مزدلفة بعد الغروب',
      'صلِّ المغرب والعشاء جمعاً في مزدلفة',
      'اجمع ٧٠ حصاة للرمي',
      'بت في مزدلفة تحت السماء المفتوحة',
    ],
  },
  {
    day: '10 Dhul Hijjah',
    dayAr: '١٠ ذو الحجة',
    title: "Yawm al-Nahr — Day of Sacrifice (Eid al-Adha)",
    titleAr: 'يوم النحر — عيد الأضحى',
    location: 'Mina → Makkah → Mina',
    color: '#9a4a4a',
    icon: '🌅',
    actions: [
      'Pray Fajr in Muzdalifah',
      'Move to Mina before sunrise',
      'Stone Jamarat al-Aqabah (the large pillar) with 7 pebbles',
      'Perform Hady (sacrifice)',
      'Shave or trim the hair (halq or taqsir) — partial exit from ihram',
      'Travel to Makkah for Tawaf al-Ifadah (obligatory tawaf)',
      'Perform Sa\'i (7 rounds between Safa and Marwa) if not done in Umrah',
      'Return to Mina — first night in Mina',
    ],
    actionsAr: [
      'صلِّ الفجر في مزدلفة',
      'انتقل إلى منى قبل شروق الشمس',
      'ارمِ جمرة العقبة الكبرى بـ٧ حصيات',
      'انحر الهدي',
      'احلق أو قصّر شعرك — التحلل الأول',
      'توجه إلى مكة لأداء طواف الإفاضة',
      'اسعَ بين الصفا والمروة إذا لم تفعله في العمرة',
      'عُد إلى منى — أول ليلة في منى',
    ],
  },
  {
    day: '11 Dhul Hijjah',
    dayAr: '١١ ذو الحجة',
    title: 'First Day of Tashriq',
    titleAr: 'أول أيام التشريق',
    location: 'Mina',
    color: '#4a9a6a',
    icon: '🕌',
    actions: [
      'Remain in Mina',
      'Stone all three Jamarat after midday (7 pebbles each)',
      'Stone in order: Sughra (small), Wusta (middle), Aqabah (large)',
      'Make du\'a after stoning the first and second pillars',
      'Spend the night in Mina',
    ],
    actionsAr: [
      'ابقَ في منى',
      'ارمِ الجمرات الثلاث بعد الظهر (٧ حصيات لكل واحدة)',
      'ارمِ بالترتيب: الصغرى ثم الوسطى ثم العقبة',
      'ادعُ بعد رمي الجمرتين الأولى والثانية',
      'بت في منى',
    ],
  },
  {
    day: '12 Dhul Hijjah',
    dayAr: '١٢ ذو الحجة',
    title: 'Second Day of Tashriq',
    titleAr: 'ثاني أيام التشريق',
    location: 'Mina → Makkah',
    color: '#4a9a6a',
    icon: '🕌',
    actions: [
      'Stone all three Jamarat after midday (same order as Day 11)',
      'Those who wish to leave early (nafar awwal) must leave Mina before sunset',
      'Those staying proceed to Day 13 (nafar thani — superior)',
    ],
    actionsAr: [
      'ارمِ الجمرات الثلاث بعد الظهر (نفس ترتيب اليوم ١١)',
      'من يرغب في المغادرة المبكرة (النفر الأول) يغادر منى قبل الغروب',
      'من يبقى يستمر ليوم ١٣ (النفر الثاني — أفضل)',
    ],
  },
  {
    day: '13 Dhul Hijjah',
    dayAr: '١٣ ذو الحجة',
    title: 'Third Day of Tashriq (Final)',
    titleAr: 'ثالث أيام التشريق — الأخير',
    location: 'Mina → Makkah',
    color: '#7a6a9a',
    icon: '🌙',
    actions: [
      'Stone all three Jamarat after midday for the last time',
      'Leave Mina and return to Makkah',
      'Perform Tawaf al-Wada\' (Farewell Tawaf) before leaving Makkah',
      'The last thing before departing should be facing the Kaabah',
    ],
    actionsAr: [
      'ارمِ الجمرات الثلاث بعد الظهر للمرة الأخيرة',
      'غادر منى وعُد إلى مكة',
      'أدِّ طواف الوداع قبل مغادرة مكة',
      'آخر شيء قبل الرحيل أن تستقبل الكعبة',
    ],
  },
];

const HAJJ_DUAS = [
  {
    title: 'Talbiyah',
    titleAr: 'التلبية',
    arabic: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
    transliteration: "Labbayk Allahumma labbayk, labbayka la sharika laka labbayk, innal-hamda wan-ni'mata laka wal-mulk, la sharika lak",
    meaning: "Here I am O Allah, here I am. Here I am, You have no partner, here I am. Verily all praise, grace, and sovereignty belong to You. You have no partner.",
    when: 'Recite continuously after entering ihram',
  },
  {
    title: "Du'a at the Kaabah (First Sight)",
    titleAr: 'دعاء رؤية الكعبة',
    arabic: 'اللَّهُمَّ زِدْ هَذَا الْبَيْتَ تَشْرِيفًا وَتَعْظِيمًا وَتَكْرِيمًا وَمَهَابَةً',
    transliteration: "Allahumma zid hadhal-bayta tashreefan wa ta'dheeman wa taqreeman wa mahabah",
    meaning: 'O Allah, increase this House in honor, reverence, nobility, and awe.',
    when: 'Upon first seeing the Kaabah',
  },
  {
    title: "Du'a at Safa",
    titleAr: 'دعاء الصفا',
    arabic: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ، أَبْدَأُ بِمَا بَدَأَ اللَّهُ بِهِ',
    transliteration: "Innas-safa wal-marwata min sha'a'irillah, abd'u bima bada'allahu bih",
    meaning: 'Indeed Safa and Marwa are among the symbols of Allah. I begin with what Allah began with.',
    when: 'At the beginning of Sa\'i, standing on Safa',
  },
  {
    title: "Du'a at Arafah",
    titleAr: 'دعاء عرفة',
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir",
    meaning: 'There is no god but Allah alone, with no partner. To Him belongs the dominion, to Him belongs all praise, and He is over all things powerful.',
    when: "The best du'a on the Day of Arafah",
  },
  {
    title: "Du'a Between the Two Corners (Rukn)",
    titleAr: 'الدعاء بين الركنين',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar',
    meaning: 'Our Lord, give us good in this world and good in the Hereafter, and save us from the torment of the Fire.',
    when: 'During Tawaf, between the Yemeni corner and the Black Stone',
  },
  {
    title: 'Stoning Du\'a (Rami)',
    titleAr: 'دعاء الرمي',
    arabic: 'بِسْمِ اللَّهِ، اللَّهُ أَكْبَرُ',
    transliteration: 'Bismillah, Allahu Akbar',
    meaning: 'In the name of Allah, Allah is the Greatest.',
    when: 'Said with each pebble thrown at the Jamarat',
  },
  {
    title: 'Du\'a When Entering Ihram',
    titleAr: 'نية الإحرام',
    arabic: 'اللَّهُمَّ إِنِّي أُرِيدُ الْحَجَّ فَيَسِّرْهُ لِي وَتَقَبَّلْهُ مِنِّي',
    transliteration: "Allahumma inni uridul-hajja fayassirhu li wa taqabbalhu minni",
    meaning: 'O Allah, I intend to perform Hajj, so make it easy for me and accept it from me.',
    when: 'When making niyyah before entering ihram',
  },
  {
    title: 'Farewell Tawaf Du\'a',
    titleAr: 'دعاء طواف الوداع',
    arabic: 'اللَّهُمَّ الْبَيْتُ بَيْتُكَ وَالْعَبْدُ عَبْدُكَ وَابْنُ عَبْدِكَ، حَمَلْتَنِي عَلَى مَا سَخَّرْتَ لِي',
    transliteration: "Allahummal-baytu baytuka wal-'abdu 'abduka wabnu 'abdik, hamaltani 'ala ma sakhkharta li",
    meaning: 'O Allah, this House is Your house, the servant is Your servant and son of Your servant. You carried me on what You subjected for me.',
    when: 'During Tawaf al-Wada\' (farewell tawaf)',
  },
];

const THINGS_TO_DO = [
  { catKey: 'catIhram', icon: '🕊️', items: [
    { en: 'Make a sincere intention (niyyah) for Hajj', ar: 'اجعل نيتك خالصة لله في الحج' },
    { en: 'Enter ihram at the designated Miqat', ar: 'أحرم من الميقات المحدد' },
    { en: 'Perform ghusl (ritual bath) before ihram', ar: 'اغتسل قبل الإحرام' },
    { en: 'Wear white ihram garments (men)', ar: 'ارتدِ ثوب الإحرام الأبيض للرجال' },
    { en: 'Recite Talbiyah continuously until stoning Aqabah', ar: 'رَدِّد التلبية باستمرار حتى رمي جمرة العقبة' },
  ]},
  { catKey: 'catPhysical', icon: '💪', items: [
    { en: 'Consult a doctor before travelling if you have health conditions', ar: 'استشر طبيبك قبل السفر إذا كنت تعاني من حالة صحية' },
    { en: 'Carry your medications and a copy of prescriptions', ar: 'احتفظ بأدويتك ونسخة من الوصفات الطبية' },
    { en: 'Wear comfortable footwear for extensive walking', ar: 'ارتدِ حذاءً مريحاً للمشي الطويل' },
    { en: 'Stay hydrated — drink Zamzam water often', ar: 'حافظ على رطوبتك — اشرب ماء زمزم كثيراً' },
    { en: 'Use an umbrella for sun protection', ar: 'استخدم مظلة للحماية من الشمس' },
  ]},
  { catKey: 'catSpiritual', icon: '✨', items: [
    { en: "Make du'a abundantly, especially at Arafah", ar: 'أكثر من الدعاء، خاصة في عرفة' },
    { en: 'Recite dhikr, Quran, and istighfar throughout', ar: 'اذكر الله واقرأ القرآن واستغفره باستمرار' },
    { en: 'Maintain patience and good character at all times', ar: 'حافظ على الصبر وحسن الخلق في جميع الأوقات' },
    { en: 'Help fellow pilgrims — the elderly, disabled, and lost', ar: 'ساعد الحجاج — كبار السن والمعاقين والضائعين' },
    { en: "Seek forgiveness for yourself and your family", ar: 'استغفر لنفسك ولأهلك' },
  ]},
  { catKey: 'catPractical', icon: '📋', items: [
    { en: 'Keep your identification and Hajj permit on you always', ar: 'احتفظ بهويتك وتصريح الحج معك دائماً' },
    { en: 'Memorise your group leader\'s contact number', ar: 'احفظ رقم مشرف مجموعتك' },
    { en: 'Know the location of your tent/accommodation in Mina', ar: 'اعرف موقع خيمتك أو سكنك في منى' },
    { en: 'Carry a small bag with essentials for each day', ar: 'احمل حقيبة صغيرة بالضروريات لكل يوم' },
    { en: 'Keep emergency phone numbers saved offline', ar: 'احفظ أرقام الطوارئ دون اتصال بالإنترنت' },
  ]},
];

const THINGS_TO_AVOID = [
  { catKey: 'catIhramAvoid', icon: '🚫', severity: 'high', items: [
    { en: 'Do not cut hair or nails', ar: 'لا تقص شعرك أو أظافرك' },
    { en: 'Do not use perfume or scented products', ar: 'لا تستخدم العطور أو المنتجات المعطرة' },
    { en: 'Do not engage in sexual relations', ar: 'لا تقرب أهلك' },
    { en: 'Do not propose marriage or conclude a marriage contract', ar: 'لا تعقد زواجاً أو خطوبة' },
    { en: 'Men: do not cover the head', ar: 'الرجال: لا تغطِ الرأس' },
    { en: 'Women: do not cover the face or hands', ar: 'النساء: لا تغطِ الوجه أو الكفين' },
    { en: 'Do not hunt animals or cut plants in the Haram area', ar: 'لا تصطد الحيوانات ولا تقطع النباتات في الحرم' },
  ]},
  { catKey: 'catBehaviour', icon: '⚠️', severity: 'medium', items: [
    { en: 'Avoid arguments, disputes, and anger', ar: 'تجنب الجدال والخلافات والغضب' },
    { en: 'Do not push or shove others in crowded areas', ar: 'لا تدفع الآخرين في المناطق المزدحمة' },
    { en: 'Avoid wasting time on phones and social media', ar: 'تجنب إضاعة الوقت في الهواتف ووسائل التواصل الاجتماعي' },
    { en: 'Do not litter — keep the sacred sites clean', ar: 'لا تلقِ القمامة — حافظ على نظافة المشاعر المقدسة' },
    { en: 'Avoid loud conversations and noisy behaviour', ar: 'تجنب المحادثات الصاخبة والسلوك المزعج' },
  ]},
  { catKey: 'catSafety', icon: '🏥', severity: 'medium', items: [
    { en: 'Do not travel to sites outside the permitted schedule', ar: 'لا تسافر إلى مواقع خارج الجدول الزمني المحدد' },
    { en: 'Avoid fasting on the Day of Arafah if it weakens you', ar: 'تجنب الصيام في يوم عرفة إذا كان يضعفك' },
    { en: 'Do not ignore signs of heat stroke — seek help immediately', ar: 'لا تتجاهل علامات ضربة الشمس — اطلب المساعدة فوراً' },
    { en: 'Do not wander alone in unfamiliar areas', ar: 'لا تتجول وحدك في مناطق غير مألوفة' },
  ]},
];

const JOURNEY_STOPS = [
  { name: 'Miqat', nameAr: 'الميقات', desc: 'The boundary where pilgrims enter ihram. Different Miqats exist depending on your direction of travel.', icon: '🟢', step: 1 },
  { name: 'Makkah al-Mukarramah', nameAr: 'مكة المكرمة', desc: 'The holiest city in Islam. Home of the Masjid al-Haram and the Kaabah. Pilgrims perform Tawaf and Sa\'i here.', icon: '🕋', step: 2 },
  { name: 'Mina', nameAr: 'منى', desc: 'A valley 5 km east of Makkah. Pilgrims spend 3–4 nights here in tents. The Jamarat (stoning pillars) are located here.', icon: '⛺', step: 3 },
  { name: "Arafah (Mount of Mercy)", nameAr: 'جبل عرفات', desc: "The most critical site of Hajj. Standing here (wuquf) on 9 Dhul Hijjah is the pillar of Hajj. 'Hajj is Arafah.'", icon: '⛰️', step: 4 },
  { name: 'Muzdalifah', nameAr: 'مزدلفة', desc: "Between Arafah and Mina. Pilgrims spend the night of 9 Dhul Hijjah here under the open sky, collecting pebbles for the stoning.", icon: '🌙', step: 5 },
  { name: 'Jamarat Bridge', nameAr: 'جسر الجمرات', desc: 'Site of the symbolic stoning of the devil. Three pillars (sughra, wusta, aqabah) are stoned on designated days.', icon: '🪨', step: 6 },
  { name: 'Masjid al-Haram', nameAr: 'المسجد الحرام', desc: 'Return to Makkah for Tawaf al-Ifadah (obligatory) and Tawaf al-Wada\' (farewell) before departing.', icon: '🌟', step: 7 },
];

export default function HajjScreen() {
  const insets = useSafeAreaInsets();
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [expandedDua, setExpandedDua] = useState<number | null>(null);
  const [expandedDo, setExpandedDo] = useState<number | null>(null);
  const [expandedAvoid, setExpandedAvoid] = useState<number | null>(null);
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const th = HAJJ_T[lang] || HAJJ_T.en;

  const SECTIONS: { id: Section; icon: string; label: string }[] = [
    { id: 'overview', icon: '🕋', label: th.secOverview },
    { id: 'days', icon: '📅', label: th.secDays },
    { id: 'duas', icon: '🤲', label: th.secDuas },
    { id: 'do', icon: '✅', label: th.secDo },
    { id: 'avoid', icon: '⛔', label: th.secAvoid },
    { id: 'map', icon: '🗺️', label: th.secMap },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a1a15', '#0d2818', '#132e1f']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.screenTitle}>{th.title}</Text>
            <Text style={styles.screenSub}>{th.sub}</Text>
          </View>
        </View>

        {/* Section Navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navRow}>
          {SECTIONS.map((sec) => (
            <Pressable
              key={sec.id}
              onPress={() => setActiveSection(sec.id)}
              style={[styles.navChip, activeSection === sec.id && styles.navChipActive]}
            >
              <Text style={styles.navChipIcon}>{sec.icon}</Text>
              <Text style={[styles.navChipText, activeSection === sec.id && styles.navChipTextActive]}>
                {sec.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* OVERVIEW */}
        {activeSection === 'overview' && (
          <View style={styles.section}>
            {/* Banner */}
            <View style={styles.overviewBanner}>
              <Text style={styles.overviewBannerText}>🕋</Text>
              <Text style={styles.overviewBannerTitle}>{th.bannerTitle}</Text>
              <Text style={styles.overviewBannerSub}>{th.bannerSub}</Text>
            </View>

            {/* Pillars */}
            <Text style={styles.sectionHeading}>{th.pillarsTitle}</Text>
            {[
              { num: '١', numEn: '1', en: 'Ihram — Entering the Sacred State', ar: 'الإحرام — الدخول في الحالة المقدسة' },
              { num: '٢', numEn: '2', en: "Wuquf at Arafah — Standing on 9 Dhul Hijjah", ar: 'الوقوف بعرفة — الوقوف في ٩ ذو الحجة' },
              { num: '٣', numEn: '3', en: "Tawaf al-Ifadah — Circumambulating the Kaabah", ar: 'طواف الإفاضة — الطواف حول الكعبة' },
              { num: '٤', numEn: '4', en: "Sa'i — Walking between Safa and Marwa", ar: 'السعي — المشي بين الصفا والمروة' },
            ].map((item, i) => (
              <View key={i} style={styles.pillarRow}>
                <View style={styles.pillarNum}><Text style={styles.pillarNumText}>{isAr ? item.num : item.numEn}</Text></View>
                <Text style={[styles.pillarText, isAr && styles.rtlText]}>{isAr ? item.ar : item.en}</Text>
              </View>
            ))}

            {/* Wajibat */}
            <Text style={[styles.sectionHeading, { marginTop: 20 }]}>{th.wajibatTitle}</Text>
            {[
              { en: 'Ihram from the Miqat boundary', ar: 'الإحرام من الميقات' },
              { en: "Staying at Arafah until sunset", ar: 'المكث في عرفة حتى الغروب' },
              { en: 'Spending the night in Muzdalifah', ar: 'المبيت في مزدلفة' },
              { en: 'Stoning the Jamarat on designated days', ar: 'رمي الجمرات في أوقاتها' },
              { en: 'Shaving or trimming the hair (halq/taqsir)', ar: 'الحلق أو التقصير' },
              { en: 'Spending the nights of Tashriq in Mina', ar: 'المبيت في منى ليالي التشريق' },
              { en: 'Tawaf al-Wada\' (Farewell Tawaf)', ar: 'طواف الوداع' },
            ].map((item, i) => (
              <View key={i} style={styles.listRow}>
                <Text style={styles.listBullet}>◆</Text>
                <Text style={[styles.listText, isAr && styles.rtlText]}>{isAr ? item.ar : item.en}</Text>
              </View>
            ))}

            {/* Types */}
            <Text style={[styles.sectionHeading, { marginTop: 20 }]}>{th.typesTitle}</Text>
            {[
              { title: 'Tamattu\'', titleAr: 'التمتع', desc: 'Umrah first then Hajj with a break between. Most common for those travelling from afar. Requires Hady sacrifice.', descAr: 'عمرة ثم حج مع فصل بينهما. الأكثر شيوعاً للقادمين من بعيد. يستلزم ذبح الهدي.' },
              { title: 'Ifrad', titleAr: 'الإفراد', desc: 'Hajj only. Pilgrim stays in ihram throughout. No Hady required.', descAr: 'حج فقط. يبقى الحاج في الإحرام طوال الوقت. لا يستلزم الهدي.' },
              { title: 'Qiran', titleAr: 'القران', desc: "Combined Umrah and Hajj in a single ihram without break. Requires Hady sacrifice.", descAr: 'جمع بين العمرة والحج في إحرام واحد. يستلزم ذبح الهدي.' },
            ].map((item, i) => (
              <View key={i} style={styles.typeCard}>
                <Text style={styles.typeTitle}>{isAr ? item.titleAr : item.title}</Text>
                <Text style={[styles.typeDesc, isAr && styles.rtlText]}>{isAr ? item.descAr : item.desc}</Text>
              </View>
            ))}
          </View>
        )}

        {/* DAILY GUIDE */}
        {activeSection === 'days' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{th.daysTitle}</Text>
            {HAJJ_DAYS.map((day, i) => (
              <Pressable key={i} onPress={() => setExpandedDay(expandedDay === i ? null : i)} style={styles.dayCard}>
                <View style={[styles.dayCardBar, { backgroundColor: day.color + '33' }]}>
                  <View style={[styles.dayDot, { backgroundColor: day.color }]}>
                    <Text style={styles.dayDotText}>{day.icon}</Text>
                  </View>
                  <View style={styles.dayCardInfo}>
                    <Text style={styles.dayLabel}>{isAr ? day.dayAr : day.day}</Text>
                    <Text style={[styles.dayTitle, isAr && styles.rtlText]}>{isAr ? day.titleAr : day.title}</Text>
                    <View style={styles.dayLocation}>
                      <Text style={styles.dayLocationText}>📍 {day.location}</Text>
                    </View>
                  </View>
                  <Text style={[styles.expandChev, expandedDay === i && styles.expandChevOpen]}>›</Text>
                </View>
                {expandedDay === i && (
                  <View style={styles.dayActions}>
                    {(isAr ? day.actionsAr : day.actions).map((act, j) => (
                      <View key={j} style={styles.dayActionRow}>
                        <View style={[styles.dayActionNum, { backgroundColor: day.color + '33' }]}>
                          <Text style={[styles.dayActionNumText, { color: day.color }]}>{j + 1}</Text>
                        </View>
                        <Text style={[styles.dayActionText, isAr && styles.rtlText]}>{act}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* HAJJ DUAS */}
        {activeSection === 'duas' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{th.duasTitle}</Text>
            {HAJJ_DUAS.map((dua, i) => (
              <Pressable key={i} onPress={() => setExpandedDua(expandedDua === i ? null : i)} style={styles.duaCard}>
                <View style={styles.duaCardHeader}>
                  <View>
                    <Text style={styles.duaCardTitle}>{isAr ? dua.titleAr : dua.title}</Text>
                    <Text style={styles.duaCardWhen}>🕐 {dua.when}</Text>
                  </View>
                  <Text style={[styles.expandChev, expandedDua === i && styles.expandChevOpen]}>›</Text>
                </View>
                {expandedDua === i && (
                  <View style={styles.duaExpanded}>
                    <Text style={styles.duaArabic}>{dua.arabic}</Text>
                    <View style={styles.duaDivider} />
                    <Text style={styles.duaTranslit}>{dua.transliteration}</Text>
                    <Text style={styles.duaMeaning}>{dua.meaning}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* THINGS TO DO */}
        {activeSection === 'do' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{th.doTitle}</Text>
            {THINGS_TO_DO.map((group, gi) => (
              <Pressable key={gi} onPress={() => setExpandedDo(expandedDo === gi ? null : gi)} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupIcon}>{group.icon}</Text>
                  <Text style={[styles.groupTitle, isAr && styles.rtlText]}>{th[group.catKey] || group.catKey}</Text>
                  <Text style={[styles.expandChev, expandedDo === gi && styles.expandChevOpen]}>›</Text>
                </View>
                {expandedDo === gi && (
                  <View style={styles.groupItems}>
                    {group.items.map((item, ii) => (
                      <View key={ii} style={styles.checkRow}>
                        <View style={styles.checkIcon}><Text style={styles.checkIconText}>✓</Text></View>
                        <Text style={[styles.checkText, isAr && styles.rtlText]}>{isAr ? item.ar : item.en}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* THINGS TO AVOID */}
        {activeSection === 'avoid' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{th.avoidTitle}</Text>
            {THINGS_TO_AVOID.map((group, gi) => (
              <Pressable key={gi} onPress={() => setExpandedAvoid(expandedAvoid === gi ? null : gi)} style={[styles.groupCard, group.severity === 'high' && styles.groupCardHigh]}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupIcon}>{group.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.groupTitle, isAr && styles.rtlText, group.severity === 'high' && styles.groupTitleHigh]}>
                      {th[group.catKey] || group.catKey}
                    </Text>
                    {group.severity === 'high' && (
                      <Text style={styles.severityBadge}>{th.ihramProhib}</Text>
                    )}
                  </View>
                  <Text style={[styles.expandChev, expandedAvoid === gi && styles.expandChevOpen]}>›</Text>
                </View>
                {expandedAvoid === gi && (
                  <View style={styles.groupItems}>
                    {group.items.map((item, ii) => (
                      <View key={ii} style={styles.avoidRow}>
                        <View style={[styles.avoidIcon, group.severity === 'high' && styles.avoidIconHigh]}>
                          <Text style={styles.avoidIconText}>✕</Text>
                        </View>
                        <Text style={[styles.avoidText, isAr && styles.rtlText]}>{isAr ? item.ar : item.en}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* JOURNEY MAP */}
        {activeSection === 'map' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{th.mapTitle}</Text>
            <Text style={styles.mapSubtitle}>{th.mapSub}</Text>

            <View style={styles.mapContainer}>
              {JOURNEY_STOPS.map((stop, i) => (
                <View key={i} style={styles.mapStopRow}>
                  {/* Line */}
                  <View style={styles.mapLineCol}>
                    <View style={[styles.mapNode, i === 3 && styles.mapNodeHighlight]}>
                      <Text style={styles.mapNodeText}>{stop.icon}</Text>
                    </View>
                    {i < JOURNEY_STOPS.length - 1 && <View style={styles.mapLine} />}
                  </View>

                  {/* Content */}
                  <View style={[styles.mapStopCard, i === 3 && styles.mapStopCardHighlight]}>
                    <View style={styles.mapStopHeader}>
                      <Text style={[styles.mapStopNum, i === 3 && styles.mapStopNumHighlight]}>{th.stop} {stop.step}</Text>
                    </View>
                    <Text style={[styles.mapStopName, i === 3 && styles.mapStopNameHighlight, isAr && styles.rtlText]}>
                      {isAr ? stop.nameAr : stop.name}
                    </Text>
                    <Text style={[styles.mapStopDesc, isAr && styles.rtlText]}>{stop.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Distance reference */}
            <View style={styles.distanceCard}>
              <Text style={styles.distanceTitle}>{th.distTitle}</Text>
              {[
                { from: 'Makkah', to: 'Mina', dist: '~5 km', fromAr: 'مكة', toAr: 'منى' },
                { from: 'Mina', to: 'Arafah', dist: '~15 km', fromAr: 'منى', toAr: 'عرفة' },
                { from: 'Arafah', to: 'Muzdalifah', dist: '~9 km', fromAr: 'عرفة', toAr: 'مزدلفة' },
                { from: 'Muzdalifah', to: 'Mina', dist: '~4 km', fromAr: 'مزدلفة', toAr: 'منى' },
              ].map((row, i) => (
                <View key={i} style={styles.distanceRow}>
                  <Text style={[styles.distanceFrom, isAr && styles.rtlText]}>{isAr ? row.fromAr : row.from}</Text>
                  <View style={styles.distanceLine}>
                    <View style={styles.distanceLineInner} />
                    <Text style={styles.distanceDist}>{row.dist}</Text>
                  </View>
                  <Text style={[styles.distanceTo, isAr && styles.rtlText]}>{isAr ? row.toAr : row.to}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_DARK },
  scroll: { paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  headerLeft: { flex: 1 },
  screenTitle: { fontSize: 26, fontWeight: '700', color: GOLD },
  screenSub: { fontSize: 10, color: MUTED, letterSpacing: 1, marginTop: 2 },

  navRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  navChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: BORDER, backgroundColor: 'rgba(196,164,106,0.03)' },
  navChipActive: { borderColor: GOLD, backgroundColor: 'rgba(196,164,106,0.14)' },
  navChipIcon: { fontSize: 14 },
  navChipText: { color: MUTED, fontSize: 11, fontWeight: '500' },
  navChipTextActive: { color: GOLD },

  section: { paddingHorizontal: 16 },
  sectionHeading: { color: GOLD, fontSize: 13, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12, marginTop: 4 },

  // Overview
  overviewBanner: { alignItems: 'center', padding: 24, marginBottom: 20, backgroundColor: BG_CARD, borderRadius: 20, borderWidth: 1, borderColor: BORDER },
  overviewBannerText: { fontSize: 48, marginBottom: 8 },
  overviewBannerTitle: { color: GOLD, fontSize: 20, fontWeight: '700', marginBottom: 6 },
  overviewBannerSub: { color: MUTED, fontSize: 11, textAlign: 'center', lineHeight: 18, fontStyle: 'italic' },

  pillarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, paddingHorizontal: 4 },
  pillarNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(196,164,106,0.15)', borderWidth: 1, borderColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  pillarNumText: { color: GOLD, fontSize: 12, fontWeight: '700' },
  pillarText: { color: '#c8d8c0', fontSize: 13, flex: 1 },
  rtlText: { textAlign: 'right' },

  listRow: { flexDirection: 'row', gap: 10, marginBottom: 8, paddingHorizontal: 4 },
  listBullet: { color: GOLD, fontSize: 8, marginTop: 5 },
  listText: { color: '#c8d8c0', fontSize: 13, flex: 1, lineHeight: 20 },

  typeCard: { marginBottom: 10, padding: 14, backgroundColor: BG_CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER },
  typeTitle: { color: GOLD, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  typeDesc: { color: MUTED, fontSize: 12, lineHeight: 18 },

  // Days
  dayCard: { marginBottom: 10, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  dayCardBar: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  dayDot: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  dayDotText: { fontSize: 20 },
  dayCardInfo: { flex: 1 },
  dayLabel: { color: MUTED, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  dayTitle: { color: '#e0d0b0', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  dayLocation: { marginTop: 4 },
  dayLocationText: { color: MUTED, fontSize: 10 },
  expandChev: { color: GOLD, fontSize: 22, fontWeight: '300', transform: [{ rotate: '0deg' }] },
  expandChevOpen: { transform: [{ rotate: '90deg' }] },
  dayActions: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4, gap: 8 },
  dayActionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dayActionNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  dayActionNumText: { fontSize: 10, fontWeight: '700' },
  dayActionText: { color: '#c0d0b8', fontSize: 12, flex: 1, lineHeight: 18 },

  // Duas
  duaCard: { marginBottom: 10, padding: 14, backgroundColor: BG_CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER },
  duaCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  duaCardTitle: { color: GOLD, fontSize: 14, fontWeight: '600', marginBottom: 3 },
  duaCardWhen: { color: MUTED, fontSize: 10 },
  duaExpanded: { marginTop: 14 },
  duaArabic: { color: '#e8e0d0', fontSize: 20, fontWeight: '600', textAlign: 'center', lineHeight: 36, marginBottom: 10 },
  duaDivider: { height: 1, backgroundColor: BORDER, marginBottom: 10 },
  duaTranslit: { color: GOLD, fontSize: 11, fontWeight: '500', textAlign: 'center', marginBottom: 6 },
  duaMeaning: { color: MUTED, fontSize: 11, textAlign: 'center', fontStyle: 'italic', lineHeight: 18 },

  // Groups (Do / Avoid)
  groupCard: { marginBottom: 10, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: BORDER, backgroundColor: BG_CARD },
  groupCardHigh: { borderColor: 'rgba(196,97,74,0.3)', backgroundColor: 'rgba(196,97,74,0.04)' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  groupIcon: { fontSize: 22 },
  groupTitle: { flex: 1, color: '#e0d0b0', fontSize: 13, fontWeight: '600' },
  groupTitleHigh: { color: '#e09080' },
  severityBadge: { color: RED_WARN, fontSize: 10, marginTop: 2 },
  groupItems: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },

  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(74,154,106,0.2)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkIconText: { color: GREEN_OK, fontSize: 10, fontWeight: '700' },
  checkText: { color: '#c0d0b8', fontSize: 12, flex: 1, lineHeight: 18 },

  avoidRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avoidIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(196,164,106,0.15)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  avoidIconHigh: { backgroundColor: 'rgba(196,97,74,0.2)' },
  avoidIconText: { color: RED_WARN, fontSize: 10, fontWeight: '700' },
  avoidText: { color: '#c0d0b8', fontSize: 12, flex: 1, lineHeight: 18 },

  // Map
  mapSubtitle: { color: MUTED, fontSize: 11, marginBottom: 16, marginTop: -6 },
  mapContainer: { gap: 0 },
  mapStopRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  mapLineCol: { alignItems: 'center', width: 44 },
  mapNode: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(196,164,106,0.12)', borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  mapNodeHighlight: { backgroundColor: 'rgba(196,164,106,0.25)', borderColor: GOLD },
  mapNodeText: { fontSize: 20 },
  mapLine: { width: 2, flex: 1, minHeight: 16, backgroundColor: BORDER, marginVertical: 4 },
  mapStopCard: { flex: 1, padding: 14, marginBottom: 8, backgroundColor: BG_CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER },
  mapStopCardHighlight: { borderColor: 'rgba(196,164,106,0.4)', backgroundColor: 'rgba(196,164,106,0.08)' },
  mapStopHeader: { marginBottom: 4 },
  mapStopNum: { color: DIM, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },
  mapStopNumHighlight: { color: GOLD },
  mapStopName: { color: '#e8d8b0', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  mapStopNameHighlight: { color: GOLD },
  mapStopDesc: { color: MUTED, fontSize: 11, lineHeight: 17 },

  distanceCard: { marginTop: 20, padding: 16, backgroundColor: BG_CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER },
  distanceTitle: { color: GOLD, fontSize: 12, fontWeight: '700', marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  distanceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  distanceFrom: { color: '#e0d0b0', fontSize: 12, fontWeight: '600', width: 80 },
  distanceLine: { flex: 1, alignItems: 'center', position: 'relative' },
  distanceLineInner: { height: 1, width: '100%', backgroundColor: BORDER },
  distanceDist: { color: GOLD, fontSize: 10, position: 'absolute', top: -8 },
  distanceTo: { color: '#e0d0b0', fontSize: 12, fontWeight: '600', width: 80, textAlign: 'right' },
});
