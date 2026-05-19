import { useState, useRef, useEffect } from 'react';
import { useScrollToTop } from '@react-navigation/native';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLang } from '@/lib/lang';
import { LANG_LABELS } from '@/constants/data';
import { registerScroll } from '@/lib/scrollRegistry';

const GOLD = '#c4a46a';
const MUTED = '#6a7a6a';
const DIM = '#4a5a4a';
const BG_CARD = 'rgba(196,164,106,0.05)';
const BORDER = 'rgba(196,164,106,0.12)';
const BG_DARK = '#0a1a15';
const RED_WARN = '#c4614a';
const GREEN_OK = '#4a9a6a';

type Section = 'overview' | 'steps' | 'duas' | 'do' | 'avoid' | 'map';

const UMRAH_T: Record<string, Record<string, string>> = {
  en: {
    title: 'Umrah Guide', sub: 'Complete Umrah Companion',
    secOverview: 'Overview', secSteps: 'Step-by-Step', secDuas: "Umrah Du'a",
    secDo: 'Things To Do', secAvoid: 'Things To Avoid', secMap: 'Journey Map',
    pillarsTitle: 'Pillars of Umrah', conditionsTitle: 'Conditions',
    stepsTitle: 'Step-by-Step Guide', duasTitle: "Umrah Du'as",
    doTitle: 'Things To Do During Umrah', avoidTitle: 'Things To Avoid During Umrah',
    mapTitle: 'Umrah Journey Map', mapSub: 'A sacred journey through the holy sites of Makkah',
    distTitle: 'Approximate Distances',
    bannerTitle: 'Al-Umrah al-Maqbulah',
    bannerSub: '"Umrah to Umrah is an expiation for sins committed in between." — Bukhari & Muslim',
    stop: 'Stop', ihramProhib: 'Ihram Prohibitions — requires expiation',
    catIhram: 'Ihram & Intention', catTawaf: 'During Tawaf',
    catSai: "During Sa'i", catGeneral: 'General Devotion',
    catIhramAvoid: 'Ihram Prohibitions', catBehaviour: 'Behaviour & Conduct',
  },
  ar: {
    title: 'دليل العمرة', sub: 'الدليل الشامل للعمرة',
    secOverview: 'نظرة عامة', secSteps: 'خطوة بخطوة', secDuas: 'أدعية العمرة',
    secDo: 'ما يجب فعله', secAvoid: 'ما يجب تجنبه', secMap: 'خريطة الرحلة',
    pillarsTitle: 'أركان العمرة', conditionsTitle: 'شروط العمرة',
    stepsTitle: 'دليل خطوة بخطوة', duasTitle: 'أدعية العمرة',
    doTitle: 'ما يجب فعله في العمرة', avoidTitle: 'ما يجب تجنبه في العمرة',
    mapTitle: 'خريطة رحلة العمرة', mapSub: 'رحلة مقدسة عبر المواقع الشريفة في مكة',
    distTitle: 'المسافات التقريبية',
    bannerTitle: 'العمرة المقبولة',
    bannerSub: '"العمرة إلى العمرة كفارة لما بينهما من الذنوب" — البخاري ومسلم',
    stop: 'محطة', ihramProhib: 'محظورات الإحرام — كفارة واجبة',
    catIhram: 'الإحرام والنية', catTawaf: 'أثناء الطواف',
    catSai: 'أثناء السعي', catGeneral: 'العبادة والتفرغ',
    catIhramAvoid: 'محظورات الإحرام', catBehaviour: 'السلوك والتصرف',
  },
};

const UMRAH_STEPS = [
  {
    step: 'Step 1', stepAr: 'الخطوة ١',
    title: 'Miqat — Enter Ihram', titleAr: 'الميقات — ارتداء الإحرام',
    location: 'Miqat Boundary',
    color: '#4a7a9a', icon: '🟢',
    actions: [
      'Perform ghusl (ritual bath) before reaching the Miqat',
      'Men: wear two white unstitched cloths (izar & rida\')',
      'Women: wear modest loose clothing (face and hands uncovered)',
      'Make the intention (niyyah): "Labbayk Allahumma Umrah"',
      'Recite the Talbiyah — men loudly, women softly',
      'Avoid all ihram prohibitions from this point',
    ],
    actionsAr: [
      'اغتسل قبل الوصول إلى الميقات',
      'الرجال: ارتدِ إزاراً ورداءً أبيضين غير مخيطين',
      'النساء: ارتدي ملابس فضفاضة محتشمة (الوجه والكفان مكشوفان)',
      'انوِ العمرة: "لبيك اللهم عمرة"',
      'ردِّد التلبية — الرجال بصوت مرتفع والنساء بصوت خفيض',
      'اجتنب جميع محظورات الإحرام من هذه اللحظة',
    ],
  },
  {
    step: 'Step 2', stepAr: 'الخطوة ٢',
    title: 'Enter Masjid al-Haram', titleAr: 'الدخول إلى المسجد الحرام',
    location: 'Makkah al-Mukarramah',
    color: '#c4a46a', icon: '🕋',
    actions: [
      'Enter the mosque with your right foot first',
      'Recite the du\'a for entering the mosque',
      'Lower your gaze and proceed to the Mataf (tawaf area)',
      'Upon first seeing the Kaabah, raise your hands and make heartfelt du\'a — this is a moment of acceptance',
      'Continue reciting the Talbiyah until you begin Tawaf',
    ],
    actionsAr: [
      'ادخل المسجد بقدمك اليمنى أولاً',
      'قل دعاء دخول المسجد',
      'اخفض بصرك وتوجه إلى المطاف',
      'عند رؤية الكعبة لأول مرة، ارفع يديك وادعُ من قلبك — هذه لحظة إجابة الدعاء',
      'استمر في التلبية حتى تبدأ الطواف',
    ],
  },
  {
    step: 'Step 3', stepAr: 'الخطوة ٣',
    title: 'Tawaf — 7 Circuits Around the Kaabah', titleAr: 'الطواف — ٧ أشواط حول الكعبة',
    location: 'Masjid al-Haram (Mataf)',
    color: '#9a4a9a', icon: '⭕',
    actions: [
      'Ensure you are in a state of wudu before beginning',
      'Begin at the Black Stone (al-Hajar al-Aswad) — face it and say: Bismillah, Allahu Akbar',
      'Walk counter-clockwise, keeping the Kaabah on your left at all times',
      'Men: perform idtiba\' (drape the rida\' under the right arm) for the entire tawaf',
      'Men: perform raml (brisk walk) during the first 3 circuits if possible',
      'Complete 7 full circuits, ending at the Black Stone',
      'Recite du\'a and dhikr throughout — there is no fixed du\'a per circuit',
      'Recite between the Yemeni Corner and Black Stone: "Rabbana atina fid-dunya hasanah..."',
    ],
    actionsAr: [
      'تأكد من أنك على وضوء قبل البدء',
      'ابدأ عند الحجر الأسود — استقبله وقل: بسم الله الله أكبر',
      'سِر عكس اتجاه عقارب الساعة مع إبقاء الكعبة على يسارك',
      'الرجال: اضطبع (أخرج كتفك الأيمن) طوال الطواف',
      'الرجال: ارمل (أسرع المشي) في الأشواط الثلاثة الأولى إن أمكن',
      'أكمل ٧ أشواط كاملة منتهياً عند الحجر الأسود',
      'اقرأ الأدعية والأذكار طوال الطواف — لا دعاء محدد لكل شوط',
      'بين الركن اليماني والحجر الأسود: "ربنا آتنا في الدنيا حسنة..."',
    ],
  },
  {
    step: 'Step 4', stepAr: 'الخطوة ٤',
    title: "Pray 2 Rak'ah at Maqam Ibrahim", titleAr: 'صلاة ركعتين خلف مقام إبراهيم',
    location: 'Masjid al-Haram',
    color: '#4a9a6a', icon: '🤲',
    actions: [
      'After Tawaf, proceed to Maqam Ibrahim',
      'Recite Quran 2:125: "Take the Station of Ibrahim as a place of prayer"',
      'Pray 2 rak\'ah — recite Surah al-Kafirun (109) in the first and Surah al-Ikhlas (112) in the second',
      'After prayer, go to the well of Zamzam and drink facing the Kaabah',
      'Make du\'a — this is a blessed time for supplication',
      'Return to the Black Stone and touch or gesture toward it before proceeding to Sa\'i',
    ],
    actionsAr: [
      'بعد الطواف، توجه إلى مقام إبراهيم',
      'اقرأ: "وَاتَّخِذُوا مِن مَّقَامِ إِبْرَاهِيمَ مُصَلًّى" (البقرة: ١٢٥)',
      'صلِّ ركعتين — اقرأ سورة الكافرون في الأولى وسورة الإخلاص في الثانية',
      'بعد الصلاة، اذهب إلى بئر زمزم واشرب منها مستقبلاً الكعبة',
      'ادعُ الله — هذا وقت مبارك للدعاء',
      'عُد إلى الحجر الأسود فاستلمه أو أشر إليه قبل الذهاب إلى السعي',
    ],
  },
  {
    step: 'Step 5', stepAr: 'الخطوة ٥',
    title: "Sa'i — 7 Times Between Safa and Marwa", titleAr: 'السعي — ٧ مرات بين الصفا والمروة',
    location: "Mas'a (Sa'i Walkway)",
    color: '#4a7a9a', icon: '🏃',
    actions: [
      'Go to the hill of Safa and recite: "Inna as-Safa wal-Marwata min sha\'a\'irillah"',
      'Climb Safa, face the Kaabah, raise your hands, and make du\'a',
      'Walk toward Marwa — men jog between the two green lights (marked green pillars)',
      'At Marwa: face the Kaabah, raise your hands, and make du\'a',
      'This Safa-to-Marwa journey counts as 1; complete 7 times ending at Marwa',
      'Recite dhikr, Quran, and du\'a throughout — no fixed words required',
    ],
    actionsAr: [
      'اذهب إلى الصفا واقرأ: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ"',
      'اصعد الصفا، استقبل الكعبة، ارفع يديك، وادعُ الله',
      'امشِ نحو المروة — الرجال يرملون بين العلمين الأخضرين',
      'عند المروة: استقبل الكعبة، ارفع يديك، وادعُ الله',
      'المسافة من الصفا إلى المروة تُعدّ شوطاً واحداً؛ أكمل ٧ أشواط بالانتهاء عند المروة',
      'اذكر الله واقرأ القرآن وادعُ طوال السعي — لا أذكار محددة واجبة',
    ],
  },
  {
    step: 'Step 6', stepAr: 'الخطوة ٦',
    title: 'Halq or Taqsir — Exit Ihram', titleAr: 'الحلق أو التقصير — التحلل من الإحرام',
    location: 'Makkah',
    color: '#7a6a9a', icon: '✂️',
    actions: [
      'Men: shave the entire head (halq) — this is preferred and more rewarding',
      'Men alternative: trim at least an inch from all parts of the head (taqsir)',
      'Women: cut a fingertip\'s length (~1 cm) from the ends of the hair (taqsir only)',
      'This act releases you fully from ihram — all prohibitions are now lifted',
      'Your Umrah is complete — offer gratitude and make heartfelt du\'a',
      'You may perform additional voluntary Tawaf (tawaf nafl) as much as you wish',
    ],
    actionsAr: [
      'الرجال: احلق رأسك كاملاً (الحلق) — وهو أفضل وأكثر ثواباً',
      'بديل الرجال: قصِّر من جميع أجزاء الرأس بمقدار أنملة على الأقل (التقصير)',
      'النساء: قصِّري من أطراف الشعر بمقدار أنملة فقط (التقصير حصراً)',
      'هذا الفعل يُحلّلك من الإحرام كلياً — ترتفع جميع المحظورات',
      'عمرتك مكتملة — اشكر الله وادعُ بما شئت من قلبك',
      'يمكنك أداء طواف نافلة إضافي بقدر ما تشاء',
    ],
  },
];

const UMRAH_DUAS = [
  {
    title: 'Ihram Intention',
    titleAr: 'نية الإحرام',
    arabic: 'اللَّهُمَّ إِنِّي أُرِيدُ الْعُمْرَةَ فَيَسِّرْهَا لِي وَتَقَبَّلْهَا مِنِّي',
    transliteration: 'Allahumma inni uridul-umrata fayassirha li wa taqabbalha minni',
    meaning: 'O Allah, I intend to perform Umrah, so make it easy for me and accept it from me.',
    when: 'At the Miqat before entering ihram',
  },
  {
    title: 'Talbiyah',
    titleAr: 'التلبية',
    arabic: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
    transliteration: "Labbayk Allahumma labbayk, labbayka la sharika laka labbayk, innal-hamda wan-ni'mata laka wal-mulk, la sharika lak",
    meaning: 'Here I am O Allah, here I am. Here I am, You have no partner, here I am. Verily all praise, grace, and sovereignty belong to You. You have no partner.',
    when: 'Recite continuously from Miqat until beginning Tawaf',
  },
  {
    title: 'Entering Masjid al-Haram',
    titleAr: 'دعاء دخول المسجد الحرام',
    arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    transliteration: 'Allahumma iftah li abwaba rahmatik',
    meaning: 'O Allah, open for me the gates of Your mercy.',
    when: 'When entering the mosque with the right foot first',
  },
  {
    title: "Du'a Upon Seeing the Kaabah",
    titleAr: 'دعاء رؤية الكعبة',
    arabic: 'اللَّهُمَّ زِدْ هَذَا الْبَيْتَ تَشْرِيفًا وَتَعْظِيمًا وَتَكْرِيمًا وَمَهَابَةً',
    transliteration: "Allahumma zid hadhal-bayta tashreefan wa ta'dheeman wa taqreeman wa mahabah",
    meaning: 'O Allah, increase this House in honour, reverence, nobility, and awe.',
    when: 'Upon first seeing the Kaabah — raise your hands and make du\'a',
  },
  {
    title: "Tawaf Du'a — Between the Two Corners",
    titleAr: 'دعاء الطواف — بين الركنين',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar',
    meaning: 'Our Lord, give us good in this world and good in the Hereafter, and save us from the torment of the Fire.',
    when: 'During Tawaf between the Yemeni Corner and the Black Stone',
  },
  {
    title: "Du'a at Safa — Beginning of Sa'i",
    titleAr: 'دعاء الصفا',
    arabic: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ، أَبْدَأُ بِمَا بَدَأَ اللَّهُ بِهِ',
    transliteration: "Innas-safa wal-marwata min sha'a'irillah, abd'u bima bada'allahu bih",
    meaning: "Indeed Safa and Marwa are among the symbols of Allah. I begin with what Allah began with.",
    when: "At the start of Sa'i, standing on Safa facing the Kaabah",
  },
  {
    title: "Sa'i Du'a on the Hills",
    titleAr: "دعاء السعي على الصفا والمروة",
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir",
    meaning: "There is no god but Allah alone, with no partner. To Him belongs dominion, all praise, and He is over all things powerful.",
    when: "Recite 3 times on both Safa and Marwa each time you ascend",
  },
  {
    title: 'Completion Du\'a',
    titleAr: 'دعاء الإتمام',
    arabic: 'اللَّهُمَّ تَقَبَّلْ مِنَّا إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ',
    transliteration: "Allahumma taqabbal minna innaka antas-sami'ul-'alim",
    meaning: 'O Allah, accept from us. Indeed You are the All-Hearing, the All-Knowing.',
    when: 'After completing all rites of Umrah',
  },
];

const UMRAH_DO = [
  { catKey: 'catIhram', icon: '🕊️', items: [
    { en: 'Perform ghusl (ritual bath) before putting on ihram', ar: 'اغتسل قبل ارتداء الإحرام' },
    { en: 'Make a sincere intention (niyyah) for Umrah at the Miqat', ar: 'اجعل نيتك خالصة لله في العمرة عند الميقات' },
    { en: 'Recite the Talbiyah continuously until you begin Tawaf', ar: 'رَدِّد التلبية باستمرار حتى تبدأ الطواف' },
    { en: 'Maintain the state of wudu throughout Tawaf', ar: 'حافظ على وضوئك طوال الطواف' },
  ]},
  { catKey: 'catTawaf', icon: '⭕', items: [
    { en: 'Start and end each circuit at the Black Stone', ar: 'ابدأ وانهِ كل شوط عند الحجر الأسود' },
    { en: 'Keep the Kaabah on your left throughout', ar: 'أبقِ الكعبة على يسارك في جميع الأوقات' },
    { en: 'Recite du\'a and dhikr — especially between the Yemeni Corner and Black Stone', ar: 'اذكر الله وادعُه — خاصة بين الركن اليماني والحجر الأسود' },
    { en: 'Pray 2 rak\'ah behind Maqam Ibrahim after Tawaf', ar: 'صلِّ ركعتين خلف مقام إبراهيم بعد الطواف' },
    { en: 'Drink Zamzam water and make du\'a', ar: 'اشرب ماء زمزم وادعُ الله' },
  ]},
  { catKey: 'catSai', icon: '🏃', items: [
    { en: "Begin Sa'i at Safa — recite the opening verse and make du'a", ar: 'ابدأ السعي من الصفا — اقرأ الآية وادعُ الله' },
    { en: 'Walk with calmness and devotion, remembering Hajar (as)', ar: 'امشِ بهدوء وخشوع، متذكراً هاجر (عليها السلام)' },
    { en: "Make du'a and dhikr at both Safa and Marwa each round", ar: 'ادعُ الله واذكره عند الصفا والمروة في كل شوط' },
    { en: 'End at Marwa on your 7th pass', ar: 'انتهِ عند المروة في الشوط السابع' },
  ]},
  { catKey: 'catGeneral', icon: '✨', items: [
    { en: 'Make du\'a at al-Multazam (between the Black Stone and the door)', ar: 'ادعُ الله عند الملتزم (بين الحجر الأسود والباب)' },
    { en: 'Perform additional voluntary Tawaf (tawaf nafl) while in Makkah', ar: 'أدِّ طوافاً نافلاً إضافياً ما دمت في مكة' },
    { en: 'Give charity and help fellow pilgrims', ar: 'تصدق وساعد الحجاج والمعتمرين' },
    { en: 'Spend time in prayer, Quran recitation, and dhikr', ar: 'أمضِ وقتك في الصلاة وتلاوة القرآن والذكر' },
    { en: 'Visit Masjid al-Nabawi in Madinah if possible', ar: 'زُر المسجد النبوي في المدينة المنورة إن أمكن' },
  ]},
];

const UMRAH_AVOID = [
  { catKey: 'catIhramAvoid', icon: '🚫', severity: 'high', items: [
    { en: 'Do not cut hair or nails', ar: 'لا تقص شعرك أو أظافرك' },
    { en: 'Do not use perfume or scented products', ar: 'لا تستخدم العطور أو المنتجات المعطرة' },
    { en: 'Do not engage in sexual relations', ar: 'لا تقرب أهلك' },
    { en: 'Men: do not cover the head with anything that touches it', ar: 'الرجال: لا تغطِ الرأس بما يلاصقه' },
    { en: 'Women: do not cover the face or hands', ar: 'النساء: لا تغطِ الوجه أو الكفين' },
    { en: 'Do not hunt animals or cut plants in the Haram area', ar: 'لا تصطد الحيوانات ولا تقطع النباتات في الحرم' },
    { en: 'Do not argue or engage in obscene speech', ar: 'لا تجادل ولا تتلفظ بالفحش' },
  ]},
  { catKey: 'catBehaviour', icon: '⚠️', severity: 'medium', items: [
    { en: 'Avoid pushing or shoving others in the crowded Mataf', ar: 'تجنب دفع الآخرين في المطاف المزدحم' },
    { en: 'Do not waste time on phones and social media', ar: 'لا تضع وقتك في الهواتف ووسائل التواصل الاجتماعي' },
    { en: 'Do not litter — keep the mosque and sacred sites clean', ar: 'لا تُلقِ القمامة — حافظ على نظافة المسجد والمشاعر' },
    { en: 'Avoid loud conversations or noisy behaviour in the mosque', ar: 'تجنب الضوضاء والأحاديث بصوت مرتفع في المسجد' },
    { en: 'Do not delay or rush others during Tawaf and Sa\'i', ar: 'لا تُبطئ أو تضغط على الآخرين أثناء الطواف والسعي' },
  ]},
];

const UMRAH_MAP_STOPS = [
  { name: 'Miqat', nameAr: 'الميقات', desc: 'The designated boundary where pilgrims enter ihram. Different Miqats exist depending on your direction of travel (e.g., Dhul Hulayfah for Madinah, Yalamlam for Yemen).', icon: '🟢', step: 1 },
  { name: 'Masjid al-Haram', nameAr: 'المسجد الحرام', desc: 'The Grand Mosque in Makkah — home of the Kaabah, Zamzam well, Maqam Ibrahim, and the Black Stone. The heart of the Umrah journey.', icon: '🕋', step: 2 },
  { name: 'Tawaf (Kaabah)', nameAr: 'الطواف (الكعبة)', desc: 'Perform 7 counter-clockwise circuits around the Kaabah, beginning and ending at the Black Stone. This is a pillar of Umrah.', icon: '⭕', step: 3 },
  { name: 'Maqam Ibrahim', nameAr: 'مقام إبراهيم', desc: 'The station of Prophet Ibrahim (AS). After Tawaf, pray 2 rak\'ah here — reciting Surah al-Kafirun and al-Ikhlas.', icon: '🤲', step: 4 },
  { name: "Safa & Marwa (Sa'i)", nameAr: 'الصفا والمروة (السعي)', desc: "Perform Sa'i — walk 7 times between the hills of Safa and Marwa, commemorating Hajar's search for water for her son Ismail.", icon: '🏃', step: 5 },
  { name: 'Halq / Taqsir', nameAr: 'الحلق / التقصير', desc: 'The final rite — men shave (halq, preferred) or trim the hair, women trim a fingertip\'s length. This releases you from ihram and completes Umrah.', icon: '✂️', step: 6 },
];

export default function UmrahScreen() {
  const insets = useSafeAreaInsets();
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [expandedDua, setExpandedDua] = useState<number | null>(null);
  const [expandedDo, setExpandedDo] = useState<number | null>(null);
  const [expandedAvoid, setExpandedAvoid] = useState<number | null>(null);
  const { lang, setLang } = useLang();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const isAr = lang === 'ar';
  const tu = UMRAH_T[lang] || UMRAH_T.en;
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  useEffect(() => { registerScroll('umrah', scrollRef); }, []);

  const SECTIONS: { id: Section; icon: string; label: string }[] = [
    { id: 'overview', icon: '🕌', label: tu.secOverview },
    { id: 'steps',    icon: '📋', label: tu.secSteps },
    { id: 'duas',     icon: '🤲', label: tu.secDuas },
    { id: 'do',       icon: '✅', label: tu.secDo },
    { id: 'avoid',    icon: '⛔', label: tu.secAvoid },
    { id: 'map',      icon: '🗺️', label: tu.secMap },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a1a15', '#0d2818', '#132e1f']} style={StyleSheet.absoluteFill} />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.screenTitle}>{tu.title}</Text>
            <Text style={styles.screenSub}>{tu.sub}</Text>
          </View>
          <Pressable onPress={() => setShowLangPicker(v => !v)} style={styles.langToggle}>
            <Text style={styles.langToggleText}>{LANG_LABELS[lang]?.slice(0, 2).toUpperCase()}</Text>
          </Pressable>
        </View>

        {showLangPicker && (
          <View style={styles.langDropdown}>
            {Object.entries(LANG_LABELS).map(([code, label]) => (
              <Pressable key={code} onPress={() => { setLang(code); setShowLangPicker(false); }} style={[styles.langItem, lang === code && styles.langItemActive]}>
                <Text style={[styles.langItemText, lang === code && styles.langItemTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        )}

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
              <Text style={styles.overviewBannerText}>🕌</Text>
              <Text style={styles.overviewBannerTitle}>{tu.bannerTitle}</Text>
              <Text style={styles.overviewBannerSub}>{tu.bannerSub}</Text>
            </View>

            {/* Pillars */}
            <Text style={styles.sectionHeading}>{tu.pillarsTitle}</Text>
            {[
              { num: '١', numEn: '1', en: 'Ihram — Entering the Sacred State', ar: 'الإحرام — الدخول في الحالة المقدسة' },
              { num: '٢', numEn: '2', en: 'Tawaf — 7 Counter-Clockwise Circuits Around the Kaabah', ar: 'الطواف — ٧ أشواط حول الكعبة عكس اتجاه عقارب الساعة' },
              { num: '٣', numEn: '3', en: "Sa'i — Walking 7 Times Between Safa and Marwa", ar: 'السعي — المشي ٧ مرات بين الصفا والمروة' },
              { num: '٤', numEn: '4', en: 'Halq or Taqsir — Shaving or Trimming the Hair', ar: 'الحلق أو التقصير — حلق الشعر أو تقصيره' },
            ].map((item, i) => (
              <View key={i} style={styles.pillarRow}>
                <View style={styles.pillarNum}><Text style={styles.pillarNumText}>{isAr ? item.num : item.numEn}</Text></View>
                <Text style={[styles.pillarText, isAr && styles.rtlText]}>{isAr ? item.ar : item.en}</Text>
              </View>
            ))}

            {/* Conditions */}
            <Text style={[styles.sectionHeading, { marginTop: 20 }]}>{tu.conditionsTitle}</Text>
            {[
              { en: 'Be Muslim — Umrah is only obligatory for Muslims', ar: 'أن يكون مسلماً — العمرة واجبة على المسلمين فقط' },
              { en: 'Be of sound mind (sane)', ar: 'أن يكون عاقلاً' },
              { en: 'Be free from Ihram prohibitions before performing rituals', ar: 'أن يكون خالياً من محظورات الإحرام قبل أداء المناسك' },
              { en: 'Ability — physical and financial capability', ar: 'الاستطاعة — القدرة الجسدية والمالية' },
              { en: 'Women: have a mahram (male guardian) for travel', ar: 'المرأة: وجود محرم للسفر' },
            ].map((item, i) => (
              <View key={i} style={styles.listRow}>
                <Text style={styles.listBullet}>◆</Text>
                <Text style={[styles.listText, isAr && styles.rtlText]}>{isAr ? item.ar : item.en}</Text>
              </View>
            ))}
          </View>
        )}

        {/* STEP-BY-STEP GUIDE */}
        {activeSection === 'steps' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{tu.stepsTitle}</Text>
            {UMRAH_STEPS.map((s, i) => (
              <Pressable key={i} onPress={() => setExpandedStep(expandedStep === i ? null : i)} style={styles.dayCard}>
                <View style={[styles.dayCardBar, { backgroundColor: s.color + '33' }]}>
                  <View style={[styles.dayDot, { backgroundColor: s.color }]}>
                    <Text style={styles.dayDotText}>{s.icon}</Text>
                  </View>
                  <View style={styles.dayCardInfo}>
                    <Text style={styles.dayLabel}>{isAr ? s.stepAr : s.step}</Text>
                    <Text style={[styles.dayTitle, isAr && styles.rtlText]}>{isAr ? s.titleAr : s.title}</Text>
                    <View style={styles.dayLocation}>
                      <Text style={styles.dayLocationText}>📍 {s.location}</Text>
                    </View>
                  </View>
                  <Text style={[styles.expandChev, expandedStep === i && styles.expandChevOpen]}>›</Text>
                </View>
                {expandedStep === i && (
                  <View style={styles.dayActions}>
                    {(isAr ? s.actionsAr : s.actions).map((act, j) => (
                      <View key={j} style={styles.dayActionRow}>
                        <View style={[styles.dayActionNum, { backgroundColor: s.color + '33' }]}>
                          <Text style={[styles.dayActionNumText, { color: s.color }]}>{j + 1}</Text>
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

        {/* UMRAH DUAS */}
        {activeSection === 'duas' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{tu.duasTitle}</Text>
            {UMRAH_DUAS.map((dua, i) => (
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
            <Text style={styles.sectionHeading}>{tu.doTitle}</Text>
            {UMRAH_DO.map((group, gi) => (
              <Pressable key={gi} onPress={() => setExpandedDo(expandedDo === gi ? null : gi)} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupIcon}>{group.icon}</Text>
                  <Text style={[styles.groupTitle, isAr && styles.rtlText]}>{tu[group.catKey] || group.catKey}</Text>
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
            <Text style={styles.sectionHeading}>{tu.avoidTitle}</Text>
            {UMRAH_AVOID.map((group, gi) => (
              <Pressable key={gi} onPress={() => setExpandedAvoid(expandedAvoid === gi ? null : gi)} style={[styles.groupCard, group.severity === 'high' && styles.groupCardHigh]}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupIcon}>{group.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.groupTitle, isAr && styles.rtlText, group.severity === 'high' && styles.groupTitleHigh]}>
                      {tu[group.catKey] || group.catKey}
                    </Text>
                    {group.severity === 'high' && (
                      <Text style={styles.severityBadge}>{tu.ihramProhib}</Text>
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
            <Text style={styles.sectionHeading}>{tu.mapTitle}</Text>
            <Text style={styles.mapSubtitle}>{tu.mapSub}</Text>

            <View style={styles.mapContainer}>
              {UMRAH_MAP_STOPS.map((stop, i) => (
                <View key={i} style={styles.mapStopRow}>
                  <View style={styles.mapLineCol}>
                    <View style={[styles.mapNode, i === 2 && styles.mapNodeHighlight]}>
                      <Text style={styles.mapNodeText}>{stop.icon}</Text>
                    </View>
                    {i < UMRAH_MAP_STOPS.length - 1 && <View style={styles.mapLine} />}
                  </View>
                  <View style={[styles.mapStopCard, i === 2 && styles.mapStopCardHighlight]}>
                    <View style={styles.mapStopHeader}>
                      <Text style={[styles.mapStopNum, i === 2 && styles.mapStopNumHighlight]}>{tu.stop} {stop.step}</Text>
                    </View>
                    <Text style={[styles.mapStopName, i === 2 && styles.mapStopNameHighlight, isAr && styles.rtlText]}>
                      {isAr ? stop.nameAr : stop.name}
                    </Text>
                    <Text style={[styles.mapStopDesc, isAr && styles.rtlText]}>{stop.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Distance reference */}
            <View style={styles.distanceCard}>
              <Text style={styles.distanceTitle}>{tu.distTitle}</Text>
              {[
                { from: 'Miqat', to: 'Makkah', dist: '~9 km', fromAr: 'الميقات', toAr: 'مكة' },
                { from: "Kaabah", to: 'Maqam Ibrahim', dist: '~20 m', fromAr: 'الكعبة', toAr: 'مقام إبراهيم' },
                { from: 'Safa', to: 'Marwa', dist: '~450 m', fromAr: 'الصفا', toAr: 'المروة' },
                { from: "Sa'i Total", to: '(7 laps)', dist: '~3.15 km', fromAr: 'مجموع السعي', toAr: '(٧ أشواط)' },
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
  langToggle: { backgroundColor: 'rgba(196,164,106,0.1)', borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  langToggleText: { color: GOLD, fontSize: 11, fontWeight: '600' },
  langDropdown: { alignSelf: 'flex-end', marginRight: 20, marginTop: -4, marginBottom: 4, backgroundColor: '#132e1f', borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 4, minWidth: 130 },
  langItem: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  langItemActive: { backgroundColor: 'rgba(196,164,106,0.15)' },
  langItemText: { color: MUTED, fontSize: 13 },
  langItemTextActive: { color: GOLD, fontWeight: '600' },

  navRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  navChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: BORDER, backgroundColor: 'rgba(196,164,106,0.03)' },
  navChipActive: { borderColor: GOLD, backgroundColor: 'rgba(196,164,106,0.14)' },
  navChipIcon: { fontSize: 14 },
  navChipText: { color: MUTED, fontSize: 11, fontWeight: '500' },
  navChipTextActive: { color: GOLD },

  section: { paddingHorizontal: 16 },
  sectionHeading: { color: GOLD, fontSize: 13, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12, marginTop: 4 },

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

  duaCard: { marginBottom: 10, padding: 14, backgroundColor: BG_CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER },
  duaCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  duaCardTitle: { color: GOLD, fontSize: 14, fontWeight: '600', marginBottom: 3 },
  duaCardWhen: { color: MUTED, fontSize: 10 },
  duaExpanded: { marginTop: 14 },
  duaArabic: { color: '#e8e0d0', fontSize: 20, fontWeight: '600', textAlign: 'center', lineHeight: 36, marginBottom: 10 },
  duaDivider: { height: 1, backgroundColor: BORDER, marginBottom: 10 },
  duaTranslit: { color: GOLD, fontSize: 11, fontWeight: '500', textAlign: 'center', marginBottom: 6 },
  duaMeaning: { color: MUTED, fontSize: 11, textAlign: 'center', fontStyle: 'italic', lineHeight: 18 },

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
