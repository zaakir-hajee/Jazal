import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ============ TRANSLATIONS ============
const TRANSLATIONS = {
  en: {
    appName: "Tasbeeh", appSub: "Digital Prayer Counter", tapHint: "Tap anywhere on the circle",
    today: "Today", cycles: "Cycles", current: "Current", reset: "Reset Counter",
    completed: "✓ Completed", nextLoading: "Next dhikr loading...",
    duaTitle: "Supplications", duaSub: "Supplications & Remembrance",
    backToAll: "← Back to all du'a", listen: "🔊 Listen",
    statsTitle: "Statistics", statsSub: "Your Personal Progress",
    signInUnlock: "Sign in to unlock full stats",
    signInDesc: "Track your daily, weekly, and monthly dhikr progress across all your devices.",
    signInFree: "Sign In Free", thisMonth: "This Month", streak: "Streak",
    bestDay: "Best Day", totalAll: "Total All Time", days: "days", keepGoing: "Keep going!",
    sinceJoining: "Since joining", dhikrCounted: "dhikr counted", thisWeek: "This Week",
    rankTitle: "Competition", rankSub: "Compete in Good Deeds",
    rankNum: "# Rank", rankPct: "Top %", rankFriends: "Friends", rankOff: "Off",
    rankOffMsg: "Ranking is hidden. Your dhikr is between you and Allah.",
    rankKeep: "Keep counting! Every dhikr brings you closer to the top.",
    ofAllUsers: "of all users",
    supportBtn: "Support This App",
    supportMsg: "This app is free to use. If you find it valuable, you can support us with a one time contribution to help us keep improving it.",
    dhikrOfDay: "Dhikr of the Day", signIn: "Sign In",
    navCounter: "Tasbeeh", navDua: "Du'a", navStats: "Stats", navRanking: "Ranking",
    of: "of",
    morning: "Morning Adhkar", evening: "Evening Adhkar", travel: "Travel",
    food: "Before & After Eating", bathroom: "Entering & Leaving Bathroom",
    sleep: "Before Sleep", happiness: "Joy & Gratitude", distress: "In Times of Distress",
    mosque: "Entering & Leaving Mosque",
    settings: "Settings", soundSettings: "Sound Settings",
    tapSound: "Tap Sound", completionSound: "Completion Sound", voiceStyle: "Voice",
    noDataYet: "No data yet", startCounting: "Start counting your dhikr to see progress here.",
    rankNoData: "Complete dhikr to see your ranking among other users.",
    noDays: "No days tracked yet",
  },
  ar: {
    appName: "تسبيح", appSub: "عداد الأذكار الرقمي", tapHint: "اضغط في أي مكان على الدائرة",
    today: "اليوم", cycles: "الدورات", current: "الحالي", reset: "إعادة تعيين",
    completed: "✓ تم", nextLoading: "الذكر التالي...",
    duaTitle: "الأدعية", duaSub: "الأدعية والأذكار",
    backToAll: "← العودة لجميع الأدعية", listen: "🔊 استمع",
    statsTitle: "إحصائيات", statsSub: "تقدمك الشخصي",
    signInUnlock: "سجل دخولك لفتح الإحصائيات",
    signInDesc: "تتبع تقدمك اليومي والأسبوعي والشهري عبر جميع أجهزتك.",
    signInFree: "تسجيل الدخول مجاناً", thisMonth: "هذا الشهر", streak: "سلسلة متواصلة",
    bestDay: "أفضل يوم", totalAll: "المجموع الكلي", days: "يوم", keepGoing: "استمر!",
    sinceJoining: "منذ الانضمام", dhikrCounted: "ذكر", thisWeek: "هذا الأسبوع",
    rankTitle: "المنافسة", rankSub: "تنافس في الخيرات",
    rankNum: "الترتيب", rankPct: "النسبة", rankFriends: "الأصدقاء", rankOff: "إيقاف",
    rankOffMsg: "الترتيب مخفي. ذكرك بينك وبين الله.",
    rankKeep: "استمر! كل ذكر يقربك من القمة.", ofAllUsers: "من جميع المستخدمين",
    supportBtn: "ادعم التطبيق",
    supportMsg: "هذا التطبيق مجاني. إذا وجدته مفيداً، يمكنك دعمنا بمساهمة لمرة واحدة لمساعدتنا في تحسينه.",
    dhikrOfDay: "ذكر اليوم", signIn: "تسجيل الدخول",
    navCounter: "تسبيح", navDua: "دعاء", navStats: "إحصائيات", navRanking: "ترتيب", of: "من",
    morning: "أذكار الصباح", evening: "أذكار المساء", travel: "دعاء السفر",
    food: "دعاء الطعام", bathroom: "دعاء دخول الخلاء", sleep: "أذكار النوم",
    happiness: "دعاء الفرح", distress: "دعاء الكرب", mosque: "دعاء دخول المسجد",
    settings: "الإعدادات", soundSettings: "إعدادات الصوت",
    tapSound: "صوت النقر", completionSound: "صوت الإنجاز", voiceStyle: "الصوت",
    noDataYet: "لا توجد بيانات بعد", startCounting: "ابدأ التسبيح لمشاهدة تقدمك هنا.",
    rankNoData: "أكمل الأذكار لمشاهدة ترتيبك.", noDays: "لم يتم تتبع أي أيام بعد",
  },
  ms: {
    appName: "Tasbih", appSub: "Kaunter Zikir Digital", tapHint: "Ketik di mana-mana pada bulatan",
    today: "Hari Ini", cycles: "Kitaran", current: "Semasa", reset: "Set Semula",
    completed: "✓ Selesai", nextLoading: "Zikir seterusnya...",
    duaTitle: "Doa", duaSub: "Doa & Zikir", backToAll: "← Kembali ke semua doa", listen: "🔊 Dengar",
    statsTitle: "Statistik", statsSub: "Kemajuan Peribadi Anda",
    signInUnlock: "Log masuk untuk membuka statistik",
    signInDesc: "Jejaki kemajuan zikir harian, mingguan dan bulanan anda.",
    signInFree: "Log Masuk Percuma", thisMonth: "Bulan Ini", streak: "Kesinambungan",
    bestDay: "Hari Terbaik", totalAll: "Jumlah Keseluruhan", days: "hari", keepGoing: "Teruskan!",
    sinceJoining: "Sejak menyertai", dhikrCounted: "zikir dikira", thisWeek: "Minggu Ini",
    rankTitle: "Pertandingan", rankSub: "Berlumba dalam Kebaikan",
    rankNum: "# Kedudukan", rankPct: "% Teratas", rankFriends: "Rakan", rankOff: "Tutup",
    rankOffMsg: "Kedudukan disembunyikan. Zikir anda antara anda dan Allah.",
    rankKeep: "Teruskan! Setiap zikir mendekatkan anda ke puncak.", ofAllUsers: "dari semua pengguna",
    supportBtn: "Sokong Aplikasi Ini",
    supportMsg: "Aplikasi ini percuma. Jika anda mendapati ia berguna, anda boleh menyokong kami dengan sumbangan sekali sahaja.",
    dhikrOfDay: "Zikir Hari Ini", signIn: "Log Masuk",
    navCounter: "Tasbih", navDua: "Doa", navStats: "Statistik", navRanking: "Kedudukan", of: "dari",
    morning: "Zikir Pagi", evening: "Zikir Petang", travel: "Doa Musafir", food: "Doa Makan",
    bathroom: "Doa Tandas", sleep: "Zikir Tidur", happiness: "Doa Kegembiraan",
    distress: "Doa Kesusahan", mosque: "Doa Masuk Masjid",
    settings: "Tetapan", soundSettings: "Tetapan Bunyi",
    tapSound: "Bunyi Ketik", completionSound: "Bunyi Selesai", voiceStyle: "Suara",
    noDataYet: "Tiada data lagi", startCounting: "Mulakan zikir untuk melihat kemajuan di sini.",
    rankNoData: "Lengkapkan zikir untuk melihat kedudukan anda.", noDays: "Tiada hari dijejak lagi",
  },
  id: {
    appName: "Tasbih", appSub: "Penghitung Zikir Digital", tapHint: "Ketuk di mana saja pada lingkaran",
    today: "Hari Ini", cycles: "Siklus", current: "Saat Ini", reset: "Atur Ulang",
    completed: "✓ Selesai", nextLoading: "Zikir berikutnya...",
    duaTitle: "Doa", duaSub: "Doa & Zikir", backToAll: "← Kembali ke semua doa", listen: "🔊 Dengar",
    statsTitle: "Statistik", statsSub: "Kemajuan Pribadi Anda",
    signInUnlock: "Masuk untuk membuka statistik",
    signInDesc: "Lacak kemajuan zikir harian, mingguan, dan bulanan Anda.",
    signInFree: "Masuk Gratis", thisMonth: "Bulan Ini", streak: "Beruntun",
    bestDay: "Hari Terbaik", totalAll: "Total Semua", days: "hari", keepGoing: "Lanjutkan!",
    sinceJoining: "Sejak bergabung", dhikrCounted: "zikir dihitung", thisWeek: "Minggu Ini",
    rankTitle: "Kompetisi", rankSub: "Berlomba dalam Kebaikan",
    rankNum: "# Peringkat", rankPct: "% Teratas", rankFriends: "Teman", rankOff: "Mati",
    rankOffMsg: "Peringkat disembunyikan. Zikir Anda antara Anda dan Allah.",
    rankKeep: "Terus! Setiap zikir mendekatkan Anda ke puncak.", ofAllUsers: "dari semua pengguna",
    supportBtn: "Dukung Aplikasi Ini",
    supportMsg: "Aplikasi ini gratis. Jika Anda merasa bermanfaat, Anda dapat mendukung kami dengan kontribusi satu kali.",
    dhikrOfDay: "Zikir Hari Ini", signIn: "Masuk",
    navCounter: "Tasbih", navDua: "Doa", navStats: "Statistik", navRanking: "Peringkat", of: "dari",
    morning: "Zikir Pagi", evening: "Zikir Sore", travel: "Doa Perjalanan", food: "Doa Makan",
    bathroom: "Doa Kamar Mandi", sleep: "Zikir Tidur", happiness: "Doa Kebahagiaan",
    distress: "Doa Kesulitan", mosque: "Doa Masuk Masjid",
    settings: "Pengaturan", soundSettings: "Pengaturan Suara",
    tapSound: "Suara Ketuk", completionSound: "Suara Selesai", voiceStyle: "Suara",
    noDataYet: "Belum ada data", startCounting: "Mulai zikir untuk melihat kemajuan di sini.",
    rankNoData: "Selesaikan zikir untuk melihat peringkat Anda.", noDays: "Belum ada hari yang dilacak",
  },
  fil: {
    appName: "Tasbih", appSub: "Digital na Pangbilang ng Panalangin", tapHint: "Pindutin kahit saan sa bilog",
    today: "Ngayon", cycles: "Siklo", current: "Kasalukuyan", reset: "I-reset",
    completed: "✓ Tapos na", nextLoading: "Susunod na dhikr...",
    duaTitle: "Mga Panalangin", duaSub: "Mga Panalangin at Pag-alaala",
    backToAll: "← Bumalik sa lahat ng dua", listen: "🔊 Pakinggan",
    statsTitle: "Mga Istatistika", statsSub: "Ang Iyong Personal na Progreso",
    signInUnlock: "Mag-sign in para ma-unlock ang stats",
    signInDesc: "Subaybayan ang iyong araw-araw, lingguhan, at buwanang progreso.",
    signInFree: "Mag-sign In Libre", thisMonth: "Ngayong Buwan", streak: "Sunod-sunod",
    bestDay: "Pinakamahusay na Araw", totalAll: "Kabuuang Lahat", days: "araw", keepGoing: "Ituloy mo!",
    sinceJoining: "Mula nang sumali", dhikrCounted: "dhikr na nabilang", thisWeek: "Ngayong Linggo",
    rankTitle: "Kompetisyon", rankSub: "Magpaligsahan sa Kabutihan",
    rankNum: "# Ranggo", rankPct: "Nangungunang %", rankFriends: "Mga Kaibigan", rankOff: "Patayin",
    rankOffMsg: "Nakatago ang ranggo. Ang dhikr mo ay sa pagitan mo at ng Allah.",
    rankKeep: "Ituloy! Bawat dhikr ay nagpapalapit sa iyo sa tuktok.", ofAllUsers: "sa lahat ng gumagamit",
    supportBtn: "Suportahan ang App",
    supportMsg: "Ang app na ito ay libre. Kung nakita mong mahalaga ito, maaari mo kaming suportahan ng isang beses na kontribusyon.",
    dhikrOfDay: "Dhikr ng Araw", signIn: "Mag-sign In",
    navCounter: "Tasbih", navDua: "Dua", navStats: "Stats", navRanking: "Ranggo", of: "sa",
    morning: "Dhikr sa Umaga", evening: "Dhikr sa Gabi", travel: "Panalangin sa Paglalakbay",
    food: "Panalangin sa Pagkain", bathroom: "Panalangin sa Banyo", sleep: "Dhikr Bago Matulog",
    happiness: "Panalangin ng Pasasalamat", distress: "Panalangin sa Kahirapan", mosque: "Panalangin sa Masjid",
    settings: "Mga Setting", soundSettings: "Mga Setting ng Tunog",
    tapSound: "Tunog ng Pindutin", completionSound: "Tunog ng Pagkumpleto", voiceStyle: "Boses",
    noDataYet: "Wala pang data", startCounting: "Magsimulang mag-dhikr para makita ang progreso dito.",
    rankNoData: "Kumpletuhin ang dhikr para makita ang iyong ranggo.", noDays: "Wala pang araw na nasubaybayan",
  },
};

const LANG_LABELS = { en: "English", ar: "العربية", ms: "Melayu", id: "Indonesia", fil: "Filipino" };

// ============ DHIKR DATA ============
const DHIKR_SEQUENCE = [
  { arabic: "سُبْحَانَ اللَّهِ", transliteration: "SubhanAllah", meaning: { en: "Glory be to Allah", ar: "تنزيه الله عن كل نقص", ms: "Maha Suci Allah", id: "Maha Suci Allah", fil: "Kaluwalhatian sa Allah" }, target: 33 },
  { arabic: "الْحَمْدُ لِلَّهِ", transliteration: "Alhamdulillah", meaning: { en: "Praise be to Allah", ar: "الثناء لله", ms: "Segala puji bagi Allah", id: "Segala puji bagi Allah", fil: "Papuri sa Allah" }, target: 33 },
  { arabic: "اللَّهُ أَكْبَرُ", transliteration: "Allahu Akbar", meaning: { en: "Allah is the Greatest", ar: "الله أعظم من كل شيء", ms: "Allah Maha Besar", id: "Allah Maha Besar", fil: "Ang Allah ang Pinakadakila" }, target: 33 },
  { arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ", transliteration: "La ilaha illallah", meaning: { en: "There is no god but Allah", ar: "لا معبود بحق إلا الله", ms: "Tiada Tuhan selain Allah", id: "Tiada Tuhan selain Allah", fil: "Walang diyos kundi ang Allah" }, target: 1 },
];

// ============ DHIKR OF THE DAY DATABASE (50+ entries) ============
const DAILY_DHIKR_DB = [
  { arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", transliteration: "HasbunAllahu wa ni'mal wakeel", en: "Allah is sufficient for us and He is the best disposer of affairs", ar: "حسبنا الله ونعم الوكيل" },
  { arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", transliteration: "La hawla wa la quwwata illa billah", en: "There is no power nor strength except with Allah", ar: "لا حول ولا قوة إلا بالله" },
  { arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ", transliteration: "Astaghfirullah al-'Azeem", en: "I seek forgiveness from Allah, the Almighty", ar: "أستغفر الله العظيم" },
  { arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", transliteration: "SubhanAllahi wa bihamdihi", en: "Glory be to Allah and His is the praise", ar: "سبحان الله وبحمده" },
  { arabic: "سُبْحَانَ اللَّهِ الْعَظِيمِ", transliteration: "SubhanAllah il-'Azeem", en: "Glory be to Allah, the Almighty", ar: "سبحان الله العظيم" },
  { arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ", transliteration: "Allahumma salli 'ala Muhammad", en: "O Allah, send blessings upon Muhammad and upon his family", ar: "اللهم صل على محمد وعلى آل محمد" },
  { arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ", transliteration: "La ilaha illallahu wahdahu la sharika lah", en: "There is no god but Allah alone, with no partner", ar: "لا إله إلا الله وحده لا شريك له" },
  { arabic: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ", transliteration: "Rabbighfir li wa tub 'alayya", en: "My Lord, forgive me and accept my repentance. You are the Accepter of repentance, the Merciful", ar: "ربي اغفر لي وتب علي إنك أنت التواب الرحيم" },
  { arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ", transliteration: "Ya Hayyu ya Qayyum birahmatika astaghith", en: "O Ever-Living, O Sustainer, in Your mercy I seek relief", ar: "يا حي يا قيوم برحمتك أستغيث" },
  { arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ", transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazan", en: "O Allah, I seek refuge in You from worry and grief", ar: "اللهم إني أعوذ بك من الهم والحزن" },
  { arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً", transliteration: "Rabbana atina fid-dunya hasanah", en: "Our Lord, give us good in this world and good in the Hereafter", ar: "ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة" },
  { arabic: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ", transliteration: "Allahumma a'inni 'ala dhikrika", en: "O Allah, help me to remember You, thank You, and worship You well", ar: "اللهم أعني على ذكرك وشكرك وحسن عبادتك" },
  { arabic: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي", transliteration: "Rabbish-rahli sadri wa yassirli amri", en: "My Lord, expand my chest and ease my task for me", ar: "رب اشرح لي صدري ويسر لي أمري" },
  { arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي", transliteration: "Allahumma innaka 'afuwwun tuhibbul-'afwa", en: "O Allah, You are the Pardoner, You love to pardon, so pardon me", ar: "اللهم إنك عفو تحب العفو فاعف عني" },
  { arabic: "سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ", transliteration: "SubhanAllahi walhamdulillahi...", en: "Glory be to Allah, praise be to Allah, there is no god but Allah, Allah is the Greatest", ar: "سبحان الله والحمد لله ولا إله إلا الله والله أكبر" },
  { arabic: "اللَّهُمَّ بَارِكْ لِي فِيمَا رَزَقْتَنِي", transliteration: "Allahumma barik li fima razaqtani", en: "O Allah, bless me in what You have provided for me", ar: "اللهم بارك لي فيما رزقتني" },
  { arabic: "رَبِّ زِدْنِي عِلْمًا", transliteration: "Rabbi zidni 'ilma", en: "My Lord, increase me in knowledge", ar: "رب زدني علماً" },
  { arabic: "اللَّهُمَّ اهْدِنِي وَسَدِّدْنِي", transliteration: "Allahummah-dini wa saddidni", en: "O Allah, guide me and keep me on the right path", ar: "اللهم اهدني وسددني" },
  { arabic: "تَوَكَّلْتُ عَلَى اللَّهِ", transliteration: "Tawakkaltu 'alAllah", en: "I place my trust in Allah", ar: "توكلت على الله" },
  { arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ", transliteration: "Allahumma inni as'alukal-'afiyah", en: "O Allah, I ask You for well-being in this world and the Hereafter", ar: "اللهم إني أسألك العافية في الدنيا والآخرة" },
  { arabic: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا", transliteration: "Rabbana la tuzigh qulubana", en: "Our Lord, do not let our hearts deviate after You have guided us", ar: "ربنا لا تزغ قلوبنا بعد إذ هديتنا" },
  { arabic: "اللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي", transliteration: "Allahumma aslih li dini", en: "O Allah, set right my religion which is the safeguard of my affairs", ar: "اللهم أصلح لي ديني الذي هو عصمة أمري" },
  { arabic: "سُبُّوحٌ قُدُّوسٌ رَبُّ الْمَلَائِكَةِ وَالرُّوحِ", transliteration: "Subbuhun quddusun rabbul-mala'ikati war-ruh", en: "Most Glorious, Most Holy, Lord of the angels and the Spirit", ar: "سبوح قدوس رب الملائكة والروح" },
  { arabic: "اللَّهُمَّ اغْفِرْ لِي ذَنْبِي كُلَّهُ دِقَّهُ وَجِلَّهُ", transliteration: "Allahummagh-fir li dhanbi kullahu", en: "O Allah, forgive all my sins, small and great", ar: "اللهم اغفر لي ذنبي كله دقه وجله" },
  { arabic: "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ", transliteration: "Rabbi awzi'ni an ashkura ni'matak", en: "My Lord, enable me to be grateful for Your favor", ar: "رب أوزعني أن أشكر نعمتك" },
  { arabic: "اللَّهُمَّ لَكَ الْحَمْدُ كَمَا يَنْبَغِي لِجَلَالِ وَجْهِكَ", transliteration: "Allahumma lakal-hamdu kama yanbaghi", en: "O Allah, praise is Yours as befits the glory of Your countenance", ar: "اللهم لك الحمد كما ينبغي لجلال وجهك" },
  { arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى", transliteration: "Allahumma inni as'alukal-huda wat-tuqa", en: "O Allah, I ask You for guidance, piety, chastity, and self-sufficiency", ar: "اللهم إني أسألك الهدى والتقى والعفاف والغنى" },
  { arabic: "اللَّهُمَّ ثَبِّتْنِي وَاجْعَلْنِي هَادِيًا مَهْدِيًّا", transliteration: "Allahumma thabbitni waj'alni", en: "O Allah, make me steadfast and make me a guide who is rightly guided", ar: "اللهم ثبتني واجعلني هادياً مهدياً" },
  { arabic: "اللَّهُمَّ اجْعَلْ فِي قَلْبِي نُورًا", transliteration: "Allahummaj'al fi qalbi nura", en: "O Allah, place light in my heart", ar: "اللهم اجعل في قلبي نوراً" },
  { arabic: "رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ", transliteration: "Rabbana taqabbal minna", en: "Our Lord, accept from us. You are the All-Hearing, the All-Knowing", ar: "ربنا تقبل منا إنك أنت السميع العليم" },
  { arabic: "اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ", transliteration: "Allahummak-fini bihalalika 'an haramik", en: "O Allah, suffice me with what is lawful against what is unlawful", ar: "اللهم اكفني بحلالك عن حرامك" },
  { arabic: "رَبِّ هَبْ لِي مِنْ لَدُنْكَ رَحْمَةً", transliteration: "Rabbi hab li min ladunka rahmah", en: "My Lord, grant me mercy from Yourself", ar: "رب هب لي من لدنك رحمة" },
  { arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّ مَا عَمِلْتُ وَمِنْ شَرِّ مَا لَمْ أَعْمَلْ", transliteration: "Allahumma inni a'udhu bika min sharri ma 'amiltu", en: "O Allah, I seek refuge in You from the evil of what I have done and what I have not done", ar: "اللهم إني أعوذ بك من شر ما عملت ومن شر ما لم أعمل" },
  { arabic: "رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ", transliteration: "Rabbana zalamna anfusana", en: "Our Lord, we have wronged ourselves. If You do not forgive us, we will be among the losers", ar: "ربنا ظلمنا أنفسنا وإن لم تغفر لنا لنكونن من الخاسرين" },
  { arabic: "اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ", transliteration: "Allahummaj'alni minat-tawwabin", en: "O Allah, make me among those who repent and among those who purify themselves", ar: "اللهم اجعلني من التوابين واجعلني من المتطهرين" },
  { arabic: "اللَّهُمَّ أَحْسِنْ عَاقِبَتَنَا فِي الْأُمُورِ كُلِّهَا", transliteration: "Allahumma ahsin 'aqibatana", en: "O Allah, make the end of all our affairs good", ar: "اللهم أحسن عاقبتنا في الأمور كلها" },
  { arabic: "لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ", transliteration: "La ilaha illa anta subhanaka", en: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers", ar: "لا إله إلا أنت سبحانك إني كنت من الظالمين" },
  { arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ حُسْنَ الْخَاتِمَةِ", transliteration: "Allahumma inni as'aluka husnal-khatimah", en: "O Allah, I ask You for a good ending", ar: "اللهم إني أسألك حسن الخاتمة" },
  { arabic: "رَبِّ لَا تَذَرْنِي فَرْدًا وَأَنْتَ خَيْرُ الْوَارِثِينَ", transliteration: "Rabbi la tadhurni fardan", en: "My Lord, do not leave me alone, and You are the best of inheritors", ar: "رب لا تذرني فرداً وأنت خير الوارثين" },
  { arabic: "اللَّهُمَّ عَافِنِي فِي بَدَنِي وَعَافِنِي فِي سَمْعِي وَعَافِنِي فِي بَصَرِي", transliteration: "Allahumma 'afini fi badani", en: "O Allah, grant me health in my body, my hearing, and my sight", ar: "اللهم عافني في بدني وعافني في سمعي وعافني في بصري" },
  { arabic: "الْحَمْدُ لِلَّهِ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ", transliteration: "Alhamdulillahi hamdan kathiran", en: "Praise be to Allah, abundant, good, and blessed praise", ar: "الحمد لله حمداً كثيراً طيباً مباركاً فيه" },
  { arabic: "اللَّهُمَّ آتِ نَفْسِي تَقْوَاهَا وَزَكِّهَا أَنْتَ خَيْرُ مَنْ زَكَّاهَا", transliteration: "Allahumma ati nafsi taqwaha", en: "O Allah, grant my soul its piety and purify it. You are the best to purify it", ar: "اللهم آت نفسي تقواها وزكها أنت خير من زكاها" },
  { arabic: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ", transliteration: "Rabbana hab lana min azwajina", en: "Our Lord, grant us comfort in our spouses and offspring", ar: "ربنا هب لنا من أزواجنا وذرياتنا قرة أعين" },
  { arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ", transliteration: "Allahumma anta Rabbi la ilaha illa ant", en: "O Allah, You are my Lord, there is no god but You. You created me and I am Your servant", ar: "اللهم أنت ربي لا إله إلا أنت خلقتني وأنا عبدك" },
  { arabic: "اللَّهُمَّ بَاعِدْ بَيْنِي وَبَيْنَ خَطَايَايَ", transliteration: "Allahumma ba'id bayni wa bayna khatayay", en: "O Allah, put a distance between me and my sins", ar: "اللهم باعد بيني وبين خطاياي" },
  { arabic: "اللَّهُمَّ اغْسِلْنِي مِنْ خَطَايَايَ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ", transliteration: "Allahummagh-silni min khatayaya", en: "O Allah, wash me from my sins with water, snow, and hail", ar: "اللهم اغسلني من خطاياي بالماء والثلج والبرد" },
  { arabic: "رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ", transliteration: "Rabbanaghfir lana wa li-ikhwanina", en: "Our Lord, forgive us and our brothers who preceded us in faith", ar: "ربنا اغفر لنا ولإخواننا الذين سبقونا بالإيمان" },
  { arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الثَّبَاتَ فِي الْأَمْرِ وَالْعَزِيمَةَ عَلَى الرُّشْدِ", transliteration: "Allahumma inni as'alukat-thabat", en: "O Allah, I ask You for steadfastness and determination in doing what is right", ar: "اللهم إني أسألك الثبات في الأمر والعزيمة على الرشد" },
  { arabic: "اللَّهُمَّ مُصَرِّفَ الْقُلُوبِ صَرِّفْ قُلُوبَنَا عَلَى طَاعَتِكَ", transliteration: "Allahumma musarrifal-qulub", en: "O Allah, Turner of hearts, turn our hearts to Your obedience", ar: "اللهم مصرف القلوب صرف قلوبنا على طاعتك" },
  { arabic: "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي", transliteration: "Rabbij'alni muqimas-salah", en: "My Lord, make me an establisher of prayer, and my descendants too", ar: "رب اجعلني مقيم الصلاة ومن ذريتي" },
];

// ============ DU'A DATA ============
const DUAA_CATEGORIES = [
  { id: "morning", icon: "🌅", nameKey: "morning", nameAr: "أذكار الصباح", items: [
    { arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ", transliteration: "Asbahna wa asbahal mulku lillah", meaning: { en: "We have reached the morning and the kingdom belongs to Allah", ar: "بدأنا الصباح والملك كله لله", ms: "Kami telah sampai ke waktu pagi dan kerajaan milik Allah", id: "Kami telah sampai pagi dan kerajaan milik Allah", fil: "Sumapit kami sa umaga at ang kaharian ay sa Allah" } },
    { arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ", transliteration: "Allahumma bika asbahna wa bika amsayna", meaning: { en: "O Allah, by You we enter the morning and by You we enter the evening", ar: "اللهم بك نبدأ صباحنا ومساءنا", ms: "Ya Allah, dengan-Mu kami masuk waktu pagi dan petang", id: "Ya Allah, dengan-Mu kami memasuki pagi dan petang", fil: "O Allah, sa Iyo kami pumapasok sa umaga at gabi" } },
  ]},
  { id: "evening", icon: "🌙", nameKey: "evening", nameAr: "أذكار المساء", items: [
    { arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ", transliteration: "Amsayna wa amsal mulku lillah", meaning: { en: "We have reached the evening and the kingdom belongs to Allah", ar: "بدأنا المساء والملك كله لله", ms: "Kami telah sampai ke waktu petang dan kerajaan milik Allah", id: "Kami telah sampai sore dan kerajaan milik Allah", fil: "Sumapit kami sa gabi at ang kaharian ay sa Allah" } },
  ]},
  { id: "travel", icon: "✈️", nameKey: "travel", nameAr: "دعاء السفر", items: [
    { arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ", transliteration: "Subhanal-ladhi sakh-khara lana hadha", meaning: { en: "Glory to Him who has subjected this to us", ar: "سبحان من سخر لنا هذا", ms: "Maha Suci Tuhan yang menundukkan ini untuk kami", id: "Maha Suci yang menundukkan ini untuk kami", fil: "Kaluwalhatian sa Kanya na nagpasakop nito sa amin" } },
  ]},
  { id: "food", icon: "🍽️", nameKey: "food", nameAr: "دعاء الطعام", items: [
    { arabic: "بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ", transliteration: "Bismillah wa 'ala barakatillah", meaning: { en: "In the name of Allah and with the blessings of Allah", ar: "بسم الله وعلى بركة الله", ms: "Dengan nama Allah dan berkat Allah", id: "Dengan nama Allah dan berkat Allah", fil: "Sa ngalan ng Allah at sa pagpapala ng Allah" } },
    { arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ", transliteration: "Alhamdulillahil-ladhi at'amana wa saqana", meaning: { en: "Praise be to Allah who fed us, gave us drink, and made us Muslims", ar: "الحمد لله الذي أطعمنا وسقانا وجعلنا مسلمين", ms: "Segala puji bagi Allah yang memberi kami makan dan minum", id: "Segala puji bagi Allah yang memberi kami makan dan minum", fil: "Papuri sa Allah na nagpakain at nagpainom sa amin" } },
  ]},
  { id: "bathroom", icon: "🚿", nameKey: "bathroom", nameAr: "دعاء الخلاء", items: [
    { arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ", transliteration: "Allahumma inni a'udhu bika minal-khubuthi wal-khaba'ith", meaning: { en: "O Allah, I seek refuge in You from evil and evil ones", ar: "اللهم إني أعوذ بك من الخبث والخبائث", ms: "Ya Allah, aku berlindung dengan-Mu dari kejahatan", id: "Ya Allah, aku berlindung kepada-Mu dari kejahatan", fil: "O Allah, nagpapakupkop ako sa Iyo mula sa kasamaan" } },
    { arabic: "غُفْرَانَكَ", transliteration: "Ghufranaka", meaning: { en: "I seek Your forgiveness (upon leaving)", ar: "أطلب مغفرتك", ms: "Aku memohon keampunan-Mu", id: "Aku memohon ampunan-Mu", fil: "Humihingi ako ng kapatawaran Mo" } },
  ]},
  { id: "sleep", icon: "😴", nameKey: "sleep", nameAr: "أذكار النوم", items: [
    { arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", transliteration: "Bismika Allahumma amutu wa ahya", meaning: { en: "In Your name, O Allah, I die and I live", ar: "باسمك اللهم أموت وأحيا", ms: "Dengan nama-Mu ya Allah aku mati dan hidup", id: "Dengan nama-Mu ya Allah aku mati dan hidup", fil: "Sa Iyong pangalan, O Allah, ako ay namamatay at nabubuhay" } },
    { arabic: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ", transliteration: "Allahumma qini 'adhabaka yawma tab'athu 'ibadak", meaning: { en: "O Allah, protect me from Your punishment on the Day of Resurrection", ar: "اللهم قني عذابك يوم تبعث عبادك", ms: "Ya Allah, lindungi aku dari azab-Mu pada hari kebangkitan", id: "Ya Allah, lindungi aku dari azab-Mu pada hari kebangkitan", fil: "O Allah, protektahan Mo ako sa parusa sa Araw ng Pagkabuhay" } },
  ]},
  { id: "happiness", icon: "😊", nameKey: "happiness", nameAr: "دعاء الفرح", items: [
    { arabic: "الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ", transliteration: "Alhamdulillahil-ladhi bini'matihi tatimmus-salihat", meaning: { en: "Praise be to Allah by whose grace good deeds are completed", ar: "الحمد لله الذي بنعمته تتم الصالحات", ms: "Segala puji bagi Allah yang dengan nikmat-Nya sempurna kebaikan", id: "Segala puji bagi Allah yang dengan nikmat-Nya kebaikan menjadi sempurna", fil: "Papuri sa Allah na sa Kanyang biyaya natutupad ang mabubuting gawa" } },
  ]},
  { id: "distress", icon: "🤲", nameKey: "distress", nameAr: "دعاء الكرب", items: [
    { arabic: "لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ", transliteration: "La ilaha illa anta subhanaka inni kuntu minaz-zalimin", meaning: { en: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers", ar: "لا إله إلا أنت سبحانك إني كنت من الظالمين", ms: "Tiada Tuhan melainkan Engkau, Maha Suci Engkau", id: "Tiada Tuhan selain Engkau, Maha Suci Engkau", fil: "Walang diyos kundi Ikaw, Maluwalhati Ka" } },
    { arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", transliteration: "HasbunAllahu wa ni'mal wakeel", meaning: { en: "Allah is sufficient for us and He is the best disposer of affairs", ar: "حسبنا الله ونعم الوكيل", ms: "Cukuplah Allah bagi kami dan Dia sebaik-baik Pelindung", id: "Cukuplah Allah bagi kami dan Dia sebaik-baik Pelindung", fil: "Sapat na sa amin ang Allah" } },
  ]},
  { id: "mosque", icon: "🕌", nameKey: "mosque", nameAr: "دعاء المسجد", items: [
    { arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", transliteration: "Allahummaf-tah li abwaba rahmatik", meaning: { en: "O Allah, open the doors of Your mercy for me", ar: "اللهم افتح لي أبواب رحمتك", ms: "Ya Allah, bukakanlah pintu-pintu rahmat-Mu untukku", id: "Ya Allah, bukakanlah pintu-pintu rahmat-Mu untukku", fil: "O Allah, buksan Mo para sa akin ang mga pintuan ng Iyong awa" } },
  ]},
];

// ============ SOUND PRESETS ============
const TAP_SOUNDS = {
  soft: { name: "Soft Click", freq: 600, dur: 0.06, type: "sine", vol: 0.1 },
  crisp: { name: "Crisp Tap", freq: 900, dur: 0.04, type: "square", vol: 0.08 },
  deep: { name: "Deep Bead", freq: 200, dur: 0.12, type: "sine", vol: 0.15 },
  water: { name: "Water Drop", freq: 1200, dur: 0.08, type: "sine", vol: 0.1 },
  gentle: { name: "Gentle Touch", freq: 440, dur: 0.1, type: "triangle", vol: 0.12 },
  none: { name: "Silent", freq: 0, dur: 0, type: "sine", vol: 0 },
};
const COMPLETION_SOUNDS = {
  chime: { name: "Chime", notes: [523.25, 659.25, 783.99], type: "sine" },
  bell: { name: "Bell", notes: [440, 554.37, 659.25], type: "triangle" },
  gong: { name: "Gong", notes: [130.81, 164.81], type: "sine" },
  ascend: { name: "Ascending", notes: [392, 493.88, 587.33, 698.46], type: "sine" },
  none: { name: "Silent", notes: [], type: "sine" },
};
const VOICE_OPTIONS = {
  arabic: { name: "Arabic Voice", lang: "ar-SA", rate: 0.75, pitch: 0.9 },
  slow: { name: "Arabic (Slow)", lang: "ar-SA", rate: 0.55, pitch: 0.85 },
  none: { name: "No Voice", lang: "", rate: 0, pitch: 0 },
};

// ============ SOUND ENGINE ============
function createSoundEngine(tapKey, compKey, voiceKey) {
  let ctx = null;
  const getCtx = () => {
    if (!ctx) try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    return ctx;
  };
  return {
    tap() {
      const preset = TAP_SOUNDS[tapKey] || TAP_SOUNDS.soft;
      if (!preset.freq) return;
      const c = getCtx(); if (!c) return;
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = preset.type;
      o.frequency.setValueAtTime(preset.freq, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(Math.max(preset.freq * 0.5, 20), c.currentTime + preset.dur);
      g.gain.setValueAtTime(preset.vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + preset.dur + 0.02);
      o.start(c.currentTime); o.stop(c.currentTime + preset.dur + 0.03);
    },
    complete() {
      const preset = COMPLETION_SOUNDS[compKey] || COMPLETION_SOUNDS.chime;
      if (!preset.notes.length) return;
      const c = getCtx(); if (!c) return;
      preset.notes.forEach((freq, i) => {
        const o = c.createOscillator(); const g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = preset.type;
        o.frequency.setValueAtTime(freq, c.currentTime + i * 0.15);
        g.gain.setValueAtTime(0.12, c.currentTime + i * 0.15);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.15 + 0.4);
        o.start(c.currentTime + i * 0.15); o.stop(c.currentTime + i * 0.15 + 0.4);
      });
    },
    speak(text) {
      const preset = VOICE_OPTIONS[voiceKey] || VOICE_OPTIONS.arabic;
      if (!preset.lang) return;
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = preset.lang; u.rate = preset.rate; u.pitch = preset.pitch;
        speechSynthesis.cancel(); speechSynthesis.speak(u);
      } catch(e) {}
    },
    preview(type, key) {
      if (type === "tap") {
        const preset = TAP_SOUNDS[key]; if (!preset?.freq) return;
        const c = getCtx(); if (!c) return;
        const o = c.createOscillator(); const g = c.createGain();
        o.connect(g); g.connect(c.destination); o.type = preset.type;
        o.frequency.setValueAtTime(preset.freq, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(Math.max(preset.freq * 0.5, 20), c.currentTime + preset.dur);
        g.gain.setValueAtTime(preset.vol, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + preset.dur + 0.02);
        o.start(c.currentTime); o.stop(c.currentTime + preset.dur + 0.03);
      } else if (type === "comp") {
        const preset = COMPLETION_SOUNDS[key]; if (!preset?.notes?.length) return;
        const c = getCtx(); if (!c) return;
        preset.notes.forEach((freq, i) => {
          const o = c.createOscillator(); const g = c.createGain();
          o.connect(g); g.connect(c.destination); o.type = preset.type;
          o.frequency.setValueAtTime(freq, c.currentTime + i * 0.15);
          g.gain.setValueAtTime(0.12, c.currentTime + i * 0.15);
          g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.15 + 0.4);
          o.start(c.currentTime + i * 0.15); o.stop(c.currentTime + i * 0.15 + 0.4);
        });
      }
    }
  };
}

// ============ LOCAL STORAGE ============
const STORAGE_KEY = "tasbeeh_data";
function loadData() { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch(e) { return null; } }
function saveData(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch(e) {} }

// Get dhikr of the day based on date
function getDailyDhikr() {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  return DAILY_DHIKR_DB[dayOfYear % DAILY_DHIKR_DB.length];
}

// ============ MAIN APP ============
export default function TasbeehApp() {
  const saved = useMemo(() => loadData(), []);
  const [lang, setLang] = useState(saved?.lang || "en");
  const [screen, setScreen] = useState("counter");
  const [currentDhikr, setCurrentDhikr] = useState(0);
  const [count, setCount] = useState(0);
  const [totalToday, setTotalToday] = useState(saved?.totalToday || 0);
  const [completedCycles, setCompletedCycles] = useState(saved?.completedCycles || 0);
  const [allTimeDhikr, setAllTimeDhikr] = useState(saved?.allTimeDhikr || 0);
  const [weeklyData, setWeeklyData] = useState(saved?.weeklyData || {});
  const [bestDayCount, setBestDayCount] = useState(saved?.bestDayCount || 0);
  const [bestDayLabel, setBestDayLabel] = useState(saved?.bestDayLabel || "");
  const [streakDays, setStreakDays] = useState(saved?.streakDays || 0);
  const [firstUseDate, setFirstUseDate] = useState(saved?.firstUseDate || new Date().toISOString());
  const [isMuted, setIsMuted] = useState(false);
  const [ripples, setRipples] = useState([]);
  const [showTransition, setShowTransition] = useState(false);
  const [leaderboardMode, setLeaderboardMode] = useState("percentage");
  const [selectedDuaaCategory, setSelectedDuaaCategory] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(saved?.isLoggedIn || false);
  const [pulseAnim, setPulseAnim] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tapSound, setTapSound] = useState(saved?.tapSound || "soft");
  const [compSound, setCompSound] = useState(saved?.compSound || "chime");
  const [voiceOpt, setVoiceOpt] = useState(saved?.voiceOpt || "arabic");
  const rippleId = useRef(0);
  const soundRef = useRef(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isRTL = lang === "ar";
  const dailyDhikr = useMemo(() => getDailyDhikr(), []);

  useEffect(() => { soundRef.current = createSoundEngine(tapSound, compSound, voiceOpt); }, [tapSound, compSound, voiceOpt]);

  // Persist
  useEffect(() => {
    saveData({ totalToday, completedCycles, lang, isLoggedIn, lastDate: new Date().toDateString(), tapSound, compSound, voiceOpt, allTimeDhikr, weeklyData, bestDayCount, bestDayLabel, streakDays, firstUseDate });
  }, [totalToday, completedCycles, lang, isLoggedIn, tapSound, compSound, voiceOpt, allTimeDhikr, weeklyData, bestDayCount, bestDayLabel, streakDays, firstUseDate]);

  // Daily reset
  useEffect(() => {
    const s = loadData();
    if (s && s.lastDate !== new Date().toDateString()) {
      // Save yesterday's data to weekly before reset
      if (s.totalToday > 0) {
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const key = yesterday.toISOString().slice(0, 10);
        setWeeklyData(prev => ({ ...prev, [key]: s.totalToday }));
      }
      setTotalToday(0); setCompletedCycles(0);
    }
  }, []);

  // Track best day and streak
  useEffect(() => {
    if (totalToday > bestDayCount) {
      setBestDayCount(totalToday);
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      setBestDayLabel(dayNames[new Date().getDay()]);
    }
  }, [totalToday, bestDayCount]);

  const dhikr = DHIKR_SEQUENCE[currentDhikr];
  const progress = count / dhikr.target;

  const handleTap = useCallback((e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const cX = e.clientX ?? e.touches?.[0]?.clientX ?? rect.width / 2 + rect.left;
    const cY = e.clientY ?? e.touches?.[0]?.clientY ?? rect.height / 2 + rect.top;
    const id = rippleId.current++;
    setRipples(prev => [...prev, { id, x: cX - rect.left, y: cY - rect.top }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
    setPulseAnim(true); setTimeout(() => setPulseAnim(false), 150);

    if (!isMuted && soundRef.current) soundRef.current.tap();
    const nc = count + 1;
    setTotalToday(prev => prev + 1);
    setAllTimeDhikr(prev => prev + 1);

    if (nc >= dhikr.target) {
      setCount(0);
      if (!isMuted && soundRef.current) soundRef.current.complete();
      if (currentDhikr < DHIKR_SEQUENCE.length - 1) {
        setShowTransition(true);
        setTimeout(() => { setCurrentDhikr(p => p + 1); if (!isMuted && soundRef.current) soundRef.current.speak(DHIKR_SEQUENCE[currentDhikr + 1].arabic); setShowTransition(false); }, 900);
      } else {
        setCompletedCycles(p => p + 1); setCurrentDhikr(0); setShowTransition(true);
        setTimeout(() => { if (!isMuted && soundRef.current) soundRef.current.speak(DHIKR_SEQUENCE[0].arabic); setShowTransition(false); }, 900);
      }
    } else { setCount(nc); }
  }, [count, currentDhikr, dhikr, isMuted]);

  const resetCounter = () => { setCount(0); setCurrentDhikr(0); };

  // Build real weekly chart from tracked data
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      days.push({ day: labels[d.getDay()], count: i === 0 ? totalToday : (weeklyData[key] || 0), isToday: i === 0 });
    }
    return days;
  }, [weeklyData, totalToday]);

  // Calculate this month total from weekly data + today
  const monthTotal = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    let total = totalToday;
    Object.entries(weeklyData).forEach(([k, v]) => { if (k.startsWith(monthKey)) total += v; });
    return total;
  }, [weeklyData, totalToday]);

  const S = {
    card: { padding: 20, borderRadius: 20, background: "rgba(196,164,106,0.04)", border: "1px solid rgba(196,164,106,0.1)" },
    gold: { color: "#c4a46a" }, muted: { color: "#6a7a6a" }, dim: { color: "#5a6a5a" },
    out: { fontFamily: "'Outfit', sans-serif" }, ami: { fontFamily: "'Amiri', 'Noto Sans Arabic', serif" },
  };

  // ============ RENDER ============
  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{
      fontFamily: "'Amiri', 'Noto Sans Arabic', serif",
      background: "linear-gradient(165deg, #0a1a15 0%, #0d2818 30%, #132e1f 60%, #0a1a15 100%)",
      color: "#e8e0d0", minHeight: "100vh", maxWidth: 430, margin: "0 auto",
      position: "relative", overflow: "hidden", userSelect: "none", WebkitUserSelect: "none",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Outfit:wght@300;400;500;600;700&family=Noto+Sans+Arabic:wght@400;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes rippleOut { 0% { transform: scale(0); opacity: 0.5; } 100% { transform: scale(4); opacity: 0; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(${isRTL?"-":""}30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.015); } }
        @keyframes starPulse { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.6; } }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 0; }
        .geo-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%23c4a46a' stroke-width='0.3' opacity='0.06'/%3E%3C/svg%3E"); }
      `}</style>
      <div className="geo-bg" />
      {[...Array(10)].map((_, i) => <div key={i} style={{ position: "absolute", width: 2, height: 2, background: "#c4a46a", borderRadius: "50%", left: `${10+Math.random()*80}%`, top: `${5+Math.random()*90}%`, animation: `starPulse ${2+Math.random()*3}s ease-in-out infinite`, animationDelay: `${Math.random()*2}s` }} />)}

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* HEADER */}
        <div style={{ padding: "14px 20px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ ...S.ami, fontSize: 26, fontWeight: 700, margin: 0, ...S.gold, textShadow: "0 0 30px rgba(196,164,106,0.3)" }}>{t.appName}</h1>
            <p style={{ ...S.out, fontSize: 10, ...S.muted, margin: 0, letterSpacing: 2, textTransform: "uppercase" }}>{t.appSub}</p>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={() => setShowLangPicker(!showLangPicker)} style={{ background: "rgba(196,164,106,0.1)", border: "1px solid rgba(196,164,106,0.2)", borderRadius: 8, padding: "5px 8px", cursor: "pointer", ...S.gold, ...S.out, fontSize: 11 }}>{LANG_LABELS[lang].slice(0, 3)}</button>
            <button onClick={() => setShowSettings(!showSettings)} style={{ background: "rgba(196,164,106,0.1)", border: "1px solid rgba(196,164,106,0.2)", borderRadius: 8, padding: "5px 8px", cursor: "pointer", fontSize: 14 }}>⚙️</button>
            <button onClick={() => { setIsMuted(!isMuted); }} style={{ background: "rgba(196,164,106,0.1)", border: "1px solid rgba(196,164,106,0.2)", borderRadius: 8, padding: "5px 8px", cursor: "pointer", fontSize: 14 }}>{isMuted ? "🔇" : "🔊"}</button>
            {!isLoggedIn ? (
              <button onClick={() => setIsLoggedIn(true)} style={{ background: "linear-gradient(135deg, #c4a46a, #a08040)", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", color: "#0a1a15", ...S.out, fontSize: 10, fontWeight: 600 }}>{t.signIn}</button>
            ) : (
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #c4a46a, #a08040)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#0a1a15", fontWeight: 700 }}>S</div>
            )}
          </div>
        </div>

        {/* LANG PICKER */}
        {showLangPicker && (
          <div style={{ position: "absolute", top: 52, [isRTL?"left":"right"]: 60, zIndex: 99, ...S.card, background: "#132e1f", padding: 6, minWidth: 150, animation: "fadeInUp 0.2s ease" }}>
            {Object.entries(LANG_LABELS).map(([code, label]) => (
              <button key={code} onClick={() => { setLang(code); setShowLangPicker(false); }} style={{ display: "block", width: "100%", padding: "8px 12px", background: lang === code ? "rgba(196,164,106,0.12)" : "transparent", border: "none", borderRadius: 8, cursor: "pointer", color: lang === code ? "#c4a46a" : "#e8e0d0", ...S.out, fontSize: 12, fontWeight: lang === code ? 600 : 400, textAlign: isRTL ? "right" : "left" }}>{label}</button>
            ))}
          </div>
        )}

        {/* SETTINGS PANEL */}
        {showSettings && (
          <div style={{ margin: "0 20px 12px", ...S.card, padding: 18, animation: "fadeInUp 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ ...S.out, fontSize: 14, fontWeight: 600, ...S.gold }}>{t.soundSettings}</span>
              <button onClick={() => setShowSettings(false)} style={{ background: "none", border: "none", ...S.muted, fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            {/* Tap sound */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ ...S.out, fontSize: 11, ...S.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1.5 }}>{t.tapSound}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {Object.entries(TAP_SOUNDS).map(([key, val]) => (
                  <button key={key} onClick={() => { setTapSound(key); if (soundRef.current) soundRef.current.preview("tap", key); }} style={{ padding: "5px 10px", borderRadius: 8, border: tapSound === key ? "1px solid #c4a46a" : "1px solid rgba(196,164,106,0.15)", background: tapSound === key ? "rgba(196,164,106,0.12)" : "transparent", color: tapSound === key ? "#c4a46a" : "#8a9a8a", ...S.out, fontSize: 10, cursor: "pointer" }}>{val.name}</button>
                ))}
              </div>
            </div>
            {/* Completion sound */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ ...S.out, fontSize: 11, ...S.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1.5 }}>{t.completionSound}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {Object.entries(COMPLETION_SOUNDS).map(([key, val]) => (
                  <button key={key} onClick={() => { setCompSound(key); if (soundRef.current) soundRef.current.preview("comp", key); }} style={{ padding: "5px 10px", borderRadius: 8, border: compSound === key ? "1px solid #c4a46a" : "1px solid rgba(196,164,106,0.15)", background: compSound === key ? "rgba(196,164,106,0.12)" : "transparent", color: compSound === key ? "#c4a46a" : "#8a9a8a", ...S.out, fontSize: 10, cursor: "pointer" }}>{val.name}</button>
                ))}
              </div>
            </div>
            {/* Voice */}
            <div>
              <div style={{ ...S.out, fontSize: 11, ...S.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1.5 }}>{t.voiceStyle}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {Object.entries(VOICE_OPTIONS).map(([key, val]) => (
                  <button key={key} onClick={() => setVoiceOpt(key)} style={{ padding: "5px 10px", borderRadius: 8, border: voiceOpt === key ? "1px solid #c4a46a" : "1px solid rgba(196,164,106,0.15)", background: voiceOpt === key ? "rgba(196,164,106,0.12)" : "transparent", color: voiceOpt === key ? "#c4a46a" : "#8a9a8a", ...S.out, fontSize: 10, cursor: "pointer" }}>{val.name}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NAV */}
        <div style={{ display: "flex", gap: 4, padding: "4px 20px 12px" }}>
          {[{ id: "counter", label: t.navCounter, icon: "📿" }, { id: "duaa", label: t.navDua, icon: "🤲" }, { id: "stats", label: t.navStats, icon: "📊" }, { id: "ranking", label: t.navRanking, icon: "🏆" }].map(tab => (
            <button key={tab.id} onClick={() => { setScreen(tab.id); setSelectedDuaaCategory(null); setShowSettings(false); setShowLangPicker(false); }} style={{
              flex: 1, padding: "10px 4px", border: "none", borderRadius: 12, cursor: "pointer",
              background: screen === tab.id ? "rgba(196,164,106,0.15)" : "transparent",
              color: screen === tab.id ? "#c4a46a" : "#5a6a5a",
              ...S.out, fontSize: 10, fontWeight: screen === tab.id ? 600 : 400,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.3s",
            }}><span style={{ fontSize: 18 }}>{tab.icon}</span>{tab.label}</button>
          ))}
        </div>

        {/* ══════ COUNTER ══════ */}
        {screen === "counter" && (
          <div style={{ padding: "0 20px 16px", animation: "fadeInUp 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18 }}>
              {DHIKR_SEQUENCE.map((_, i) => (
                <div key={i} style={{ width: i === currentDhikr ? 28 : 10, height: 10, borderRadius: 5, background: i < currentDhikr ? "#c4a46a" : i === currentDhikr ? "linear-gradient(90deg, #c4a46a, #e0c88a)" : "rgba(196,164,106,0.15)", transition: "all 0.4s", boxShadow: i === currentDhikr ? "0 0 12px rgba(196,164,106,0.4)" : "none" }} />
              ))}
            </div>
            <div onClick={handleTap} onTouchStart={handleTap} style={{
              position: "relative", width: "100%", aspectRatio: "1", maxWidth: 280, margin: "0 auto",
              borderRadius: "50%", background: "radial-gradient(circle at 40% 35%, rgba(196,164,106,0.08) 0%, rgba(10,26,21,0.95) 70%)",
              border: "2px solid rgba(196,164,106,0.2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              cursor: "pointer", animation: pulseAnim ? "none" : "breathe 4s ease-in-out infinite",
              transform: pulseAnim ? "scale(0.96)" : undefined, transition: "transform 0.1s ease",
              boxShadow: "0 0 40px rgba(196,164,106,0.1), inset 0 0 60px rgba(0,0,0,0.3)", overflow: "hidden", touchAction: "manipulation",
            }}>
              {ripples.map(r => <div key={r.id} style={{ position: "absolute", left: r.x - 20, top: r.y - 20, width: 40, height: 40, borderRadius: "50%", background: "radial-gradient(circle, rgba(196,164,106,0.4), transparent)", animation: "rippleOut 0.7s ease-out forwards", pointerEvents: "none" }} />)}
              {showTransition ? (
                <div style={{ animation: "fadeInUp 0.5s ease", textAlign: "center", padding: 20 }}>
                  <div style={{ fontSize: 15, ...S.gold, ...S.out, fontWeight: 300, marginBottom: 6 }}>{t.completed}</div>
                  <div style={{ fontSize: 12, ...S.muted, ...S.out }}>{t.nextLoading}</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 34, ...S.ami, fontWeight: 700, color: "#e8e0d0", textAlign: "center", lineHeight: 1.3, textShadow: "0 2px 20px rgba(196,164,106,0.2)", marginBottom: 4, padding: "0 14px" }}>{dhikr.arabic}</div>
                  <div style={{ fontSize: 12, ...S.out, ...S.gold, fontWeight: 500, letterSpacing: 1, marginBottom: 2 }}>{dhikr.transliteration}</div>
                  <div style={{ fontSize: 9, ...S.out, ...S.muted, fontWeight: 300, marginBottom: 12, padding: "0 16px", textAlign: "center" }}>{dhikr.meaning[lang] || dhikr.meaning.en}</div>
                  <div style={{ fontSize: 50, ...S.out, fontWeight: 700, ...S.gold, textShadow: "0 0 30px rgba(196,164,106,0.3)", lineHeight: 1 }}>{count}</div>
                  <div style={{ fontSize: 11, ...S.out, ...S.dim, marginTop: 2 }}>{t.of} {dhikr.target}</div>
                </>
              )}
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                <circle cx="50%" cy="50%" r="48%" fill="none" stroke="rgba(196,164,106,0.08)" strokeWidth="3" />
                <circle cx="50%" cy="50%" r="48%" fill="none" stroke="#c4a46a" strokeWidth="3" strokeDasharray={`${progress * 2 * Math.PI * 134} ${2 * Math.PI * 134}`} strokeLinecap="round" transform="rotate(-90, 140, 140)" style={{ transition: "stroke-dasharray 0.3s ease", filter: "drop-shadow(0 0 6px rgba(196,164,106,0.4))" }} />
              </svg>
            </div>
            <p style={{ textAlign: "center", ...S.out, fontSize: 10, ...S.dim, marginTop: 12, fontWeight: 300 }}>{t.tapHint}</p>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              {[{ label: t.today, value: totalToday }, { label: t.cycles, value: completedCycles }, { label: t.current, value: `${currentDhikr + 1}/4` }].map((s, i) => (
                <div key={i} style={{ flex: 1, padding: "10px 4px", borderRadius: 12, background: "rgba(196,164,106,0.05)", border: "1px solid rgba(196,164,106,0.1)", textAlign: "center" }}>
                  <div style={{ ...S.out, fontSize: 18, fontWeight: 700, ...S.gold }}>{s.value}</div>
                  <div style={{ ...S.out, fontSize: 8, ...S.muted, textTransform: "uppercase", letterSpacing: 1.5, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={resetCounter} style={{ width: "100%", marginTop: 12, padding: 10, borderRadius: 10, background: "none", border: "1px solid rgba(196,164,106,0.1)", ...S.muted, ...S.out, fontSize: 11, cursor: "pointer" }}>{t.reset}</button>
          </div>
        )}

        {/* ══════ DU'A ══════ */}
        {screen === "duaa" && (
          <div style={{ padding: "0 20px 16px", animation: "fadeInUp 0.4s ease" }}>
            {!selectedDuaaCategory ? (
              <>
                <h2 style={{ ...S.ami, fontSize: 26, ...S.gold, margin: "0 0 4px", textAlign: "center" }}>{lang === "ar" ? "الأدعية" : t.duaTitle}</h2>
                <p style={{ ...S.out, fontSize: 11, ...S.muted, textAlign: "center", marginBottom: 18 }}>{t.duaSub}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {DUAA_CATEGORIES.map((cat, i) => (
                    <button key={cat.id} onClick={() => setSelectedDuaaCategory(cat)} style={{ padding: 14, borderRadius: 16, background: "rgba(196,164,106,0.05)", border: "1px solid rgba(196,164,106,0.12)", cursor: "pointer", textAlign: "center", animation: `slideIn 0.3s ease ${i * 0.04}s both` }}>
                      <div style={{ fontSize: 24, marginBottom: 5 }}>{cat.icon}</div>
                      <div style={{ ...S.ami, fontSize: 13, ...S.gold, marginBottom: 2 }}>{cat.nameAr}</div>
                      <div style={{ ...S.out, fontSize: 9, ...S.muted }}>{t[cat.nameKey]}</div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <button onClick={() => setSelectedDuaaCategory(null)} style={{ background: "none", border: "none", ...S.gold, ...S.out, fontSize: 11, cursor: "pointer", marginBottom: 12, padding: 0 }}>{t.backToAll}</button>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 30 }}>{selectedDuaaCategory.icon}</span>
                  <h2 style={{ ...S.ami, fontSize: 20, ...S.gold, margin: "6px 0 2px" }}>{selectedDuaaCategory.nameAr}</h2>
                  <p style={{ ...S.out, fontSize: 11, ...S.muted }}>{t[selectedDuaaCategory.nameKey]}</p>
                </div>
                {selectedDuaaCategory.items.map((item, i) => (
                  <div key={i} style={{ ...S.card, padding: 16, marginBottom: 10, animation: `fadeInUp 0.4s ease ${i * 0.1}s both` }}>
                    <div style={{ ...S.ami, fontSize: 20, color: "#e8e0d0", textAlign: "center", lineHeight: 1.8, marginBottom: 8, direction: "rtl" }}>{item.arabic}</div>
                    <div style={{ ...S.out, fontSize: 11, ...S.gold, textAlign: "center", fontWeight: 500, marginBottom: 3 }}>{item.transliteration}</div>
                    <div style={{ ...S.out, fontSize: 10, ...S.muted, textAlign: "center", fontStyle: "italic" }}>{item.meaning[lang] || item.meaning.en}</div>
                    <button onClick={() => { if (!isMuted && soundRef.current) soundRef.current.speak(item.arabic); }} style={{ display: "block", margin: "8px auto 0", padding: "4px 16px", borderRadius: 16, background: "rgba(196,164,106,0.1)", border: "1px solid rgba(196,164,106,0.2)", ...S.gold, ...S.out, fontSize: 10, cursor: "pointer" }}>{t.listen}</button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ══════ STATS (REAL DATA ONLY) ══════ */}
        {screen === "stats" && (
          <div style={{ padding: "0 20px 16px", animation: "fadeInUp 0.4s ease" }}>
            <h2 style={{ ...S.ami, fontSize: 26, ...S.gold, margin: "0 0 4px", textAlign: "center" }}>{lang === "ar" ? "إحصائيات" : t.statsTitle}</h2>
            <p style={{ ...S.out, fontSize: 11, ...S.muted, textAlign: "center", marginBottom: 18 }}>{t.statsSub}</p>
            {!isLoggedIn ? (
              <div style={{ ...S.card, padding: 28, textAlign: "center", borderColor: "rgba(196,164,106,0.15)" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🔐</div>
                <h3 style={{ ...S.out, ...S.gold, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{t.signInUnlock}</h3>
                <p style={{ ...S.out, ...S.muted, fontSize: 11, marginBottom: 18, lineHeight: 1.6 }}>{t.signInDesc}</p>
                <button onClick={() => setIsLoggedIn(true)} style={{ padding: "10px 24px", borderRadius: 12, background: "linear-gradient(135deg, #c4a46a, #a08040)", border: "none", color: "#0a1a15", ...S.out, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t.signInFree}</button>
              </div>
            ) : (
              <>
                <div style={{ ...S.card, padding: 20, marginBottom: 12, textAlign: "center", background: "linear-gradient(135deg, rgba(196,164,106,0.1), rgba(196,164,106,0.03))", borderColor: "rgba(196,164,106,0.15)" }}>
                  <div style={{ ...S.out, fontSize: 8, ...S.muted, textTransform: "uppercase", letterSpacing: 2 }}>{t.today}</div>
                  <div style={{ ...S.out, fontSize: 40, fontWeight: 700, ...S.gold, lineHeight: 1.1, margin: "4px 0" }}>{totalToday}</div>
                  <div style={{ ...S.out, fontSize: 10, ...S.muted }}>{t.dhikrCounted}</div>
                </div>
                <div style={{ ...S.card, padding: 16, marginBottom: 12 }}>
                  <div style={{ ...S.out, fontSize: 11, ...S.gold, fontWeight: 600, marginBottom: 12 }}>{t.thisWeek}</div>
                  {weekDays.every(d => d.count === 0) ? (
                    <div style={{ textAlign: "center", padding: "16px 0" }}>
                      <div style={{ ...S.out, fontSize: 11, ...S.dim }}>{t.noDays}</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 90 }}>
                      {weekDays.map((d, i) => {
                        const max = Math.max(...weekDays.map(w => w.count), 1);
                        const h = (d.count / max) * 100;
                        return (
                          <div key={i} style={{ flex: 1, textAlign: "center" }}>
                            <div style={{ ...S.out, fontSize: 8, ...S.gold, marginBottom: 3 }}>{d.count > 0 ? d.count : ""}</div>
                            <div style={{ height: Math.max(h, 3), borderRadius: 4, background: d.isToday ? "linear-gradient(180deg, #c4a46a, #a08040)" : d.count > 0 ? "rgba(196,164,106,0.25)" : "rgba(196,164,106,0.08)", boxShadow: d.isToday ? "0 0 8px rgba(196,164,106,0.3)" : "none", marginBottom: 4, transition: "height 0.5s" }} />
                            <div style={{ ...S.out, fontSize: 8, color: d.isToday ? "#c4a46a" : "#5a6a5a", fontWeight: d.isToday ? 600 : 400 }}>{d.day}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: t.thisMonth, value: monthTotal.toLocaleString() },
                    { label: t.streak, value: `${streakDays} ${t.days}` },
                    { label: t.bestDay, value: bestDayCount.toLocaleString(), sub: bestDayLabel || "—" },
                    { label: t.totalAll, value: allTimeDhikr.toLocaleString(), sub: t.sinceJoining },
                  ].map((s, i) => (
                    <div key={i} style={{ ...S.card, padding: 12, animation: `slideIn 0.3s ease ${i * 0.04}s both` }}>
                      <div style={{ ...S.out, fontSize: 8, ...S.muted, textTransform: "uppercase", letterSpacing: 1.5 }}>{s.label}</div>
                      <div style={{ ...S.out, fontSize: 18, fontWeight: 700, ...S.gold, margin: "3px 0" }}>{s.value}</div>
                      {s.sub && <div style={{ ...S.out, fontSize: 8, ...S.dim }}>{s.sub}</div>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════ RANKING (HONEST — needs backend) ══════ */}
        {screen === "ranking" && (
          <div style={{ padding: "0 20px 16px", animation: "fadeInUp 0.4s ease" }}>
            <h2 style={{ ...S.ami, fontSize: 26, ...S.gold, margin: "0 0 4px", textAlign: "center" }}>{lang === "ar" ? "المنافسة" : t.rankTitle}</h2>
            <p style={{ ...S.out, fontSize: 11, ...S.muted, textAlign: "center", marginBottom: 14 }}>{t.rankSub}</p>
            <div style={{ display: "flex", gap: 3, padding: 3, borderRadius: 10, background: "rgba(196,164,106,0.05)", marginBottom: 16 }}>
              {[{ id: "numbers", label: t.rankNum }, { id: "percentage", label: t.rankPct }, { id: "friends", label: t.rankFriends }, { id: "off", label: t.rankOff }].map(mode => (
                <button key={mode.id} onClick={() => setLeaderboardMode(mode.id)} style={{ flex: 1, padding: "6px 3px", borderRadius: 8, border: "none", cursor: "pointer", background: leaderboardMode === mode.id ? "rgba(196,164,106,0.15)" : "transparent", color: leaderboardMode === mode.id ? "#c4a46a" : "#5a6a5a", ...S.out, fontSize: 10, fontWeight: leaderboardMode === mode.id ? 600 : 400 }}>{mode.label}</button>
              ))}
            </div>
            {leaderboardMode === "off" ? (
              <div style={{ ...S.card, padding: 32, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🤫</div>
                <p style={{ ...S.out, ...S.muted, fontSize: 12, lineHeight: 1.6 }}>{t.rankOffMsg}</p>
              </div>
            ) : (
              <div style={{ ...S.card, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🏆</div>
                <div style={{ ...S.out, fontSize: 13, color: "#b0a890", lineHeight: 1.7, maxWidth: 280, margin: "0 auto" }}>
                  {t.rankNoData}
                </div>
                <div style={{ ...S.card, marginTop: 16, padding: 14, background: "rgba(196,164,106,0.06)" }}>
                  <div style={{ ...S.out, fontSize: 9, ...S.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>{t.today}</div>
                  <div style={{ ...S.out, fontSize: 28, fontWeight: 700, ...S.gold }}>{totalToday}</div>
                  <div style={{ ...S.out, fontSize: 9, ...S.muted }}>{t.dhikrCounted}</div>
                </div>
                <p style={{ ...S.out, fontSize: 10, ...S.dim, marginTop: 12, fontStyle: "italic" }}>{t.rankKeep}</p>
              </div>
            )}
          </div>
        )}

        {/* DHIKR OF THE DAY — from 50+ database, rotates daily */}
        <div style={{ margin: "0 20px 12px", ...S.card, padding: 16, textAlign: "center" }}>
          <div style={{ ...S.out, fontSize: 8, ...S.muted, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>{t.dhikrOfDay}</div>
          <div style={{ ...S.ami, fontSize: 18, color: "#e8e0d0", lineHeight: 1.8, direction: "rtl", marginBottom: 5 }}>{dailyDhikr.arabic}</div>
          <div style={{ ...S.out, fontSize: 10, ...S.gold, fontWeight: 500 }}>{dailyDhikr.transliteration}</div>
          <div style={{ ...S.out, fontSize: 9, ...S.muted, fontStyle: "italic", marginTop: 3 }}>{lang === "ar" ? dailyDhikr.ar : dailyDhikr.en}</div>
        </div>

        {/* PERSISTENT SUPPORT STRIP */}
        <div style={{ margin: "0 20px 10px", padding: "14px 16px", borderRadius: 16, background: "linear-gradient(135deg, rgba(196,164,106,0.06), rgba(196,164,106,0.02))", border: "1px solid rgba(196,164,106,0.1)", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>💛</span>
            <span style={{ ...S.out, fontSize: 11, ...S.gold, fontWeight: 600 }}>{t.supportBtn}</span>
          </div>
          <p style={{ ...S.out, fontSize: 10, color: "#9a9580", lineHeight: 1.6, marginBottom: 12, maxWidth: 300, marginLeft: "auto", marginRight: "auto" }}>{t.supportMsg}</p>
          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {[
              { amount: "$2.99", label: "☕" },
              { amount: "$4.99", label: "🌟" },
              { amount: "$9.99", label: "💎" },
            ].map(tier => (
              <button key={tier.amount} style={{
                padding: "6px 14px", borderRadius: 10,
                background: tier.amount === "$4.99" ? "linear-gradient(135deg, #c4a46a, #a08040)" : "rgba(196,164,106,0.08)",
                border: tier.amount === "$4.99" ? "none" : "1px solid rgba(196,164,106,0.18)",
                color: tier.amount === "$4.99" ? "#0a1a15" : "#c4a46a",
                ...S.out, fontSize: 11, fontWeight: 600, cursor: "pointer",
                boxShadow: tier.amount === "$4.99" ? "0 2px 12px rgba(196,164,106,0.25)" : "none",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <span style={{ fontSize: 13 }}>{tier.label}</span>
                <span>{tier.amount}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "6px 20px 20px", ...S.out, fontSize: 8, color: "#2a3a2a", letterSpacing: 1 }}>TASBEEH v1.0</div>
      </div>
    </div>
  );
}
