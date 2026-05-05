import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DUAA_CATEGORIES, TRANSLATIONS } from '@/constants/data';
import { speakText, resumeAudioContext, VOICE_OPTIONS } from '@/lib/sound';
import { useLang } from '@/lib/lang';

const GOLD = '#c4a46a';
const MUTED = '#6a7a6a';
const DIM = '#4a5a4a';
const BG_CARD = 'rgba(196,164,106,0.05)';
const BORDER = 'rgba(196,164,106,0.12)';

export default function DuaScreen() {
  const { lang, setLang } = useLang();
  const [selectedCategory, setSelectedCategory] = useState<typeof DUAA_CATEGORIES[0] | null>(null);
  const [voiceOpt, setVoiceOpt] = useState('arabic');
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [voicesReady, setVoicesReady] = useState(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isRTL = lang === 'ar';

  // Wait for browser voices to load (needed for TTS to work)
  useEffect(() => {
    if (Platform.OS !== 'web') { setVoicesReady(true); return; }
    function checkVoices() {
      const voices = window.speechSynthesis?.getVoices() ?? [];
      if (voices.length > 0) {
        setVoicesReady(true);
      }
    }
    checkVoices();
    window.speechSynthesis?.addEventListener?.('voiceschanged', checkVoices);
    // Fallback: mark ready after short delay regardless
    const timer = setTimeout(() => setVoicesReady(true), 1500);
    return () => {
      window.speechSynthesis?.removeEventListener?.('voiceschanged', checkVoices);
      clearTimeout(timer);
    };
  }, []);

  function handleListen(arabic: string, idx: number) {
    resumeAudioContext();
    setSpeakingIdx(idx);

    if (Platform.OS === 'web' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const preset = VOICE_OPTIONS[voiceOpt];
      if (!preset?.lang) { setSpeakingIdx(null); return; }

      const utter = new SpeechSynthesisUtterance(arabic);
      utter.lang = preset.lang;
      utter.rate = preset.rate;
      utter.pitch = preset.pitch;

      // Try to select an Arabic voice
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
      if (arabicVoice) utter.voice = arabicVoice;

      utter.onend = () => setSpeakingIdx(null);
      utter.onerror = () => setSpeakingIdx(null);
      window.speechSynthesis.speak(utter);
    } else {
      speakText(arabic, voiceOpt);
      setTimeout(() => setSpeakingIdx(null), 3000);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a1a15', '#0d2818', '#132e1f']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[styles.header, isRTL && styles.rowReverse]}>
          <View>
            <Text style={styles.screenTitle}>{t.duaTitle}</Text>
            <Text style={styles.screenSub}>{t.duaSub}</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable onPress={() => setLang(lang === 'en' ? 'ar' : 'en')} style={styles.langToggle}>
              <Text style={styles.langToggleText}>{lang === 'en' ? 'عر' : 'EN'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Voice selector */}
        <View style={styles.voiceRow}>
          <Text style={styles.voiceLabel}>{t.voiceStyle}:</Text>
          {Object.entries(VOICE_OPTIONS).map(([key, val]) => (
            <Pressable key={key} onPress={() => setVoiceOpt(key)} style={[styles.voiceChip, voiceOpt === key && styles.voiceChipActive]}>
              <Text style={[styles.voiceChipText, voiceOpt === key && styles.voiceChipTextActive]}>{val.name}</Text>
            </Pressable>
          ))}
        </View>

        {!voicesReady && voiceOpt !== 'none' && (
          <View style={styles.voiceNotice}>
            <Text style={styles.voiceNoticeText}>Loading voices for audio playback...</Text>
          </View>
        )}

        {!selectedCategory ? (
          // Category Grid
          <View style={styles.grid}>
            {DUAA_CATEGORIES.map((cat) => (
              <Pressable key={cat.id} onPress={() => setSelectedCategory(cat)} style={styles.catCard}>
                <Text style={styles.catEmoji}>{cat.icon}</Text>
                <Text style={styles.catNameAr}>{cat.nameAr}</Text>
                <Text style={styles.catNameEn}>{t[cat.nameKey as keyof typeof t] || cat.nameKey}</Text>
                <Text style={styles.catCount}>{cat.items.length} {lang === 'ar' ? 'دعاء' : 'du\'a'}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          // Category Detail
          <>
            <Pressable onPress={() => { setSelectedCategory(null); setSpeakingIdx(null); if (Platform.OS === 'web') window.speechSynthesis?.cancel(); }} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← {t.backToAll}</Text>
            </Pressable>

            <View style={styles.catHeader}>
              <Text style={styles.catHeaderEmoji}>{selectedCategory.icon}</Text>
              <Text style={styles.catHeaderAr}>{selectedCategory.nameAr}</Text>
              <Text style={styles.catHeaderEn}>{t[selectedCategory.nameKey as keyof typeof t] || selectedCategory.nameKey}</Text>
            </View>

            {selectedCategory.items.map((item, idx) => (
              <View key={idx} style={styles.duaCard}>
                <Text style={styles.duaArabic}>{item.arabic}</Text>
                <View style={styles.duaDivider} />
                <Text style={styles.duaTranslit}>{item.transliteration}</Text>
                <Text style={styles.duaMeaning}>
                  {(item.meaning as Record<string, string>)[lang] || item.meaning.en}
                </Text>
                <Pressable
                  onPress={() => handleListen(item.arabic, idx)}
                  style={[styles.listenBtn, speakingIdx === idx && styles.listenBtnActive]}
                >
                  <Text style={[styles.listenBtnText, speakingIdx === idx && styles.listenBtnTextActive]}>
                    {speakingIdx === idx ? '🔊 Playing...' : `🔊 ${t.listen}`}
                  </Text>
                </Pressable>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1a15' },
  scroll: { paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  rowReverse: { flexDirection: 'row-reverse' },
  screenTitle: { fontSize: 26, fontWeight: '700', color: GOLD },
  screenSub: { fontSize: 10, color: MUTED, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langToggle: { backgroundColor: 'rgba(196,164,106,0.1)', borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  langToggleText: { color: GOLD, fontSize: 11, fontWeight: '600' },
  voiceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, paddingHorizontal: 20, marginBottom: 8 },
  voiceLabel: { color: MUTED, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  voiceChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: BORDER },
  voiceChipActive: { borderColor: GOLD, backgroundColor: 'rgba(196,164,106,0.12)' },
  voiceChipText: { color: '#8a9a8a', fontSize: 10 },
  voiceChipTextActive: { color: GOLD },
  voiceNotice: { marginHorizontal: 20, marginBottom: 8, padding: 8, backgroundColor: 'rgba(196,164,106,0.05)', borderRadius: 8, borderWidth: 1, borderColor: BORDER },
  voiceNoticeText: { color: MUTED, fontSize: 10, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  catCard: { width: '47%', padding: 14, backgroundColor: BG_CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  catEmoji: { fontSize: 24, marginBottom: 5 },
  catNameAr: { color: GOLD, fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 2 },
  catNameEn: { color: MUTED, fontSize: 9, textAlign: 'center', marginBottom: 4 },
  catCount: { color: DIM, fontSize: 9 },
  backBtn: { paddingHorizontal: 20, paddingBottom: 10 },
  backBtnText: { color: GOLD, fontSize: 12 },
  catHeader: { alignItems: 'center', paddingBottom: 16, paddingHorizontal: 20 },
  catHeaderEmoji: { fontSize: 32, marginBottom: 6 },
  catHeaderAr: { color: GOLD, fontSize: 20, fontWeight: '700', marginBottom: 2 },
  catHeaderEn: { color: MUTED, fontSize: 11 },
  duaCard: { marginHorizontal: 20, marginBottom: 12, padding: 18, backgroundColor: BG_CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER },
  duaArabic: { color: '#e8e0d0', fontSize: 20, fontWeight: '600', textAlign: 'center', lineHeight: 36, marginBottom: 10 },
  duaDivider: { height: 1, backgroundColor: BORDER, marginBottom: 10 },
  duaTranslit: { color: GOLD, fontSize: 11, fontWeight: '500', textAlign: 'center', marginBottom: 6 },
  duaMeaning: { color: MUTED, fontSize: 11, textAlign: 'center', fontStyle: 'italic', lineHeight: 18, marginBottom: 12 },
  listenBtn: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: 'rgba(196,164,106,0.1)', borderWidth: 1, borderColor: BORDER },
  listenBtnActive: { backgroundColor: 'rgba(196,164,106,0.2)', borderColor: GOLD },
  listenBtnText: { color: GOLD, fontSize: 11 },
  listenBtnTextActive: { color: '#e8e0d0' },
});
